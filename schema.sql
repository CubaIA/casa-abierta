-- Casa Abierta Cuba — run in the Supabase SQL Editor for the configured project.
-- This migration intentionally uses the public/anon key plus the signed-in
-- user's JWT. Never place a service-role key in browser code.

create extension if not exists pgcrypto;

do $$ begin
  create type public.account_role as enum ('client', 'provider', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.verification_status as enum ('pending', 'approved', 'rejected', 'suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.experience_category as enum (
    'accommodation', 'cuban-food', 'culture', 'nature', 'ecotourism',
    'artisans', 'local-guides', 'tourist-services'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.experience_status as enum ('draft', 'published', 'hidden');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.connection_request_status as enum ('new', 'reviewing', 'accepted', 'rejected', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('new', 'reviewing', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role public.account_role not null default 'client',
  account_status text not null default 'active' check (account_status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 120),
  host_name text not null check (char_length(host_name) between 2 and 100),
  story text not null check (char_length(story) between 20 and 3000),
  description text not null check (char_length(description) between 20 and 4000),
  province text not null,
  city text not null,
  country text not null default 'Cuba',
  category public.experience_category not null,
  languages text[] not null default '{}',
  services text[] not null default '{}',
  currency char(3) not null default 'USD',
  tags text[] not null default '{}',
  photos text[] not null default '{}',
  private_phone text,
  private_email text,
  status public.verification_status not null default 'pending',
  review_note text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.experiences (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.provider_applications(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null,
  category public.experience_category not null,
  province text not null,
  city text not null,
  country text not null default 'Cuba',
  languages text[] not null default '{}',
  services text[] not null default '{}',
  currency char(3) not null default 'USD',
  tags text[] not null default '{}',
  photos text[] not null default '{}',
  price_from numeric(10, 2) check (price_from is null or price_from >= 0),
  status public.experience_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  traveler_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.provider_applications(id) on delete cascade,
  experience_id uuid not null references public.experiences(id) on delete cascade,
  requested_service text not null,
  message text not null check (char_length(message) between 10 and 2000),
  desired_date date,
  status public.connection_request_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('provider', 'experience')),
  target_id uuid not null,
  reason text not null check (reason in ('fake-profile', 'fraud', 'incorrect-information', 'other')),
  details text not null check (char_length(details) between 10 and 2000),
  status public.report_status not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id)
);

create table if not exists public.travel_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  interests text[] not null default '{}',
  language text not null default 'es',
  trip_type text,
  favorite_experience_ids uuid[] not null default '{}',
  updated_at timestamptz not null default now()
);

create or replace function public.mark_account_as_provider()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'provider' where id = new.user_id;
  return new;
end;
$$;

drop trigger if exists provider_application_created on public.provider_applications;
create trigger provider_application_created after insert on public.provider_applications
for each row execute function public.mark_account_as_provider();

create or replace function public.sync_provider_publication()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status = 'approved' then
    insert into public.experiences (
      provider_id, title, description, category, province, city, country,
      languages, services, currency, tags, photos, status
    )
    values (
      new.id, new.business_name, new.description, new.category, new.province,
      new.city, new.country, new.languages, new.services, new.currency,
      new.tags, new.photos, 'published'
    )
    on conflict (provider_id) do update set
      title = excluded.title,
      description = excluded.description,
      category = excluded.category,
      province = excluded.province,
      city = excluded.city,
      country = excluded.country,
      languages = excluded.languages,
      services = excluded.services,
      currency = excluded.currency,
      tags = excluded.tags,
      photos = excluded.photos,
      status = 'published',
      updated_at = now();
  elsif new.status in ('rejected', 'suspended') then
    update public.experiences set status = 'hidden' where provider_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists provider_application_reviewed on public.provider_applications;
create trigger provider_application_reviewed after update on public.provider_applications
for each row execute function public.sync_provider_publication();

create index if not exists experiences_public_browse_idx
  on public.experiences (status, category, province, created_at desc);
create unique index if not exists experiences_one_listing_per_provider_idx
  on public.experiences (provider_id);
create index if not exists provider_applications_review_idx
  on public.provider_applications (status, created_at desc);
create index if not exists connection_requests_traveler_idx
  on public.connection_requests (traveler_id, created_at desc);
create index if not exists connection_requests_provider_idx
  on public.connection_requests (provider_id, created_at desc);
create index if not exists reports_queue_idx on public.reports (status, created_at desc);

create or replace view public.public_experiences
with (security_barrier = true) as
select
  e.id, e.provider_id, e.title, e.description, e.category, e.province, e.city,
  e.country, e.languages, e.services, e.currency, e.tags, e.photos,
  e.price_from, e.created_at,
  p.business_name as provider_business_name,
  p.host_name as provider_host_name,
  p.story as provider_story,
  true as provider_verified
from public.experiences e
join public.provider_applications p on p.id = e.provider_id
where e.status = 'published' and p.status = 'approved';
grant select on public.public_experiences to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
drop trigger if exists applications_set_updated_at on public.provider_applications;
create trigger applications_set_updated_at before update on public.provider_applications
for each row execute function public.set_updated_at();
drop trigger if exists experiences_set_updated_at on public.experiences;
create trigger experiences_set_updated_at before update on public.experiences
for each row execute function public.set_updated_at();
drop trigger if exists requests_set_updated_at on public.connection_requests;
create trigger requests_set_updated_at before update on public.connection_requests
for each row execute function public.set_updated_at();
drop trigger if exists preferences_set_updated_at on public.travel_preferences;
create trigger preferences_set_updated_at before update on public.travel_preferences
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  insert into public.travel_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin' and p.account_status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.account_status = 'active'
  );
$$;

alter table public.profiles enable row level security;
alter table public.provider_applications enable row level security;
alter table public.experiences enable row level security;
alter table public.connection_requests enable row level security;
alter table public.reports enable row level security;
alter table public.travel_preferences enable row level security;

drop policy if exists profiles_read_self_admin on public.profiles;
create policy profiles_read_self_admin on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists profiles_update_self on public.profiles;
drop policy if exists profiles_update_self_admin on public.profiles;
create policy profiles_update_self_admin on public.profiles for update to authenticated
using (
  (id = (select auth.uid()) and (select public.is_active_user()))
  or (select public.is_admin())
)
with check (
  (id = (select auth.uid()) and (select public.is_active_user()))
  or (select public.is_admin())
);
revoke update on public.profiles from authenticated;
grant update (display_name, account_status) on public.profiles to authenticated;

drop policy if exists applications_read_owner_admin on public.provider_applications;
create policy applications_read_owner_admin on public.provider_applications for select to authenticated
using (user_id = (select auth.uid()) or (select public.is_admin()));
drop policy if exists applications_insert_owner on public.provider_applications;
create policy applications_insert_owner on public.provider_applications for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.is_active_user()));
drop policy if exists applications_update_owner_admin on public.provider_applications;
create policy applications_update_owner_admin on public.provider_applications for update to authenticated
using (
  (user_id = (select auth.uid()) and status in ('pending', 'rejected'))
  or (select public.is_admin())
)
with check (
  (user_id = (select auth.uid()) and status in ('pending', 'rejected'))
  or (select public.is_admin())
);

