-- ============================================================================
-- 017 — Chat interno de cada solicitud (leads)
-- ============================================================================
-- Cada lead tiene una conversación entre el turista y el anfitrión. El turista
-- no tiene cuenta: el UUID del lead actúa como enlace-capacidad (se le muestra
-- solo a él al enviar la solicitud y en su ruta /chat/{lead_id}).
--
-- Idempotente: crea la tabla, activa RLS y publica la tabla en Realtime.
-- ============================================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  sender_type text not null check (sender_type in ('tourist', 'host')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists casa_abierta_messages_lead_idx
  on public.messages (lead_id, created_at);

alter table public.messages enable row level security;

grant select, insert on public.messages to anon, authenticated;

-- Turista anónimo: puede leer y escribir en el hilo cuyo enlace conoce.
-- No puede enumerar leads (la tabla `leads` no es legible por anon) y solo
-- puede escribir como 'tourist'.
drop policy if exists casa_abierta_messages_tourist_read on public.messages;
create policy casa_abierta_messages_tourist_read
  on public.messages for select to anon
  using (true);

drop policy if exists casa_abierta_messages_tourist_insert on public.messages;
create policy casa_abierta_messages_tourist_insert
  on public.messages for insert to anon
  with check (
    sender_type = 'tourist'
    and length(btrim(content)) between 1 and 2000
  );

-- Anfitrión: solo los hilos de sus propios leads. El admin, todos.
drop policy if exists casa_abierta_messages_host_read on public.messages;
create policy casa_abierta_messages_host_read
  on public.messages for select to authenticated
  using (
    public.casa_abierta_is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = messages.lead_id and l.host_id = auth.uid()
    )
  );

drop policy if exists casa_abierta_messages_host_insert on public.messages;
create policy casa_abierta_messages_host_insert
  on public.messages for insert to authenticated
  with check (
    sender_type = 'host'
    and length(btrim(content)) between 1 and 2000
    and (
      public.casa_abierta_is_admin()
      or exists (
        select 1 from public.leads l
        where l.id = messages.lead_id and l.host_id = auth.uid()
      )
    )
  );

-- Realtime: mensajes instantáneos sin recargar.
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end
$$;
