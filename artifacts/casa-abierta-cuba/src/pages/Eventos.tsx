import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowRight, CalendarDays, MapPin } from 'lucide-react';

/**
 * Cartelera cultural: festivales y eventos por provincia.
 *
 * Las fechas se publican como referencia aproximada (varias aún por confirmar):
 * la propia página invita a confirmar con el anfitrión antes de organizar el viaje.
 */

interface Evento {
  nombre: string;
  fecha: string;
  /** Fecha aún no cerrada por los organizadores. */
  porConfirmar?: boolean;
}

interface Provincia {
  nombre: string;
  eventos: Evento[];
}

const PROVINCIAS: Provincia[] = [
  {
    nombre: 'Pinar del Río',
    eventos: [
      { nombre: 'Festival «Nosotros»', fecha: 'Aprox. 26 de noviembre' },
      { nombre: 'Viñales, valle vivo', fecha: '1 de diciembre' },
    ],
  },
  {
    nombre: 'La Habana',
    eventos: [
      { nombre: 'Festival Internacional del Nuevo Cine Latinoamericano', fecha: '3 al 13 de diciembre' },
      { nombre: 'IV Bienal de Arquitectura', fecha: '15 al 20 de noviembre' },
    ],
  },
  {
    nombre: 'Matanzas (Varadero)',
    eventos: [
      { nombre: 'Festival Kike Morúa', fecha: '3 al 6 de diciembre' },
      { nombre: 'El Cayotonazo', fecha: '31 de diciembre al 3 de enero' },
    ],
  },
  {
    nombre: 'Villa Clara',
    eventos: [{ nombre: 'Parrandas de Remedios', fecha: 'Noche grande: 24 de diciembre' }],
  },
  {
    nombre: 'Sancti Spíritus (Trinidad)',
    eventos: [
      {
        nombre: 'Evento Internacional Canchánchara, Tradición y Cultura',
        fecha: '8 al 10 de diciembre',
        porConfirmar: true,
      },
    ],
  },
  {
    nombre: 'Camagüey',
    eventos: [
      { nombre: 'Jornada Campesina Guateque de la Llanura', fecha: 'Diciembre', porConfirmar: true },
    ],
  },
  {
    nombre: 'Santiago de Cuba',
    eventos: [
      { nombre: 'Festival Internacional de Coros', fecha: 'Noviembre', porConfirmar: true },
    ],
  },
];

export default function Eventos() {
  useEffect(() => {
    document.title = 'Cartelera Cultural en Cuba (Noviembre - Diciembre 2026) | Casa Abierta Cuba';
  }, []);

  return (
    <div className="min-h-[70vh] bg-crema text-tinta">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-14">
        <span className="inline-flex items-center gap-2 rounded-full bg-terracota/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-terracota-700">
          <CalendarDays size={15} aria-hidden />
          Eventos
        </span>

        <h1 className="mt-4 text-2xl font-extrabold leading-tight text-azul sm:text-4xl">
          Cartelera Cultural en Cuba (Noviembre - Diciembre 2026)
        </h1>

        <p className="mt-3 max-w-3xl text-base leading-relaxed text-tinta/75 sm:text-lg">
          Descubre los festivales y eventos que se celebran en la isla. Recomendamos confirmar las fechas exactas
          con su anfitrión.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {PROVINCIAS.map((provincia) => (
            <section
              key={provincia.nombre}
              className="rounded-2xl border border-arena-2 bg-white p-5 shadow-sm"
            >
              <h2 className="flex items-center gap-2 text-base font-extrabold text-azul">
                <MapPin size={16} aria-hidden className="shrink-0 text-terracota" />
                {provincia.nombre}
              </h2>

              <ul className="mt-3 space-y-3">
                {provincia.eventos.map((evento) => (
                  <li key={evento.nombre} className="border-l-2 border-arena-2 pl-3">
                    <p className="text-sm font-semibold leading-snug text-tinta">{evento.nombre}</p>
                    <p className="mt-0.5 text-sm text-tinta/65">
                      {evento.fecha}
                      {evento.porConfirmar ? (
                        <span className="ml-1 font-semibold text-terracota-700">· fecha por confirmar</span>
                      ) : null}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-3xl bg-azul p-6 text-center sm:p-10">
          <p className="text-lg font-bold text-white sm:text-xl">¿Listo para vivir la cultura cubana?</p>
          <p className="mt-1 text-sm text-white/75">
            Encuentra anfitriones verificados cerca de cada evento.
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-extrabold text-azul shadow-lg transition hover:bg-arena sm:w-auto"
          >
            Encuentra tu alojamiento en Cuba
            <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
