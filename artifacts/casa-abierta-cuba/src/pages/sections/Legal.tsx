import { Link } from 'wouter';
import { ArrowRight, BadgeCheck, FileText, Lock, Scale, ShieldCheck } from 'lucide-react';
import { SECTIONS } from '@/lib/sections';
import { SectionPage } from '@/components/SectionPage';

const DOCUMENTOS = [
  {
    href: '/about',
    title: 'Sobre el proyecto',
    body: 'Quién está detrás de Casa Abierta Cuba y cómo entendemos la conexión turística.',
    icon: BadgeCheck,
  },
  {
    href: '/terms',
    title: 'Términos y condiciones',
    body: 'Naturaleza del servicio, responsabilidades del anfitrión, pagos y conducta prohibida.',
    icon: Scale,
  },
  {
    href: '/privacy',
    title: 'Política de privacidad',
    body: 'Qué datos tratamos, con qué base legal y cómo ejercer tus derechos (Ley 149 de 2022).',
    icon: Lock,
  },
  {
    href: '/providers',
    title: 'Normas para proveedores',
    body: 'Qué pedimos a anfitriones, guías y choferes antes de publicar su propuesta.',
    icon: FileText,
  },
  {
    href: '/antifraud',
    title: 'Política antifraude',
    body: 'Señales que investigamos, cómo reportar y qué límites tiene nuestra revisión.',
    icon: ShieldCheck,
  },
];

export default function Legal() {
  return (
    <SectionPage section={SECTIONS.legal}>
      <section aria-labelledby="aviso-legal" className="max-w-3xl">
        <h2 id="aviso-legal" className="text-2xl font-extrabold text-azul sm:text-3xl">
          Aviso Legal y Marco Regulatorio
        </h2>
        <div className="mt-3 space-y-3 text-sm leading-relaxed text-tinta/80 sm:text-base">
          <p>
            Casa Abierta Cuba es una plataforma digital de intermediación y conexión tecnológica. Nuestra función
            principal es facilitar el contacto directo entre los viajeros internacionales y los proveedores de
            servicios turísticos locales (alojamientos, gastronomía, transporte y guías).
          </p>
          <p>
            En cumplimiento con las regulaciones del Ministerio de Turismo de la República de Cuba (MINTUR), Casa
            Abierta Cuba no opera como una agencia de viajes tradicional ni vende paquetes turísticos en nombre propio.
          </p>
          <p>
            Nuestro modelo se alinea con los servicios de representación y facilitación que estipula la normativa
            vigente, ofreciendo a las agencias internacionales y tour operadores (DMCs) un canal tecnológico para:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Gestionar la visibilidad de los proveedores locales verificados.</li>
            <li>Facilitar la comunicación y el filtrado de clientes (Leads).</li>
            <li>Coordinar servicios de transporte y reservas a través de nuestros Perfiles Máster (socios locales).</li>
          </ul>
          <p>
            Toda reserva o contratación final se formaliza directamente entre el turista y el proveedor del servicio,
            o mediante los acuerdos B2B establecidos con nuestros socios operativos en el territorio nacional.
          </p>
        </div>
      </section>

      <h2 className="mt-8 text-lg font-extrabold text-azul">Documentos legales</h2>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {DOCUMENTOS.map((doc) => {
          const Icon = doc.icon;
          return (
            <Link
              key={doc.href}
              href={doc.href}
              className="group rounded-2xl border border-arena-2 bg-white p-5 transition hover:border-azul/30 hover:shadow-sm"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-arena text-azul">
                <Icon size={19} aria-hidden />
              </span>
              <h2 className="mt-3 text-base font-extrabold text-azul group-hover:underline">{doc.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-tinta/70">{doc.body}</p>
              <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-azul">
                Leer <ArrowRight size={15} aria-hidden />
              </span>
            </Link>
          );
        })}
      </div>

      <p className="legal-note">
        Documentos informativos de la plataforma (versión 1.0). Casa Abierta revisa periódicamente estos textos
        con asesoría legal adecuada a sus actividades y a las jurisdicciones en las que opera.
      </p>

      <p className="mt-4 text-sm text-tinta/60">
        ¿Necesitas aclarar algo?{' '}
        <Link href="/contacto" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
          Escríbenos
        </Link>
        .
      </p>
    </SectionPage>
  );
}
