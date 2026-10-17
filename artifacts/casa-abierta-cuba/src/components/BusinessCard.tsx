import { Link } from 'wouter';
import { MapPin, Star } from 'lucide-react';
import type { Business } from '@/lib/types';

export function BusinessCard({ business, serviceLabel }: { business: Business; serviceLabel: string }) {
  const photo = (business.photos ?? [])[0];
  return (
    <article className="business-card">
      <div className="business-visual">
        {photo ? (
          <img src={photo} alt={`Foto de ${business.name}`} loading="lazy" />
        ) : (
          <span aria-hidden className="text-4xl">🏠</span>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge badge-blue">{serviceLabel}</span>
          {business.lgbt_friendly && <span className="badge badge-green">LGBT friendly</span>}
        </div>
        <h3 className="mt-2 font-extrabold text-lg text-azul leading-snug">{business.name}</h3>
        <p className="mt-1 text-sm text-tinta/60 inline-flex items-center gap-1">
          <MapPin size={14} /> {business.municipality}, {business.province}
        </p>
        <p className="mt-2 text-sm text-tinta/75 line-clamp-3 flex-1">{business.description}</p>
        {business.languages.length > 0 && (
          <p className="mt-2 text-xs text-tinta/50">Idiomas: {business.languages.join(', ')}</p>
        )}
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-dorado">
            <Star size={13} className="fill-dorado" /> Anfitrión verificado
          </span>
          <Link
            href={`/negocio/${business.id}`}
            className="rounded-full bg-azul px-4 py-2 text-sm font-bold text-white hover:bg-azul-700"
          >
            Ver detalle
          </Link>
        </div>
      </div>
    </article>
  );
}
