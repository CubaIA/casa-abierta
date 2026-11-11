import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight } from 'lucide-react';

const SECCIONES: Array<{ titulo: string; parrafos: string[] }> = [
  {
    titulo: 'Quién decide la cancelación',
    parrafos: [
      'Casa Abierta Cuba es una plataforma intermediaria: conecta al viajero con el anfitrión, pero no es la agencia que presta el alojamiento ni el servicio. Por eso la política de cancelación de cada reserva la acuerda el viajero directamente con el anfitrión antes de pagar.',
      'Te pedimos que ese acuerdo quede por escrito —por WhatsApp, correo o en la conversación de la solicitud— indicando la fecha límite para cancelar sin coste y qué parte del pago se devuelve si se cancela después.',
    ],
  },
  {
    titulo: 'Marco recomendado por Casa Abierta',
    parrafos: [
      'Para que ambas partes sepan qué esperar, recomendamos este esquema en alojamientos y experiencias, salvo que el anfitrión proponga otra cosa por escrito:',
      '· Cancelación con 7 días o más de antelación: reembolso del 100% del importe pagado.',
      '· Cancelación entre 7 y 3 días antes de la llegada: reembolso del 50%.',
      '· Cancelación con menos de 72 horas o no presentarse: el anfitrión puede retener el importe, ya que el alojamiento quedó bloqueado.',
      'En servicios puntuales (taxis, guías, experiencias de un día) el plazo habitual es de 48 horas, porque el anfitrión reserva ese hueco para ti.',
    ],
  },
  {
    titulo: 'Circunstancias excepcionales',
    parrafos: [
      'Si la cancelación se debe a una emergencia documentada —enfermedad, un huracán, el cierre del espacio aéreo o una restricción oficial—, recomendamos a los anfitriones ofrecer el cambio de fechas sin coste o la devolución íntegra cuando el servicio no pueda prestarse.',
      'Si el anfitrión cancela, debe avisarte lo antes posible y devolverte el importe correspondiente al servicio no prestado. Si no lo hace, escríbenos desde Contacto y revisaremos el caso con él.',
    ],
  },
  {
    titulo: 'Cambios de fecha',
    parrafos: [
      'Siempre que haya disponibilidad, muchos anfitriones aceptan mover la reserva a otras fechas en lugar de devolver el dinero. Pregúntalo antes de reservar y deja constancia escrita de la nueva fecha acordada.',
    ],
  },
  {
    titulo: 'Cómo pedir una cancelación',
    parrafos: [
      'Escribe al anfitrión por el mismo canal por el que acordaste la reserva y comunícanoslo también desde Contacto para que quede registro en la plataforma. Guarda los mensajes: son la referencia si hay alguna discrepancia.',
      'Casa Abierta no retiene el dinero de la reserva ni puede ejecutar reembolsos por su cuenta, pero sí puede mediar, revisar el historial de la conversación y tomar medidas si un anfitrión incumple lo acordado de forma reiterada.',
    ],
  },
];

/** Página pública de política de cancelación (aislada del resto de la app). */
export default function PoliticaCancelacion() {
  useEffect(() => {
    document.title = 'Política de cancelación | Casa Abierta Cuba';
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content =
        'Cómo se acuerdan las cancelaciones en Casa Abierta Cuba y el marco de reembolso recomendado para viajeros y anfitriones.';
    }
  }, []);

  return (
    <article className="editorial-page page-shell legal-page">
      <div className="section-kicker">CASA ABIERTA · RESERVAS Y CANCELACIONES</div>
      <h1>Política de cancelación</h1>
      <p className="editorial-lead">
        Cada reserva se acuerda con el anfitrión, y esa es la política que vale. Para que nadie improvise, publicamos un
        marco de recomendación claro: reembolso del 100% si cancelas con 7 días o más de antelación.
      </p>

      <div className="legal-sections">
        {SECCIONES.map((s) => (
          <section key={s.titulo}>
            <h2>{s.titulo}</h2>
            {s.parrafos.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </div>

      <p className="legal-note">
        Documento informativo de la plataforma (versión 1.0). El marco de reembolso es una recomendación: la condición
        aplicable es la que acuerdes por escrito con el anfitrión antes de pagar.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="button-primary" href="/">
          Explorar el catálogo <ArrowRight size={16} />
        </Link>
        <Link className="button-ghost" href="/faq">
          Preguntas frecuentes
        </Link>
        <Link className="button-ghost" href="/contacto">
          Contactar al equipo
        </Link>
      </div>
    </article>
  );
}
