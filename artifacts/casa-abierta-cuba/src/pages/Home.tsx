import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Building2, MapPin, Search, Sparkles, Star } from 'lucide-react';
import { listBusinesses, listProvinces, SERVICE_TYPES, type CatalogFilters } from '@/lib/marketplace';
import type { Business } from '@/lib/types';
import { BusinessCard } from '@/components/BusinessCard';
import { useAuth } from '@/lib/auth';

const SECCIONES: {
  img: string;
  alt: string;
  title: string;
  desc: string;
  serviceType?: string;
}[] = [
  {
    img: '/img/Habitación.jpg',
    alt: 'Habitación con anfitrión local',
    title: 'Alojamiento',
    desc: 'Casas coloniales, casas de huéspedes y habitaciones con anfitrión local.',
    serviceType: 'alojamiento',
  },
  {
    img: '/img/Comida.jpeg',
    alt: 'Plato tradicional cubano',
    title: 'Gastronomía',
    desc: 'Ropa vieja, congrí, tostones y la cocina de siempre servida por quienes la cocinan.',
    serviceType: 'gastronomia',
  },
  {
    img: '/img/Taxis.jpg',
    alt: 'Transporte y servicios locales',
    title: 'Servicios y Experiencias',
    desc: 'Música en vivo, baile, rutas culturales, transporte y planes auténticos con guías locales.',
    serviceType: 'experiencias',
  },
  {
    img: '/img/lgbtq-inclusivo.svg',
    alt: 'Espacio inclusivo LGBTQ+ con arcoíris',
    title: 'LGBTQ+ friendly',
    desc: 'Espacios inclusivos y acogedores, revisados por la plataforma.',
  },
];

export default function Home() {
  const { userId } = useAuth();
  const [filters, setFilters] = useState<CatalogFilters>({});
  const [provinces, setProvinces] = useState<string[]>([]);
  const [rows, setRows] = useState<Business[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Casa Abierta Cuba | Descubre la isla con quienes la viven';
    listProvinces().then(setProvinces).catch(() => setProvinces([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    const timer = setTimeout(() => {
      listBusinesses(filters)
        .then((data) => {
          if (!cancelled) setRows(data);
        })
        .catch((e: unknown) => {
          if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando el catálogo');
        });
    }, filters.q ? 250 : 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [filters]);

  const serviceLabel = useMemo(
    () => Object.fromEntries(SERVICE_TYPES.map((s) => [s.value, s.label])),
    [],
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative text-white overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/img/Playa.jpg')", backgroundColor: '#102B47' }}
        />
        <div aria-hidden className="absolute inset-0 bg-azul/75" />
        <div className="relative mx-auto max-w-6xl px-4 py-14 sm:py-20 grid gap-8 lg:grid-cols-[1.4fr_1fr] items-center">
          <div>
            <p className="section-kicker !text-dorado">Una puerta abierta a Cuba</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Descubre la isla con quienes <span className="text-dorado">la viven</span>.
            </h1>
            <p className="mt-4 max-w-xl text-azul-200 text-lg">
              Alojamientos, gastronomía, experiencias y servicios locales revisados uno a uno. Solicita contacto
              directo con los anfitriones y conversa desde la plataforma.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#catalogo" className="button-primary">
                Explorar catálogo <ArrowRight size={17} />
              </a>
              <Link href="/chat" className="button-ghost !text-white !border-azul-300 hover:!bg-azul-600">
                <Sparkles size={16} /> Preguntar a Cuba Conecta IA
              </Link>
            </div>
          </div>
          <aside className="rounded-2xl bg-white/10 backdrop-blur p-6 border border-white/20">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-dorado text-azul-700 font-black">CA</span>
              <div>
                <p className="font-bold text-white">Confianza primero</p>
                <p className="text-sm text-azul-200">Publicaciones revisadas · sin pagos en esta versión</p>
              </div>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-azul-200">
              <li className="flex gap-2"><Star size={16} className="text-dorado shrink-0 mt-0.5" /> Reseñas de viajeros con solicitud completada</li>
              <li className="flex gap-2"><Building2 size={16} className="text-dorado shrink-0 mt-0.5" /> Proveedores locales verificados por moderación</li>
              <li className="flex gap-2"><Sparkles size={16} className="text-dorado shrink-0 mt-0.5" /> Asistente IA para planear tu viaje</li>
            </ul>
          </aside>
        </div>
      </section>

      {/* Secciones temáticas */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <p className="section-kicker">Descubre por categoría</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SECCIONES.map((s) => (
            <button
              key={s.title}
              type="button"
              className="business-card text-left group"
              onClick={() => {
                setFilters((f) => ({ ...f, service_type: s.serviceType }));
                document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <div className="business-visual !h-36">
                <img
                  src={s.img}
                  alt={s.alt}
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="p-4">
                <h3 className="font-bold text-azul group-hover:text-terracota-600 transition">{s.title}</h3>
                <p className="mt-1 text-sm text-tinta/70">{s.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="section-kicker">Catálogo</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-azul">Explora negocios aprobados</h2>
          </div>
          {!userId && (
            <Link href="/entrar" className="text-link">
              Crea una cuenta para guardar favoritos <ArrowRight size={15} />
            </Link>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr]">
          <label className="relative">
            <span className="sr-only">Buscar</span>
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-tinta/40" />
            <input
              className="field-input !pl-9"
              placeholder="Buscar por nombre, provincia o municipio…"
              value={filters.q ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined }))}
            />
          </label>
          <label>
            <span className="sr-only">Provincia</span>
            <select
              className="field-input"
              value={filters.province ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, province: e.target.value || undefined }))}
            >
              <option value="">Todas las provincias</option>
              {provinces.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Tipo de servicio</span>
            <select
              className="field-input"
              value={filters.service_type ?? ''}
              onChange={(e) => setFilters((f) => ({ ...f, service_type: e.target.value || undefined }))}
            >
              <option value="">Todos los servicios</option>
              {SERVICE_TYPES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-live="polite">
          {rows === null && (
            <>
              <div className="empty-state">Cargando catálogo…</div>
            </>
          )}
          {rows?.length === 0 && (
            <div className="empty-state">
              No hay negocios que coincidan con esos filtros. Prueba con otra búsqueda.
            </div>
          )}
          {rows?.map((b) => (
            <BusinessCard key={b.id} business={b} serviceLabel={serviceLabel[b.service_type] ?? b.service_type} />
          ))}
        </div>
      </section>

      {/* CTA anfitrión */}
      <section className="mx-auto max-w-6xl px-4 pb-6">
        <div className="rounded-2xl border border-arena-2 bg-arena p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="section-kicker">Para anfitriones</p>
            <h2 className="text-xl sm:text-2xl font-extrabold text-azul">¿Ofreces alojamiento o un servicio local?</h2>
            <p className="mt-1 text-tinta/70 max-w-xl">
              Publica tu propuesta, súbelas fotos y recibe solicitudes de viajeros directamente en tu panel.
              Toda publicación se revisa antes de aparecer en el catálogo.
            </p>
          </div>
          <Link href="/anfitrion" className="button-secondary">
            <MapPin size={17} /> Publicar mi negocio
          </Link>
        </div>
      </section>
    </div>
  );
}
