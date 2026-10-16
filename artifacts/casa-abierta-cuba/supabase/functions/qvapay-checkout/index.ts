// QvaPay Checkout Edge Function
// Creates invoice via QvaPay API and returns payment URL

const QVAPAY_CREATE_INVOICE_URL = 'https://api.qvapay.com/v2/create_invoice';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const appId = Deno.env.get('QVA_PAY_APP_ID');
  const appSecret = Deno.env.get('QVA_PAY_APP_SECRET');
  if (!appId || !appSecret) {
    return json({ error: 'Faltan secretos QVA_PAY_APP_ID/QVA_PAY_APP_SECRET en Supabase' }, 500);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }

  const { amount, description, remote_id, return_url, cancel_url } = body;
  if (!amount || isNaN(Number(amount))) {
    return json({ error: 'amount es requerido y debe ser numérico' }, 400);
  }
  if (!remote_id) {
    return json({ error: 'remote_id es requerido' }, 400);
  }

  try {
    const res = await fetch(QVAPAY_CREATE_INVOICE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
        amount: Number(amount),
        description: description || 'Pago Casa Abierta Cuba',
        remote_id,
        signed: 1,
        return_url,
        cancel_url,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('QvaPay create invoice error:', res.status, data);
      return json({ error: 'Error creando factura QvaPay', details: data }, res.status);
    }

    const url = data?.url || data?.signedUrl || data?.data?.url;
    if (!url) {
      console.error('QvaPay response sin URL:', data);
      return json({ error: 'Respuesta inválida de QvaPay (sin URL de pago)' }, 502);
    }

    return json({ url, transaction_uuid: data?.transation_uuid || data?.uuid || data?.transaction_uuid });
  } catch (e) {
    console.error('Error llamando a QvaPay:', e);
    return json({ error: 'Error conectando con QvaPay' }, 502);
  }
});