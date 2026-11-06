import { useParams } from 'wouter';

const ARTICULOS = [
  {
    slug: 'trinidad',
    titulo: 'Las 5 mejores casas coloniales para hospedarse en Trinidad, Cuba',
    subtitulo: 'Guía de las casas coloniales más bonitas de Trinidad para quedarte en este pueblo mágico.',
    cuerpo: [
      'Trinidad es uno de los pueblos mejores conservados de Cuba y sus casas coloniales son un ejemplo de arquitectura cubana.',
      'En esta guía te mostramos las quintas con mejor estado, ubicación y ambiente para pasar una noche inolvidable.',
      'Te recomendamos visitarlas de día y de noche, pues el contraste de luz y sombra hace especiales las calles de la plaza mayor.',
    ],
  },
  {
    slug: 'viaje-seguro',
    titulo: 'Cómo planificar un viaje a Cuba en 2026 de forma segura y legal',
    subtitulo: 'Pasos clave para moverte por la isla con confianza, respetando las normas y preparando lo imprescindible.',
    cuerpo: [
      'La mejor forma de viajar a Cuba en 2026 es planificar con antelación: pasaporte, visas, transporte y alojamiento.',
      'Cada viaje tiene trámites específicos; consulta siempre la informacion oficial de la Embajada y de la Guardia Revolucionaria.',
      'Ten la documentación en papel y digital, y asegura un seguro viajero que acepte situaciones turísticas.',
    ],
  },
  {
    slug: 'varadero',
    titulo: 'Qué hacer en Varadero: Playas, gastronomía y cultura local',
    subtitulo: 'Ruta de un día (o dos) por Varadero, con sus playas, comida y tradiciones.',
    cuerpo: [
      'Varadero combina playas de arena blanca, agua turquesa y una gastronomía marinera muy fresca.',
      'No te pierdas la costa y los pueblos cercanos, donde se respira mejor la cultura y el ritmo local.',
      'La mejor época para visitarlo es desde finales de noviembre hasta abril, con clima más cálido y menos lluvias.',
    ],
  },
];

export function BlogPost() {
  const { slug } = useParams<{ slug?: string }>();
  const articulo = ARTICULOS.find((a) => a.slug === slug);

  if (!articulo) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-zinc-900">
        <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">Artículo no encontrado</h1>
        <p className="mt-4 text-lg text-zinc-600">El artículo que buscas no existe o fue movido.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 text-zinc-900">
      <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">{articulo.titulo}</h1>
      <p className="mt-2 text-lg text-zinc-600">{articulo.subtitulo}</p>
      <div className="mt-6 space-y-4 text-base leading-relaxed text-zinc-700">
        {articulo.cuerpo.map((parrafo) => (
          <p key={parrafo}>{parrafo}</p>
        ))}
      </div>
      <div className="mt-10">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-azul px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul/80"
        >
          Ver alojamientos
        </a>
      </div>
    </article>
  );
}
