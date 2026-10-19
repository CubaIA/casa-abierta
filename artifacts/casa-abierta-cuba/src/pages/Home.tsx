import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight,
  Car,
  Compass,
  Heart,
  Home as HomeIcon,
  ImageOff,
  MapPin,
  Plane,
  Search,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { listBusinesses, listFavoriteIds, toggleFavorite } from '@/lib/marketplace';
import type { Business } from '@/lib/types';
import { BusinessCard } from '@/components/BusinessCard';
import { useAuth } from '@/lib/auth';



/* ------------------------------------------------------------------ */
/* Imágenes oficiales (nombres exactos tal y como están en /public/img) */
/* ------------------------------------------------------------------ */
const IMG = {
  hero: '/img/Playa.jpeg',
  alojamiento: '/img/Habitación.jpeg',
  gastronomia: '/img/Comida.jpeg',
  servicios: '/img/Taxis.jpeg',
  lgbtq: '/img/lgbtq.jpeg',
  logo: '/img/Logo.jpeg',
} as const;

const CATEGORIAS: {
  key: string;
  img: string;
  alt: string;
  title: string;
  desc: string;
  serviceType?: string;
  inclusivo?: boolean;
}[] = [
  {
    key: 'alojamiento',
    img: IMG.alojamiento,
    alt: 'Habitación con anfitrión local',
    title: 'Alojamiento',
    desc: 'Casas coloniales, casas de huéspedes y habitaciones con anfitrión local.',
    serviceType: 'alojamiento',
  },
  {
    key: 'gastronomia',
    img: IMG.gastronomia,
    alt: 'Plato tradicional cubano',
    title: 'Gastronomía',
    desc: 'Ropa vieja, congrí, tostones y la cocina de siempre servida por quien la cocine.',
    serviceType: 'gastronomia',
  },
  {
    key: 'servicios',
    img: IMG.servicios,
    alt: 'Taxis y servicios locales en Cuba',
    title: 'Servicios y Experiencias',
    desc: 'Música en vivo, rutas culturales, taxis y planes auténticos con guías locales.',
    serviceType: 'transporte',
  },
  {
    key: 'lgbtq',
    img: IMG.lgbtq,
    alt: 'Espacio inclusivo LGBTQ+',
    title: 'LGBTQ+ friendly',
    desc: 'Espacios inclusivos y acogedores, revisados por la plataforma.',
    inclusivo: true,
  },
];

const FILTROS: { key: string; label: string; icon: typeof Compass }[] = [
  { key: 'todo', label: 'Todo', icon: Compass },
  { key: 'alojamiento', label: 'Alojamientos', icon: HomeIcon },
  { key: 'gastronomia', label: 'Gastronomía', icon: UtensilsCrossed },
  { key: 'experiencias', label: 'Experiencias', icon: Sparkles },
  { key: 'transporte', label: 'Taxis y traslados', icon: Car },
];

const SERVICIOS_Y_EXPERIENCIAS = new Set([
  'transporte',
  'experiencias',
  'guia_local',
  'naturaleza',
  'ecoturismo',
  'artesanos',
]);

