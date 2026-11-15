import { useEffect } from 'react';
import { BadgeCheck, Calendar, Globe2, Handshake, Mail, Users } from 'lucide-react';
import { Link } from 'wouter';

const BLOQUES = [
  {
    id: 'que-es',
    icon: Globe2,
    kicker: 'La plataforma',
    title: '¿Qué es Casa Abierta Cuba?',
    paragraphs: [
      'Casa Abierta Cuba es una plataforma digital de conexión turística que une a los viajeros con proveedores locales de servicios: alojamientos, gastronomía, transporte y guías.',
      'No somos una agencia de viajes ni vendemos paquetes turísticos: mostramos la información de cada proveedor y facilitamos que el viajero contacte directamente con él para confirmar disponibilidad, condiciones y precio.',
    ],
  },
  {
    id: 'verificado',
    icon: BadgeCheck,
    kicker: 'Sello de confianza',
    title: '¿Qué significa «Verificado CA»?',
    paragraphs: [
      'Es un sello que otorgamos tras una revisión manual, persona por persona, de cada proveedor que lo solicita. No es automático ni se compra.',
      'En esa revisión pedimos el carnet de identidad del titular y la licencia de arrendamiento o el documento que corresponda a su actividad (MINTUR, ONAT o CNA). Comprobamos que los datos coinciden con la ficha publicada antes de mostrar el sello.',
      'El sello indica que hemos revisado esa documentación; no sustituye la comprobación que cada viajero quiera hacer por su cuenta.',
    ],
  },
  {
    id: 'quien-hace-que',
    icon: Users,
    kicker: 'Responsabilidades',
    title: '¿Quién hace qué?',
    paragraphs: [
      'Los proveedores —anfitriones, taxis, guías y restaurantes— son quienes prestan el servicio directamente. Ellos fijan sus precios, confirman la disponibilidad y atienden al viajero.',
      'Casa Abierta Cuba actúa únicamente como canal tecnológico: publica la información, conecta a las dos partes y facilita la comunicación. La reserva o contratación final se formaliza directamente entre el turista y el proveedor.',
    ],
  },
];

/**
 * Página de transparencia para turistas y agencias B2B.
 *
 * Explica qué hace la plataforma, qué implica el sello Verificado CA y quién
 * presta cada servicio. Es contenido informativo: no toca catálogo ni paneles.
 */
export default function ComoFunciona() {
  useEffect(() => {
    document.title = 'Cómo funciona | Casa Abierta Cuba';
  }, []);

  return (
    <div className="page-shell max-w-3xl">
      <p className="section-kicker">Transparencia</p>
      <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">Cómo funciona Casa Abierta Cuba</h1>
      <p className="mt-3 text-base text-tinta/80">
        Queremos que sepas con claridad qué hacemos, cómo verificamos a los proveedores y dónde termina nuestro papel.
        La misma información sirve a los viajeros y a las agencias que colaboran con nosotros.
      </p>

      <div className="mt-8 space-y-6">
        {BLOQUES.map((bloque) => {
          const Icon = bloque.icon;
          return (
            <section key={bloque.id} aria-labelledby={bloque.id} className="panel">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-arena text-azul">
                  <Icon size={20} aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracota-600">
                    {bloque.kicker}
                  </p>
                  <h2 id={bloque.id} className="mt-1 text-xl font-extrabold text-azul sm:text-2xl">
                    {bloque.title}
                  </h2>
                </div>
              </div>
              <div className="mt-3 space-y-2 text-sm leading-relaxed text-tinta/80 sm:text-base">
                {bloque.paragraphs.map((texto) => (
                  <p key={texto}>{texto}</p>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <section aria-labelledby="contacto-real" className="panel mt-6">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-arena text-azul">
            <Handshake size={20} aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[0.7rem] font-extrabold uppercase tracking-[0.16em] text-terracota-600">
              Contacto real
            </p>
            <h2 id="contacto-real" className="mt-1 text-xl font-extrabold text-azul sm:text-2xl">
              Hablas con personas, no con un formulario vacío
            </h2>
          </div>
        </div>

        <ul className="mt-3 space-y-2 text-sm text-tinta/80 sm:text-base">
          <li className="flex items-start gap-2">
            <Mail size={16} className="mt-0.5 shrink-0 text-azul" aria-hidden />
            <span>
              Correo de la empresa:{' '}
              <a
                href="mailto:casaabiertacuba@gmail.com"
                className="font-semibold text-azul underline decoration-dotted underline-offset-2"
              >
                casaabiertacuba@gmail.com
              </a>
            </span>
          </li>
          <li>
            <span className="font-semibold text-azul">Fundador:</span> Yoanny Guillén
          </li>
          <li className="flex items-start gap-2 text-xs text-tinta/60 sm:text-sm">
            <Calendar size={15} className="mt-0.5 shrink-0" aria-hidden />
            <span>Última actualización: Noviembre 2026</span>
          </li>
        </ul>

        <p className="mt-3 text-sm text-tinta/70">
          ¿Tienes dudas sobre una ficha o sobre el sello Verificado CA?{' '}
          <Link href="/contacto" className="font-semibold text-azul underline decoration-dotted underline-offset-2">
            Escríbenos
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
