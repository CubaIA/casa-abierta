-- Casa Abierta platform workflows and privacy hardening.
-- Apply after 001_casa_abierta.sql. This migration is additive to business data.

begin;

alter table public.users
  add column if not exists country text,
  add column if not exists preferred_language text,
  add column if not exists travel_interests text[] not null default '{}',
  add column if not exists trip_style text,
  add column if not exists budget_band text,
  add column if not exists cultural_preferences text[] not null default '{}',
  add column if not exists favorite_activities text[] not null default '{}',
  add column if not exists account_status text not null default 'active';
alter table public.users drop constraint if exists casa_abierta_account_status_check;
alter table public.users
  add constraint casa_abierta_account_status_check
  check (account_status in ('active', 'suspended'));

alter table public.businesses
  add column if not exists host_name text not null default '',
  add column if not exists host_story text not null default '',
  add column if not exists tourism_category text not null default 'servicios_turisticos',
  add column if not exists languages text[] not null default '{}',
  add column if not exists experience_details text not null default '',
  add column if not exists recommended_for text[] not null default '{}',
  add column if not exists lgbt_friendly boolean not null default false;
alter table public.businesses
  alter column phone drop not null,
  alter column email drop not null;

update public.businesses
set tourism_category = case service_type
  when 'alojamiento' then 'alojamiento'
  when 'gastronomia' then 'gastronomia'
  when 'guia_local' then 'guias_locales'
  when 'experiencias' then 'experiencias_culturales'
  else 'servicios_turisticos'
end
where tourism_category = 'servicios_turisticos';

alter table public.businesses drop constraint if exists businesses_status_check;
alter table public.businesses drop constraint if exists casa_abierta_business_status_check;
alter table public.businesses
  add constraint casa_abierta_business_status_check
  check (status in ('pending', 'approved', 'rejected', 'suspended'));

create table if not exists public.business_contacts (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  email text not null,
  updated_at timestamptz not null default now()
);
create index if not exists casa_abierta_business_contacts_owner_idx
  on public.business_contacts(owner_id);

-- Preserve any existing contact details privately before restricting the public table.
insert into public.business_contacts (business_id, owner_id, phone, email)
select id, owner_id, coalesce(phone, ''), coalesce(email, '')
from public.businesses
where owner_id is not null
  and (coalesce(phone, '') <> '' or coalesce(email, '') <> '')
on conflict (business_id) do update
  set owner_id = excluded.owner_id,
      phone = excluded.phone,
      email = excluded.email,
      updated_at = now();

create table if not exists public.business_categories (
  key text primary key,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
insert into public.business_categories (key, label, sort_order) values
  ('alojamiento', 'Alojamientos', 10),
  ('gastronomia', 'Gastronomía cubana', 20),
  ('experiencias_culturales', 'Experiencias culturales', 30),
  ('naturaleza', 'Naturaleza', 40),
  ('ecoturismo', 'Ecoturismo', 50),
  ('artesanos', 'Artesanos', 60),
  ('guias_locales', 'Guías locales', 70),
  ('servicios_turisticos', 'Servicios turísticos', 80),
  ('turismo_inclusivo', 'Turismo inclusivo', 90)
on conflict (key) do update set label = excluded.label;

alter table public.requests
  add column if not exists service_requested text not null default '',
  add column if not exists commission_rate numeric(7,6),
  add column if not exists commission_amount numeric(12,2),
  add column if not exists commission_status text not null default 'not_applicable';
update public.requests set status = case status
  when 'open' then 'new'
  when 'rejected' then 'cancelled'
  else status
end;
alter table public.requests drop constraint if exists requests_status_check;
alter table public.requests drop constraint if exists casa_abierta_request_status_check;
alter table public.requests drop constraint if exists casa_abierta_commission_status_check;
alter table public.requests
  add constraint casa_abierta_request_status_check
  check (status in ('new', 'reviewing', 'accepted', 'completed', 'cancelled'));
alter table public.requests
  add constraint casa_abierta_commission_status_check
  check (commission_status in ('not_applicable', 'pending', 'earned', 'waived'));

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('business', 'user', 'request')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  admin_note text not null default '',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists casa_abierta_reports_status_idx
  on public.reports(status, created_at desc);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  inquiry_type text not null default 'general'
    check (inquiry_type in ('general', 'agency', 'operator', 'experience_creator', 'cultural_project')),
  subject text not null,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);
