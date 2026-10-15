-- ========================================================
-- 002: MULTI-PAÍS, MONEDAS, PAGOS Y FUNCIONALIDADES
-- ========================================================

-- Países
create table if not exists public.countries (
  id uuid primary key default gen_random_uuid(),
  code char(2) unique not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.countries (code, name, is_active) values
  ('CU', 'Cuba', true),
  ('US', 'Estados Unidos', false),
  ('ES', 'España', true),
  ('FR', 'Francia', true),
  ('MX', 'México', true),
  ('CA', 'Canadá', true),
  ('RU', 'Rusia', true),
  ('CN', 'China', true)
on conflict (code) do nothing;

-- Regiones (genérico)
create table if not exists public.regions (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Ciudades
create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_id uuid references public.countries(id) on delete set null,
  region_id uuid references public.regions(id) on delete set null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Monedas
create table if not exists public.currencies (
  code char(3) primary key,
  name text not null,
  symbol text,
  is_active boolean not null default true,
  sort_order int default 0
);

insert into public.currencies (code, name, symbol, is_active, sort_order) values
  ('USD', 'Dólar estadounidense', '$', true, 1),
  ('EUR', 'Euro', '€', true, 2),
  ('MLC', 'Moneda Libremente Convertible', 'MLC', true, 3),
  ('CUP', 'Peso cubano', 'CUP', true, 4)
on conflict (code) do nothing;

alter table public.profiles add column if not exists user_country_id uuid references public.countries(id) on delete set null;
alter table public.profiles add column if not exists currency char(3) default 'USD';

alter table public.businesses add column if not exists country_id uuid references public.countries(id) on delete set null;
alter table public.businesses add column if not exists city_id uuid references public.cities(id) on delete set null;
alter table public.businesses add column if not exists price_currency char(3) default 'USD';
alter table public.businesses add column if not exists price_amount numeric(12,2);

-- LGBTQ+ / sostenibilidad / verificación
alter table public.businesses add column if not exists verified boolean not null default false;
alter table public.businesses add column if not exists sustainability_badge text;
alter table public.businesses add column if not exists is_experience boolean not null default false;

-- RLS básico (admin solo)
alter table public.countries enable row level security;
alter table public.regions enable row level security;
alter table public.cities enable row level security;
alter table public.currencies enable row level security;

create policy if not exists countries_select on public.countries for select using (true);
create policy if not exists countries_mod on public.countries for all using (public.casa_abierta_is_admin(auth.uid())) with check (public.casa_abierta_is_admin(auth.uid()));

create policy if not exists regions_select on public.regions for select using (true);
create policy if not exists regions_mod on public.regions for all using (public.casa_abierta_is_admin(auth.uid())) with check (public.casa_abierta_is_admin(auth.uid()));

create policy if not exists cities_select on public.cities for select using (true);
create policy if not exists cities_mod on public.cities for all using (public.casa_abierta_is_admin(auth.uid())) with check (public.casa_abierta_is_admin(auth.uid()));

create policy if not exists currencies_select on public.currencies for select using (true);
create policy if not exists currencies_mod on public.currencies for all using (public.casa_abierta_is_admin(auth.uid())) with check (public.casa_abierta_is_admin(auth.uid()));
