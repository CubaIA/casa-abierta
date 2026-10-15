  with check (id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_users_access_guard on public.users;
create policy casa_abierta_users_access_guard
  on public.users as restrictive for all to authenticated
  using (id = auth.uid() or public.casa_abierta_is_admin())
  with check (id = auth.uid() or public.casa_abierta_is_admin());
drop policy if exists casa_abierta_users_active_update_guard on public.users;
create policy casa_abierta_users_active_update_guard
  on public.users as restrictive for update to authenticated
  using (public.casa_abierta_user_active() or public.casa_abierta_is_admin())
  with check (public.casa_abierta_user_active() or public.casa_abierta_is_admin());

-- businesses
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
drop policy if exists casa_abierta_businesses_active_guard on public.businesses;
create policy casa_abierta_businesses_active_guard
  on public.businesses as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

-- favorites
drop policy if exists casa_abierta_favorites_select_own on public.favorites;
create policy casa_abierta_favorites_select_own
  on public.favorites for select to authenticated using (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_insert_own on public.favorites;
create policy casa_abierta_favorites_insert_own
  on public.favorites for insert to authenticated with check (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_delete_own on public.favorites;
create policy casa_abierta_favorites_delete_own
  on public.favorites for delete to authenticated using (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_access_guard on public.favorites;
create policy casa_abierta_favorites_access_guard
  on public.favorites as restrictive for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
drop policy if exists casa_abierta_favorites_active_guard on public.favorites;
create policy casa_abierta_favorites_active_guard
  on public.favorites as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

-- requests (002: estados nuevos, email del viajero nunca visible al proveedor)
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
  with check (
    requester_id = auth.uid()
    and status = 'new'
    and exists (select 1 from public.businesses b where b.id = business_id and b.status = 'approved')
  );
drop policy if exists casa_abierta_requests_update_provider on public.requests;
create policy casa_abierta_requests_update_provider
  on public.requests for update to authenticated
  using (
    requester_id = auth.uid()
    or exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
    or public.casa_abierta_is_admin()
  )
  with check (
    (requester_id = auth.uid() and status in ('cancelled', 'new'))
    or (exists (select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid())
        and status in ('reviewing', 'accepted', 'completed'))
    or public.casa_abierta_is_admin()
  );
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
    (requester_id = auth.uid() and status in ('new', 'cancelled'))
    or (
      exists (
        select 1 from public.businesses b
        where b.id = business_id and b.owner_id = auth.uid()
      )
      and status in ('reviewing', 'accepted', 'completed')
    )
    or public.casa_abierta_is_admin()
  );
drop policy if exists casa_abierta_requests_active_guard on public.requests;
create policy casa_abierta_requests_active_guard
  on public.requests as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

-- reviews
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
drop policy if exists casa_abierta_reviews_active_guard on public.reviews;
create policy casa_abierta_reviews_active_guard
  on public.reviews as restrictive for all to authenticated
  using (public.casa_abierta_user_active())
  with check (public.casa_abierta_user_active());

-- business_contacts
drop policy if exists casa_abierta_business_contacts_owner_admin on public.business_contacts;
create policy casa_abierta_business_contacts_owner_admin
  on public.business_contacts for all to authenticated
  using (
    public.casa_abierta_is_admin()
    or (owner_id = auth.uid() and exists (
      select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
    ))
  )
  with check (
    public.casa_abierta_is_admin()
    or (owner_id = auth.uid() and exists (
      select 1 from public.businesses b where b.id = business_id and b.owner_id = auth.uid()
    ))
  );
drop policy if exists casa_abierta_business_contacts_active_guard on public.business_contacts;
create policy casa_abierta_business_contacts_active_guard
  on public.business_contacts as restrictive for all to authenticated
