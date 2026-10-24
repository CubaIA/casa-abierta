import { Link } from 'wouter';
import { MapPin } from 'lucide-react';
import { CATEGORIAS, CATALOG_IMAGES, type CategoryTile } from '@/lib/catalog';

interface CategoryTilesProps {
  onSelect: (tile: CategoryTile) => void;
}

/** Bloque "Explora por categoría": cuatro accesos visuales de la portada. */
export function CategoryTiles({ onSelect }: CategoryTilesProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 pt-10">
      <h2 className="text-xl font-extrabold text-azul sm:text-2xl">Explora por categoría</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CATEGORIAS.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => onSelect(c)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-azul-700 text-left shadow-sm ring-1 ring-black/5 transition hover:shadow-lg"
          >
            <img
              src={c.img}
              alt={c.alt}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span aria-hidden className="absolute inset-0 bg-black/45" />
            <span
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
            />
            <span className="absolute inset-x-0 bottom-0 p-4">
              <span className="block text-base font-extrabold text-white drop-shadow">{c.title}</span>
              <span className="mt-1 line-clamp-2 block text-xs leading-snug text-white/85">{c.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Bloque "Para anfitriones" con el acceso al alta de negocios. */
export function HostCTA() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-arena-2 bg-arena p-6 sm:p-8">
        <div>
          <p className="section-kicker">Para anfitriones</p>
          <h2 className="text-xl font-extrabold text-azul sm:text-2xl">¿Ofreces alojamiento o un servicio local?</h2>
          <p className="mt-1 max-w-xl text-tinta/70">
            Publica tu propuesta, sube tus fotos y recibe solicitudes de viajeros directamente en tu panel. Toda
            publicación se revisa antes de aparecer en el catálogo.
          </p>
        </div>
        <Link href="/anfitrion" className="button-secondary">
          <MapPin size={17} aria-hidden /> Publicar mi negocio
        </Link>
      </div>
    </section>
  );
}

/** Aviso reutilizable sobre el alcance de la revisión de la plataforma. */
export function ReviewNote({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-2xl border border-arena-2 bg-white p-5 ${className}`}>
      <img
        src={CATALOG_IMAGES.logo}
        alt=""
        aria-hidden
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-contain"
        loading="lazy"
      />
      <p className="text-sm leading-relaxed text-tinta/70">
        Cada propuesta pasa por revisión manual antes de publicarse. La verificación es una medida de calidad de la
        plataforma, no una certificación oficial. Confirma siempre disponibilidad, precio y condiciones con el
        proveedor.{' '}
        <Link href="/providers" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
          Normas para proveedores
        </Link>
        .
      </p>
    </div>
  );
}
