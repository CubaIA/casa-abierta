import { useEffect } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, BadgeCheck } from 'lucide-react';

/**
 * Página de transparencia del sello «Verificado CA».
 *
 * Explica de forma honesta qué revisa Casa Abierta Cuba antes de otorgar el
 * sello y, sobre todo, qué NO revisa: no es una certificación gubernamental ni
 * un aval de calidad, seguridad o precio del servicio.
 */

const REQUISITOS = [
  'Comprobación de identidad (Documento de Identidad).',
  'Verificación del número de WhatsApp.',
  'Revisión documental: Solicitamos la foto de la licencia legal (MINTUR, ONAT o CNA) para confirmar que opera dentro del marco legal cubano.',
  'Coincidencia de datos: El nombre del titular de la licencia debe coincidir con el del perfil.',
];

export default function Verificacion() {
  useEffect(() => {
    document.title = '¿Qué significa el sello Verificado CA? | Casa Abierta Cuba';
  }, []);

  return (
    <div className="min-h-[70vh] bg-crema text-tinta">
      <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
        <div className="rounded-3xl border border-arena-2 bg-white p-6 shadow-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-verde-600/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-verde-700">
            <BadgeCheck size={15} aria-hidden />
            Transparencia
          </span>

          <h1 className="mt-4 text-2xl font-extrabold leading-tight text-azul sm:text-3xl">
            ¿Qué significa el sello Verificado CA?
          </h1>

          <p className="mt-4 text-base leading-relaxed text-tinta/80">
            En Casa Abierta Cuba, la confianza es nuestra prioridad. El sello «Verificado CA» no es una
            certificación gubernamental, sino nuestra garantía de que hemos realizado una revisión básica del
            proveedor. Para obtenerlo, el anfitrión debe cumplir con:
          </p>

          <ul className="mt-5 space-y-3">
            {REQUISITOS.map((requisito) => (
              <li key={requisito} className="flex gap-3 rounded-2xl bg-crema/70 p-4">
                <span
                  aria-hidden
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-verde-600 text-[11px] font-extrabold text-white"
                >
                  ✓
                </span>
                <span className="text-sm leading-relaxed text-tinta/85 sm:text-base">{requisito}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 rounded-2xl border-l-4 border-dorado bg-arena/30 p-4">
            <p className="text-sm leading-relaxed text-tinta/80 sm:text-base">
              <strong className="font-extrabold text-azul">Nota:</strong> No verificamos la calidad del servicio,
              la seguridad física de la propiedad ni los precios; esos acuerdos son responsabilidad directa del
              viajero y el anfitrión.
            </p>
          </div>

          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-azul px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-azul-700"
            >
              <ArrowLeft size={16} aria-hidden />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
