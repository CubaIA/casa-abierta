-- ============================================================================
-- 018 — Aviso por correo al anfitrión cuando entra una solicitud
-- ============================================================================
-- El trigger llama a la Edge Function `notify-lead` con pg_net. Nunca bloquea
-- ni hace fallar la inserción del lead: si la red o el correo fallan, el error
-- se registra como aviso y la solicitud queda guardada igual.
--
-- Configuración (una sola vez, en el SQL Editor de Supabase):
--   select vault.create_secret('https://<proyecto>.supabase.co/functions/v1/notify-lead', 'lead_webhook_url');
--   select vault.create_secret('<secreto-largo-aleatorio>', 'lead_webhook_secret');
--
-- Y en el proyecto: supabase secrets set RESEND_API_KEY=... LEAD_WEBHOOK_SECRET=<el mismo secreto>
-- ============================================================================

create extension if not exists pg_net;

create or replace function public.notificar_lead_por_correo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  destino text;
  secreto text;
begin
  select decrypted_secret into destino
  from vault.decrypted_secrets where name = 'lead_webhook_url' limit 1;

  select decrypted_secret into secreto
  from vault.decrypted_secrets where name = 'lead_webhook_secret' limit 1;

  if destino is null or destino = '' then
    raise notice 'Aviso por correo sin configurar: falta lead_webhook_url en Vault';
    return new;
  end if;

  perform net.http_post(
    url := destino,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', coalesce(secreto, '')
    ),
    body := jsonb_build_object('lead_id', new.id),
    timeout_milliseconds := 5000
  );

  return new;
exception
  when others then
    -- El correo es un extra: la solicitud nunca se pierde por un fallo aquí.
    raise notice 'No se pudo encolar el aviso por correo: %', sqlerrm;
    return new;
end;
$$;

drop trigger if exists casa_abierta_leads_notify on public.leads;
create trigger casa_abierta_leads_notify
  after insert on public.leads
  for each row execute function public.notificar_lead_por_correo();
