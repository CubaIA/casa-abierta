import type { ReactNode } from 'react';
import { BedDouble, ShowerHead, Snowflake, Waves } from 'lucide-react';
import type { Business } from '@/lib/types';

interface IconosServiciosProps {
  business: Business;
  /** Tamaño de los iconos en píxeles (se adapta a la tarjeta o a la ficha). */
  size?: number;
  className?: string;
}

/**
 * Fila de iconos con los servicios del negocio para el marco postal de la
 * imagen: camas, aire acondicionado, baño privado y piscina.
 *
 * Solo se pinta lo que el negocio declara en `businesses`; si no hay ningún
 * servicio marcado no se renderiza nada (ni el hueco). La fila fluye a la
 * línea siguiente si no cabe, así que nunca rompe la franja.
 */
export function IconosServicios({ business, size = 14, className = '' }: IconosServiciosProps) {
  const camas = Number(business.beds_count ?? 0);
  const conCamas = Number.isFinite(camas) && camas > 0;

  const items: Array<{ key: string; etiqueta: string; icono: ReactNode }> = [];
  if (conCamas) {
    items.push({
      key: 'camas',
      etiqueta: `${camas} cama${camas === 1 ? '' : 's'}`,
      icono: <BedDouble size={size} aria-hidden />,
    });
  }
  if (business.has_ac === true) {
    items.push({ key: 'ac', etiqueta: 'Aire acondicionado', icono: <Snowflake size={size} aria-hidden /> });
  }
  if (business.has_private_bath === true) {
    items.push({ key: 'bano', etiqueta: 'Baño privado', icono: <ShowerHead size={size} aria-hidden /> });
  }
  if (business.has_pool === true) {
    items.push({ key: 'piscina', etiqueta: 'Piscina', icono: <Waves size={size} aria-hidden /> });
  }

  if (items.length === 0) return null;

  return (
    <ul className={`flex flex-wrap items-center gap-2 text-[#2c3e50] ${className}`}>
      {items.map(({ key, etiqueta, icono }) => (
        <li key={key} title={etiqueta} aria-label={etiqueta} className="inline-flex items-center gap-1">
          {icono}
          {key === 'camas' ? (
            <span className="text-[11px] font-bold leading-none tabular-nums">{camas}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
