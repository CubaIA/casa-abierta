-- ============================================================================
-- 011: REGISTRO SILENCIOSO DE CONTACTOS (contact_leads)
-- ============================================================================
-- Cada vez que un visitante abre WhatsApp con un negocio, se registra un
-- lead silencioso: sirve para medir el rendimiento del negocio sin perseguir
-- a la persona ni exponer al anfitrión a spams.
--
-- Datos guardados: únicamente business_id y cuándo se produjo el contacto.
-- No hay correo, ni número ni nombre de usuario.
--
-- Privacidad:
--   anon     -> INSERT (puede registrar el contacto)
--   anon     -> SELECT/UPDATE/DELETE denegados (no puede enumerar leads ajenos)
--   admin    -> lectura solo por la función admin_count_contact_leads
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor (después de 010_mintur_credentials.sql).
-- ============================================================================

create table if not exists public.contact_leads (
  id          uuid  primary key default gen_random_uuid(),
  business_id uuid  not null references public.businesses(id) on delete cascade,
  created_at  timestamptz not null default now()
);

comment on table public.contact_leads is 'Leads silenciosos de contacto por negocio (solo business_id y created_at).';
comment on column public.contact_leads.id is 'Identificador del registro.';
comment on column public.contact_leads.business_id is 'Negocio al que se contactó.';
comment on column public.contact_leads.created_at is 'Cuándo se produjo el contacto.';

-- El público puede registrar un contacto (anon); nunca puede enumerar leads ajenos.
grant insert on public.contact_leads to anon;

-- Sin privilegios de lectura ni escritura directa: el admin lee por función.
revoke all on public.contact_leads from anon, authenticated;

-- ============================================================================
-- FUNCIÓN: admin_count_contact_leads (p_business_id uuid)
-- Contador para el panel de administración.
-- ============================================================================

drop function if exists public.admin_count_contact_leads(uuid);

create or replace function public.admin_count_contact_leads(p_business_id uuid)
returns bigint
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

  return (select count(*)::bigint from public.contact_leads where business_id = p_business_id);
end;
$$;

revoke all on function public.admin_count_contact_leads(uuid) from public, anon;
grant execute on function public.admin_count_contact_leads(uuid) to authenticated;
