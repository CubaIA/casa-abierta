-- ============================================================================
-- 019 — Partners B2B: agencias y tour operadores internacionales
-- ============================================================================
-- El formulario público de /operadores deja la solicitud en estado `new`; el
-- equipo la revisa en la pestaña «Partners B2B» del panel de administración y
-- la mueve a `contacted` o `active`.
--
-- Idempotente: se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================================

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  agency_name text not null,
  contact_name text not null,
  email text not null,
  country text not null,
  website text,
  annual_clients text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'active')),
  created_at timestamptz not null default now()
);

create index if not exists casa_abierta_partners_status_idx
  on public.partners (status, created_at desc);

alter table public.partners enable row level security;

grant insert on public.partners to anon, authenticated;
grant select, update on public.partners to authenticated;

-- Cualquier agencia puede enviar su solicitud, siempre como `new`.
drop policy if exists casa_abierta_partners_public_insert on public.partners;
create policy casa_abierta_partners_public_insert
  on public.partners for insert to anon, authenticated
  with check (
    status = 'new'
    and length(btrim(agency_name)) between 1 and 160
    and length(btrim(contact_name)) between 1 and 120
    and length(btrim(country)) between 1 and 80
    and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
  );

-- Solo el administrador lee y cambia el estado del seguimiento.
drop policy if exists casa_abierta_partners_admin_read on public.partners;
create policy casa_abierta_partners_admin_read
  on public.partners for select to authenticated
  using (public.casa_abierta_is_admin());

drop policy if exists casa_abierta_partners_admin_update on public.partners;
create policy casa_abierta_partners_admin_update
  on public.partners for update to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());