create index if not exists casa_abierta_contact_messages_status_idx
  on public.contact_messages(status, created_at desc);

-- A signup can request traveler/provider only; admin can only be assigned by an administrator.
create or replace function public.casa_abierta_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, phone, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', ''),
    case when new.raw_user_meta_data ->> 'account_type' = 'provider'
      then 'provider' else 'traveler' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = excluded.phone;
  return new;
end;
$$;

create or replace function public.provider_submit_business(
  p_name text,
  p_host_name text,
  p_description text,
  p_host_story text,
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

create or replace function public.casa_abierta_user_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and account_status = 'active'
  );
$$;

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
  update public.businesses set
    name = trim(next_name),
    host_name = trim(next_host_name),
    description = trim(next_description),
    host_story = trim(coalesce(next_host_story, '')),
    tourism_category = next_tourism_category,
    category = case
      when next_tourism_category = 'alojamiento' then 'alojamiento'
      when next_tourism_category in ('experiencias_culturales', 'naturaleza', 'ecoturismo', 'artesanos') then 'experiencias'
      else 'servicios'
    end,
    province = trim(next_province),
    municipality = trim(next_municipality),
    languages = coalesce(next_languages, '{}'),
    experience_details = trim(coalesce(next_experience_details, '')),
    recommended_for = coalesce(next_recommended_for, '{}'),
    lgbt_friendly = coalesce(next_lgbt_friendly, false)
  where id = target_business_id;
  if not found then raise exception 'Business not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_delete_business(target_business_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  delete from public.businesses where id = target_business_id;
  if not found then raise exception 'Business not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_set_request_status(
  target_request_id uuid,
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
  if next_status not in ('new', 'reviewing', 'accepted', 'completed', 'cancelled') then
    raise exception 'Invalid request status' using errcode = '22023';
  end if;
  update public.requests set status = next_status where id = target_request_id;
  if not found then raise exception 'Request not found' using errcode = 'P0002'; end if;
end;
$$;

