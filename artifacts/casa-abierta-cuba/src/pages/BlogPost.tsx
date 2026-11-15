import { useEffect } from 'react';
import { useParams } from 'wouter';

/** Bloque de contenido del artículo: párrafo, subtítulo o lista. */
type Bloque = {
  tipo: 'p' | 'h2' | 'h3' | 'ul' | 'ol';
  texto?: string;
  items?: string[];
};

type Articulo = {
  slug: string;
  titulo: string;
  subtitulo: string;
  cuerpo?: string[];
  /** Descripción para SEO (solo los artículos que la definen la aplican). */
  metaDescripcion?: string;
  /** Contenido con subtítulos y listas; si existe, manda sobre `cuerpo`. */
  bloques?: Bloque[];
};

const ARTICULOS: Articulo[] = [
  {
    slug: 'vinales-paneles-solares',
    titulo: 'Viñales sin apagones: Las mejores casas con paneles solares en Cuba',
    subtitulo:
      '¿Planeando viajar a Cuba pero te preocupan los apagones? Descubre las casas en Viñales con paneles solares y respaldo eléctrico garantizado.',
    metaDescripcion:
      '¿Planeando viajar a Cuba pero te preocupan los apagones? Descubre las casas en Viñales con paneles solares y respaldo eléctrico garantizado.',
    bloques: [
      {
        tipo: 'p',
        texto:
          'Viajar a Cuba es una experiencia inigualable, pero sabemos que la situación energética actual puede generar dudas. Los apagones programados son una realidad en la isla, y nadie quiere que su ansiado viaje a Viñales se arruine por no tener ventilador, aire acondicionado o una nevera funcionando.',
      },
      {
        tipo: 'p',
        texto:
          'En Casa Abierta Cuba, no solo nos hemos adaptado a esta realidad, sino que hemos convertido la seguridad energética en nuestro estándar de calidad. Por eso, hoy te traemos una guía de las mejores opciones de alojamiento en Viñales que cuentan con paneles solares y respaldo eléctrico.',
      },
      { tipo: 'h2', texto: '¿Por qué es vital elegir una casa con paneles solares en Viñales?' },
      {
        tipo: 'p',
        texto:
          'Viñales es un paraíso natural, pero su conexión a la red eléctrica nacional es tan vulnerable como la del resto del país. Al reservar una casa equipada con energía solar, te aseguras de tener:',
      },
      {
        tipo: 'ul',
        items: [
          'Ventiladores o A/C funcionando durante las horas de más calor.',
          'Refrigerador activo para mantener frescas tus bebidas y alimentos.',
          'Carga garantizada para tus dispositivos (móviles, cámaras, laptops).',
          'Agua caliente si la casa cuenta con sistemas de bombeo o calentadores que dependen de la energía.',
        ],
      },
      { tipo: 'h2', texto: 'Las mejores casas con respaldo solar en Viñales (Verificadas CA)' },
      {
        tipo: 'p',
        texto:
          'En nuestra plataforma, solo mostramos casas auditadas manualmente. Si buscas tranquilidad total, te recomendamos revisar estas opciones que ya cuentan con el sello Verificado CA y sistemas de energía renovable:',
      },
      { tipo: 'h3', texto: '1. Casa Leibys y Papito el Zapatero' },
      {
        tipo: 'p',
        texto:
          'Ubicada a solo 5 minutos del centro de Viñales, esta casa es el ejemplo perfecto de cómo adaptarse al entorno. "Lo más importante: cuenta con un sistema de panel solar de 24 horas para garantizar electricidad constante". Además, ofrece vistas panorámicas a las montañas, piscina y áreas rodeadas de árboles frutales. Es ideal para quienes buscan desconectar sin perder las comodidades modernas.',
      },
      { tipo: 'h3', texto: '2. Villa Sonia y Papito' },
      {
        tipo: 'p',
        texto:
          'Un espacio acogedor gestionado por anfitriones experimentados. Aunque su fuerte es la gastronomía local (desayunos y cenas de primer nivel), su ubicación y gestión aseguran una estancia tranquila. (Nota: Recuerda preguntar siempre por el respaldo eléctrico al anfitrión a través de nuestro chat).',
      },
      { tipo: 'h3', texto: '3. Casa Jorge y Ana Luisa' },
      {
        tipo: 'p',
        texto:
          'Con 9 habitaciones y un servicio de excelencia, esta casa es perfecta si buscas capacidad y confort en el corazón de Viñales. Cuenta con terraza privada y excelente ventilación.',
      },
      { tipo: 'h2', texto: 'Consejos de supervivencia para tu viaje a Viñales' },
      {
        tipo: 'p',
        texto:
          'Incluso si tu casa tiene paneles solares, el resto del pueblo puede experimentar cortes. Aquí van nuestros mejores consejos:',
      },
      {
        tipo: 'ol',
        items: [
          'Descarga mapas offline: La señal de internet en Cuba es limitada. Usa Google Maps offline.',
          'Lleva una batería portátil: Para cargar el móvil cuando estés fuera de la casa.',
          'Habla con tu anfitrión: Los cubanos son expertos en adaptarse. Ellos saben exactamente a qué horas vuelve la luz o qué lugares están abiertos.',
          'Reserva a través de nuestra plataforma: Al usar Casa Abierta Cuba, no solo aseguras una casa verificada, sino que puedes chatear directamente con el anfitrión antes de reservar para confirmar todos los detalles de la energía.',
        ],
      },
      { tipo: 'h2', texto: 'Reserva con confianza en Casa Abierta Cuba' },
      {
        tipo: 'p',
        texto:
          'No dejes que el miedo a los apagones te impida descubrir el Valle de Viñales, uno de los lugares más hermosos del planeta. En nuestra plataforma, nos encargamos de verificar las licencias de cada anfitrión y tú te encargas de disfrutar.',
      },
    ],
  },
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

/** Aplica title y description propios solo a los artículos que los definen. */
function useSeoArticulo(articulo: Articulo | undefined) {
  useEffect(() => {
    if (!articulo?.metaDescripcion) return;
    const tituloAnterior = document.title;

    document.title = `${articulo.titulo} | Blog de Casa Abierta Cuba`;
    const meta = document.querySelector('meta[name="description"]');
    const descripcionAnterior = meta?.getAttribute('content') ?? null;
    if (meta) meta.setAttribute('content', articulo.metaDescripcion);

    return () => {
      document.title = tituloAnterior;
      if (meta && descripcionAnterior !== null) meta.setAttribute('content', descripcionAnterior);
    };
  }, [articulo]);
}

function BloqueContenido({ bloque }: { bloque: Bloque }) {
  if (bloque.tipo === 'h2') {
    return <h2 className="mt-8 text-2xl font-extrabold leading-snug text-azul">{bloque.texto}</h2>;
  }
  if (bloque.tipo === 'h3') {
    return <h3 className="mt-6 text-lg font-bold leading-snug text-azul-700">{bloque.texto}</h3>;
  }
  if (bloque.tipo === 'ul' || bloque.tipo === 'ol') {
    const Lista = bloque.tipo;
    return (
      <Lista className={`space-y-2 pl-5 ${bloque.tipo === 'ul' ? 'list-disc' : 'list-decimal'}`}>
        {(bloque.items ?? []).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </Lista>
    );
  }
  return <p>{bloque.texto}</p>;
}

export function BlogPost() {
  const { slug } = useParams<{ slug?: string }>();
  const articulo = ARTICULOS.find((a) => a.slug === slug);
  useSeoArticulo(articulo);

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
        {articulo.bloques
          ? articulo.bloques.map((bloque, i) => (
              <BloqueContenido key={`${bloque.tipo}-${i}`} bloque={bloque} />
            ))
          : (articulo.cuerpo ?? []).map((parrafo) => <p key={parrafo}>{parrafo}</p>)}
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
