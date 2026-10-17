import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Heart } from 'lucide-react';
import { listBusinesses, listFavoriteIds, toggleFavorite } from '@/lib/marketplace';
import type { Business } from '@/lib/types';
import { BusinessCard } from '@/components/BusinessCard';
import { useAuth } from '@/lib/auth';

export default function Favoritos() {
  const { userId, loading } = useAuth();
  const [rows, setRows] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Favoritos | Casa Abierta Cuba';
    if (loading || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const [ids, all] = await Promise.all([listFavoriteIds(userId), listBusinesses()]);
        if (!cancelled) setRows(all.filter((b) => ids.includes(b.id)));
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando favoritos');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, loading]);

  if (!userId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Inicia sesión para ver tus favoritos.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <p className="section-kicker">Guardados</p>
      <h1 className="text-3xl font-extrabold text-azul">Mis favoritos</h1>
      <p className="mt-2 text-tinta/70">Los negocios que marcaste con el corazón.</p>

      {error && <p className="form-error mt-4" role="alert">{error}</p>}

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {rows === null && <div className="empty-state">Cargando…</div>}
        {rows?.length === 0 && (
          <div className="empty-state">
            <Heart size={28} className="mx-auto mb-2 opacity-50" />
            <p>Aún no has guardado negocios.</p>
            <Link href="/" className="button-primary mt-3 inline-flex">Explorar catálogo</Link>
          </div>
        )}
        {rows?.map((b) => (
          <BusinessCard
            key={b.id}
            business={b}
            favorite
            layout="grid"
            onToggleFavorite={async (business) => {
              if (!userId) return;
              try {
                await toggleFavorite(userId, business.id);
                setRows((prev) => (prev ?? []).filter((x) => x.id !== business.id));
              } catch (e) {
                setError(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}
