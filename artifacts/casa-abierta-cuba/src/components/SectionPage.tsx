import { useEffect, type ReactNode } from 'react';
import { Link } from 'wouter';
import { ChevronRight } from 'lucide-react';
import type { SectionDef } from '@/lib/sections';
import { sectionCountLabel } from '@/lib/sections';

interface SectionPageProps {
  section: SectionDef;
  /** Total de resultados de la sección; null mientras se carga. */
  count?: number | null;
  children: ReactNode;
}

/**
 * Cascarón común de las secciones: cabecera con foto, miga de pan y cuerpo.
 * No conoce datos ni filtros; cada página decide qué bloques coloca dentro.
 */
export function SectionPage({ section, count = null, children }: SectionPageProps) {
  const Icon = section.icon;

  useEffect(() => {
    document.title = `${section.title} | Casa Abierta Cuba`;
  }, [section.title]);

  return (
    <div>
      <header className={`relative isolate overflow-hidden text-white ${section.image ? 'bg-azul-700' : 'bg-azul'}`}>
        {section.image && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-cover bg-center"
              style={{ backgroundImage: `url('${section.image}')` }}
            />
            <div aria-hidden className="absolute inset-0 -z-10 bg-black/55" />
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-gradient-to-b from-azul-700/85 via-azul-700/45 to-azul-700/95"
            />
          </>
        )}

        <div className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:pb-12 sm:pt-10">
          <nav aria-label="Ruta" className="flex items-center gap-1 text-xs font-semibold text-azul-200">
            <Link href="/" className="rounded transition hover:text-white">
              Inicio
            </Link>
            <ChevronRight size={13} aria-hidden />
            <span className="text-white" aria-current="page">
              {section.title}
            </span>
          </nav>

          <div className="mt-5 flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white/15 ring-1 ring-white/30">
              <Icon size={22} aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.18em] text-dorado">
                {section.kicker}
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
                {section.title}
              </h1>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">{section.subtitle}</p>

          {count !== null && (
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-dorado">
              {sectionCountLabel(count)}
            </p>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">{children}</div>
    </div>
  );
}
