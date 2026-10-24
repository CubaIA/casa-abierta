import { useEffect, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { CATALOG_IMAGES, FILTROS, type CategoryTile } from '@/lib/catalog';
import { useCatalog } from '@/hooks/useCatalog';
import { useFavorites } from '@/hooks/useFavorites';
import { CatalogExplorer } from '@/components/CatalogExplorer';
import { CategoryTiles, HostCTA } from '@/components/HomeBlocks';
import { ConciergeTeaser } from '@/components/ConciergeBanner';

export default function Home() {
  const { businesses, error: catalogError } = useCatalog();
  const { favoritos, error: favoritesError, toggle: onToggleFavorite } = useFavorites();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todo');
  const [inclusivo, setInclusivo] = useState(false);

  useEffect(() => {
    document.title = 'Casa Abierta Cuba | Descubre la isla con quienes la viven';
  }, []);

  function verCategoria(next: CategoryTile) {
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
          style={{ backgroundImage: `url('${CATALOG_IMAGES.hero}')` }}
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

      {/* Categorías con foto + overlay para leer el texto blanco */}
      <CategoryTiles onSelect={verCategoria} />

      {/* ---------------------------------------------------------- */}
      {/* Filas de tarjetas estilo Airbnb                             */}
      {/* ---------------------------------------------------------- */}
      <section id="catalogo" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-10">
        <CatalogExplorer
          businesses={businesses}
          error={catalogError ?? favoritesError}
          q={q}
          cat={cat}
          inclusivo={inclusivo}
          favoritos={favoritos}
          onToggleFavorite={onToggleFavorite}
        />
      </section>

      {/* Teaser de Concierge: enlaza a la página, no a WhatsApp. */}
      <ConciergeTeaser />

      <HostCTA />
    </div>
  );
}
