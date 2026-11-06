import { Link } from 'wouter';

const ARTICULOS = [
  {
    titulo: 'Las 5 mejores casas coloniales para hospedarse en Trinidad, Cuba',
    slug: 'trinidad',
  },
  {
    titulo: 'Cómo planificar un viaje a Cuba en 2026 de forma segura y legal',
    slug: 'viaje-seguro',
  },
  {
    titulo: 'Qué hacer en Varadero: Playas, gastronomía y cultura local',
    slug: 'varadero',
  },
];

export function BlogPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-zinc-900">
      <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">Blog de Viajes - Casa Abierta Cuba</h1>
      <p className="mt-4 text-lg leading-relaxed text-zinc-600">
        Guías y novedades para descubrir Cuba con confianza, preparados por el equipo de Casa Abierta Cuba.
      </p>
      <ol className="mt-10 space-y-6">
        {ARTICULOS.map((articulo) => (
          <li key={articulo.slug}>
            <Link
              href={`/blog/${articulo.slug}`}
              className="block rounded-2xl border border-azul/20 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-azul/40"
            >
              <span className="text-sm font-semibold text-azul">Artículo</span>
              <h2 className="mt-2 text-xl font-bold leading-snug text-zinc-900">{articulo.titulo}</h2>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
