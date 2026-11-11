import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, BadgeCheck, CheckCircle2, MessageCircle, ShieldCheck, XCircle } from 'lucide-react';

const MITOS: Array<{ mito: string; realidad: string }> = [
  {
    mito: '«En Cuba todo el mundo intenta estafarte»',
    realidad:
      'Como en cualquier país turístico hay que estar atento, pero la gran mayoría de anfitriones y guías viven de su reputación. Aquí pasan por una revisión manual y responden con su nombre detrás de cada ficha.',
  },
  {
    mito: '«Hay que pagar la reserva por adelantado en la plataforma»',
    realidad:
      'No. Casa Abierta no cobra reservas ni pide pagos por adelantado para conectar. Las condiciones y el pago se acuerdan directamente con el anfitrión, nunca por canales que no hayas verificado.',
  },
  {
    mito: '«Sin electricidad no se puede estar en una casa»',
    realidad:
      'Muchos anfitriones tienen paneles solares, inversores y baterías que mantienen luz, ventiladores, agua y wifi durante los cortes programados. Pregúntalo antes de reservar: la ficha y el anfitrión te lo explican.',
  },
  {
    mito: '«Todos los negocios de Cuba son informales»',
    realidad:
      'La mayoría de alojamientos, paladares y guías trabajan con licencias de trabajo por cuenta propia y permisos sanitarios. Los anfitriones los declaran bajo juramento y el equipo revisa la coherencia de cada propuesta.',
  },
  {
    mito: '«Si el anuncio está en internet, ya es seguro»',
    realidad:
      'Estar publicado no sustituye tu criterio. Lee la ficha completa, revisa las reseñas aprobadas, pregunta por lo que no esté claro y desconfía de precios demasiado bajos o de quien te pide dinero fuera de los canales acordados.',
  },
];

/** Página pública de seguridad y sello Verificado CA (aislada del resto). */
export default function Seguridad() {
  useEffect(() => {
    document.title = 'Seguridad y sello Verificado | Casa Abierta Cuba';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content =
        'Qué significa el sello Verificado CA, cómo protegemos la comunicación con los anfitriones y qué mitos sobre Cuba conviene dejar atrás.';
    }
  }, []);

  return (
    <article className="editorial-page page-shell legal-page">
      <div className="section-kicker">CASA ABIERTA · SEGURIDAD Y CONFIANZA</div>
      <h1>Viajar con confianza</h1>
      <p className="editorial-lead">
        El sello «Verificado CA», la comunicación registrada con cada anfitrión y una idea clara de lo que la plataforma
        garantiza —y de lo que no— para que decidas con la información delante.
      </p>

      <div className="legal-sections">
        <section>
          <h2 className="inline-flex items-center gap-2">
            <BadgeCheck size={20} aria-hidden className="text-verde-700" /> Qué significa el sello «Verificado CA»
          </h2>
          <p>
            Antes de aparecer en el catálogo, cada negocio pasa por una revisión manual: comprobamos que la propuesta sea
            coherente, que las fotos correspondan al lugar y que el anfitrión se identifique con su nombre real. Los
            anfitriones declaran bajo juramento contar con las licencias y permisos que exige la legislación cubana.
          </p>
          <p>
            El sello indica que ese negocio completó esa revisión de plataforma. No es una certificación oficial del
            Estado cubano, ni un seguro, ni una garantía de calidad del servicio: es una señal de que alguien del equipo
            miró esa ficha y que hay un historial detrás.
          </p>
        </section>

        <section>
          <h2 className="inline-flex items-center gap-2">
            <MessageCircle size={20} aria-hidden className="text-azul" /> Comunicación directa y registrada
          </h2>
          <p>
            Toda solicitud de reserva pasa por la plataforma: queda guardada con el negocio al que va dirigida, la fecha
            y tus datos de contacto. Eso significa que existe un registro consultable si algo no cuadra, tanto para ti
            como para el anfitrión y para el equipo de Casa Abierta.
          </p>
          <p>
            Contacta siempre por los canales que aparecen en la ficha o en la respuesta a tu solicitud. Desconfía de
            mensajes que dicen ser de Casa Abierta pidiendo contraseñas, códigos de verificación, datos de tarjeta o
            pagos urgentes: nunca los pedimos. Si recibes algo así, repórtalo desde Contacto.
          </p>
        </section>

        <section>
          <h2>Mitos sobre Cuba que conviene dejar atrás</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MITOS.map((m) => (
              <div key={m.mito} className="rounded-xl border border-arena-2 bg-white p-4">
                <p className="inline-flex items-start gap-2 text-sm font-bold text-terracota-700">
                  <XCircle size={16} aria-hidden className="mt-0.5 shrink-0" /> {m.mito}
                </p>
                <p className="mt-2 inline-flex items-start gap-2 text-sm leading-relaxed text-tinta/80">
                  <CheckCircle2 size={16} aria-hidden className="mt-0.5 shrink-0 text-verde-700" /> {m.realidad}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="inline-flex items-center gap-2">
            <ShieldCheck size={20} aria-hidden className="text-azul" /> Consejos que sí dependen de ti
          </h2>
          <p>
            Confirma por escrito el precio final, qué incluye el servicio y la política de cancelación antes de pagar.
            Pregunta por el respaldo eléctrico, el agua y el wifi si te importan para tu viaje. Guarda la conversación y
            no envíes dinero a nadie que no sea el anfitrión con el que acordaste la reserva.
          </p>
          <p>
            Si algo va mal, escríbenos con el nombre del negocio y las fechas: revisamos el historial, mediamos con el
            anfitrión y, si detectamos un patrón de fraude, retiramos la ficha del catálogo.
          </p>
        </section>
      </div>

      <p className="legal-note">
        Documento informativo de la plataforma (versión 1.0). La verificación es una revisión de plataforma y no
        sustituye licencias, permisos ni la responsabilidad del proveedor del servicio.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="button-primary" href="/">
          Explorar el catálogo <ArrowRight size={16} />
        </Link>
        <Link className="button-ghost" href="/faq">
          Preguntas frecuentes
        </Link>
        <Link className="button-ghost" href="/contacto">
          Reportar algo
        </Link>
      </div>
    </article>
  );
}
