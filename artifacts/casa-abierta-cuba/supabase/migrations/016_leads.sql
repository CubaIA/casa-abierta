-- ============================================================================
-- 016 — Solicitudes de reserva (leads) de la ficha pública
-- ============================================================================
-- El viajero pide disponibilidad sin cuenta: deja nombre, contacto, fechas,
-- huéspedes y presupuesto. El anfitrión (dueño del negocio) ve la solicitud en
-- su panel y la mueve de `pending` a `contacted` o `booked`.
--
-- Columnas exactas que usa el frontend:
--   business_id, host_id, tourist_name, tourist_email, tourist_phone,
--   check_in, check_out, guests, budget, message, status, created_at
--
-- Esta migración, idempotente:
--   1) crea `public.leads` (y añade las columnas que falten si ya existe);
--   2) permite INSERT anónimo únicamente en estado `pending`;
--   3) permite SELECT/UPDATE solo al anfitrión destinatario y al admin;
--   4) crea `business_host_id(uuid)`, la única forma en que un visitante
--      anónimo puede conocer el dueño del negocio para firmar la solicitud.
-- ============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  host_id uuid references auth.users (id) on delete set null,
  tourist_name text not null,
  tourist_email text not null,
  tourist_phone text not null,
  check_in date,
  check_out date,
  guests integer,
  budget text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'booked')),
  created_at timestamptz not null default now()
);

-- Tabla ya creada a mano en producción: se completan las columnas que falten.
alter table public.leads add column if not exists tourist_name text;
alter table public.leads add column if not exists tourist_email text;
alter table public.leads add column if not exists tourist_phone text;
alter table public.leads add column if not exists budget text;
alter table public.leads add column if not exists message text;
alter table public.leads add column if not exists status text default 'pending';

create index if not exists casa_abierta_leads_business_idx
  on public.leads (business_id, created_at desc);
create index if not exists casa_abierta_leads_host_idx
  on public.leads (host_id, created_at desc);

alter table public.leads enable row level security;

grant insert on public.leads to anon, authenticated;
grant select, update on public.leads to authenticated;

-- El formulario público solo puede crear solicitudes pendientes y con datos
-- mínimos: nadie puede inyectar leads ya "reservados" ni filas vacías.
drop policy if exists casa_abierta_leads_public_insert on public.leads;
create policy casa_abierta_leads_public_insert
  on public.leads for insert to anon, authenticated
  with check (
    status = 'pending'
    and length(btrim(coalesce(tourist_name, ''))) between 2 and 120
    and position('@' in coalesce(tourist_email, '')) > 1
    and length(btrim(coalesce(tourist_phone, ''))) between 6 and 40
    and (guests is null or guests between 1 and 50)
  );

-- El anfitrión ve solo las solicitudes de sus negocios; el admin, todas.
drop policy if exists casa_abierta_leads_host_read on public.leads;
create policy casa_abierta_leads_host_read
  on public.leads for select to authenticated
  using (host_id = auth.uid() or public.casa_abierta_is_admin());

drop policy if exists casa_abierta_leads_host_update on public.leads;
create policy casa_abierta_leads_host_update
  on public.leads for update to authenticated
  using (host_id = auth.uid() or public.casa_abierta_is_admin())
  with check (host_id = auth.uid() or public.casa_abierta_is_admin());

-- Dueño del negocio para firmar la solicitud desde la ficha pública.
-- `owner_id` no está concedido a anon, así que se expone solo este dato.
create or replace function public.business_host_id(target_business_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select owner_id from public.businesses where id = target_business_id;
$$;

revoke all on function public.business_host_id(uuid) from public;
grant execute on function public.business_host_id(uuid) to anon, authenticated;
