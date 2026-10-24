import { Link } from 'wouter';
import { ImageOff } from 'lucide-react';
import type { Business } from '@/lib/types';
import { BusinessCard } from './BusinessCard';

interface BusinessGridProps {
  /** null mientras carga; array (posiblemente vacío) cuando ya hay datos. */
  items: Business[] | null;
  favoritos: Set<string>;
  onToggleFavorite: (business: Business) => void;
  error?: string | null;
  emptyTitle: string;
  emptyBody?: string;
  emptyCta?: { href: string; label: string };
}

/** Rejilla de tarjetas con esqueleto de carga y estado vacío propios de las secciones. */
export function BusinessGrid({
  items,
  favoritos,
  onToggleFavorite,
  error,
  emptyTitle,
  emptyBody,
  emptyCta,
}: BusinessGridProps) {
  return (
    <>
      {error && (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      {items === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square animate-pulse rounded-2xl bg-azul/10" />
              <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-azul/10" />
              <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-azul/10" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <ImageOff size={28} className="mx-auto mb-2 opacity-50" aria-hidden />
          <p className="font-semibold text-azul">{emptyTitle}</p>
          {emptyBody && <p className="mt-1 text-sm">{emptyBody}</p>}
          {emptyCta && (
            <Link href={emptyCta.href} className="button-primary mt-3 inline-flex">
              {emptyCta.label}
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              layout="grid"
              favorite={favoritos.has(b.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </>
  );
}
