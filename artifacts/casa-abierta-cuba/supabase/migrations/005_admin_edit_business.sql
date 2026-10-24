-- ============================================================================
-- 005: EDICIÓN DE NEGOCIO DESDE EL PANEL DE ADMINISTRACIÓN
-- ============================================================================
-- El panel Admin necesita editar descripción, WhatsApp y fotos de cualquier
-- negocio. El UPDATE directo sobre `businesses` depende de los privilegios y de
-- las políticas RLS de cada proyecto (001 solo permite actualizar negocios
-- pendientes de su dueño), así que este RPC SECURITY DEFINER es la vía
-- garantizada sin editar datos a mano en el SQL Editor.
--
-- Notas:
--   * La BD de producción guarda las fotos en `images`; la migración 001 usa
--     `photos`. Se detecta la columna que exista y se usa esa.
--   * Idempotente: puede re-ejecutarse sin dañar datos existentes.
--   * Aplicar en Supabase → SQL Editor una sola vez si el panel Admin muestra
--     el aviso de migración.
-- ============================================================================

create or replace function public.admin_edit_business(
  target_business_id uuid,
  next_description text,
  next_phone text,
  next_images text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin boolean := false;
  col_fotos text;
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

  -- Columna de fotos real (images en producción, photos en la migración 001).
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'images'
  ) then
    col_fotos := 'images';
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'businesses' and column_name = 'photos'
  ) then
    col_fotos := 'photos';
  else
    raise exception 'La tabla businesses no tiene columna images/photos' using errcode = '42703';
  end if;

  if not exists (select 1 from public.businesses where id = target_business_id) then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;

  if next_description is null or length(trim(next_description)) = 0 then
    raise exception 'Invalid business description' using errcode = '22023';
  end if;

  execute format(
    'update public.businesses set description = trim($1), %I = coalesce($2, ''{}''::text[]) where id = $3',
    col_fotos
  )
  using next_description, next_images, target_business_id;

  -- WhatsApp: businesses.phone (producción) y business_contacts.phone (001).
  if next_phone is not null and length(trim(next_phone)) > 0 then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'businesses' and column_name = 'phone'
    ) then
      execute 'update public.businesses set phone = trim($1) where id = $2'
        using next_phone, target_business_id;
    end if;

    if to_regclass('public.business_contacts') is not null
       and exists (
         select 1 from information_schema.columns
         where table_schema = 'public' and table_name = 'business_contacts' and column_name = 'phone'
       ) then
      update public.business_contacts
         set phone = trim(next_phone)
       where business_id = target_business_id;
      if not found
         and exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'business_contacts' and column_name = 'owner_id'
         )
         and exists (
           select 1 from information_schema.columns
           where table_schema = 'public' and table_name = 'business_contacts' and column_name = 'email'
         ) then
        insert into public.business_contacts (business_id, owner_id, phone, email)
        select b.id, b.owner_id, trim(next_phone), ''
          from public.businesses b
         where b.id = target_business_id and b.owner_id is not null
        on conflict (business_id) do nothing;
      end if;
    end if;
  end if;
end;
$$;

revoke all on function public.admin_edit_business(uuid, text, text, text[]) from public, anon;
grant execute on function public.admin_edit_business(uuid, text, text, text[]) to authenticated;
