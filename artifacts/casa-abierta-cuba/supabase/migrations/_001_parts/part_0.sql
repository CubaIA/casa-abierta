-- ============================================================================
-- CASA ABIERTA CUBA — MIGRACIÓN ÚNICA COMPLETA
-- ============================================================================
-- Fusión de 001_casa_abierta.sql + 002_platform_mvp.sql en un solo archivo,
-- listo para pegar en el SQL Editor de un proyecto Supabase NUEVO.
--
-- Contenido:
--   1.  Tablas: users, businesses, business_contacts, business_categories,
--       favorites, requests, reviews, reports, contact_messages
--   2.  Índices y constraints
--   3.  RPC: casa_abierta_is_admin, provider_submit_business,
--       admin_set_business_status, admin_set_user_role, admin_set_user_status,
--       admin_set_request_status, admin_set_report_status,
--       admin_update_business, admin_delete_business, casa_abierta_user_active
--   4.  Row Level Security: políticas permisivas + restrictivas (guards)
--   5.  Grants/revoke por columna para PostgREST
--   6.  Storage: bucket "business-photos" (público, 5 MB, jpeg/png/webp)
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
--
-- CÓMO APLICARLO:
--   1. Crea el proyecto en https://supabase.com
--   2. SQL Editor → New query → pega TODO este archivo → Run
--   3. Despliega la Edge Function (ver fase 4): cuba-conecta-ia
--   4. Crea el primer administrador (ver sección FINAL al pie de este archivo)
--
-- CAMBIOS RESPECTO A 001+002 (justificados, ver docs/FASE3_CAMBIOS.md):
--   [FIX-1] revoke de admin_set_user_role desde PUBLIC/ANON (faltaba en 002:
--           aunque la función ya rechazaba no-admin, el privilegio de
--           ejecución debe ser solo de authenticated).
--   [FIX-2] grant select on reviews TO anon (la política RLS ya permitía
--           lectura pública "to anon, authenticated" pero el grant lo omitía;
--           sin esto el catálogo anónimo no puede mostrar reseñas).
--   [FIX-3] revoke de casa_abierta_user_active desde PUBLIC/ANON (granted a
--           authenticated; ninguna política anónima la necesita).
--   [FIX-4] constraint de users.role garantizado también en tablas previas.
--   [FIX-5] casa_abierta_is_admin() exige account_status='active': un admin
--           suspendido NO puede ejecutar RPCs administrativas ni hereda
--           visibilidad admin en RLS (antes bastaba con el rol).
--   [FIX-6] grant insert en requests ampliado con id (uuid del cliente,
--           patrón PostgREST) y contact_email (email del viajero, columna
--           que NUNCA se concede en select: privacidad vía RPC admin).
--   [FIX-7] RPC admin_get_request_contact(uuid): única vía PostgREST de leer
--           requests.contact_email; restringida a admin activo.
--   Nota: schema.sql NO se usa: define una arquitectura alternativa legacy
--   (profiles/experiences/connection_requests, bucket casa-abierta-listings)
--   incompatible con el código de la aplicación.
-- ============================================================================

begin;

-- ============================================================================
-- EXTENSIÓN
-- ============================================================================
create extension if not exists pgcrypto;

-- ============================================================================
-- TABLA: users (perfil + rol, espejo de auth.users)
-- ============================================================================
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

-- 002: preferencias de viajero + estado de cuenta
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

-- [FIX-4] integridad del rol también en tablas creadas previamente
alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check
  check (role in ('traveler', 'provider', 'admin'));

-- ============================================================================
-- TABLA: businesses (catálogo público)
-- ============================================================================
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

-- 002: ficha extendida del anfitrión
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

create unique index if not exists casa_abierta_businesses_id_uidx
  on public.businesses (id);
create index if not exists casa_abierta_businesses_public_idx
  on public.businesses (status, province, category, service_type);
create index if not exists casa_abierta_businesses_owner_idx
  on public.businesses (owner_id);

-- ============================================================================
-- TABLA: favorites
-- ============================================================================
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, business_id)
);

-- ============================================================================
-- TABLA: requests (solicitudes viajero → proveedor)
-- ============================================================================
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
