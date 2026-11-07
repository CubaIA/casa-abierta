import { Car, Compass, Home as HomeIcon, Sparkles, UtensilsCrossed } from 'lucide-react';
import type { Business } from './types';

/* ------------------------------------------------------------------ */
/* Imágenes oficiales (nombres exactos tal y como están en /public/img) */
/* ------------------------------------------------------------------ */
export const CATALOG_IMAGES = {
  hero: '/img/Playa.jpeg',
  alojamiento: '/img/Habitación.jpeg',
  gastronomia: '/img/Comida.jpeg',
  servicios: '/img/Taxis.jpeg',
  lgbtq: '/img/lgbtq.jpeg',
  logo: '/img/Logo.jpeg',
} as const;

export interface CategoryTile {
  key: string;
  img: string;
  alt: string;
  title: string;
  desc: string;
  serviceType?: string;
  inclusivo?: boolean;
}

/** Accesos visuales de la portada. */
export const CATEGORIAS: CategoryTile[] = [
  {
    key: 'alojamiento',
    img: CATALOG_IMAGES.alojamiento,
    alt: 'Habitación con anfitrión local',
    title: 'Alojamiento',
    desc: 'Casas coloniales, casas de huéspedes y habitaciones con anfitrión local.',
    serviceType: 'alojamiento',
  },
  {
    key: 'gastronomia',
    img: CATALOG_IMAGES.gastronomia,
    alt: 'Plato tradicional cubano',
    title: 'Gastronomía',
    desc: 'Ropa vieja, congrí, tostones y la cocina de siempre servida por quien la cocine.',
    serviceType: 'gastronomia',
  },
  {
    key: 'servicios',
    img: CATALOG_IMAGES.servicios,
    alt: 'Taxis y servicios locales en Cuba',
    title: 'Servicios y Experiencias',
    desc: 'Música en vivo, rutas culturales, taxis y planes auténticos con guías locales.',
    serviceType: 'transporte',
  },
  {
    key: 'lgbtq',
    img: CATALOG_IMAGES.lgbtq,
    alt: 'Espacio inclusivo LGBTQ+',
    title: 'LGBTQ+ friendly',
    desc: 'Espacios inclusivos y acogedores, revisados por la plataforma.',
    inclusivo: true,
  },
];

export interface CatalogFilterDef {
  key: string;
  label: string;
  icon: typeof Compass;
}

export const CATALOG_ALL = 'todo';

/** Píldoras de filtro del buscador. */
export const FILTROS: CatalogFilterDef[] = [
  { key: CATALOG_ALL, label: 'Todo', icon: Compass },
  { key: 'alojamiento', label: 'Alojamientos', icon: HomeIcon },
  { key: 'gastronomia', label: 'Gastronomía', icon: UtensilsCrossed },
  { key: 'experiencias', label: 'Experiencias', icon: Sparkles },
  { key: 'transporte', label: 'Taxis y traslados', icon: Car },
];

/** Tipos de servicio que la portada agrupa como "Experiencias y servicios". */
export const SERVICIOS_Y_EXPERIENCIAS = new Set([
  'transporte',
  'experiencias',
  'guia_local',
  'naturaleza',
  'ecoturismo',
  'artesanos',
]);

export interface CatalogFilterState {
  q: string;
  cat: string;
  inclusivo: boolean;
}

/** Aplica búsqueda por texto y filtros de categoría / LGBTQ+ sobre el catálogo. */
export function filterBusinesses(lista: Business[], { q, cat, inclusivo }: CatalogFilterState): Business[] {
  let rows = lista;
  // Cada pestaña devuelve sólo su categoría: Premium nunca mezcla tipos de servicio.
  //   alojamiento → service_type === 'alojamiento' (las guías locales no entran)
  //   gastronomia → service_type === 'gastronomia'
  //   transporte  → service_type === 'transporte'
  //   experiencias → experiencias, guías, naturaleza y demás servicios
  if (cat !== CATALOG_ALL) {
    if (cat === 'experiencias') {
      rows = rows.filter((b) => SERVICIOS_Y_EXPERIENCIAS.has(b.service_type));
    } else {
      rows = rows.filter((b) => b.service_type === cat);
    }
  }
  // El mismo criterio de orden se aplica a TODAS las categorías: Premium
  // siempre arriba, estrictamente por `featured === true` y nunca mezclando
  // tipos de servicio.
  rows = ordenarPremiumPrimero(rows);
  if (inclusivo) rows = rows.filter((b) => b.lgbt_friendly);
  const term = q.trim().toLowerCase();
  if (term) {
    rows = rows.filter((b) =>
      [b.name, b.municipality, b.province, b.description].some((v) => v?.toLowerCase().includes(term)),
    );
  }
  return rows;
}

/** Ordena Premium (featured) primero DENTRO de la lista ya filtrada por categoría. */
export function ordenarPorPremium(lista: Business[]): Business[] {
  return [...lista].sort((a, b) => Number(b.featured === true) - Number(a.featured === true));
}

/** Ordena por orderKey en orden ascendente y los Premium (featured === true)
 *  al principios de la lista, para que cada categoría empiece por los
 *  negocios destacados sin mezclar categorías ni depender del orden de la BD.
 *
 *  El criterio es estricto y determinista:
 *    - si `a` y `b` son Premium, se deja el orden original (estable).
 *    - si sólo uno es Premium, ese va primero.
 *    - si ninguno lo es, se compara el campo `orderKey` como texto.
 *  `featured` se lee exactamente como viene de la BD: `true` (boolean).
 */
export function ordenarPremiumPrimero(lista: Business[]): Business[] {
  return [...lista].sort((a, b) => {
    const ap = a.featured === true;
    const bp = b.featured === true;
    if (ap && bp) return 0;
    if (ap) return -1;
    if (bp) return 1;
    const ka = (a.orderKey ?? '').toString().toLowerCase();
    const kb = (b.orderKey ?? '').toString().toLowerCase();
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });
}

/** ¿Hay algún filtro activo que deba sustituir las filas por los resultados? */
export function hasActiveFilter({ q, cat, inclusivo }: CatalogFilterState): boolean {
  return cat !== CATALOG_ALL || inclusivo || q.trim().length > 0;
}

export interface CatalogGroups {
  alojamientos: Business[];
  gastronomia: Business[];
  servicios: Business[];
  inclusivos: Business[];
}

/** Agrupa el catálogo para las filas de la portada. */
export function groupCatalog(lista: Business[]): CatalogGroups {
  return {
    alojamientos: lista.filter((b) => b.service_type === 'alojamiento'),
    gastronomia: lista.filter((b) => b.service_type === 'gastronomia'),
    // «Servicios y experiencias»: transporte y demás (guías, tours, actividades).
    // Los guías locales (guia_local) pasan aquí, no en alojamientos.
    servicios: lista.filter((b) => b.service_type !== 'alojamiento' && b.service_type !== 'gastronomia'),
    inclusivos: lista.filter((b) => b.lgbt_friendly),
  };
}

/** Título de la fila de resultados según el filtro activo. */
export function resultsTitle({ q, cat, inclusivo }: CatalogFilterState): string {
  if (q.trim()) return `Resultados para “${q.trim()}”`;
  if (inclusivo) return 'Espacios LGBTQ+ friendly';
  return FILTROS.find((f) => f.key === cat)?.label ?? 'Resultados';
}
