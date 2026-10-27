-- ============================================================================
-- 007: SELLO DE VERIFICACIÓN CONTROLADO POR EL ADMINISTRADOR
-- ============================================================================
-- La columna `verified` alimenta el sello «Verificado en Cuba por Casa Abierta»
-- que se pinta en las tarjetas del catálogo y en la ficha del negocio. El sello
-- solo aparece con verified = true, y únicamente el administrador puede
-- otorgarlo desde el panel (botón «Verificar Negocio»), que llama al RPC
-- admin_set_business_verified.
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor (después de 006_normalize_host_role.sql).
-- ============================================================================

-- 1) La columna existe desde 002; se repite para que la migración sea segura
--    en proyectos que la aplicaron antes de esa versión.
alter table public.businesses
  add column if not exists verified boolean not null default false;

-- 2) Lectura pública: el catálogo (anon) y la ficha (authenticated) seleccionan
--    `verified` junto al resto de columnas de descubrimiento. Sin privilegio
--    explícito, PostgREST devuelve error de permisos en toda la consulta.
grant select (verified) on public.businesses to anon, authenticated;

-- 3) Escritura de respaldo: si el RPC aún no está aplicado, la capa de datos
--    reintenta con un UPDATE directo a esta columna.
grant update (verified) on public.businesses to authenticated;

-- ============================================================================
-- FUNCIÓN: admin_set_business_verified
-- ============================================================================
create or replace function public.admin_set_business_verified(
  target_business_id uuid,
  next_verified boolean
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
     set verified = coalesce(next_verified, false)
   where id = target_business_id;
  if not found then raise exception 'Business not found' using errcode = 'P0002'; end if;
end;
$$;

revoke all on function public.admin_set_business_verified(uuid, boolean) from public, anon;
grant execute on function public.admin_set_business_verified(uuid, boolean) to authenticated;
