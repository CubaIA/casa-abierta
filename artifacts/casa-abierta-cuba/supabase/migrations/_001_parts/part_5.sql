  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

-- business_categories
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

-- reports
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

-- contact_messages
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

-- ============================================================================
-- STORAGE: bucket "business-photos" (público, 5 MB, jpeg/png/webp)
-- ============================================================================
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

-- ============================================================================
-- PRIVILEGIOS DE FUNCIONES
-- ============================================================================
revoke all on function public.provider_submit_business(text,text,text,text,text,text,text,text,text[],text[],text,text[],boolean,text,text) from public, anon;
revoke all on function public.admin_set_user_status(uuid,text) from public, anon;
revoke all on function public.admin_set_business_status(uuid,text) from public, anon;
revoke all on function public.admin_set_user_role(uuid,text) from public, anon;        -- [FIX-1]
revoke all on function public.admin_update_business(uuid,text,text,text,text,text,text,text,text[],text,text[],boolean) from public, anon;
revoke all on function public.admin_delete_business(uuid) from public, anon;
revoke all on function public.admin_set_request_status(uuid,text) from public, anon;
revoke all on function public.admin_set_report_status(uuid,text,text) from public, anon;
revoke all on function public.admin_get_request_contact(uuid) from public, anon;
revoke all on function public.casa_abierta_user_active() from public, anon;            -- [FIX-3]
grant execute on function public.provider_submit_business(text,text,text,text,text,text,text,text,text[],text[],text,text[],boolean,text,text) to authenticated;
grant execute on function public.casa_abierta_user_active() to authenticated;
grant execute on function public.admin_set_user_status(uuid,text) to authenticated;
grant execute on function public.admin_set_business_status(uuid,text) to authenticated;
grant execute on function public.admin_set_user_role(uuid,text) to authenticated;
grant execute on function public.admin_update_business(uuid,text,text,text,text,text,text,text,text[],text,text[],boolean) to authenticated;
grant execute on function public.admin_delete_business(uuid) to authenticated;
grant execute on function public.admin_set_request_status(uuid,text) to authenticated;
grant execute on function public.admin_set_report_status(uuid,text,text) to authenticated;
grant execute on function public.admin_get_request_contact(uuid) to authenticated;

commit;

-- ============================================================================
-- FINAL — PRIMER ADMINISTRADOR (ejecutar tras registrar tu cuenta de admin)
-- ============================================================================
-- 1. Regístrate en la app con tu correo (queda como 'traveler').
-- 2. En SQL Editor ejecuta:
--
--      update public.users set role = 'admin' where email = 'TU-CORREO';
--
-- 3. Vuelve a iniciar sesión (o recarga) y entra a /admin.
-- ============================================================================
