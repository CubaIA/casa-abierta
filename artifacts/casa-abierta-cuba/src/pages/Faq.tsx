import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, Sun } from 'lucide-react';

interface Pregunta {
  pregunta: string;
  respuesta: string[];
}

const PREGUNTAS: Pregunta[] = [
  {
    pregunta: '¿Cómo reservo un alojamiento o un servicio?',
    respuesta: [
      'Entra en la ficha del negocio que te interesa y pulsa «Solicitar Reserva». Rellena tus datos, las fechas de llegada y salida, cuántos viajan y tu presupuesto aproximado. No necesitas crear una cuenta.',
      'La solicitud llega directamente al anfitrión, que te escribe por correo o WhatsApp para confirmar disponibilidad, precio y condiciones. El pago y los detalles finales se acuerdan con él, nunca por adelantado a través de la plataforma.',
    ],
  },
  {
    pregunta: '¿Cómo se verifica al anfitrión?',
    respuesta: [
      'Cada propuesta pasa por una revisión manual antes de publicarse: revisamos que el negocio exista, que la información sea coherente y que las fotos correspondan al lugar. Los anfitriones declaran bajo juramento contar con las licencias exigidas por la legislación cubana.',
      'Los negocios que completan esa revisión muestran el sello «Verificado CA». Es una medida de calidad de la plataforma, no una certificación oficial del Estado ni un seguro: antes de contratar, confirma siempre las condiciones directamente con el anfitrión.',
    ],
  },
  {
    pregunta: '¿Qué pasa si no hay electricidad durante mi estancia?',
    respuesta: [
      'En Cuba los cortes de electricidad programados forman parte del día a día, sobre todo en verano. Muchos de nuestros anfitriones lo saben y han invertido en paneles solares, inversores y baterías de respaldo para mantener al menos la iluminación, los ventiladores, el agua y la conexión a internet.',
      'En la ficha del negocio y en la conversación con el anfitrión puedes preguntar por el respaldo eléctrico antes de reservar. Te recomendamos hacerlo siempre: así sabes qué esperar y el anfitrión puede explicarte cómo funciona su sistema y qué equipos quedan cubiertos.',
      'Si durante la estancia el respaldo falla o el servicio no es el acordado, escríbenos desde Contacto: revisamos el caso con el anfitrión y, si corresponde, te ayudamos a buscar una alternativa.',
    ],
  },
  {
    pregunta: '¿Tengo que pagar algo a Casa Abierta?',
    respuesta: [
      'Buscar, comparar y enviar solicitudes es gratuito para los viajeros. La plataforma no cobra la reserva ni pide pagos por adelantado para conectar con un anfitrión.',
      'Los únicos pagos de la plataforma son servicios opcionales para anfitriones, como el Plan Premium para destacar su negocio, y se procesan a través de pasarelas de pago legales. Si alguien te pide dinero en nombre de Casa Abierta por un canal que no sea el oficial, repórtalo.',
    ],
  },
  {
    pregunta: '¿Puedo cancelar mi reserva?',
    respuesta: [
      'Como plataforma intermediaria, no imponemos la política de cancelación: las condiciones se acuerdan con el anfitrión. Aun así, publicamos un marco de recomendación para que ambas partes sepan qué esperar, y te pedimos acordar siempre por escrito la fecha límite y las condiciones antes de pagar.',
      'Puedes leer el detalle en nuestra política de cancelación.',
    ],
  },
  {
    pregunta: '¿Es seguro viajar a Cuba y contactar con desconocidos?',
    respuesta: [
      'Cuba es un destino tranquilo para el viajero que respeta las normas locales, pero como en cualquier país conviene usar el sentido común: no compartas datos bancarios, no envíes dinero por adelantado fuera de los canales acordados y desconfía de precios demasiado bajos.',
      'En Casa Abierta todas las solicitudes quedan registradas y los anfitriones pasan por revisión, de modo que tienes un historial y un canal para reclamar. Consulta la sección de seguridad para conocer el sello y los mitos más habituales.',
    ],
  },
];

/**
 * Página pública de preguntas frecuentes.
 *
 * Isla independiente: no toca catálogo, reseñas, leads ni paneles. Usa un
 * acordeón nativo (`details`) para que funcione sin JavaScript adicional.
 */
export default function Faq() {
  useEffect(() => {
    document.title = 'Preguntas frecuentes | Casa Abierta Cuba';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content =
        'Cómo reservar, cómo verificamos a los anfitriones y qué pasa con la electricidad en Cuba: respuestas claras antes de viajar.';
    }
  }, []);

  return (
    <article className="editorial-page page-shell legal-page">
      <div className="section-kicker">CASA ABIERTA · AYUDA Y CONFIANZA</div>
      <h1>Preguntas frecuentes</h1>
      <p className="editorial-lead">
        Lo que más nos preguntan los viajeros antes de reservar: cómo funciona la solicitud, qué significa el sello
        Verificado CA y cómo se resuelve el tema de la electricidad en la isla.
      </p>

      <div className="mt-6 space-y-3">
        {PREGUNTAS.map((item) => (
          <details key={item.pregunta} className="group rounded-2xl border border-arena-2 bg-white p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-extrabold text-azul">
              <span>{item.pregunta}</span>
              <span
                aria-hidden
                className="shrink-0 text-xl leading-none text-dorado transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="mt-3 space-y-2 text-sm leading-relaxed text-tinta/80">
              {item.respuesta.map((parrafo) => (
                <p key={parrafo}>{parrafo}</p>
              ))}
            </div>
          </details>
        ))}
      </div>

      <aside className="mt-8 rounded-2xl border border-dorado/60 bg-crema/60 p-5">
        <h2 className="inline-flex items-center gap-2 text-base font-extrabold text-azul">
          <Sun size={18} aria-hidden className="text-dorado" /> Antes de reservar en Cuba
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-tinta/80">
          Pregunta siempre por el respaldo eléctrico, el agua y la conexión a internet, y acuerda por escrito el precio
          final y las condiciones de cancelación. Un par de preguntas antes del viaje evitan casi todas las sorpresas.
        </p>
      </aside>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link className="button-primary" href="/">
          Explorar el catálogo <ArrowRight size={16} />
        </Link>
        <Link className="button-ghost" href="/politica-de-cancelacion">
          Política de cancelación
        </Link>
        <Link className="button-ghost" href="/seguridad">
          Seguridad y sello Verificado
        </Link>
      </div>

      <p className="legal-note">
        Documento informativo de la plataforma (versión 1.0). Las condiciones concretas de cada servicio las acuerdas
        con el anfitrión; Casa Abierta actúa como intermediario digital de conexión.
      </p>
    </article>
  );
}
