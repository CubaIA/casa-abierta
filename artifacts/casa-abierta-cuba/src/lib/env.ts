/** Configuración de la app.
 *
 * Variables (Vite):
 *   VITE_SUPABASE_URL       — URL del proyecto Supabase
 *   VITE_SUPABASE_ANON_KEY  — clave pública anon/publishable (NUNCA service_role)
 *
 * Si faltan, la app entra en "modo demostración": catálogo y flujos funcionan
 * con datos locales de ejemplo persistidos en el navegador, claramente marcados.
 */
const viteEnv = (import.meta as { env?: Record<string, string | undefined> }).env;

/** Normaliza un valor de variable de entorno: quita espacios y saltos de línea
 *  pegados al copiarlo desde el panel (Vercel/Supabase) y, en la URL, añade el
 *  protocolo https:// si falta. Sin esto `createClient` fallaba y la app
 *  entraba en modo demo aunque las variables estuvieran definidas. */
function normalizar(valor: string | undefined, conProtocolo = false): string | undefined {
  const limpio = valor?.trim();
  if (!limpio) return undefined;
  if (!conProtocolo) return limpio;
  return /^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`;
}

export const SUPABASE_URL = normalizar(viteEnv?.VITE_SUPABASE_URL, true);
export const SUPABASE_ANON_KEY = normalizar(viteEnv?.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const APP_NAME = 'Casa Abierta Cuba';
