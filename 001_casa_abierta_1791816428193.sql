-- Casa Abierta MVP schema for the existing Supabase project.
-- This migration is additive: it does not delete business records. Restrictive
-- guards keep pre-existing permissive policies from widening access to these
-- tables; still review old policies for clarity and shared-project impact.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text,
  role text not null default 'traveler'
    check (role in ('traveler', 'provider', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.users
  add column if not exists email text,
  add column if not exists full_name text not null default '',
  add column if not exists phone text,
  add column if not exists role text not null default 'traveler',
  add column if not exists created_at timestamptz not null default now();

create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  service_type text not null,
  category text not null,
  description text not null,
  province text not null,
  municipality text not null,
  photos text[] not null default '{}',
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- Add the Casa Abierta fields to the existing businesses table without
-- renaming or dropping columns that may already be used elsewhere.
alter table public.businesses
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists owner_id uuid references auth.users (id) on delete cascade,
  add column if not exists name text,
  add column if not exists phone text,
  add column if not exists email text,
  add column if not exists service_type text,
  add column if not exists category text,
  add column if not exists description text,
  add column if not exists province text,
  add column if not exists municipality text,
  add column if not exists photos text[] not null default '{}',
  add column if not exists status text not null default 'pending',
  add column if not exists created_at timestamptz not null default now();

create unique index if not exists casa_abierta_businesses_id_uidx
  on public.businesses (id);
create index if not exists casa_abierta_businesses_public_idx
  on public.businesses (status, province, category, service_type);
create index if not exists casa_abierta_businesses_owner_idx
  on public.businesses (owner_id);

create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  contact_email text,
  message text not null,
  status text not null default 'open'
    check (status in ('open', 'accepted', 'rejected', 'completed')),
  created_at timestamptz not null default now()
);

create index if not exists casa_abierta_requests_business_idx
  on public.requests (business_id, status, created_at desc);
create index if not exists casa_abierta_requests_requester_idx
  on public.requests (requester_id, created_at desc);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.requests (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  author_id uuid not null references auth.users (id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists casa_abierta_reviews_business_idx
  on public.reviews (business_id, created_at desc);

create or replace function public.casa_abierta_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'admin'
  );
$$;

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
    'traveler'
  )
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists casa_abierta_auth_user_created on auth.users;
create trigger casa_abierta_auth_user_created
  after insert on auth.users
  for each row execute function public.casa_abierta_handle_new_user();

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
  if next_status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid business status' using errcode = '22023';
  end if;
  update public.businesses
     set status = next_status
   where id = target_business_id;
  if not found then
    raise exception 'Business not found' using errcode = 'P0002';
  end if;
end;
$$;

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

alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.favorites enable row level security;
alter table public.requests enable row level security;
alter table public.reviews enable row level security;

grant select on public.users to authenticated;
grant update (full_name, phone) on public.users to authenticated;
grant select on public.businesses to anon, authenticated;
grant insert, update, delete on public.businesses to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.requests to authenticated;
grant update (status) on public.requests to authenticated;
grant select, insert on public.reviews to authenticated;
grant execute on function public.casa_abierta_is_admin() to authenticated;
grant execute on function public.admin_set_business_status(uuid, text) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

drop policy if exists casa_abierta_users_read_self_or_admin on public.users;
create policy casa_abierta_users_read_self_or_admin
  on public.users for select to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_users_update_self_profile on public.users;
create policy casa_abierta_users_update_self_profile
  on public.users for update to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin())
  with check (id = auth.uid() or public.casa_abierta_is_admin());

