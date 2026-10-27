/**
 * Sello de calidad «Verificado en Cuba por Casa Abierta».
 *
 * Se usa igual en la tarjeta del catálogo (compacto, sobre la foto) y en la
 * ficha del negocio (grande, junto al título), para que el mensaje de
 * verificación sea siempre el mismo en toda la plataforma.
 */

/** Texto único del sello. */
export const TEXTO_SELLO = 'Verificado en Cuba por Casa Abierta';

interface SelloVerificadoProps {
  /** compact = sobre la foto de la tarjeta; full = sello destacado de la ficha. */
  variant?: 'compact' | 'full';
  className?: string;
}

export function SelloVerificado({ variant = 'compact', className = '' }: SelloVerificadoProps) {
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
      <span className="truncate">{TEXTO_SELLO}</span>
    </span>
  );
}
