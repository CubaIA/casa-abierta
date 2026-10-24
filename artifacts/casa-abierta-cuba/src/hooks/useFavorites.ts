import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { listFavoriteIds, toggleFavorite } from '@/lib/marketplace';
import { useAuth } from '@/lib/auth';
import type { Business } from '@/lib/types';

/**
 * Estado de favoritos del usuario. Sin sesión redirige a /entrar, igual que
 * antes; el error de escritura se expone para que la vista lo muestre.
 */
export function useFavorites() {
  const { userId } = useAuth();
  const [, navigate] = useLocation();
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setFavoritos(new Set());
      return;
    }
    let cancelled = false;
    listFavoriteIds(userId)
      .then((ids) => {
        if (!cancelled) setFavoritos(new Set(ids));
      })
      .catch(() => setFavoritos(new Set()));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggle = useCallback(
    async (business: Business) => {
      if (!userId) {
        navigate('/entrar');
        return;
      }
      try {
        const isFav = await toggleFavorite(userId, business.id);
        setFavoritos((prev) => {
          const next = new Set(prev);
          if (isFav) next.add(business.id);
          else next.delete(business.id);
          return next;
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
        // Consistencia: si la escritura falló, releemos el estado real del backend.
        try {
          const ids = await listFavoriteIds(userId);
          setFavoritos(new Set(ids));
        } catch {
          /* sin efecto */
        }
      }
    },
    [userId, navigate],
  );

  return { favoritos, error, toggle };
}
