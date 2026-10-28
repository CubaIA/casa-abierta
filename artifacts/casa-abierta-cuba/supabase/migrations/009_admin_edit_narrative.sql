-- ============================================================================
-- 009: EDICIÓN DESDE EL PANEL ADMIN DE «CONOCE A TU ANFITRIÓN» Y
--      «DETALLES DE LA EXPERIENCIA»
-- ============================================================================
-- El editor del panel Admin necesita modificar estos dos textos de la ficha.
-- La migración 001 los crea en `businesses`, pero el RPC de edición (005) solo
-- aceptaba descripción, WhatsApp y fotos: en los proyectos donde el UPDATE
-- directo de `businesses` no está concedido a `authenticated` (001 hace
-- `revoke all` y solo re-concede columnas de lectura) esas dos columnas no se
-- podían escribir desde el panel.
--
--   * Añade las columnas si faltan (idempotente) y concede select/update.
--   * Crea la firma de 6 argumentos de admin_edit_business. La firma de 4
--     argumentos de 005 se conserva intacta.
--   * Aplicar en Supabase → SQL Editor una sola vez.
-- ============================================================================

alter table public.businesses add column if not exists host_story text not null default '';
alter table public.businesses add column if not exists experience_details text not null default '';

grant select (host_story, experience_details) on public.businesses to anon, authenticated;
grant update (host_story, experience_details) on public.businesses to authenticated;

create or replace function public.admin_edit_business(
  target_business_id uuid,
  next_description text,
  next_phone text,
  next_images text[],
  next_host_story text,
  next_experience_details text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  es_admin boolean := false;
  col_fotos text;
  col_historia text;
  col_detalles text;
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

  -- «Conoce a tu anfitrión»: host_story o su alias host_bio.
  if next_host_story is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'businesses' and column_name = 'host_story'
    ) then
      col_historia := 'host_story';
    elsif exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'businesses' and column_name = 'host_bio'
    ) then
      col_historia := 'host_bio';
    end if;

    if col_historia is not null then
      execute format('update public.businesses set %I = trim($1) where id = $2', col_historia)
        using next_host_story, target_business_id;
    end if;
  end if;

  -- «Detalles de la experiencia»: experience_details o el text[] amenities.
  if next_experience_details is not null then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'businesses' and column_name = 'experience_details'
    ) then
      col_detalles := 'experience_details';
    elsif exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'businesses' and column_name = 'amenities'
    ) then
      col_detalles := 'amenities';
    end if;

    if col_detalles = 'experience_details' then
      execute 'update public.businesses set experience_details = trim($1) where id = $2'
        using next_experience_details, target_business_id;
    elsif col_detalles = 'amenities' then
      begin
        execute 'update public.businesses set amenities = case when trim($1) = '''' then ''{}''::text[] else array[trim($1)] end where id = $2'
          using next_experience_details, target_business_id;
      exception when others then
        -- Columna con otro tipo en este proyecto: no se toca.
        null;
      end;
    end if;
  end if;

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

revoke all on function public.admin_edit_business(uuid, text, text, text[], text, text) from public, anon;
grant execute on function public.admin_edit_business(uuid, text, text, text[], text, text) to authenticated;
