import { useRef } from 'react';
import { ArrowRight, ImageOff } from 'lucide-react';
import type { Business } from '@/lib/types';
import { BusinessCard } from './BusinessCard';

interface BusinessCarouselProps {
  title: string;
  subtitle?: string;
  items: Business[];
  favoritos: Set<string>;
  onToggleFavorite: (business: Business) => void;
}

/** Fila horizontal de tarjetas con desplazamiento por botón "Ver más". */
export function BusinessCarousel({ title, subtitle, items, favoritos, onToggleFavorite }: BusinessCarouselProps) {
  const ref = useRef<HTMLDivElement>(null);

  function verMas() {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;

    // En "Disponibles en Cuba" el botón devuelve al inicio del catálogo;
    // en el resto de carruseles solo desplaza la fila.
    if (title === 'Disponibles en Cuba') {
      const catalogo = document.getElementById('catalogo');
      if (catalogo) {
        catalogo.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }

    el.scrollTo({ left: atEnd ? 0 : el.scrollLeft + el.clientWidth * 0.85, behavior: 'smooth' });
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-extrabold text-azul sm:text-2xl">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-sm text-tinta/60">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={verMas}
          className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-azul transition hover:bg-azul/5"
          aria-label={`Ver más de ${title}`}
        >
          Ver más <ArrowRight size={16} aria-hidden />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-dashed border-arena-2 bg-white/60 px-5 py-8 text-sm text-tinta/60">
          <ImageOff size={20} aria-hidden />
          No hay negocios que coincidan con esos filtros. Prueba con otra búsqueda.
        </div>
      ) : (
        <div
          ref={ref}
          className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2"
        >
          {items.map((b) => (
            <BusinessCard
              key={b.id}
              business={b}
              favorite={favoritos.has(b.id)}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
