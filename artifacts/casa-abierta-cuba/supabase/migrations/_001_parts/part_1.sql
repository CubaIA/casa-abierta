
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

-- ============================================================================
-- TABLA: reviews
-- ============================================================================
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

-- ============================================================================
-- TABLA: business_contacts (datos de contacto privados del proveedor)
-- ============================================================================
create table if not exists public.business_contacts (
  business_id uuid primary key references public.businesses(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  phone text not null,
  email text not null,
  updated_at timestamptz not null default now()
);
create index if not exists casa_abierta_business_contacts_owner_idx
  on public.business_contacts(owner_id);

-- Preserva contactos previos de la tabla legacy de businesses (no-op en base nueva)
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

-- ============================================================================
-- TABLA: business_categories (semillas)
-- ============================================================================
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

-- ============================================================================
-- TABLA: reports
-- ============================================================================
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

-- ============================================================================
-- TABLA: contact_messages
-- ============================================================================
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

-- ============================================================================
-- FUNCIÓN: casa_abierta_is_admin
-- ============================================================================
-- [FIX-5] el rol admin solo surte efecto con cuenta activa
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
      and account_status = 'active'
  );
$$;

-- ============================================================================
-- FUNCIÓN: handle_new_user (trigger de auth.users)
-- Registro público: solo traveler/provider; admin solo desde Supabase.
-- ============================================================================
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

drop trigger if exists casa_abierta_auth_user_created on auth.users;
create trigger casa_abierta_auth_user_created
  after insert on auth.users
  for each row execute function public.casa_abierta_handle_new_user();

-- ============================================================================
-- FUNCIÓN: casa_abierta_user_active
-- ============================================================================
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

-- ============================================================================
-- FUNCIÓN: provider_submit_business (alta de negocio por el proveedor)
-- ============================================================================
create or replace function public.provider_submit_business(
  p_name text,
  p_host_name text,
  p_description text,
  p_host_story text,
