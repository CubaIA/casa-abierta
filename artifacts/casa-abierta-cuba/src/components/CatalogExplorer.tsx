import { useMemo } from 'react';
import type { Business } from '@/lib/types';
import {
  filterBusinesses,
  groupCatalog,
  hasActiveFilter,
  resultsTitle,
  type CatalogFilterState,
} from '@/lib/catalog';
import { BusinessCarousel } from './BusinessCarousel';

interface CatalogExplorerProps extends CatalogFilterState {
  businesses: Business[] | null;
  error: string | null;
  favoritos: Set<string>;
  onToggleFavorite: (business: Business) => void;
}

/**
 * Resultados del catálogo: esqueleto de carga, aviso de error y filas de tarjetas.
 * No incluye el buscador; cada vista coloca el suyo encima.
 */
export function CatalogExplorer({
  businesses,
  error,
  q,
  cat,
  inclusivo,
  favoritos,
  onToggleFavorite,
}: CatalogExplorerProps) {
  const lista = useMemo(() => businesses ?? [], [businesses]);
  const filtros: CatalogFilterState = { q, cat, inclusivo };
  const filtrados = useMemo(() => filterBusinesses(lista, filtros), [lista, q, cat, inclusivo]);
  const hayFiltro = hasActiveFilter(filtros);
  const { alojamientos, gastronomia, servicios, inclusivos } = useMemo(() => groupCatalog(lista), [lista]);

  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {businesses === null && (
        <div className="space-y-4" aria-live="polite">
          <div className="h-7 w-56 animate-pulse rounded-full bg-azul/10" />
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-[68vw] max-w-[280px] shrink-0 sm:w-64">
                <div className="aspect-square animate-pulse rounded-2xl bg-azul/10" />
                <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-azul/10" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-azul/10" />
              </div>
            ))}
          </div>
        </div>
      )}

      {businesses !== null && hayFiltro && (
        <BusinessCarousel
          title={resultsTitle(filtros)}
          subtitle={`${filtrados.length} ${filtrados.length === 1 ? 'lugar' : 'lugares'} disponibles`}
          items={filtrados}
          favoritos={favoritos}
          onToggleFavorite={onToggleFavorite}
        />
      )}

      {businesses !== null && !hayFiltro && (
        <div className="space-y-10">
          <BusinessCarousel
            title="Disponibles en Cuba"
            subtitle="Publicaciones revisadas por el equipo de Casa Abierta"
            items={filtrados}
            favoritos={favoritos}
            onToggleFavorite={onToggleFavorite}
          />
          {alojamientos.length > 0 && (
            <BusinessCarousel
              title="Alojamientos en Cuba"
              subtitle="Casas particulares, habitaciones y villas con anfitrión local"
              items={alojamientos}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          {gastronomia.length > 0 && (
            <BusinessCarousel
              title="Mesas con sabor"
              subtitle="Paladares y cocina criolla servida por quien la cocina"
              items={gastronomia}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          {servicios.length > 0 && (
            <BusinessCarousel
              title="Experiencias y servicios"
              subtitle="Taxis, rutas, guías y planes auténticos"
              items={servicios}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
          )}
          {inclusivos.length > 0 && (
            <BusinessCarousel
              title="Espacios LGBTQ+ friendly"
              subtitle="Anfitriones y locales que celebran a todo el mundo"
              items={inclusivos}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
          )}
        </div>
      )}
    </>
  );
}
