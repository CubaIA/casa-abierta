-- ============================================================================
-- 015 — Reseñas anónimas con aprobación manual
-- ============================================================================
-- La ficha pública deja escribir una reseña sin cuenta: nombre, estrellas y
-- comentario. Nada se publica hasta que el equipo lo aprueba.
--
-- Esta migración, idempotente:
--   1) añade `author_name` (el nombre escrito a mano) y `status` a `reviews`;
--   2) deja en `approved` las reseñas que ya estaban publicadas y pone
--      `pending` por defecto en las nuevas;
--   3) permite INSERT anónimo solo como `pending`;
--   4) permite leer al público únicamente lo `approved` (el admin ve todo);
--   5) añade `contacts_generated` a `businesses` para el contador de clics de
--      WhatsApp del panel.
-- ============================================================================

alter table public.reviews add column if not exists author_name text;

alter table public.reviews
  add column if not exists status text not null default 'approved';

-- Las reseñas anteriores a esta migración ya estaban visibles: siguen
-- aprobadas. A partir de aquí, cualquier inserción sin estado entra pendiente.
alter table public.reviews alter column status set default 'pending';

alter table public.reviews drop constraint if exists casa_abierta_reviews_status_check;
alter table public.reviews
  add constraint casa_abierta_reviews_status_check
  check (status in ('pending', 'approved'));

create index if not exists casa_abierta_reviews_status_idx
  on public.reviews (status, created_at desc);

-- Contador de contactos generados por negocio.
alter table public.businesses
  add column if not exists contacts_generated integer not null default 0;

grant select (contacts_generated) on public.businesses to anon, authenticated;
grant insert on public.reviews to anon;
grant select on public.reviews to anon;

-- Lectura pública: solo lo aprobado. El administrador conserva acceso total.
drop policy if exists casa_abierta_reviews_public_read on public.reviews;
create policy casa_abierta_reviews_public_read
  on public.reviews for select to anon, authenticated
  using (status = 'approved' or public.casa_abierta_is_admin());

-- Escritura pública: siempre pendiente, con límites razonables.
drop policy if exists casa_abierta_reviews_public_insert on public.reviews;
create policy casa_abierta_reviews_public_insert
  on public.reviews for insert to anon, authenticated
  with check (
    status = 'pending'
    and rating between 1 and 5
    and length(btrim(coalesce(author_name, ''))) between 1 and 80
    and length(btrim(coalesce(comment, ''))) between 5 and 1000
  );

-- Moderación: solo el administrador aprueba o rechaza.
drop policy if exists casa_abierta_reviews_admin_update on public.reviews;
create policy casa_abierta_reviews_admin_update
  on public.reviews for update to authenticated
  using (public.casa_abierta_is_admin())
  with check (public.casa_abierta_is_admin());

drop policy if exists casa_abierta_reviews_admin_delete on public.reviews;
create policy casa_abierta_reviews_admin_delete
  on public.reviews for delete to authenticated
  using (public.casa_abierta_is_admin());
