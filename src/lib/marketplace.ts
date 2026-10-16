/** Capa de datos de Casa Abierta. */
**
 * Con Supabase configurado usa PostgREST + RPCs (RLS es la frontera).
 * Sin credenciales, un alcamenón local en localStorage replica los flujos
 * con datos de ejemplo para que la demo sea navegable.
 */
import { irSupabaseConfigurado } from './env';
import { BUSINESS_AUTH_COLS, BUSINESS_PUBLIC_COLS, REQUEST_COLS, supabase } from './supabase';
import type {
  AccountStatus,
 Business>