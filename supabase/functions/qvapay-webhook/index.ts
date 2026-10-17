import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-qvapay-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

async function verifySignature(secret: string, signature: string | null, rawBody: Uint8Array): Promise<boolean> {
  if (!signature) return false;
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, rawBody);
    const sigHex = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    
    // Compare against provided signature (could be hex, base64, or with prefix)
    const provided = signature.replace(/^sha256=/i, '').trim();
    if (provided === sigHex || provided === sigB64) return true;
    // Also try case-insensitive hex
    if (provided.toLowerCase() === sigHex.toLowerCase()) return true;
    return false;
  } catch (e) {
    console.error('Error verifying signature:', e);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const appSecret = Deno.env.get('QVA_PAY_APP_SECRET');
  if (!appSecret) {
    return json({ error: 'Falta secreto QVA_PAY_APP_SECRET' }, 500);
  }

  const signature = req.headers.get('x-qvapay-signature') || req.headers.get('x-qvapay-sign') || req.headers.get('X-QvaPay-Signature');
  
  const rawBody = new Uint8Array(await req.arrayBuffer());
  const bodyText = new TextDecoder().decode(rawBody);
  
  // Verify signature
  const isValid = await verifySignature(appSecret, signature, rawBody);
  if (!isValid) {
    console.error('Invalid signature received');
    return json({ error: 'Firma inválida' }, 401);
  }

  let payload: any;
  try {
    payload = JSON.parse(bodyText);
  } catch {
    return json({ error: 'Payload inválido' }, 400);
  }

  const { remote_id, id, uuid, transaction_uuid, status } = payload;
  const txnRemoteId = remote_id || uuid || transaction_uuid;
  
  if (!txnRemoteId) {
    return json({ error: 'remote_id/uuid requerido' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'Supabase config missing' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Check for idempotency
    const { data: existing } = await supabase
      .from('payments')
      .select('id, status')
      .eq('remote_id', String(txnRemoteId))
      .maybeSingle();

    if (existing && existing.status === 'paid') {
      return json({ ok: true, message: 'Already processed' });
    }

    // Upsert payment
    const { error } = await supabase
      .from('payments')
      .upsert({
        remote_id: String(txnRemoteId),
        transaction_uuid: transaction_uuid || uuid,
        transaction_id: id || transaction_uuid || uuid,
        status: status === 'paid' ? 'paid' : status === 'cancelled' ? 'cancelled' : 'pending',
        amount: payload.amount ? Number(payload.amount) : null,
        description: payload.description,
        metadata: payload,
      }, { onConflict: 'remote_id' });

    if (error) {
      console.error('DB error:', error);
      return json({ error: 'Error guardando pago' }, 500);
    }

    return json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    return json({ error: 'Error procesando webhook' }, 500);
  }
});