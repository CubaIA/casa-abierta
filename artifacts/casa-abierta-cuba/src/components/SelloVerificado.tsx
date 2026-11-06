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
 */

/** Texto completo del sello (ficha del negocio). */
export const TEXTO_SELLO = 'Revisión básica CA · Identidad y contacto comprobados';

/** Texto corto del sello para la tarjeta del catálogo, donde no cabe el completo. */
export const TEXTO_SELLO_CORTO = 'Verificado CA';

interface SelloVerificadoProps {
  /** Valor de `businesses.verified`: sin true, el sello no se renderiza. */
  verified: boolean;
  /** compact = sobre la foto de la tarjeta; full = sello destacado de la ficha. */
  variant?: 'compact' | 'full';
  className?: string;
}

export function SelloVerificado({ verified, variant = 'compact', className = '' }: SelloVerificadoProps) {
  if (!verified) return null;

  if (variant === 'full') {
    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full border border-dorado bg-gradient-to-r from-verde-700 via-verde-600 to-verde-500 px-3.5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-md shadow-verde-700/25 sm:text-sm ${className}`}
      >
        <span aria-hidden className="text-dorado">
          ✓
        </span>
        {TEXTO_SELLO}
      </span>
    );
  }

  return (
    <span
      className={`pointer-events-none inline-flex max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-verde-700 shadow-sm ring-1 ring-verde-600/35 backdrop-blur-sm ${className}`}
    >
      <span aria-hidden className="text-dorado">
        ✓
      </span>
      <span className="truncate">{TEXTO_SELLO_CORTO}</span>
    </span>
  );
}
