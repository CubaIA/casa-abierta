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

-- ============================================================================
-- FUNCIÓN: admin_delete_business
-- ============================================================================
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

-- ============================================================================
-- FUNCIÓN: admin_set_request_status
-- ============================================================================
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

-- ============================================================================
-- FUNCIÓN: admin_set_report_status
-- ============================================================================
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

-- ============================================================================
-- FUNCIÓN: admin_get_request_contact ([FIX-7])
-- Única vía PostgREST de leer requests.contact_email (no hay grant de select
-- sobre esa columna: ni el proveedor ni el dueño pueden verla directamente).
-- ============================================================================
create or replace function public.admin_get_request_contact(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.casa_abierta_is_admin() then
    raise exception 'Administrator role required' using errcode = '42501';
  end if;
  return (select contact_email from public.requests where id = p_request_id);
end;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY: habilitar
-- ============================================================================
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.favorites enable row level security;
alter table public.requests enable row level security;
alter table public.reviews enable row level security;
alter table public.business_contacts enable row level security;
alter table public.business_categories enable row level security;
alter table public.reports enable row level security;
alter table public.contact_messages enable row level security;

-- ============================================================================
-- GRANTS (PostgREST)
-- ============================================================================
grant select on public.users to authenticated;
grant update (full_name, phone) on public.users to authenticated;
grant select on public.businesses to anon, authenticated;
grant insert, update, delete on public.businesses to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert on public.requests to authenticated;
grant update (status) on public.requests to authenticated;
grant select, insert on public.reviews to authenticated;
-- [FIX-2] lectura pública de reseñas consistente con su política RLS
grant select on public.reviews to anon;
grant execute on function public.casa_abierta_is_admin() to authenticated;
grant execute on function public.admin_set_business_status(uuid, text) to authenticated;
grant execute on function public.admin_set_user_role(uuid, text) to authenticated;

-- 002: perfil ampliado escribible por su dueño; rol/email/estado NUNCA
revoke update (full_name, phone, country, preferred_language, travel_interests,
  trip_style, budget_band, cultural_preferences, favorite_activities)
  on public.users from authenticated;
grant update (full_name, phone, country, preferred_language, travel_interests,
  trip_style, budget_band, cultural_preferences, favorite_activities)
  on public.users to authenticated;

-- 002: lectura pública de businesses acotada a columnas de descubrimiento
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

revoke all on public.business_categories from anon, authenticated;
grant select on public.business_categories to anon, authenticated;
grant insert, update, delete on public.business_categories to authenticated;

revoke all on public.requests from anon, authenticated;
grant select (
  id, requester_id, business_id, message, status, service_requested,
  commission_rate, commission_amount, commission_status, created_at
) on public.requests to authenticated;
-- [FIX-6] id: uuid generado por el cliente; contact_email: el viajero deja su
-- email al solicitar, pero NO se concede en select (ver T13b/PRIVACIDAD).
grant insert (id, requester_id, business_id, contact_email, message, service_requested, status) on public.requests to authenticated;
grant update (status) on public.requests to authenticated;

revoke all on public.reports from anon, authenticated;
grant select, insert, update on public.reports to authenticated;

revoke all on public.contact_messages from anon, authenticated;
grant select, insert, update on public.contact_messages to authenticated;

-- ============================================================================
-- POLICIES RLS (001 base + 002 definitivas)
-- ============================================================================

-- users
drop policy if exists casa_abierta_users_read_self_or_admin on public.users;
create policy casa_abierta_users_read_self_or_admin
  on public.users for select to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_users_update_self_profile on public.users;
create policy casa_abierta_users_update_self_profile
  on public.users for update to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin())
