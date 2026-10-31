-- ============================================================================
-- 014 — Reseñas directas desde la ficha pública
-- ============================================================================
-- La tabla creada en 001 exigía `request_id` NOT NULL y una política RLS que
-- solo aceptaba reseñas de solicitudes `completed`. El formulario de la ficha
-- pública no tiene solicitud: cualquier cuenta con sesión debe poder valorar.
--
-- Esta migración, idempotente:
--   1) añade `user_id` como autor de la reseña y lo rellena desde la columna
--      antigua (`reviewer_id` en producción, `author_id` en 001);
--   2) quita el NOT NULL de `request_id` y del autor antiguo;
--   3) sustituye la política restrictiva que exigía una solicitud completada.
--
-- Lección de la 012: aquí NO se hace ningún cast de texto a array. Las
-- columnas se leen una sola vez de pg_attribute y se comparan con `= any`.
-- ============================================================================

do $migracion$
declare
  columnas text[];
begin
  select array_agg(a.attname)
    into columnas
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relname = 'reviews'
    and a.attnum > 0
    and not a.attisdropped;

  if columnas is null then
    raise notice 'public.reviews no existe; no hay nada que migrar';
    return;
  end if;

  if not ('user_id' = any (columnas)) then
    execute 'alter table public.reviews add column user_id uuid references auth.users (id) on delete cascade';
    columnas := columnas || 'user_id'::text;
  end if;

  if 'reviewer_id' = any (columnas) then
    execute 'update public.reviews set user_id = reviewer_id where user_id is null and reviewer_id is not null';
    execute 'alter table public.reviews alter column reviewer_id drop not null';
  end if;

  if 'author_id' = any (columnas) then
    execute 'update public.reviews set user_id = author_id where user_id is null and author_id is not null';
    execute 'alter table public.reviews alter column author_id drop not null';
  end if;

  if 'request_id' = any (columnas) then
    execute 'alter table public.reviews alter column request_id drop not null';
  end if;
end
$migracion$;

create index if not exists casa_abierta_reviews_user_idx
  on public.reviews (user_id);

grant select, insert on public.reviews to authenticated;
grant select on public.reviews to anon;

-- INSERT: el autor es siempre `auth.uid()`; nadie puede reseñar en nombre de otro.
drop policy if exists casa_abierta_reviews_insert_completed_request on public.reviews;
drop policy if exists casa_abierta_reviews_insert_authenticated on public.reviews;
create policy casa_abierta_reviews_insert_authenticated
  on public.reviews for insert to authenticated
  with check (user_id = auth.uid() and rating between 1 and 5);

-- El guard antiguo era restrictivo y exigía una solicitud `completed`: con él
-- ninguna reseña libre pasaría. Se reemplaza por el guard de cuenta activa.
drop policy if exists casa_abierta_reviews_access_guard on public.reviews;
drop policy if exists casa_abierta_reviews_active_guard on public.reviews;
create policy casa_abierta_reviews_active_guard
  on public.reviews as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());