create or replace function public.admin_set_report_status(
  target_report_id uuid,
  next_status text,
  next_note text default ''
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
  if next_status not in ('open', 'reviewing', 'resolved', 'dismissed') then
    raise exception 'Invalid report status' using errcode = '22023';
  end if;
  update public.reports
    set status = next_status,
        admin_note = left(coalesce(next_note, ''), 1200),
        resolved_at = case when next_status in ('resolved', 'dismissed') then now() else null end
  where id = target_report_id;
  if not found then raise exception 'Report not found' using errcode = 'P0002'; end if;
end;
$$;

alter table public.business_contacts enable row level security;
alter table public.business_categories enable row level security;
alter table public.reports enable row level security;
alter table public.contact_messages enable row level security;

-- Profile fields may be updated by their owner, but role, email, and account
-- status are never client-writable.
revoke update (full_name, phone, country, preferred_language, travel_interests,
  trip_style, budget_band, cultural_preferences, favorite_activities)
  on public.users from authenticated;
grant update (full_name, phone, country, preferred_language, travel_interests,
  trip_style, budget_band, cultural_preferences, favorite_activities)
  on public.users to authenticated;
drop policy if exists casa_abierta_users_active_update_guard on public.users;
create policy casa_abierta_users_active_update_guard
  on public.users as restrictive for update to authenticated
  using (public.casa_abierta_user_active() or public.casa_abierta_is_admin())
  with check (public.casa_abierta_user_active() or public.casa_abierta_is_admin());

-- Narrow public business reads to fields intended for discovery. Contact fields
-- in the legacy table remain inaccessible through PostgREST.
revoke all on public.businesses from anon, authenticated;
revoke select (phone, email) on public.businesses from anon, authenticated;
grant select (
  id, name, host_name, description, host_story, service_type, category,
  tourism_category, province, municipality, photos, languages,
  experience_details, recommended_for, lgbt_friendly, status, created_at
) on public.businesses to anon, authenticated;
grant select (owner_id) on public.businesses to authenticated;

revoke all on public.business_contacts from anon, authenticated;
grant select, insert, update on public.business_contacts to authenticated;
drop policy if exists casa_abierta_business_contacts_owner_admin on public.business_contacts;
create policy casa_abierta_business_contacts_owner_admin
  on public.business_contacts for all to authenticated
  using (
    public.casa_abierta_is_admin()
    or (owner_id = auth.uid() and exists (
      select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
    ))
  )
  with check (
    public.casa_abierta_is_admin()
    or (owner_id = auth.uid() and exists (
      select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
    ))
  );
drop policy if exists casa_abierta_business_contacts_active_guard on public.business_contacts;
create policy casa_abierta_business_contacts_active_guard
  on public.business_contacts as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

revoke all on public.business_categories from anon, authenticated;
grant select on public.business_categories to anon, authenticated;
grant insert, update, delete on public.business_categories to authenticated;
drop policy if exists casa_abierta_categories_read_active on public.business_categories;
create policy casa_abierta_categories_read_active
  on public.business_categories for select to anon, authenticated
  using (active or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_categories_admin_manage on public.business_categories;
create policy casa_abierta_categories_admin_manage
  on public.business_categories for all to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());
drop policy if exists casa_abierta_categories_admin_guard on public.business_categories;
create policy casa_abierta_categories_admin_guard
  on public.business_categories as restrictive for all to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());

-- The requester and provider may read a lead, but provider access never includes
-- the requester's email; all first contact stays inside Casa Abierta.
revoke all on public.requests from anon, authenticated;
grant select (
  id, requester_id, business_id, message, status, service_requested,
  commission_rate, commission_amount, commission_status, created_at
) on public.requests to authenticated;
grant insert (requester_id, business_id, message, service_requested, status) on public.requests to authenticated;
grant update (status) on public.requests to authenticated;
drop policy if exists casa_abierta_requests_insert_requester on public.requests;
create policy casa_abierta_requests_insert_requester
  on public.requests for insert to authenticated
  with check (
    requester_id = auth.uid()
    and status = 'new'
    and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'approved')
  );
drop policy if exists casa_abierta_requests_update_provider on public.requests;
create policy casa_abierta_requests_update_provider
  on public.requests for update to authenticated
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
    or public.casa_abierta_is_admin()
  )
  with check (
    (requester_id = auth.uid() and status in ('cancelled', 'new'))
    or (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
        and status in ('reviewing', 'accepted', 'completed'))
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_requests_access_guard on public.requests;
create policy casa_abierta_requests_access_guard
  on public.requests as restrictive for all to authenticated
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
    or public.casa_abierta_is_admin()
  )
  with check (
    (requester_id = auth.uid() and status in ('new', 'cancelled'))
    or (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
        and status in ('reviewing', 'accepted', 'completed'))
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_requests_active_guard on public.requests;
create policy casa_abierta_requests_active_guard
  on public.requests as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

revoke all on public.reports from anon, authenticated;
grant select, insert, update on public.reports to authenticated;
drop policy if exists casa_abierta_reports_read_owner_admin on public.reports;
create policy casa_abierta_reports_read_owner_admin
  on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_reports_insert_owner on public.reports;
create policy casa_abierta_reports_insert_owner
  on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'open');
drop policy if exists casa_abierta_reports_update_admin on public.reports;
create policy casa_abierta_reports_update_admin
  on public.reports for update to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());
