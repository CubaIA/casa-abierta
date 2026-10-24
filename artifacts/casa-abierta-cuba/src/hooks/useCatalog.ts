import { useCallback, useEffect, useRef, useState } from 'react';
import { listBusinesses } from '@/lib/marketplace';
import type { Business } from '@/lib/types';

/** Cuánto vale una carga del catálogo antes de volver a consultar el backend. */
const CACHE_TTL_MS = 60_000;

let cache: { at: number; data: Business[] } | null = null;
let inflight: Promise<Business[]> | null = null;

/** Fuerza que la próxima lectura del catálogo vaya al backend (tras aprobar o publicar). */
export function invalidateCatalog() {
  cache = null;
}

/**
 * Carga el catálogo una sola vez por sesión (con TTL corto) y lo comparte entre
 * todas las vistas que lo necesiten, evitando el parpadeo del esqueleto al volver.
 */
export function useCatalog() {
  const [businesses, setBusinesses] = useState<Business[] | null>(() =>
    cache && Date.now() - cache.at < CACHE_TTL_MS ? cache.data : null,
  );
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async (force = false) => {
    if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
      setBusinesses(cache.data);
      return;
    }
    try {
      const request = inflight ?? listBusinesses();
      inflight = request;
      const data = await request;
      cache = { at: Date.now(), data };
      if (!alive.current) return;
      setBusinesses(data);
      setError(null);
    } catch (e) {
      if (!alive.current) return;
      setError(e instanceof Error ? e.message : 'Error cargando el catálogo');
    } finally {
      inflight = null;
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    void load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const reload = useCallback(() => load(true), [load]);

  return { businesses, error, reload };
}
