/**
 * Edge Function: aviso por correo al anfitrión cuando entra una solicitud.
 *
 * La invoca el trigger `casa_abierta_leads_notify` con pg_net y un secreto
 * compartido. Envía el correo por Resend y una copia al administrador.
 *
 * Variables de entorno (supabase secrets set ...):
 *   RESEND_API_KEY       clave de Resend
 *   LEAD_WEBHOOK_SECRET  mismo valor que el secreto `lead_webhook_secret` de Vault
 *   LEAD_FROM_EMAIL      remitente verificado en Resend (opcional)
 *   LEAD_ADMIN_EMAIL     copia de supervisión (opcional)
 *   APP_PANEL_URL        enlace al panel del anfitrión (opcional)
 *   SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los inyecta Supabase.
 */
import { createClient } from 'npm:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const WEBHOOK_SECRET = Deno.env.get('LEAD_WEBHOOK_SECRET') ?? '';
const FROM = Deno.env.get('LEAD_FROM_EMAIL') ?? 'Casa Abierta Cuba <reservas@casaabiertacuba.com>';
const ADMIN_COPY = Deno.env.get('LEAD_ADMIN_EMAIL') ?? 'casaabiertacuba@gmail.com';
const PANEL_URL = Deno.env.get('APP_PANEL_URL') ?? 'https://casa-abierta-r7g9.vercel.app/anfitrion';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fecha(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return 'sin fecha';
  return valor.slice(0, 10);
}

function escapeHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
    return json({ error: 'No autorizado' }, 401);
  }
  if (!RESEND_API_KEY) return json({ error: 'Falta RESEND_API_KEY' }, 500);

  let leadId = '';
  try {
    const cuerpo = await req.json();
    leadId = typeof cuerpo?.lead_id === 'string' ? cuerpo.lead_id : '';
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }
  if (!leadId) return json({ error: 'Falta lead_id' }, 400);

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: lead, error: leadError } = await admin
    .from('leads')
    .select('*, businesses(title, owner_id)')
    .eq('id', leadId)
    .maybeSingle();

  if (leadError || !lead) {
    console.error('[notify-lead] No se pudo leer la solicitud:', leadError);
    return json({ error: 'Solicitud no encontrada' }, 404);
  }

  const negocio = (lead.businesses ?? null) as { title?: string | null; owner_id?: string | null } | null;
  const hostId = lead.host_id ?? negocio?.owner_id ?? null;

  let hostEmail: string | null = null;
  if (hostId) {
    const { data: host, error: hostError } = await admin
      .from('users')
      .select('email, full_name')
      .eq('id', hostId)
      .maybeSingle();
    if (hostError) console.error('[notify-lead] No se pudo leer el anfitrión:', hostError);
    hostEmail = (host?.email as string | null) ?? null;
  }

  const destino = hostEmail || ADMIN_COPY;
  const nombreNegocio = negocio?.title ?? 'tu negocio';
  const turista = String(lead.tourist_name ?? 'Un viajero');
  const llegada = fecha(lead.check_in);
  const salida = fecha(lead.check_out);
  const huespedes = lead.guests ?? '—';
  const presupuesto = lead.budget || 'a consultar';
  const mensaje = lead.message ? `<p style="margin:8px 0 0"><strong>Mensaje:</strong> ${escapeHtml(String(lead.message))}</p>` : '';

  const html = `
    <div style="font-family:Arial,sans-serif;color:#2c3e50;line-height:1.5">
      <h2 style="color:#143b63;margin:0 0 8px">Nueva solicitud de reserva</h2>
      <p style="margin:0 0 12px">Han pedido disponibilidad en <strong>${escapeHtml(nombreNegocio)}</strong>.</p>
      <ul style="padding-left:18px;margin:0 0 12px">
        <li><strong>Turista:</strong> ${escapeHtml(turista)}</li>
        <li><strong>Fechas:</strong> ${escapeHtml(llegada)} → ${escapeHtml(salida)}</li>
        <li><strong>Huéspedes:</strong> ${escapeHtml(String(huespedes))}</li>
        <li><strong>Presupuesto:</strong> ${escapeHtml(String(presupuesto))}</li>
        <li><strong>Contacto:</strong> ${escapeHtml(String(lead.tourist_email ?? '—'))} · ${escapeHtml(String(lead.tourist_phone ?? '—'))}</li>
      </ul>
      ${mensaje}
      <p style="margin:16px 0">
        <a href="${PANEL_URL}" style="background:#143b63;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none">
          Responder en mi panel
        </a>
      </p>
      <p style="font-size:12px;color:#6b7a8a">Casa Abierta Cuba · aviso automático de una solicitud registrada en la plataforma.</p>
    </div>`;

  const destinatarios = Array.from(new Set([destino, ADMIN_COPY].filter(Boolean)));

  try {
    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: destinatarios,
        subject: `Nueva solicitud de reserva · ${nombreNegocio}`,
        html,
      }),
    });

    if (!respuesta.ok) {
      const detalle = await respuesta.text();
      console.error('[notify-lead] Resend rechazó el envío:', respuesta.status, detalle);
      return json({ error: 'No se pudo enviar el correo', status: respuesta.status }, 502);
    }
    return json({ ok: true, to: destinatarios });
  } catch (error) {
    console.error('[notify-lead] Error de red con Resend:', error);
    return json({ error: 'Error de red' }, 502);
  }
});
