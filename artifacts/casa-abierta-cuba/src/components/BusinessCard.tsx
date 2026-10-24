import { useMemo, type MouseEvent } from 'react';
import { Link } from 'wouter';
import { Heart, ImageOff, MapPin, Star } from 'lucide-react';
import type { Business } from '@/lib/types';
import { firstPhoto } from '@/lib/images';

/** Anti-caché: añade `?v=<timestamp>` a la URL de la foto para que el navegador
 *  descargue de nuevo la portada cuando cambia, en lugar de servir la anterior
 *  desde su caché. Se elimina cualquier `v=` previo para no acumular parámetros. */
function conAntiCache(url: string): string {
  const hashIndex = url.indexOf('#');
  const hash = hashIndex >= 0 ? url.slice(hashIndex) : '';
  const sinHash = hashIndex >= 0 ? url.slice(0, hashIndex) : url;
  const sinV = sinHash.replace(/([?&])v=[^&]*/g, '$1');
  const base = sinV.endsWith('?') || sinV.endsWith('&') ? sinV.slice(0, -1) : sinV;
  return `${base}${base.includes('?') ? '&' : '?'}v=${Date.now()}${hash}`;
}

/** Precio legible para las tarjetas ("$12 USD"). */
export function formatPrice(business: Business): string | null {
  if (business.price_amount === null || business.price_amount === undefined) return null;
  const amount = Number(business.price_amount);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  const currency = (business.price_currency || 'USD').toUpperCase();
  const pretty = Number.isInteger(amount) ? amount.toString() : amount.toFixed(2);
  return `$${pretty} ${currency}`;
}

/** "por noche" sólo cuando el negocio es alojamiento. */
export function priceUnit(business: Business): string {
  return business.service_type === 'alojamiento' ? 'por noche' : '';
}

interface BusinessCardProps {
  business: Business;
  serviceLabel?: string;
  favorite?: boolean;
  onToggleFavorite?: (business: Business) => void;
  /** carousel = fila deslizable; grid = rejilla de página. */
  layout?: 'carousel' | 'grid';
  className?: string;
}

export function BusinessCard({
  business,
  favorite = false,
  onToggleFavorite,
  layout = 'carousel',
  className = '',
}: BusinessCardProps) {
  // Portada: SIEMPRE la primera foto válida del arreglo (images[0]).
  const photo = firstPhoto(business);
  // Recalcula el anti-caché solo cuando cambia la foto: así no se descarga
  // de nuevo en cada render pero tampoco se queda la portada anterior.
  const photoSrc = useMemo(() => (photo ? conAntiCache(photo) : null), [photo]);
  const price = formatPrice(business);
  const unit = priceUnit(business);
  const rating = typeof business.rating === 'number' ? business.rating : null;
  const href = `/negocio/${business.id}`;
  const featured = business.featured === true;
  const width = layout === 'grid' ? 'w-full' : 'w-[68vw] max-w-[280px] shrink-0 snap-start sm:w-64';

  function onHeart(e: MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite?.(business);
  }

  return (
    <article
      className={`group relative ${width} ${
        featured ? 'rounded-[1.15rem] border-2 border-yellow-500 p-1.5' : ''
      } ${className}`}
    >
      {/* Imagen cuadrada con bordes redondeados */}
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-azul-700">
        <Link href={href} aria-label={`Ver ${business.name}`} className="absolute inset-0 block">
          {photoSrc ? (
            <img
              src={photoSrc}
              alt={`Foto de ${business.name}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.opacity = '0';
              }}
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-white/70">
              <ImageOff size={34} aria-hidden />
            </span>
          )}
        </Link>

        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
        />

        {featured && (
          <span className="pointer-events-none absolute left-3 top-3 z-10 rounded-full bg-yellow-500 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-black shadow-sm">
            ⭐ Premium
          </span>
        )}

        {business.lgbt_friendly && (
          <span
            className={`pointer-events-none absolute left-3 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-azul ${
              featured ? 'top-10' : 'top-3'
            }`}
          >
            LGBTQ+ friendly
          </span>
        )}

        {onToggleFavorite && (
          <button
            type="button"
            onClick={onHeart}
            aria-pressed={favorite}
            aria-label={favorite ? `Quitar ${business.name} de favoritos` : `Guardar ${business.name} en favoritos`}
            className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/25 text-white backdrop-blur transition hover:bg-black/40"
          >
            <Heart size={18} className={favorite ? 'fill-[#FF385C] text-[#FF385C]' : 'text-white'} aria-hidden />
          </button>
        )}
      </div>

      {/* Título, precio y calificación */}
      <Link href={href} className="mt-2.5 block focus:outline-none">
        <h3 className="truncate font-bold leading-snug text-azul group-hover:underline">{business.name}</h3>
        <p className="mt-0.5 flex w-full items-center gap-1 truncate text-sm text-tinta/60">
          <MapPin size={12} aria-hidden className="shrink-0" />
          {business.municipality}, {business.province}
        </p>
        <p className="mt-1 flex items-center gap-1 truncate text-sm text-tinta/75">
          {price ? (
            <>
              <span className="font-semibold text-tinta">{price}</span>
              {unit ? <span>{unit}</span> : null}
            </>
          ) : (
            <span>Consultar precio</span>
          )}
          <span aria-hidden className="text-tinta/40">
            ·
          </span>
          <Star size={12} className="shrink-0 fill-tinta/80" aria-hidden />
          <span className="font-semibold text-tinta">{rating !== null ? rating.toFixed(2) : 'Nuevo'}</span>
        </p>
      </Link>
    </article>
  );
}