export default function Home() {
  const { userId } = useAuth();
  const [, navigate] = useLocation();
  const [businesses, setBusinesses] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todo');
  const [inclusivo, setInclusivo] = useState(false);
  const [favoritos, setFavoritos] = useState<Set<string>>(new Set());

  useEffect(() => {
    document.title = 'Casa Abierta Cuba | Descubre la isla con quienes la viven';
    let cancelled = false;
    listBusinesses()
      .then((data) => {
        if (!cancelled) setBusinesses(data);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando el catálogo');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!userId) {
      setFavoritos(new Set());
      return;
    }
    let cancelled = false;
    listFavoriteIds(userId)
      .then((ids) => {
        if (!cancelled) setFavoritos(new Set(ids));
      })
      .catch(() => setFavoritos(new Set()));
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function onToggleFavorite(business: Business) {
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      const isFav = await toggleFavorite(userId, business.id);
      setFavoritos((prev) => {
        const next = new Set(prev);
        if (isFav) next.add(business.id);
        else next.delete(business.id);
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
    } finally {
      // Consistencia local rápida aunque el servidor falle en algún entorno:
      // volvemos a calcular el estado desde el backend cuando hay sesión.
      if (userId && !businesses) {
        try {
          const ids = await listFavoriteIds(userId);
          setFavoritos(new Set(ids));
        } catch {
          /* sin efecto */
        }
      }
    }
  }

  const lista = useMemo(() => businesses ?? [], [businesses]);

  const filtrados = useMemo(() => {
    let rows = lista;
    if (cat !== 'todo') rows = rows.filter((b) => b.service_type === cat);
    if (inclusivo) rows = rows.filter((b) => b.lgbt_friendly);
    const term = q.trim().toLowerCase();
    if (term) {
      rows = rows.filter((b) =>
        [b.name, b.municipality, b.province, b.description].some((v) => v?.toLowerCase().includes(term)),
      );
    }
    return rows;
  }, [lista, cat, inclusivo, q]);

  const hayFiltro = cat !== 'todo' || inclusivo || q.trim().length > 0;

  const alojamientos = useMemo(() => lista.filter((b) => b.service_type === 'alojamiento'), [lista]);
  const gastronomia = useMemo(() => lista.filter((b) => b.service_type === 'gastronomia'), [lista]);
  const servicios = useMemo(
    () => lista.filter((b) => SERVICIOS_Y_EXPERIENCIAS.has(b.service_type)),
    [lista],
  );
  const inclusivos = useMemo(() => lista.filter((b) => b.lgbt_friendly), [lista]);

  function verCategoria(next: (typeof CATEGORIAS)[number]) {
    setCat(next.serviceType ?? 'todo');
    setInclusivo(Boolean(next.inclusivo));
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div>
      {/* ---------------------------------------------------------- */}
      {/* Hero con Playa.jpeg + overlay oscuro                        */}
      {/* ---------------------------------------------------------- */}
      <section className="relative isolate overflow-hidden bg-azul-700 text-white">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url('${IMG.hero}')` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-azul-700/85 via-azul-700/40 to-azul-700/95"
        />

        <div className="mx-auto max-w-5xl px-4 pb-12 pt-14 sm:pb-16 sm:pt-20">
          <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-dorado">
            Una puerta abierta a Cuba
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Descubre la isla con quienes <span className="text-dorado">la viven</span>.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Alojamientos, gastronomía, experiencias y taxis revisados uno a uno. Habla directo con los
            anfitriones desde la plataforma.
          </p>

          {/* Buscador píldora */}
          <form
            role="search"
            className="mt-8"
            onSubmit={(e) => {
              e.preventDefault();
              document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
          >
            <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-white p-2 pl-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
              <Search size={20} aria-hidden className="shrink-0 text-tinta/50" />
              <label htmlFor="busqueda" className="sr-only">
                Buscar alojamientos, gastronomía y experiencias
              </label>
              <input
                id="busqueda"
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Empieza la búsqueda"
                className="min-w-0 flex-1 bg-transparent py-2 text-base text-tinta placeholder:text-tinta/45 focus:outline-none"
              />
              <button
                type="submit"
                aria-label="Buscar"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-terracota-600 text-white transition hover:bg-terracota-700"
              >
                <Search size={18} aria-hidden />
              </button>
            </div>
          </form>

          {/* Filtros píldora deslizables */}
          <div
            className="no-scrollbar mt-4 flex snap-x gap-2 overflow-x-auto pb-1"
            role="tablist"
            aria-label="Filtrar por categoría"
          >
            {FILTROS.map((f) => {
              const Icon = f.icon;
              const activo = cat === f.key && !inclusivo;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={activo}
                  onClick={() => {
                    setCat(f.key);
                    setInclusivo(false);
                    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition ${
                    activo
                      ? 'bg-white text-azul shadow'
                      : 'bg-white/15 text-white ring-1 ring-white/35 hover:bg-white/25'
                  }`}
                >
                  <Icon size={15} aria-hidden />
                  {f.label}
                </button>
              );
            })}
            <button
              type="button"
              role="tab"
              aria-selected={inclusivo}
              onClick={() => {
                setInclusivo((v) => !v);
                setCat('todo');
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition ${
                inclusivo ? 'bg-white text-azul shadow' : 'bg-white/15 text-white ring-1 ring-white/35 hover:bg-white/25'
              }`}
            >
              <Heart size={15} aria-hidden />
              LGBTQ+ friendly
            </button>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Categorías con foto + overlay para leer el texto blanco     */}
      {/* ---------------------------------------------------------- */}
      <section className="mx-auto max-w-6xl px-4 pt-10">
        <h2 className="text-xl font-extrabold text-azul sm:text-2xl">Explora por categoría</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIAS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => verCategoria(c)}
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

      {/* ---------------------------------------------------------- */}
      {/* Filas de tarjetas estilo Airbnb                             */}
      {/* ---------------------------------------------------------- */}
      <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
        {error && (
          <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {businesses === null && (
          <div className="space-y-4" aria-live="polite">
            <div className="h-7 w-56 animate-pulse rounded-full bg-azul/10" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="w-[68vw] max-w-[280px] shrink-0 sm:w-64">
                  <div className="aspect-square animate-pulse rounded-2xl bg-azul/10" />
                  <div className="mt-3 h-4 w-3/4 animate-pulse rounded-full bg-azul/10" />
                  <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-azul/10" />
                </div>
              ))}
            </div>
          </div>
        )}

        {businesses !== null && hayFiltro && (
          <Carrusel
            title={
              q.trim()
                ? `Resultados para “${q.trim()}”`
                : inclusivo
                  ? 'Espacios LGBTQ+ friendly'
                  : FILTROS.find((f) => f.key === cat)?.label ?? 'Resultados'
            }
            subtitle={`${filtrados.length} ${filtrados.length === 1 ? 'lugar' : 'lugares'} disponibles`}
            items={filtrados}
            favoritos={favoritos}
            onToggleFavorite={onToggleFavorite}
          />
        )}

        {businesses !== null && !hayFiltro && (
          <div className="space-y-10">
            <Carrusel
              title="Disponibles en Cuba"
              subtitle="Publicaciones revisadas por el equipo de Casa Abierta"
              items={filtrados}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
            {alojamientos.length > 0 && (
              <Carrusel
                title="Alojamientos en Cuba"
                subtitle="Casas particulares, habitaciones y villas con anfitrión local"
                items={alojamientos}
                favoritos={favoritos}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            {gastronomia.length > 0 && (
              <Carrusel
                title="Mesas con sabor"
                subtitle="Paladares y cocina criolla servida por quien la cocina"
                items={gastronomia}
                favoritos={favoritos}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            {servicios.length > 0 && (
              <Carrusel
                title="Experiencias y servicios"
                subtitle="Taxis, rutas, guías y planes auténticos"
                items={servicios}
                favoritos={favoritos}
                onToggleFavorite={onToggleFavorite}
              />
            )}
            {inclusivos.length > 0 && (
              <Carrusel
                title="Espacios LGBTQ+ friendly"
                subtitle="Anfitriones y locales que celebran a todo el mundo"
                items={inclusivos}
                favoritos={favoritos}
                onToggleFavorite={onToggleFavorite}
              />
            )}
          </div>
        )}
      </section>

      {/* CTA anfitrión */}
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
            <MapPin size={17} /> Publicar mi negocio
          </Link>
        </div>
      </section>

      {/* Concierge Premium: Diseña tu viaje a medida */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <a
          href="https://wa.me/+5356289645?text=Hola,%20quiero%20que%20me%20ayudes%20a%20planificar%20un%20paquete%20de%20viaje%20a%20Cuba%20a%20tu%20medida%20con%20Casa%20Abierta%20Cuba"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/20 transition duration-300 hover:scale-[1.01]"
          style={{ backgroundImage: `url('/img/concierge-bg.jpg')`, minHeight: 'clamp(16rem, 30vh, 22rem)', backgroundPosition: 'center', backgroundSize: 'cover' }}
        >
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
          <div className="relative mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
            <div className="shrink-0">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-yellow-500/20 text-yellow-500">
                <Plane size={24} aria-hidden />
              </div>
            </div>
            <div className="min-w-0">
              <p className="section-kicker text-yellow-500">Concierge Casa Abierta</p>
              <h2 className="text-xl font-extrabold sm:text-2xl">
                <span className="inline-block align-middle text-yellow-500">✈️ Diseña tu Viaje a Medida</span>
              </h2>
              <p className="mt-1 max-w-xl text-sm text-yellow-500/90">
                Días, personas, casa, taxi, comida… cuéntame tu idea y te cotizo el paquete completo por WhatsApp.
              </p>
            </div>
            <div className="shrink-0 sm:mt-0">
              <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/60 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-500 shadow-sm">
                <span className="text-base leading-none" aria-hidden="true">💬</span> WhatsApp directo
              </span>
            </div>
          </div>
        </a>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Carrusel horizontal reutilizable                                    */
/* ------------------------------------------------------------------ */

interface CarruselProps {
  title: string;
  subtitle?: string;
  items: Business[];
  favoritos: Set<string>;
  onToggleFavorite: (business: Business) => void;
}

function Carrusel({ title, subtitle, items, favoritos, onToggleFavorite }: CarruselProps) {
  const ref = useRef<HTMLDivElement>(null);

  function verMas() {
    const el = ref.current;
    if (!el) return;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 8;

    // El botón “Ver más” envía al catálogo completo para la sección
    // “Disponibles en Cuba”; en el resto de carruseles solo hace scroll.
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
