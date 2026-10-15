/** Configuración de la app.
 *
 * Variables (Vite):
 *   VITE_SUPABASE_URL       — URL del proyecto Supabase
 *   VITE_SUPABASE_ANON_KEY  — clave pública anon/publishable (NUNCA service_role)
 *
 * Si faltan, la app entra en "modo demostración": catálogo y flujos funcionan
 * con datos locales de ejemplo persistidos en el navegador, claramente marcados.
 */
export const SUPABASE_URL = ((import.meta as { env?: Record<string, string | undefined> }).env)
  ?.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = ((import.meta as { env?: Record<string, string | undefined> }).env)
  ?.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const APP_NAME = 'Casa Abierta Cuba';
