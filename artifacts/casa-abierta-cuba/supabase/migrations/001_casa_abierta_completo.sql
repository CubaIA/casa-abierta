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
