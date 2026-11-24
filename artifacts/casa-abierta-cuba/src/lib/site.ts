/**
 * Dominio público único de la plataforma.
 *
 * Todas las etiquetas SEO (canonical, Open Graph, JSON-LD) y el sitemap usan
 * esta base, sin importar por qué dominio se haya entrado a la app.
 */
export const SITE_URL = 'https://casaabiertacuba.vercel.app';

export const SITE_NAME = 'Casa Abierta Cuba';

/** Imagen social por defecto (la misma tarjeta de `index.html`). */
export const DEFAULT_OG_IMAGE = '/og-casa-abierta.jpg';

/** Convierte una ruta interna (o una URL ya absoluta) en URL absoluta del sitio. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

/** Ruta pública y estable de una ficha del catálogo. */
export function businessPath(id: string): string {
  return `/negocio/${id}`;
}
