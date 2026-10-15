  p_service_type text,
  p_tourism_category text,
  p_province text,
  p_municipality text,
  p_photos text[],
  p_languages text[],
  p_experience_details text,
  p_recommended_for text[],
  p_lgbt_friendly boolean,
  p_phone text,
  p_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_business_id uuid;
  broad_category text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.users
    where id = auth.uid() and role = 'provider' and account_status = 'active'
  ) then
    raise exception 'Provider account required' using errcode = '42501';
  end if;
  if length(trim(coalesce(p_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_host_name, ''))) not between 2 and 120
     or length(trim(coalesce(p_description, ''))) not between 20 and 1200
     or length(trim(coalesce(p_host_story, ''))) not between 20 and 1200
     or length(trim(coalesce(p_phone, ''))) not between 5 and 40
     or length(trim(coalesce(p_email, ''))) not between 5 and 254
     or trim(coalesce(p_email, '')) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
     or length(trim(coalesce(p_province, ''))) not between 2 and 80
     or length(trim(coalesce(p_municipality, ''))) not between 2 and 100
     or coalesce(array_length(p_photos, 1), 0) > 8
     or coalesce(array_length(p_languages, 1), 0) > 10
     or coalesce(array_length(p_recommended_for, 1), 0) > 10 then
    raise exception 'Invalid provider submission fields' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.business_categories
    where key = p_tourism_category and active
  ) then
    raise exception 'Inactive or unknown tourism category' using errcode = '22023';
  end if;
  if p_service_type not in (
    'alojamiento', 'gastronomia', 'transporte', 'guia_local', 'experiencias',
    'naturaleza', 'ecoturismo', 'artesanos', 'turismo_inclusivo'
  ) then
    raise exception 'Unknown service type' using errcode = '22023';
  end if;

  broad_category := case
    when p_tourism_category = 'alojamiento' then 'alojamiento'
    when p_tourism_category in ('experiencias_culturales', 'naturaleza', 'ecoturismo', 'artesanos') then 'experiencias'
    else 'servicios'
  end;

  insert into public.businesses (
    owner_id, name, host_name, description, host_story, service_type,
    category, tourism_category, province, municipality, photos, languages,
    experience_details, recommended_for, lgbt_friendly, status
  ) values (
    auth.uid(), trim(p_name), trim(p_host_name), trim(p_description),
    trim(coalesce(p_host_story, '')), p_service_type, broad_category,
    p_tourism_category, trim(p_province), trim(p_municipality),
    coalesce(p_photos, '{}'), coalesce(p_languages, '{}'),
    trim(coalesce(p_experience_details, '')), coalesce(p_recommended_for, '{}'),
    coalesce(p_lgbt_friendly, false), 'pending'
  )
  returning id into new_business_id;

  insert into public.business_contacts (business_id, owner_id, phone, email)
  values (new_business_id, auth.uid(), trim(p_phone), lower(trim(p_email)));
  return new_business_id;
end;
$$;

-- ============================================================================
-- FUNCIÓN: admin_set_business_status
-- ============================================================================
create or replace function public.admin_set_business_status(
  target_business_id uuid,
  next_status text
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
  if next_status not in ('pending', 'approved', 'rejected', 'suspended') then
    raise exception 'Invalid business status' using errcode = '22023';
  end if;
  update public.businesses set status = next_status where id = target_business_id;
  if not found then raise exception 'Business not found' using errcode = 'P0002'; end if;
end;
$$;

-- ============================================================================
-- FUNCIÓN: admin_set_user_role
-- ============================================================================
create or replace function public.admin_set_user_role(
  target_user_id uuid,
  next_role text
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
  if next_role not in ('traveler', 'provider', 'admin') then
    raise exception 'Invalid account role' using errcode = '22023';
  end if;
  update public.users
     set role = next_role
   where id = target_user_id;
  if not found then
    raise exception 'User not found' using errcode = 'P0002';
  end if;
end;
$$;

-- ============================================================================
-- FUNCIÓN: admin_set_user_status
-- ============================================================================
create or replace function public.admin_set_user_status(
  target_user_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare target_role text;
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  if next_status not in ('active', 'suspended') or target_user_id = auth.uid() then
    raise exception 'Invalid account status change' using errcode = '22023';
  end if;
  select role into target_role from public.users where id = target_user_id;
  if target_role is null then raise exception 'User not found' using errcode = 'P0002'; end if;
  if target_role = 'admin' and next_status = 'suspended'
     and (select count(*) from public.users where role = 'admin' and account_status = 'active') <= 1 then
    raise exception 'Cannot suspend the last active administrator' using errcode = '42501';
  end if;
  update public.users set account_status = next_status where id = target_user_id;
end;
$$;

-- ============================================================================
-- FUNCIÓN: admin_update_business
-- ============================================================================
create or replace function public.admin_update_business(
  target_business_id uuid,
  next_name text,
  next_host_name text,
  next_description text,
  next_host_story text,
  next_tourism_category text,
  next_province text,
  next_municipality text,
  next_languages text[],
  next_experience_details text,
  next_recommended_for text[],
  next_lgbt_friendly boolean
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
  if length(trim(coalesce(next_name, ''))) not between 2 and 120
     or length(trim(coalesce(next_description, ''))) not between 20 and 1200
     or not exists (select 1 from public.business_categories where key = next_tourism_category) then
    raise exception 'Invalid business fields or category' using errcode = '22023';
  end if;
