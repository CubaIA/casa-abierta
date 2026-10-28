-- ============================================================================
-- 008: AUDITORÍA LEGAL Y CUMPLIMIENTO (Ley 149 de 2022)
-- ============================================================================
-- Añade los datos con los que Casa Abierta comprueba que un negocio puede
-- operar legalmente:
--
--   license_number     Texto declarado POR EL ANFITRIÓN (licencia de
--                      arrendamiento, MINTUR, carnet de guía…). Es un dato
--                      privado: NO se muestra en el catálogo ni en la ficha.
--   legal_validated    Boolean que SOLO el administrador puede activar, tras
--                      revisar la documentación.
--   admin_legal_notes  Notas internas de la comprobación. Privadas: solo las
--                      lee el administrador.
--
-- Diseño de privacidad: `license_number` y `admin_legal_notes` NO se conceden
-- a `anon` ni a `authenticated`. El anfitrión escribe su licencia y el admin
-- lee/escribe las notas mediante funciones SECURITY DEFINER que comprueban el
-- rol o la propiedad del negocio. Así ninguna política RLS que permita al
-- dueño editar su ficha puede dejarle auto-validarse (`legal_validated`).
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor (después de 007_business_verified.sql).
-- ============================================================================

-- 1) Columnas.
alter table public.businesses add column if not exists license_number text;
alter table public.businesses add column if not exists legal_validated boolean not null default false;
alter table public.businesses add column if not exists admin_legal_notes text;

-- 2) Lectura pública SOLO del booleano (alimenta la leyenda de la ficha).
--    Sin este privilegio, PostgREST devuelve error en toda la consulta del
--    catálogo porque la columna va en el select.
grant select (legal_validated) on public.businesses to anon, authenticated;

-- 3) Escritura de la licencia al publicar: el alta directa (sin RPC) la
--    incluye en el insert. Es un dato que el propio dueño declara.
grant insert (license_number) on public.businesses to authenticated;

-- ============================================================================
-- FUNCIÓN: provider_set_business_license
-- El anfitrión guarda su propia licencia; nunca la de otro negocio.
-- ============================================================================
create or replace function public.provider_set_business_license(
  target_business_id uuid,
  next_license text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.businesses
     where id = target_business_id
       and owner_id = auth.uid()
  ) then
    raise exception 'Business not owned by the current user' using errcode = '42501';
  end if;
  update public.businesses
     set license_number = nullif(trim(coalesce(next_license, '')), '')
   where id = target_business_id;
end;
$$;

revoke all on function public.provider_set_business_license(uuid, text) from public, anon;
grant execute on function public.provider_set_business_license(uuid, text) to authenticated;

-- ============================================================================
-- FUNCIÓN: admin_set_business_legal
-- Valida o retira la validación de la documentación y guarda las notas.
-- Parámetros: p_business_id, p_is_legal, p_notes (la app envía estos nombres).
-- Postgres no permite renombrar parámetros con CREATE OR REPLACE, así que se
-- elimina la versión anterior (misma firma) antes de crearla de nuevo. Esto
-- hace la migración re-ejecutable sobre proyectos con la 008 ya aplicada.
-- ============================================================================
drop function if exists public.admin_set_business_legal(uuid, boolean, text);

create or replace function public.admin_set_business_legal(
  p_business_id uuid,
  p_is_legal boolean,
  p_notes text
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
     set legal_validated = coalesce(p_is_legal, false),
         admin_legal_notes = nullif(trim(coalesce(p_notes, '')), '')
   where id = p_business_id;
  if not found then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke all on function public.admin_set_business_legal(uuid, boolean, text) from public, anon;
grant execute on function public.admin_set_business_legal(uuid, boolean, text) to authenticated;

-- ============================================================================
-- FUNCIÓN: admin_get_business_legal
-- Lectura de los datos privados para el panel de administración.
-- Igual que la anterior: DROP para fijar los nombres p_* de los parámetros.
-- ============================================================================
drop function if exists public.admin_get_business_legal(uuid);

create or replace function public.admin_get_business_legal(p_business_id uuid)
returns table (
  license_number text,
  legal_validated boolean,
  admin_legal_notes text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  return query
    select b.license_number, b.legal_validated, b.admin_legal_notes
      from public.businesses b
     where b.id = p_business_id;
end;
$$;

revoke all on function public.admin_get_business_legal(uuid) from public, anon;
grant execute on function public.admin_get_business_legal(uuid) to authenticated;
