import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Heart, Menu, Search, Sparkles } from 'lucide-react';
import { CATALOG_IMAGES, FILTROS } from '@/lib/catalog';
import { useCatalog } from '@/hooks/useCatalog';
import { useFavorites } from '@/hooks/useFavorites';
import { CatalogExplorer } from '@/components/CatalogExplorer';

/**
 * Portada minimalista tipo wallpaper.
 *
 * La foto de Varadero es el fondo de toda la pantalla: no hay bloque de imagen
 * aparte. Se funde arriba con el azul marino de la cabecera y abajo con el
 * crema de la página, y encima flotan el mensaje de marca, el buscador (con
 * sus filtros) y el acceso a la IA.
 *
 * El catálogo sigue cargado y disponible: sus filas, tarjetas, favoritos y
 * fichas no se han tocado y viven además en las secciones del menú
 * (/alojamientos, /gastronomia, /guias, /taxis, /lgbtq).
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
      {/* Portada wallpaper: la foto de Varadero ocupa toda la        */}
      {/* pantalla y se funde con la cabecera (azul marino) y con el */}
      {/* crema de la página. Un solo lienzo, sin bloques de imagen. */}
      {/* ---------------------------------------------------------- */}
      <section className="home-wallpaper relative isolate flex min-h-[calc(100svh-7.5rem)] flex-col justify-center overflow-hidden text-white md:min-h-[calc(100svh-8.5rem)]">
        <img
          src={CATALOG_IMAGES.hero}
          alt=""
          aria-hidden
          className="home-wallpaper__photo"
          fetchPriority="high"
          decoding="async"
        />
        {/* Velo tenue para que el texto blanco respire sobre el agua. */}
        <div aria-hidden className="home-wallpaper__scrim absolute inset-0" />
        {/* Azul marino de la cabecera disuelto en el cielo. */}
        <div aria-hidden className="home-wallpaper__blend-top absolute inset-x-0 top-0 h-[58%]" />
        {/* Arena de la foto fundida con el crema de la página. */}
        <div aria-hidden className="home-wallpaper__blend-bottom absolute inset-x-0 bottom-0 h-80 sm:h-96" />

        <div className="relative mx-auto w-full max-w-5xl px-5 pt-8 sm:pt-12">
          <p className="wallpaper-ink text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-dorado">
            Una puerta abierta a Cuba
          </p>
          <h1 className="wallpaper-ink mt-3 max-w-3xl text-4xl font-extrabold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
            Descubre la isla con quienes <span className="text-dorado">la viven</span>.
          </h1>
          <p className="wallpaper-ink mt-4 max-w-xl text-base text-white/90 sm:text-lg">
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
            <div className="flex max-w-2xl items-center gap-2 rounded-full bg-white/95 p-2 pl-5 shadow-[0_18px_50px_rgba(9,25,45,0.45)] ring-1 ring-white/70 backdrop-blur-sm">
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
          <p className="wallpaper-ink mt-3 flex max-w-2xl items-start gap-2 px-2 text-[12.5px] leading-snug text-white/80 sm:px-0">
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
                  className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${
                    activo
                      ? 'bg-white text-azul shadow-lg'
                      : 'bg-azul-700/35 text-white ring-1 ring-white/45 hover:bg-azul-700/55'
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
              className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold backdrop-blur-md transition ${
                inclusivo
                  ? 'bg-white text-azul shadow-lg'
                  : 'bg-azul-700/35 text-white ring-1 ring-white/45 hover:bg-azul-700/55'
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
              className="wallpaper-ink inline-flex items-center gap-2 rounded-full border border-dorado/80 bg-azul-700/40 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition hover:bg-azul-700/60"
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
