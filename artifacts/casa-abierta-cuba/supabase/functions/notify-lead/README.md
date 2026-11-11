# Avisos por correo de nuevas solicitudes

La función `notify-lead` envía un correo al anfitrión (y una copia al
administrador) cada vez que entra un lead. La dispara el trigger
`casa_abierta_leads_notify` de la migración `018_lead_notifications.sql`.

## 1. Crear la clave en Resend

1. Entra en https://resend.com y crea una cuenta.
2. En **API Keys**, crea una clave con permiso de envío y cópiala.
3. En **Domains**, verifica el dominio desde el que enviarás
   (`casaabiertacuba.com`) añadiendo los registros DNS que te indique Resend.
4. Mientras el dominio no esté verificado, usa el remitente de pruebas de
   Resend (`onboarding@resend.dev`), que solo envía a tu propio correo.

## 2. Guardar los secretos en Supabase

```bash
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx
supabase secrets set LEAD_WEBHOOK_SECRET=un-secreto-largo-aleatorio
supabase secrets set LEAD_FROM_EMAIL="Casa Abierta Cuba <reservas@casaabiertacuba.com>"
supabase secrets set LEAD_ADMIN_EMAIL=casaabiertacuba@gmail.com
supabase secrets set APP_PANEL_URL=https://casa-abierta-r7g9.vercel.app/anfitrion
```

## 3. Desplegar la función

```bash
supabase functions deploy notify-lead --no-verify-jwt
```

`--no-verify-jwt` es necesario porque quien llama es la base de datos, no un
usuario; la protección real es la cabecera `x-webhook-secret`.

## 4. Conectar el trigger

En el SQL Editor de Supabase, una sola vez:

```sql
select vault.create_secret(
  'https://<tu-proyecto>.supabase.co/functions/v1/notify-lead',
  'lead_webhook_url'
);
select vault.create_secret('<el mismo LEAD_WEBHOOK_SECRET>', 'lead_webhook_secret');
```

Después aplica `supabase/migrations/018_lead_notifications.sql`.

## Probar

```sql
select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name = 'lead_webhook_url'),
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'x-webhook-secret',
    (select decrypted_secret from vault.decrypted_secrets where name = 'lead_webhook_secret')
  ),
  body := jsonb_build_object('lead_id', '<uuid-de-un-lead>')
);
```

Revisa la respuesta en `select * from net._http_response order by created desc limit 5;`
y los logs de la función en el panel de Supabase.
