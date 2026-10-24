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
      <div className="grid gap-4 sm:grid-cols-2">
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
        Documentos informativos de la Plataforma en vivo (Versión 1.0). Casa Abierta revisa periódicamente estos textos
        con asesoría legal adecuada a sus actividades y jurisdicciones.
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
