import { ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'wouter';
import { SECTIONS } from '@/lib/sections';
import { SectionPage } from '@/components/SectionPage';
import { ConciergeBanner, CONCIERGE_WHATSAPP } from '@/components/ConciergeBanner';

const PASOS = [
  {
    title: 'Cuéntame tu idea',
    body: 'Días de viaje, cuántas personas vienen y qué te apetece hacer. Escríbeme por WhatsApp y lo concretamos.',
  },
  {
    title: 'Recibes la cotización',
    body: 'Te paso una propuesta con casa, taxi, comida y actividades, con los precios por separado.',
  },
  {
    title: 'Ajustamos los detalles',
    body: 'Cambiamos lo que necesites hasta que el plan encaje. La reserva se confirma directamente por WhatsApp.',
  },
];

const INCLUYE = [
  'Alojamiento en casas y habitaciones del catálogo',
  'Traslados del aeropuerto y viajes entre provincias',
  'Paladares, cafeterías y planes gastronómicos',
  'Rutas culturales, música y guías que viven la isla',
];

export default function Concierge() {
  return (
    <SectionPage section={SECTIONS.concierge}>
      <ConciergeBanner />

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-2xl border border-arena-2 bg-white p-5">
          <h2 className="text-lg font-extrabold text-azul">Qué incluye</h2>
          <ul className="mt-2 space-y-2 text-sm text-tinta/70">
            {INCLUYE.map((item) => (
              <li key={item} className="flex gap-2">
                <span aria-hidden className="text-terracota-600">
                  ·
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-arena-2 bg-arena p-5">
          <h2 className="text-lg font-extrabold text-azul">Cómo funciona</h2>
          <ol className="mt-2 space-y-3 text-sm text-tinta/70">
            {PASOS.map((paso, i) => (
              <li key={paso.title}>
                <span className="font-bold text-azul">
                  {i + 1}. {paso.title}
                </span>
                <p className="mt-0.5">{paso.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-arena-2 bg-white p-5">
        <p className="max-w-xl text-sm text-tinta/70">
          El servicio es una gestión de asistencia personalizada. La cotización final y los detalles se acuerdan
          directamente por WhatsApp, fuera de la plataforma.
        </p>
        <a href={CONCIERGE_WHATSAPP} target="_blank" rel="noopener noreferrer" className="button-primary">
          <MessageCircle size={17} aria-hidden /> Escríbeme por WhatsApp
        </a>
      </div>

      <p className="mt-4 text-sm text-tinta/60">
        Casa Abierta es una plataforma intermediaria de conexión: no vende paquetes en nombre propio. Consulta los{' '}
        <Link href="/terms" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
          términos y condiciones
        </Link>
        .{' '}
        <Link href="/contacto" className="inline-flex items-center gap-1 font-semibold text-azul underline decoration-dotted underline-offset-2">
          Contactar al equipo <ArrowRight size={14} aria-hidden />
        </Link>
      </p>
    </SectionPage>
  );
}
