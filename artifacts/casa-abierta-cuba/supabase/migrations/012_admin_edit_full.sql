-- ============================================================================
-- 012: CONTROL TOTAL DEL ADMINISTRADOR SOBRE LA FICHA
--      + BLINDAJE DE PRIVACIDAD DE LOS DATOS LEGALES
-- ============================================================================
-- El panel Admin edita ahora todos los datos del negocio: nombre del anfitrión,
-- provincia, municipio, categoría, tipo de servicio, horario (check-in /
-- check-out en JSON), idiomas, precio, moneda y el número de licencia
-- declarada.
--
-- Por qué un RPC y no un UPDATE directo:
--   * `license_number` y `admin_legal_notes` NO están concedidas a `anon` ni a
--     `authenticated` (migración 008). Un UPDATE directo desde el panel no
--     podría escribir la licencia y, además, RLS silencia las filas afectadas
--     sin devolver error.
--   * `admin_edit_business_full` es SECURITY DEFINER y comprueba el rol con
--     `casa_abierta_is_admin()`, igual que 005/008/009.
--
-- Qué devuelve: `text[]` con las columnas que este proyecto NO tiene, para que
-- la app avise en lugar de fingir que guardó. Array vacío = todo se aplicó.
--
-- Privacidad (crítico): al final se reconstruyen los privilegios por columna de
-- `businesses`. Se revoca el privilegio de TABLA y se vuelve a conceder la lista
-- explícita de columnas públicas, excluyendo de SELECT `license_number`,
-- `admin_legal_notes`, `phone` y `email`, y de UPDATE los datos legales. Así
-- ninguna lectura ni escritura de un usuario normal puede alcanzarlos, aunque
-- el proyecto tuviera el GRANT por defecto de Supabase (ALL para anon y
-- authenticated).
--
-- Idempotente: puede re-ejecutarse. Aplicar en Supabase → SQL Editor
-- (después de 008 y 009).
-- ============================================================================

-- 1) Columnas que el panel necesita editar (no-op si ya existen).
alter table public.businesses add column if not exists host_name text not null default '';
alter table public.businesses add column if not exists schedule text;
alter table public.businesses add column if not exists price_amount numeric;
alter table public.businesses add column if not exists price_currency text;

-- 2) Helper interno: ¿existe esta columna en businesses?
create or replace function public.casa_abierta_columna_existe(p_columna text)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'businesses'
       and column_name = p_columna
  );
$$;

revoke all on function public.casa_abierta_columna_existe(text) from public, anon, authenticated;