drop policy if exists experiences_public_approved on public.experiences;
create policy experiences_public_approved on public.experiences for select to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and p.status = 'approved'
  )
);
drop policy if exists experiences_owner_admin on public.experiences;
create policy experiences_owner_admin on public.experiences for select to authenticated
using (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and (p.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);
drop policy if exists experiences_owner_insert on public.experiences;
create policy experiences_owner_insert on public.experiences for insert to authenticated
with check (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and p.user_id = (select auth.uid()) and p.status = 'approved'
  )
);
drop policy if exists experiences_owner_admin_update on public.experiences;
create policy experiences_owner_admin_update on public.experiences for update to authenticated
using (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and (p.user_id = (select auth.uid()) or (select public.is_admin()))
  )
)
with check (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and (p.user_id = (select auth.uid()) or (select public.is_admin()))
  )
);

drop policy if exists requests_read_participants_admin on public.connection_requests;
create policy requests_read_participants_admin on public.connection_requests for select to authenticated
using (
  traveler_id = (select auth.uid())
  or exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and p.user_id = (select auth.uid())
  )
  or (select public.is_admin())
);
drop policy if exists requests_insert_traveler on public.connection_requests;
create policy requests_insert_traveler on public.connection_requests for insert to authenticated
with check (
  traveler_id = (select auth.uid())
  and (select public.is_active_user())
  and exists (
    select 1 from public.experiences e
    join public.provider_applications p on p.id = e.provider_id
    where e.id = experience_id and e.provider_id = provider_id
      and e.status = 'published' and p.status = 'approved'
  )
);
drop policy if exists requests_update_provider_admin on public.connection_requests;
create policy requests_update_provider_admin on public.connection_requests for update to authenticated
using (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and p.user_id = (select auth.uid())
  )
  or (select public.is_admin())
)
with check (
  exists (
    select 1 from public.provider_applications p
    where p.id = provider_id and p.user_id = (select auth.uid())
  )
  or (select public.is_admin())
);

