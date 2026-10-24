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
  if (cat !== CATALOG_ALL) rows = rows.filter((b) => b.service_type === cat);
  if (inclusivo) rows = rows.filter((b) => b.lgbt_friendly);
  const term = q.trim().toLowerCase();
  if (term) {
    rows = rows.filter((b) =>
      [b.name, b.municipality, b.province, b.description].some((v) => v?.toLowerCase().includes(term)),
    );
  }
  return rows;
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
    servicios: lista.filter((b) => SERVICIOS_Y_EXPERIENCIAS.has(b.service_type)),
    inclusivos: lista.filter((b) => b.lgbt_friendly),
  };
}

/** Título de la fila de resultados según el filtro activo. */
export function resultsTitle({ q, cat, inclusivo }: CatalogFilterState): string {
  if (q.trim()) return `Resultados para “${q.trim()}”`;
  if (inclusivo) return 'Espacios LGBTQ+ friendly';
  return FILTROS.find((f) => f.key === cat)?.label ?? 'Resultados';
}
