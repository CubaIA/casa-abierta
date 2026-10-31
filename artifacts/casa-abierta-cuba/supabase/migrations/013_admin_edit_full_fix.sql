-- ============================================================================
-- 013: CORRIGE `admin_edit_business_full` (malformed array literal)
-- ============================================================================
-- Síntoma: al guardar desde el panel admin, Supabase devuelve
--   ERROR: malformed array literal: "schedule"
--
-- Causa: la versión de la migración 012 comprobaba cada columna con
--   public.casa_abierta_columna_existe('schedule')
-- Si en el proyecto existe (o quedó) una versión de ese helper con firma
-- `text[]`, PostgreSQL intenta convertir el literal 'schedule' a un array y
-- falla con ese mensaje. El frontend no tiene la culpa: ya envía
-- `next_languages` como array JSON.
--
-- Solución: esta versión lee UNA vez la lista de columnas de `businesses` en
-- un `text[]` y comprueba con `'columna' = any(columnas)`. No hay ninguna
-- conversión de texto a array en todo el cuerpo de la función, así que el error
-- no puede reproducirse aunque el helper antiguo siga en la base de datos.
--
-- También elimina cualquier overload previo de la función (si una versión
-- anterior se creó con otros tipos) antes de recrearla, para que PostgREST no
-- tenga que elegir entre dos candidatas.
--
-- Idempotente: puede re-ejecutarse. Aplicar en Supabase → SQL Editor después de
-- 012. No borra datos: sólo redefine funciones.
-- ============================================================================

-- 1) Quita cualquier versión anterior (misma firma u otra): se recrea debajo.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as firma
      from pg_proc p
     where p.proname = 'admin_edit_business_full'
       and p.pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || r.firma;
  end loop;
end $$;

-- 2) Función de edición total, sin casts texto→array.
create or replace function public.admin_edit_business_full(
  target_business_id uuid,
  next_host_name text default null,
  next_province text default null,
  next_municipality text default null,
  next_category text default null,
  next_service_type text default null,
  next_schedule text default null,
  next_languages text[] default null,
  next_price_amount text default null,
  next_price_currency text default null,
  next_license_number text default null
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  omitidos text[] := '{}';
  columnas text[] := '{}';
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.businesses where id = target_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  -- Columnas reales de la tabla, leídas del catálogo (sin depender de helpers
  -- ni de casts de texto a array).
  select coalesce(array_agg(a.attname), '{}')
    into columnas
    from pg_attribute a
   where a.attrelid = 'public.businesses'::regclass
     and a.attnum > 0
     and not a.attisdropped;

  -- Nombre del anfitrión (dueño del negocio, no quien mira la ficha).
  if next_host_name is not null then
    if 'host_name' = any(columnas) then
      update public.businesses set host_name = trim(next_host_name) where id = target_business_id;
    else
      omitidos := omitidos || 'host_name';
    end if;
  end if;

  if next_province is not null then
    if 'province' = any(columnas) then
      update public.businesses set province = trim(next_province) where id = target_business_id;
    else
      omitidos := omitidos || 'province';
    end if;
  end if;

  if next_municipality is not null then
    if 'municipality' = any(columnas) then
      update public.businesses set municipality = trim(next_municipality) where id = target_business_id;
    else
      omitidos := omitidos || 'municipality';
    end if;
  end if;

  -- Categoría ancha: `category` en producción, `subcategory` como alias.
  if next_category is not null then
    if 'category' = any(columnas) then
      update public.businesses set category = trim(next_category) where id = target_business_id;
    elsif 'subcategory' = any(columnas) then
      update public.businesses set subcategory = trim(next_category) where id = target_business_id;
    else
      omitidos := omitidos || 'category';
    end if;
  end if;

  -- Tipo de servicio: `service_type` (migración 001) o `subcategory`.
  if next_service_type is not null then
    if 'service_type' = any(columnas) then
      update public.businesses set service_type = trim(next_service_type) where id = target_business_id;
    elsif 'subcategory' = any(columnas) then
      update public.businesses set subcategory = trim(next_service_type) where id = target_business_id;
    else
      omitidos := omitidos || 'service_type';
    end if;
  end if;

  -- Horario: texto JSON {"check_in":"15:00","check_out":"11:00"}.
  if next_schedule is not null then
    if 'schedule' = any(columnas) then
      begin
        update public.businesses
           set schedule = nullif(trim(next_schedule), '')
         where id = target_business_id;
      exception when others then
        omitidos := omitidos || 'schedule';
      end;
    elsif 'horario' = any(columnas) then
      begin
        update public.businesses
           set horario = nullif(trim(next_schedule), '')
         where id = target_business_id;
      exception when others then
        omitidos := omitidos || 'schedule';
      end;
    else
      omitidos := omitidos || 'schedule';
    end if;
  end if;

  -- Idiomas: el parámetro es text[]; si la columna fuera texto se unen.
  if next_languages is not null then
    if 'languages' = any(columnas) then
      begin
        update public.businesses
           set languages = next_languages
         where id = target_business_id;
      exception when others then
        begin
          update public.businesses
             set languages = array_to_string(next_languages, ', ')
           where id = target_business_id;
        exception when others then
          omitidos := omitidos || 'languages';
        end;
      end;
    else
      omitidos := omitidos || 'languages';
    end if;
  end if;

  -- `''` borra el precio; cualquier otro texto se interpreta como número.
  if next_price_amount is not null then
    if 'price_amount' = any(columnas) then
      begin
        update public.businesses
           set price_amount = nullif(trim(next_price_amount), '')::numeric
         where id = target_business_id;
      exception when others then
        omitidos := omitidos || 'price_amount';
      end;
    else
      omitidos := omitidos || 'price_amount';
    end if;
  end if;

  if next_price_currency is not null then
    if 'price_currency' = any(columnas) then
      update public.businesses
         set price_currency = upper(nullif(trim(next_price_currency), ''))
       where id = target_business_id;
    else
      omitidos := omitidos || 'price_currency';
    end if;
  end if;

  -- Licencia declarada: dato privado, escrito SOLO por este RPC de admin.
  if next_license_number is not null then
    if 'license_number' = any(columnas) then
      update public.businesses
         set license_number = nullif(trim(next_license_number), '')
       where id = target_business_id;
    else
      omitidos := omitidos || 'license_number';
    end if;
  end if;

  return omitidos;
end;
$$;

revoke all on function public.admin_edit_business_full(
  uuid, text, text, text, text, text, text, text[], text, text, text
) from public, anon;
grant execute on function public.admin_edit_business_full(
  uuid, text, text, text, text, text, text, text[], text, text, text
) to authenticated;

-- El helper antiguo ya no lo usa nadie; se elimina para que no pueda volver a
-- resolverse con una firma de array por error.
do $$
declare
  r record;
begin
  for r in
    select p.oid::regprocedure as firma
      from pg_proc p
     where p.proname = 'casa_abierta_columna_existe'
       and p.pronamespace = 'public'::regnamespace
  loop
    execute 'drop function ' || r.firma;
  end loop;
end $$;

-- ============================================================================
-- COMPROBACIÓN (debe mostrar next_languages text[] y devolver 0 filas):
--
--   select pg_get_function_arguments('public.admin_edit_business_full'::regproc);
--
--   select grantee, privilege_type, column_name
--     from information_schema.column_privileges
--    where table_schema = 'public'
--      and table_name = 'businesses'
--      and column_name in ('license_number', 'admin_legal_notes')
--      and grantee in ('anon', 'authenticated');
-- ============================================================================
