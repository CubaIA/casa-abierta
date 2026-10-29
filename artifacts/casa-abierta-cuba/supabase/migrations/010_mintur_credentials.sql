-- ============================================================================
-- 010: CREDENCIALES MINTUR DEL PANEL DE ADMINISTRACIÓN
-- ============================================================================
-- Regulación MINTUR: el administrador necesita registrar, según la actividad
-- del negocio, una credencial específica:
--
--   formatur_credential   Guías locales: credencial FORMATUR.
--   transport_license     Transporte: licencia de transporte turístico.
--   agency_registry       Agencias de viaje: registro turístico nacional.
--
-- Diseño de privacidad: las tres columnas NO se conceden a `anon` ni a
-- `authenticated`. Se leen y se escriben con funciones SECURITY DEFINER que
-- comprueban el rol de administrador, igual que la auditoría legal de la 008.
-- Así ningún RLS que permita al dueño editar su ficha le deja tocarlas.
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor (después de 009_admin_edit_narrative.sql).
-- ============================================================================

alter table public.businesses add column if not exists formatur_credential text;
alter table public.businesses add column if not exists transport_license text;
alter table public.businesses add column if not exists agency_registry text;

-- Sin grant de select/insert/update: fuera del RPC nadie las ve ni las escribe.

-- ============================================================================
-- FUNCIÓN: admin_set_business_mintur
-- ============================================================================

drop function if exists public.admin_set_business_mintur(uuid, text, text, text);

create or replace function public.admin_set_business_mintur(
  p_business_id uuid,
  p_formatur text,
  p_transport text,
  p_agency text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin boolean := false;
begin
  -- Comprobación de rol: admite las dos variantes de la firma histórica.
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'casa_abierta_is_admin' and p.pronargs = 0
  ) then
    execute 'select public.casa_abierta_is_admin()' into es_admin;
  elsif exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'casa_abierta_is_admin' and p.pronargs = 1
  ) then
    execute 'select public.casa_abierta_is_admin($1)' into es_admin using auth.uid();
  end if;

  if not es_admin then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;

  update public.businesses
     set formatur_credential  = nullif(trim(coalesce(p_formatur, '')), ''),
         transport_license    = nullif(trim(coalesce(p_transport, '')), ''),
         agency_registry      = nullif(trim(coalesce(p_agency, '')), '')
   where id = p_business_id;

  if not found then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_business_mintur(uuid, text, text, text) from public, anon;
grant execute on function public.admin_set_business_mintur(uuid, text, text, text) to authenticated;

-- ============================================================================
-- FUNCIÓN: admin_get_business_mintur
-- ============================================================================

drop function if exists public.admin_get_business_mintur(uuid);

create or replace function public.admin_get_business_mintur(p_business_id uuid)
returns table (
  formatur_credential text,
  transport_license text,
  agency_registry text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin boolean := false;
begin
  if exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'casa_abierta_is_admin' and p.pronargs = 0
  ) then
    execute 'select public.casa_abierta_is_admin()' into es_admin;
  elsif exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'casa_abierta_is_admin' and p.pronargs = 1
  ) then
    execute 'select public.casa_abierta_is_admin($1)' into es_admin using auth.uid();
  end if;

  if not es_admin then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;

  return query
    select b.formatur_credential, b.transport_license, b.agency_registry
      from public.businesses b
     where b.id = p_business_id;
end;
$$;

revoke all on function public.admin_get_business_mintur(uuid) from public, anon;
grant execute on function public.admin_get_business_mintur(uuid) to authenticated;
