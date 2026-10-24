import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Heart, Menu, Search, Sparkles } from 'lucide-react';
import { CATALOG_IMAGES, FILTROS } from '@/lib/catalog';
import { useCatalog } from '@/hooks/useCatalog';
import { useFavorites } from '@/hooks/useFavorites';
import { CatalogExplorer } from '@/components/CatalogExplorer';

/**
 * Portada minimalista.
 *
 * La vista deja sólo la cabecera, el mensaje de marca, el buscador (con sus
 * filtros) y el acceso a la IA. El catálogo sigue cargado y disponible: sus
 * filas, tarjetas, favoritos y fichas no se han tocado y viven además en las
 * secciones del menú (/alojamientos, /gastronomia, /guias, /taxis, /lgbtq).
 * Aquí los resultados se pintan sólo cuando hay una búsqueda o un filtro
 * activo, para que la portada no muestre carruseles de entrada.
 */
export default function Home() {
  const { businesses, error: catalogError } = useCatalog();
  const { favoritos, error: favoritesError, toggle: onToggleFavorite } = useFavorites();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('todo');
  const [inclusivo, setInclusivo] = useState(false);

  useEffect(() => {
    document.title = 'Casa Abierta Cuba | Descubre la isla con quienes la viven';
  }, []);

  const error = catalogError ?? favoritesError;
  const hayFiltro = cat !== 'todo' || inclusivo || q.trim().length > 0;
  const mostrarResultados = hayFiltro || Boolean(error);

  function irAlCatalogo() {
    document.getElementById('catalogo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <div className="bg-crema">
      {/* ---------------------------------------------------------- */}
      {/* Hero: foto de Cuba + azul marino, con aire libre alrededor  */}
      {/* ---------------------------------------------------------- */}
      <section className="relative isolate flex min-h-[calc(100svh-4.5rem)] flex-col justify-center overflow-hidden bg-azul-700 text-white md:min-h-[calc(100svh-5rem)]">
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{ backgroundImage: `url('${CATALOG_IMAGES.hero}')` }}
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-azul-700/60" />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-b from-azul-700/90 via-azul-700/45 to-azul-700/95"
        />

        <div className="mx-auto w-full max-w-5xl px-4 pb-44 pt-16 sm:pb-36 sm:pt-24">
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

          {/* Buscador protagonista */}
          <form
            role="search"
            className="mt-9"
            onSubmit={(e) => {
              e.preventDefault();
              irAlCatalogo();
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

          {/* Aviso del menú: registro, sesión y todas las categorías */}
          <p className="mx-auto mt-3 flex max-w-2xl items-start gap-2 px-2 text-[12.5px] leading-snug text-white/70 sm:px-0">
            <Menu size={14} aria-hidden className="mt-0.5 shrink-0 text-dorado" />
            <span>
              Para registrarte, iniciar sesión o explorar todas las categorías, abre el menú
            </span>
          </p>

          {/* Filtros píldora deslizables */}
          <div
            className="no-scrollbar mt-5 flex snap-x gap-2 overflow-x-auto pb-1"
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
                    irAlCatalogo();
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
                irAlCatalogo();
              }}
              className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur transition ${
                inclusivo ? 'bg-white text-azul shadow' : 'bg-white/15 text-white ring-1 ring-white/35 hover:bg-white/25'
              }`}
            >
              <Heart size={15} aria-hidden />
              LGBTQ+ friendly
            </button>
          </div>

          {/* Acceso a la IA */}
          <div className="mt-7">
            <Link
              href="/chat"
              className="inline-flex items-center gap-2 rounded-full border border-dorado/70 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Sparkles size={16} aria-hidden className="text-dorado" />
              Preguntar a Cuba Conecta IA
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Resultados: sólo se pintan con búsqueda o filtro activo     */}
      {/* ---------------------------------------------------------- */}
      <section
        id="catalogo"
        className="mx-auto w-full max-w-6xl scroll-mt-20 px-4 pb-44 md:pb-24"
      >
        {mostrarResultados && (
          <div className="pt-10">
            <CatalogExplorer
              businesses={businesses}
              error={error}
              q={q}
              cat={cat}
              inclusivo={inclusivo}
              favoritos={favoritos}
              onToggleFavorite={onToggleFavorite}
            />
          </div>
        )}
      </section>
    </div>
  );
}
