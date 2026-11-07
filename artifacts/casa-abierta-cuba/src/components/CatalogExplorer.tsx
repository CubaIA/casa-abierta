import { useEffect, useMemo, useState } from 'react';
import type { Business } from '@/lib/types';
import {
  filterBusinesses,
  hasActiveFilter,
  ordenarPorPremium,
  resultsTitle,
  type CatalogFilterState,
} from '@/lib/catalog';
import { BusinessGrid } from './BusinessGrid';
import { AvisoError } from './AvisoError';

interface CatalogExplorerProps extends CatalogFilterState {
  businesses: Business[] | null;
  error: string | null;
  favoritos: Set<string>;
  onToggleFavorite: (business: Business) => void;
  /** Tarjetas por página. 8 en Inicio y 12 en las categorías. */
  pageSize?: number;
}

/**
 * Resultados del catálogo en rejilla paginada.
 *
 * El orden es siempre el mismo: primero se filtra de forma estricta por la
 * categoría elegida (Premium nunca mezcla tipos de servicio) y sólo después se
 * ponen los destacados delante. Se muestran como mucho `pageSize` tarjetas y el
 * resto se carga con «Ver más».
 */
export function CatalogExplorer({
  businesses,
  error,
  q,
  cat,
  inclusivo,
  favoritos,
  onToggleFavorite,
  pageSize = 12,
}: CatalogExplorerProps) {
  const lista = useMemo(() => businesses ?? [], [businesses]);
  const filtros: CatalogFilterState = { q, cat, inclusivo };
  const filtrados = useMemo(
    () => ordenarPorPremium(filterBusinesses(lista, filtros)),
    [businesses, q, cat, inclusivo],
  );
  const hayFiltro = hasActiveFilter(filtros);
  const [pagina, setPagina] = useState(1);

  // Al cambiar de pestaña, búsqueda o filtro se vuelve a la primera página.
  useEffect(() => {
    setPagina(1);
  }, [q, cat, inclusivo, pageSize]);

  const visibles = filtrados.slice(0, pagina * pageSize);
  const quedan = visibles.length < filtrados.length;

  return (
    <>
      <AvisoError mensaje={error} className="mb-4" />

      {businesses !== null && (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-azul sm:text-2xl">
              {hayFiltro ? resultsTitle(filtros) : 'Todo el catálogo'}
            </h2>
            <p className="mt-0.5 text-sm text-tinta/60">
              {filtrados.length} {filtrados.length === 1 ? 'lugar disponible' : 'lugares disponibles'}
            </p>
          </div>
        </div>
      )}

      <BusinessGrid
        items={businesses === null ? null : visibles}
        favoritos={favoritos}
        onToggleFavorite={onToggleFavorite}
        emptyTitle="No hay lugares en esta categoría"
        emptyBody="Prueba con otra categoría o con otra búsqueda."
      />

      {businesses !== null && quedan && (
        <div className="mt-9 flex justify-center">
          <button
            type="button"
            onClick={() => setPagina((p) => p + 1)}
            className="inline-flex items-center gap-2 rounded-full bg-azul px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul-700"
          >
            Ver más
            <span aria-hidden>→</span>
          </button>
        </div>
      )}
    </>
  );
}