drop policy if exists casa_abierta_businesses_read_public_or_owner on public.businesses;
create policy casa_abierta_businesses_read_public_or_owner
  on public.businesses for select to anon, authenticated
  using (
    status = 'approved'
    or owner_id = auth.uid()
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_businesses_insert_pending_owner on public.businesses;
create policy casa_abierta_businesses_insert_pending_owner
  on public.businesses for insert to authenticated
  with check (owner_id = auth.uid() and status = 'pending');
drop policy if exists casa_abierta_businesses_update_pending_owner on public.businesses;
create policy casa_abierta_businesses_update_pending_owner
  on public.businesses for update to authenticated
  using (owner_id = auth.uid() and status = 'pending')
  with check (owner_id = auth.uid() and status = 'pending');
drop policy if exists casa_abierta_businesses_delete_pending_owner on public.businesses;
create policy casa_abierta_businesses_delete_pending_owner
  on public.businesses for delete to authenticated
  using (owner_id = auth.uid() and status = 'pending');

drop policy if exists casa_abierta_favorites_select_own on public.favorites;
create policy casa_abierta_favorites_select_own
  on public.favorites for select to authenticated using (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_insert_own on public.favorites;
create policy casa_abierta_favorites_insert_own
  on public.favorites for insert to authenticated with check (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_delete_own on public.favorites;
create policy casa_abierta_favorites_delete_own
  on public.favorites for delete to authenticated using (user_id = auth.uid());

drop policy if exists casa_abierta_requests_read_participants on public.requests;
create policy casa_abierta_requests_read_participants
  on public.requests for select to authenticated
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_requests_insert_requester on public.requests;
create policy casa_abierta_requests_insert_requester
  on public.requests for insert to authenticated
  with check (requester_id = auth.uid() and status = 'open');
drop policy if exists casa_abierta_requests_update_provider on public.requests;
create policy casa_abierta_requests_update_provider
  on public.requests for update to authenticated
  using (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
    and status in ('accepted', 'rejected', 'completed')
  );

drop policy if exists casa_abierta_reviews_read_public on public.reviews;
create policy casa_abierta_reviews_read_public
  on public.reviews for select to anon, authenticated using (true);
drop policy if exists casa_abierta_reviews_insert_completed_request on public.reviews;
create policy casa_abierta_reviews_insert_completed_request
  on public.reviews for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.business_id = business_id
        and r.requester_id = auth.uid()
        and r.status = 'completed'
    )
  );

-- Restrictive guards are deliberate: PostgreSQL combines permissive policies
-- with OR, so an older wide policy must not widen Casa Abierta's access.
drop policy if exists casa_abierta_users_access_guard on public.users;
create policy casa_abierta_users_access_guard
  on public.users as restrictive for all to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin())
  with check (id = auth.uid() or public.casa_abierta_is_admin());

drop policy if exists casa_abierta_businesses_access_guard on public.businesses;
create policy casa_abierta_businesses_access_guard
  on public.businesses as restrictive for all to authenticated
  using (
    status = 'approved'
    or owner_id = auth.uid()
    or public.casa_abierta_is_admin()
  )
  with check (
    (owner_id = auth.uid() and status = 'pending')
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_businesses_anon_read_guard on public.businesses;
create policy casa_abierta_businesses_anon_read_guard
  on public.businesses as restrictive for all to anon
  using (status = 'approved')
  with check (false);

drop policy if exists casa_abierta_favorites_access_guard on public.favorites;
create policy casa_abierta_favorites_access_guard
  on public.favorites as restrictive for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists casa_abierta_requests_access_guard on public.requests;
create policy casa_abierta_requests_access_guard
  on public.requests as restrictive for all to authenticated
  using (
    requester_id = auth.uid()
    or exists (
      select 1 from public.businesses b
      where b.id = business_id and b.owner_id = auth.uid()
    )
    or public.casa_abierta_is_admin()
  )
  with check (
    (requester_id = auth.uid() and status = 'open')
    or (
      exists (
        select 1 from public.businesses b
        where b.id = business_id and b.owner_id = auth.uid()
      )
      and status in ('accepted', 'rejected', 'completed')
    )
    or public.casa_abierta_is_admin()
  );

drop policy if exists casa_abierta_reviews_access_guard on public.reviews;
create policy casa_abierta_reviews_access_guard
  on public.reviews as restrictive for all to anon, authenticated
  using (true)
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.requests r
      where r.id = request_id
        and r.business_id = business_id
        and r.requester_id = auth.uid()
        and r.status = 'completed'
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-photos',
  'business-photos',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists casa_abierta_business_photos_public_read on storage.objects;
create policy casa_abierta_business_photos_public_read
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'business-photos');
drop policy if exists casa_abierta_business_photos_owner_upload on storage.objects;
create policy casa_abierta_business_photos_owner_upload
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'business-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
drop policy if exists casa_abierta_business_photos_owner_delete on storage.objects;
create policy casa_abierta_business_photos_owner_delete
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'business-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists casa_abierta_business_photos_insert_guard on storage.objects;
create policy casa_abierta_business_photos_insert_guard
  on storage.objects as restrictive for insert to anon, authenticated
  with check (
    bucket_id <> 'business-photos'
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );
drop policy if exists casa_abierta_business_photos_update_guard on storage.objects;
create policy casa_abierta_business_photos_update_guard
  on storage.objects as restrictive for update to anon, authenticated
  using (
    bucket_id <> 'business-photos'
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  )
  with check (
    bucket_id <> 'business-photos'
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );
drop policy if exists casa_abierta_business_photos_delete_guard on storage.objects;
create policy casa_abierta_business_photos_delete_guard
  on storage.objects as restrictive for delete to anon, authenticated
  using (
    bucket_id <> 'business-photos'
    or (
      auth.uid() is not null
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );
