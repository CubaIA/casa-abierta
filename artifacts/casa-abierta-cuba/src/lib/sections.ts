import {
  BedDouble,
  Car,
  Compass,
  Heart,
  Map,
  Plane,
  Scale,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { Business } from './types';
import { CATALOG_IMAGES } from './catalog';

/**
 * Registro único de las secciones navegables de la plataforma.
 * Las rutas viven en App.tsx y los enlaces en el menú; aquí sólo se describe
 * qué es cada sección y cómo se filtra el catálogo para ella.
 */
export type SectionKey =
  | 'inicio'
  | 'alojamientos'
  | 'gastronomia'
  | 'guias'
  | 'taxis'
  | 'concierge'
  | 'lgbtq'
  | 'legal';

export interface SectionFilter {
  /** Valor de `service_type` en el catálogo (alojamiento, gastronomia…). */
  serviceType?: string;
  /** Sólo negocios marcados como LGBTQ+ friendly. */
  lgbtq?: boolean;
}

export interface SectionDef {
  key: SectionKey;
  path: string;
  title: string;
  kicker: string;
  subtitle: string;
  icon: LucideIcon;
  image?: string;
  filter?: SectionFilter;
}

export const SECTIONS: Record<SectionKey, SectionDef> = {
  inicio: {
    key: 'inicio',
    path: '/',
    title: 'Inicio',
    kicker: 'Casa Abierta Cuba',
    subtitle: 'Alojamientos, gastronomía, experiencias y taxis revisados uno a uno.',
    icon: Compass,
    image: CATALOG_IMAGES.hero,
  },
  alojamientos: {
    key: 'alojamientos',
    path: '/alojamientos',
    title: 'Alojamientos',
    kicker: 'Dónde dormir',
    subtitle:
      'Casas coloniales, casas de huéspedes y habitaciones con anfitrión local, revisadas antes de publicarse.',
    icon: BedDouble,
    image: CATALOG_IMAGES.alojamiento,
    filter: { serviceType: 'alojamiento' },
  },
  gastronomia: {
    key: 'gastronomia',
    path: '/gastronomia',
    title: 'Gastronomía',
    kicker: 'Qué comer',
    subtitle:
      'Paladares, cafeterías y cocina criolla servida por quien la cocina, con trato directo desde la plataforma.',
    icon: UtensilsCrossed,
    image: CATALOG_IMAGES.gastronomia,
    filter: { serviceType: 'gastronomia' },
  },
  guias: {
    key: 'guias',
    path: '/guias',
    title: 'Guías locales',
    kicker: 'Con quién recorrer',
    subtitle: 'Rutas culturales, música en vivo y planes auténticos con guías que viven la isla.',
    icon: Map,
    image: CATALOG_IMAGES.hero,
    filter: { serviceType: 'guia_local' },
  },
  taxis: {
    key: 'taxis',
    path: '/taxis',
    title: 'Taxis y traslados',
    kicker: 'Cómo moverte',
    subtitle: 'Traslados al aeropuerto, recorridos por la ciudad y viajes entre provincias con choferes locales.',
    icon: Car,
    image: CATALOG_IMAGES.servicios,
    filter: { serviceType: 'transporte' },
  },
  concierge: {
    key: 'concierge',
    path: '/concierge',
    title: 'Diseña tu viaje a medida',
    kicker: 'Concierge Casa Abierta',
    subtitle: 'Días, personas, casa, taxi y comida: cuéntame tu idea y te cotizo el paquete completo por WhatsApp.',
    icon: Plane,
    image: '/img/concierge-bg.jpg',
  },
  lgbtq: {
    key: 'lgbtq',
    path: '/lgbtq',
    title: 'LGBTQ+ friendly',
    kicker: 'Espacios inclusivos',
    subtitle: 'Anfitriones y locales que celebran a todo el mundo, revisados por el equipo de Casa Abierta.',
    icon: Heart,
    image: CATALOG_IMAGES.lgbtq,
    filter: { lgbtq: true },
  },
  legal: {
    key: 'legal',
    path: '/legal',
    title: 'Legal',
    kicker: 'Confianza y cuidado',
    subtitle: 'Términos, privacidad, normas para proveedores y política antifraude de Casa Abierta Cuba.',
    icon: Scale,
  },
};

/** Secciones con catálogo propio (todas menos Inicio, Concierge y Legal). */
export const CATALOG_SECTIONS: SectionDef[] = [
  SECTIONS.alojamientos,
  SECTIONS.gastronomia,
  SECTIONS.guias,
  SECTIONS.taxis,
  SECTIONS.lgbtq,
];

export function getSection(key: SectionKey): SectionDef {
  return SECTIONS[key];
}

/** Negocios que pertenecen a una sección, según su filtro declarado. */
export function sectionBusinesses(lista: Business[], section: SectionDef): Business[] {
  const filtro = section.filter;
  if (!filtro) return [];
  return lista.filter((b) => {
    if (filtro.serviceType && b.service_type !== filtro.serviceType) return false;
    if (filtro.lgbtq && !b.lgbt_friendly) return false;
    return true;
  });
}

/** Texto del contador de resultados del encabezado. */
export function sectionCountLabel(count: number): string {
  return `${count} ${count === 1 ? 'lugar revisado' : 'lugares revisados'}`;
}
