-- ============================================================================
-- 004: NEGOCIOS DESTACADOS (PREMIUM)
-- ============================================================================
-- La columna featured alimenta el orden del catálogo (destacados primero) y el
-- sello "⭐ Premium" de las tarjetas. El panel de administración la alterna con
-- el RPC admin_set_business_featured.
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor después de 001_casa_abierta_completo.sql.
-- ============================================================================

alter table public.businesses
  add column if not exists featured boolean not null default false;

-- 001 revoca el SELECT global y concede columnas sueltas: el catálogo anónimo
-- necesita privilegio explícito para leer featured vía PostgREST.
grant select (featured) on public.businesses to anon, authenticated;

-- ============================================================================
-- FUNCIÓN: admin_set_business_featured
-- ============================================================================
create or replace function public.admin_set_business_featured(
  target_business_id uuid,
  next_featured boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  update public.businesses
     set featured = coalesce(next_featured, false)
   where id = target_business_id;
  if not found then raise exception 'Business not found' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.admin_set_business_featured(uuid, boolean) from public, anon;
grant execute on function public.admin_set_business_featured(uuid, boolean) to authenticated;
