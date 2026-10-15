import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './env';

/** Cliente Supabase o null cuando no hay credenciales (modo demo). */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  : null;

/** Columnas de businesses concedidas en select a anon/authenticated (ver migración).
 *  No usar `*`: phone/email están revocados y owner_id solo se concede a
 *  authenticated, así que la lista pública lo excluye. */
export const BUSINESS_PUBLIC_COLS =
  'id, name, host_name, description, host_story, service_type, category, ' +
  'tourism_category, province, municipality, photos, languages, ' +
  'experience_details, recommended_for, lgbt_friendly, status, created_at';

/** Para usuarios autenticados además owner_id está concedido. */
export const BUSINESS_AUTH_COLS = BUSINESS_PUBLIC_COLS + ', owner_id';

/** Columnas select concedidas en requests (contact_email NO: privacidad). */
export const REQUEST_COLS =
  'id, requester_id, business_id, message, status, service_requested, ' +
  'commission_rate, commission_amount, commission_status, created_at';
