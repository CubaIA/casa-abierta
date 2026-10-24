import { Plane } from 'lucide-react';

/** Enlace de WhatsApp del servicio Concierge (mismo número y mensaje que la portada). */
export const CONCIERGE_WHATSAPP =
  'https://wa.me/+5356289645?text=Hola,%20quiero%20que%20me%20ayudes%20a%20planificar%20un%20paquete%20de%20viaje%20a%20Cuba%20a%20tu%20medida%20con%20Casa%20Abierta%20Cuba';

/** Banner "Diseña tu Viaje a Medida", ahora dentro de la sección Concierge. */
export function ConciergeBanner() {
  return (
    <a
      href={CONCIERGE_WHATSAPP}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-2xl shadow-lg ring-1 ring-white/20 transition duration-300 hover:scale-[1.01]"
      style={{
        backgroundImage: `url('/img/concierge-bg.jpg')`,
        minHeight: 'clamp(16rem, 30vh, 22rem)',
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
      <div className="relative mx-auto flex max-w-2xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
        <div className="shrink-0">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-yellow-500/20 text-yellow-500">
            <Plane size={24} aria-hidden />
          </div>
        </div>
        <div className="min-w-0">
          <p className="section-kicker text-yellow-500">Concierge Casa Abierta</p>
          <h2 className="text-xl font-extrabold sm:text-2xl">
            <span className="inline-block align-middle text-yellow-500">✈️ Diseña tu Viaje a Medida</span>
          </h2>
          <p className="mt-1 max-w-xl text-sm text-yellow-500/90">
            Días, personas, casa, taxi, comida… cuéntame tu idea y te cotizo el paquete completo por WhatsApp.
          </p>
        </div>
        <div className="shrink-0 sm:mt-0">
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/60 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-yellow-500 shadow-sm">
            <span className="text-base leading-none" aria-hidden="true">
              💬
            </span>{' '}
            WhatsApp directo
          </span>
        </div>
      </div>
    </a>
  );
}
