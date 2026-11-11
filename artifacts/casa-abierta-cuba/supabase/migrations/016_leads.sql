-- ============================================================================
-- 016 — Solicitudes de reserva (leads) de la ficha pública
-- ============================================================================
-- El viajero pide disponibilidad sin cuenta: deja nombre, contacto, fechas,
-- huéspedes y presupuesto. El anfitrión (dueño del negocio) ve la solicitud en
-- su panel y la mueve de `pending` a `contacted` o `booked`.
--
-- Esta migración, idempotente:
--   1) crea `public.leads` con `business_id` y `host_id` (dueño del negocio);
--   2) permite INSERT anónimo únicamente en estado `pending`;
--   3) permite SELECT/UPDATE solo al anfitrión destinatario y al admin.
-- ============================================================================

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  host_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  check_in date,
  check_out date,
  guests integer,
  budget text,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'contacted', 'booked')),
  created_at timestamptz not null default now()
);

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
    and length(btrim(full_name)) between 2 and 120
    and position('@' in email) > 1
    and length(btrim(phone)) between 6 and 40
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
