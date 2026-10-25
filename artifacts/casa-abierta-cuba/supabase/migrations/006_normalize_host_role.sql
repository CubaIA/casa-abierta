-- ============================================================================
-- 006: ROL DE ANFITRIÓN — «anfitrion» Y «provider» SON EL MISMO ROL
-- ============================================================================
-- La interfaz ya acepta ambos nombres, pero las políticas RLS y el RPC
-- provider_submit_business comparan contra 'provider'. Si una fila quedó
-- guardada como 'anfitrion', el usuario ve el panel pero el alta de negocio
-- le sería rechazada en la BD. Esta migración deja los datos canónicos.
--
-- Idempotente: puede re-ejecutarse sin dañar datos existentes.
-- Aplicar en Supabase → SQL Editor (después de 005_admin_edit_business.sql).
-- ============================================================================

-- 1) Quitar cualquier CHECK que limite users.role (con el nombre que tenga).
do $$
declare
  c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.users'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%role%'
  loop
    execute format('alter table public.users drop constraint %I', c.conname);
  end loop;
end
$$;

-- 2) Normalizar los valores ya guardados.
update public.users
   set role = 'provider'
 where lower(trim(role)) in ('anfitrion', 'anfitrión', 'anfitriona', 'host', 'proveedor');

update public.users
   set role = 'traveler'
 where lower(trim(role)) in ('viajero', 'turista');

update public.users
   set role = 'admin'
 where lower(trim(role)) in ('administrador', 'administrator');

-- 3) Regla definitiva: solo los tres roles canónicos.
alter table public.users
  add constraint users_role_check
  check (role in ('traveler', 'provider', 'admin'));

-- 4) El trigger de registro también acepta el alias «anfitrion».
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
    case
      when lower(trim(coalesce(new.raw_user_meta_data ->> 'account_type', '')))
           in ('provider', 'anfitrion', 'anfitrión', 'anfitriona', 'host', 'proveedor')
        then 'provider'
      else 'traveler'
    end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = excluded.full_name,
        phone = excluded.phone;
  return new;
end;
$$;