drop policy if exists casa_abierta_reports_access_guard on public.reports;
create policy casa_abierta_reports_access_guard
  on public.reports as restrictive for all to authenticated
  using (reporter_id = auth.uid() or public.casa_abierta_is_admin())
  with check ((reporter_id = auth.uid() and status = 'open') or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_reports_active_guard on public.reports;
create policy casa_abierta_reports_active_guard
  on public.reports as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

revoke all on public.contact_messages from anon, authenticated;
grant select, insert, update on public.contact_messages to authenticated;
drop policy if exists casa_abierta_contact_messages_read_owner_admin on public.contact_messages;
create policy casa_abierta_contact_messages_read_owner_admin
  on public.contact_messages for select to authenticated
  using (sender_id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_contact_messages_insert_owner on public.contact_messages;
create policy casa_abierta_contact_messages_insert_owner
  on public.contact_messages for insert to authenticated
  with check (sender_id = auth.uid() and status = 'open');
drop policy if exists casa_abierta_contact_messages_update_admin on public.contact_messages;
create policy casa_abierta_contact_messages_update_admin
  on public.contact_messages for update to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());
drop policy if exists casa_abierta_contact_messages_access_guard on public.contact_messages;
create policy casa_abierta_contact_messages_access_guard
  on public.contact_messages as restrictive for all to authenticated
  using (sender_id = auth.uid() or public.casa_abierta_is_admin())
  with check ((sender_id = auth.uid() and status = 'open') or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_contact_messages_active_guard on public.contact_messages;
create policy casa_abierta_contact_messages_active_guard
  on public.contact_messages as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

drop policy if exists casa_abierta_businesses_active_guard on public.businesses;
create policy casa_abierta_businesses_active_guard
  on public.businesses as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());
drop policy if exists casa_abierta_favorites_active_guard on public.favorites;
create policy casa_abierta_favorites_active_guard
  on public.favorites as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());
drop policy if exists casa_abierta_reviews_active_guard on public.reviews;
create policy casa_abierta_reviews_active_guard
  on public.reviews as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());
drop policy if exists casa_abierta_business_photos_active_guard on storage.objects;
create policy casa_abierta_business_photos_active_guard
  on storage.objects as restrictive for all to authenticated
  using (bucket_id <> 'business-photos' or public.casa_abierta_user_active())
  with check (bucket_id <> 'business-photos' or public.casa_abierta_user_active());
drop policy if exists casa_abierta_business_photos_provider_upload_guard on storage.objects;
create policy casa_abierta_business_photos_provider_upload_guard
  on storage.objects as restrictive for insert to authenticated
  with check (
    bucket_id <> 'business-photos'
    or public.casa_abierta_is_admin()
    or (
      public.casa_abierta_user_active()
      and exists (select 1 from public.users where id = auth.uid() and role = 'provider')
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );

revoke all on function public.provider_submit_business(text,text,text,text,text,text,text,text,text[],text[],text,text[],boolean,text,text) from public, anon;
revoke all on function public.admin_set_user_status(uuid,text) from public, anon;
revoke all on function public.admin_set_business_status(uuid,text) from public, anon;
revoke all on function public.admin_update_business(uuid,text,text,text,text,text,text,text,text[],text,text[],boolean) from public, anon;
revoke all on function public.admin_delete_business(uuid) from public, anon;
revoke all on function public.admin_set_request_status(uuid,text) from public, anon;
revoke all on function public.admin_set_report_status(uuid,text,text) from public, anon;
grant execute on function public.provider_submit_business(text,text,text,text,text,text,text,text,text[],text[],text,text[],boolean,text,text) to authenticated;
grant execute on function public.casa_abierta_user_active() to authenticated;
grant execute on function public.admin_set_user_status(uuid,text) to authenticated;
grant execute on function public.admin_set_business_status(uuid,text) to authenticated;
grant execute on function public.admin_update_business(uuid,text,text,text,text,text,text,text,text[],text,text[],boolean) to authenticated;
grant execute on function public.admin_delete_business(uuid) to authenticated;
grant execute on function public.admin_set_request_status(uuid,text) to authenticated;
grant execute on function public.admin_set_report_status(uuid,text,text) to authenticated;

commit;
