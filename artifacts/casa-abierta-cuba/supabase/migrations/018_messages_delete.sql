-- ============================================================================
-- 018 — Borrado del historial de chat por parte del anfitrión
-- ============================================================================
-- La migración 017 solo concedía select e insert, así que el botón de papelera
-- fallaba con «permission denied». Aquí se concede delete y se limita a los
-- hilos de los leads del propio anfitrión (el admin puede con todos).
--
-- Idempotente: se puede ejecutar varias veces sin efectos secundarios.
-- ============================================================================

grant delete on public.messages to authenticated;

drop policy if exists casa_abierta_messages_host_delete on public.messages;
create policy casa_abierta_messages_host_delete
  on public.messages for delete to authenticated
  using (
    public.casa_abierta_is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = messages.lead_id and l.host_id = auth.uid()
    )
  );
