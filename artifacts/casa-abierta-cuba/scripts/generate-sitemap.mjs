/**
 * Genera `public/sitemap.xml` antes de `vite build`.
 *
 * Incluye las páginas estáticas públicas y una URL por ficha aprobada de
 * `businesses`, leídas con la clave anónima (RLS deja ver solo lo aprobado).
 *
 * Regla de oro: el build nunca se rompe. Si Supabase no responde, la clave no
 * está o la consulta falla, el sitemap se escribe solo con las páginas fijas.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SITE_URL = 'https://casaabiertacuba.vercel.app';

/** Páginas públicas que siempre existen (aunque la BD falle). */
const PAGINAS_ESTATICAS = [
  '/',
  '/about',
  '/alojamientos',
  '/operadores',
  '/gastronomia',
  '/guias',
  '/taxis',
  '/lgbtq',
  '/blog',
];

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const destino = path.join(raiz, 'public', 'sitemap.xml');

/** Lee pares CLAVE=valor de `.env` sin imprimir ni registrar sus valores. */
async function leerEnvLocal() {
  const valores = {};
  try {
    const texto = await readFile(path.join(raiz, '.env'), 'utf8');
    for (const linea of texto.split('\n')) {
      const match = linea.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)$/);
      if (!match) continue;
      const valor = match[2].trim().replace(/^["']|["']$/g, '');
      if (valor) valores[match[1]] = valor;
    }
  } catch {
    /* sin .env: se usan las variables del entorno del build */
  }
  return valores;
}

/** Fichas públicas aprobadas, leídas con la clave anónima del proyecto. */
async function fichasAprobadas() {
  const env = await leerEnvLocal();
  const url = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn('[sitemap] Sin credenciales de Supabase: solo páginas estáticas.');
    return [];
  }

  const endpoint =
    `${url.replace(/\/$/, '')}/rest/v1/businesses` +
    '?select=id&status=eq.approved&order=created_at.asc';

  const res = await fetch(endpoint, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Supabase respondió ${res.status}`);

  const filas = await res.json();
  if (!Array.isArray(filas)) return [];
  return filas
    .map((fila) => (fila && typeof fila.id === 'string' ? fila.id.trim() : ''))
    .filter(Boolean);
}

function escaparXml(valor) {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function construirXml(rutas) {
  const urls = rutas
    .map((ruta) => `  <url>\n    <loc>${escaparXml(SITE_URL + ruta)}</loc>\n  </url>`)
    .join('\n');
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    `${urls}\n` +
    '</urlset>\n'
  );
}

let ids = [];
try {
  ids = await fichasAprobadas();
} catch (error) {
  console.warn(`[sitemap] No se pudieron leer las fichas (${error.message}). Solo páginas estáticas.`);
}

const rutas = [...PAGINAS_ESTATICAS, ...ids.map((id) => `/negocio/${encodeURIComponent(id)}`)];
await writeFile(destino, construirXml(rutas), 'utf8');
console.log(`[sitemap] ${rutas.length} URLs (${ids.length} fichas) → public/sitemap.xml`);