drop policy if exists reports_insert_reporter on public.reports;
create policy reports_insert_reporter on public.reports for insert to authenticated
with check (reporter_id = (select auth.uid()) and (select public.is_active_user()));
drop policy if exists reports_read_admin on public.reports;
create policy reports_read_admin on public.reports for select to authenticated
using ((select public.is_admin()));
drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports for update to authenticated
using ((select public.is_admin())) with check ((select public.is_admin()));

drop policy if exists preferences_owner on public.travel_preferences;
create policy preferences_owner on public.travel_preferences for select to authenticated
using (user_id = (select auth.uid()));
drop policy if exists preferences_insert_owner on public.travel_preferences;
create policy preferences_insert_owner on public.travel_preferences for insert to authenticated
with check (user_id = (select auth.uid()) and (select public.is_active_user()));
drop policy if exists preferences_update_owner on public.travel_preferences;
create policy preferences_update_owner on public.travel_preferences for update to authenticated
using (user_id = (select auth.uid()) and (select public.is_active_user()))
with check (user_id = (select auth.uid()) and (select public.is_active_user()));

create or replace function public.admin_summary()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
begin
  if not (select public.is_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'pendingProviders', (select count(*) from public.provider_applications where status = 'pending'),
    'openReports', (select count(*) from public.reports where status in ('new', 'reviewing')),
    'activeRequests', (select count(*) from public.connection_requests where status in ('new', 'reviewing', 'accepted'))
  );
end;
$$;

-- Public images are only readable once their provider is approved. Uploads are
-- scoped to the signed-in provider's UUID folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('casa-abierta-listings', 'casa-abierta-listings', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists listing_photos_upload_owner on storage.objects;
create policy listing_photos_upload_owner on storage.objects for insert to authenticated
with check (
  bucket_id = 'casa-abierta-listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
drop policy if exists listing_photos_read_approved on storage.objects;
create policy listing_photos_read_approved on storage.objects for select to anon, authenticated
using (
  bucket_id = 'casa-abierta-listings'
  and (
    exists (
      select 1 from public.provider_applications p
      where p.user_id::text = (storage.foldername(name))[1] and p.status = 'approved'
    )
    or (select public.is_admin())
    or (select auth.uid())::text = (storage.foldername(name))[1]
  )
);
drop policy if exists listing_photos_delete_owner on storage.objects;
create policy listing_photos_delete_owner on storage.objects for delete to authenticated
using (
  bucket_id = 'casa-abierta-listings'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Bootstrap an administrator after creating their account:
-- update public.profiles set role = 'admin' where id = '<auth.users UUID>';
