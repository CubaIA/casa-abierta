/**
 * Sello de revisión básica: «Revisión básica CA · Identidad y contacto comprobados».
 *
 * En la tarjeta del catálogo (compacto, sobre la foto) usa el texto corto
 * «Verificado CA»; en la ficha del negocio (grande, junto al título) muestra
 * el texto completo. El diseño es idéntico en ambas variantes.
 *
 * Solo lo otorga el administrador desde el panel: el componente no pinta nada
 * mientras la columna `verified` del negocio no sea true. Así el sello es un
 * distintivo real y no una etiqueta decorativa.
 *
 * El sello es también la puerta a la página de transparencia (/verificacion):
 * al tocarlo se explica qué se revisó y qué no, sin salir de la ficha.
 */
import type { MouseEvent } from 'react';
import { Link } from 'wouter';

/** Texto completo del sello (ficha del negocio). */
export const TEXTO_SELLO = 'Revisión básica CA · Identidad y contacto comprobados';

/** Texto corto del sello para la tarjeta del catálogo, donde no cabe el completo. */
export const TEXTO_SELLO_CORTO = 'Verificado CA';

/** Página que explica el alcance real del sello. */
export const HREF_SELLO = '/verificacion';

/** Etiqueta accesible común: el sello es un enlace, no un adorno. */
const ARIA_SELLO = 'Qué significa el sello Verificado CA';

interface SelloVerificadoProps {
  /** Valor de `businesses.verified`: sin true, el sello no se renderiza. */
  verified: boolean;
  /** compact = sobre la foto de la tarjeta; full = sello destacado de la ficha. */
  variant?: 'compact' | 'full';
  className?: string;
}

export function SelloVerificado({ verified, variant = 'compact', className = '' }: SelloVerificadoProps) {
  if (!verified) return null;

  // El sello vive dentro de tarjetas que ya son un enlace al negocio: se corta
  // la propagación para que el toque abra la transparencia y no la ficha.
  function alTocar(e: MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
  }

  if (variant === 'full') {
    return (
      <Link
        href={HREF_SELLO}
        aria-label={ARIA_SELLO}
        title={ARIA_SELLO}
        className={`inline-flex items-center gap-2 rounded-full border border-dorado bg-gradient-to-r from-verde-700 via-verde-600 to-verde-500 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-md shadow-verde-700/25 transition hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul sm:text-sm ${className}`}
      >
        <span aria-hidden className="text-dorado">
          ✓
        </span>
        {TEXTO_SELLO}
      </Link>
    );
  }

  return (
    <Link
      href={HREF_SELLO}
      aria-label={ARIA_SELLO}
      title={ARIA_SELLO}
      onClick={alTocar}
      className={`inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-verde-700 shadow-sm ring-1 ring-verde-600/35 backdrop-blur-sm transition hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul ${className}`}
    >
      <span aria-hidden className="text-dorado">
        ✓
      </span>
      <span className="truncate">{TEXTO_SELLO_CORTO}</span>
    </Link>
  );
}