-- 3) Edición total desde el panel de administración.
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
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;

  if not exists (select 1 from public.businesses where id = target_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  -- Nombre del anfitrión (dueño del negocio, no quien mira la ficha).
  if next_host_name is not null then
    if public.casa_abierta_columna_existe('host_name') then
      update public.businesses set host_name = trim(next_host_name) where id = target_business_id;
    else
      omitidos := omitidos || 'host_name';
    end if;
  end if;

  if next_province is not null then
    if public.casa_abierta_columna_existe('province') then
      update public.businesses set province = trim(next_province) where id = target_business_id;
    else
      omitidos := omitidos || 'province';
    end if;
  end if;

  if next_municipality is not null then
    if public.casa_abierta_columna_existe('municipality') then
      update public.businesses set municipality = trim(next_municipality) where id = target_business_id;
    else
      omitidos := omitidos || 'municipality';
    end if;
  end if;

  -- Categoría ancha: `category` en producción, `subcategory` como alias.
  if next_category is not null then
    if public.casa_abierta_columna_existe('category') then
      update public.businesses set category = trim(next_category) where id = target_business_id;
    elsif public.casa_abierta_columna_existe('subcategory') then
      update public.businesses set subcategory = trim(next_category) where id = target_business_id;
    else
      omitidos := omitidos || 'category';
    end if;
  end if;

  -- Tipo de servicio: `service_type` (migración 001) o `subcategory`.
  if next_service_type is not null then
    if public.casa_abierta_columna_existe('service_type') then
      update public.businesses set service_type = trim(next_service_type) where id = target_business_id;
    elsif public.casa_abierta_columna_existe('subcategory') then
      update public.businesses set subcategory = trim(next_service_type) where id = target_business_id;
    else
      omitidos := omitidos || 'service_type';
    end if;
  end if;

  -- Horario: texto JSON {"check_in":"15:00","check_out":"11:00"}.
  if next_schedule is not null then
    if public.casa_abierta_columna_existe('schedule') then
      begin
        update public.businesses
           set schedule = nullif(trim(next_schedule), '')
         where id = target_business_id;
      exception when others then
        omitidos := omitidos || 'schedule';
      end;
    elsif public.casa_abierta_columna_existe('horario') then
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

  if next_languages is not null then
    if public.casa_abierta_columna_existe('languages') then
      begin
        update public.businesses set languages = next_languages where id = target_business_id;
      exception when others then
        omitidos := omitidos || 'languages';
      end;
    else
      omitidos := omitidos || 'languages';
    end if;
  end if;

  -- `''` borra el precio; cualquier otro texto se interpreta como número.
  if next_price_amount is not null then
    if public.casa_abierta_columna_existe('price_amount') then
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
    if public.casa_abierta_columna_existe('price_currency') then
      update public.businesses
         set price_currency = upper(nullif(trim(next_price_currency), ''))
       where id = target_business_id;
    else
      omitidos := omitidos || 'price_currency';
    end if;
  end if;

  -- Licencia declarada: dato privado, escrito SOLO por este RPC de admin.
  if next_license_number is not null then
    if public.casa_abierta_columna_existe('license_number') then
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

-- ============================================================================
-- 4) Privacidad: privilegios por columna, sin datos legales privados.
--    Se reconstruyen desde cero para que un GRANT de tabla heredado (el que
--    Supabase da por defecto) no deje leer `license_number`.
-- ============================================================================
do $$
declare
  col text;
  publicas text[] := '{}';
  editables text[] := '{}';
begin
  -- SELECT: todo menos la licencia, las notas internas y los contactos.
  for col in
    select column_name
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'businesses'
       and column_name not in ('license_number', 'admin_legal_notes', 'phone', 'email')
     order by ordinal_position
  loop
    publicas := publicas || quote_ident(col);
  end loop;

  -- UPDATE: todo menos los datos legales y las columnas de identidad.
  for col in
    select column_name
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'businesses'
       and column_name not in (
         'id', 'owner_id', 'created_at',
         'license_number', 'admin_legal_notes', 'legal_validated'
       )
     order by ordinal_position
  loop
    editables := editables || quote_ident(col);
  end loop;

  execute 'revoke select on public.businesses from anon, authenticated';
  execute 'revoke update on public.businesses from anon, authenticated';
  execute 'revoke insert (license_number) on public.businesses from anon, authenticated';

  if array_length(publicas, 1) is not null then
    execute 'grant select (' || array_to_string(publicas, ', ') || ') on public.businesses to anon, authenticated';
  end if;
  if array_length(editables, 1) is not null then
    execute 'grant update (' || array_to_string(editables, ', ') || ') on public.businesses to authenticated';
  end if;

  -- `owner_id` sigue siendo legible con sesión (lo usa «Mis negocios»).
  if public.casa_abierta_columna_existe('owner_id') then
    execute 'grant select (owner_id) on public.businesses to authenticated';
  end if;
end $$;

-- 5) El anfitrión ya no declara la licencia desde la app: solo el admin la
--    escribe (por el RPC de arriba). Se revoca la vía antigua de 008.
do $$
begin
  if to_regprocedure('public.provider_set_business_license(uuid, text)') is not null then
    execute 'revoke execute on function public.provider_set_business_license(uuid, text) '
         || 'from public, anon, authenticated';
  end if;
end $$;

-- ============================================================================
-- COMPROBACIÓN (ejecuta esto después; debe devolver 0 filas):
--
--   select grantee, privilege_type, column_name
--     from information_schema.column_privileges
--    where table_schema = 'public'
--      and table_name = 'businesses'
--      and column_name in ('license_number', 'admin_legal_notes')
--      and grantee in ('anon', 'authenticated');
-- ============================================================================
