import type { ComponentType, ReactNode } from 'react';
import { Link } from 'wouter';
import { Facebook, Globe, Instagram, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';

/** Glifo TikTok (lucide no incluye marcas; SVG propio en `currentColor`). */
export function TikTokGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M16.6 3c.4 2.2 1.7 3.6 3.9 3.8v2.7c-1.5.1-2.8-.3-3.9-1.1v5.9c0 3.3-2.5 5.9-5.7 5.9S5.2 17.6 5.2 14.3c0-3.1 2.4-5.7 5.5-5.9v2.8c-1.6.2-2.8 1.5-2.8 3.1 0 1.8 1.3 3.2 3 3.2s3-1.4 3-3.2V3h2.7z" />
    </svg>
  );
}

/** Redes oficiales de Casa Abierta Cuba (@casaabiertacuba). */
export function SocialsCasaAbierta({ tone = 'gold' }: { tone?: 'gold' | 'light' }) {
  const color = tone === 'gold' ? 'text-dorado hover:text-white' : 'text-azul-200 hover:text-white';
  const items = [
    { href: 'https://www.facebook.com/casaabiertacuba', label: 'Casa Abierta Cuba en Facebook (@casaabiertacuba)', node: <Facebook size={18} aria-hidden /> },
    { href: 'https://www.instagram.com/casaabiertacuba', label: 'Casa Abierta Cuba en Instagram (@casaabiertacuba)', node: <Instagram size={18} aria-hidden /> },
    { href: 'https://www.tiktok.com/@casaabiertacuba', label: 'Casa Abierta Cuba en TikTok (@casaabiertacuba)', node: <TikTokGlyph size={18} /> },
    { href: 'https://casaabiertacuba.com', label: 'Sitio web oficial de Casa Abierta Cuba', node: <Globe size={18} aria-hidden /> },
  ];
  return (
    <ul className="flex flex-wrap items-center gap-3" aria-label="Redes sociales de Casa Abierta Cuba">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title="@casaabiertacuba"
            className={`inline-flex ${color} transition`}
          >
            {item.node}
          </a>
        </li>
      ))}
    </ul>
  );
}

export interface AdminTabItem {
  key: string;
  label: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
}

/**
 * Shell del panel de administración: visualmente distinto a la app pública
 * (fondo oscuro, sidebar exclusiva y encabezado dorado) para que nunca se
 * confunda con la vista de turista.
 */
export function AdminLayout({
  items,
  active,
  onSelect,
  children,
}: {
  items: AdminTabItem[];
  active: string;
  onSelect: (key: string) => void;
  children: ReactNode;
}) {
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100">
      <header className="sticky top-0 z-30 border-b border-dorado/40 bg-[#11161d]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <img src="/img/isotipo.svg" alt="" width={36} height={36} className="h-9 w-9 shrink-0" />
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-wide text-dorado sm:text-base">
                Panel de Administración | Casa Abierta
              </p>
              <p className="text-[11px] text-gray-400">Zona exclusiva de administradores</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-gray-600 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
            >
              Ver sitio público
            </Link>
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-1 rounded-full bg-terracota-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-terracota-700"
            >
              <LogOut size={13} aria-hidden /> Salir
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row">
        <aside className="md:w-60 md:shrink-0">
          <nav className="flex flex-row flex-wrap gap-2 md:flex-col" aria-label="Secciones de administración">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSelect(item.key)}
                  aria-current={active === item.key ? 'page' : undefined}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    active === item.key
                      ? 'bg-dorado text-azul-700'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-6 rounded-2xl border border-gray-700/80 bg-[#151b24] p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Casa Abierta Cuba en redes</p>
            <p className="mt-1 text-xs text-gray-300">@casaabiertacuba</p>
            <div className="mt-2">
              <SocialsCasaAbierta />
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 rounded-2xl border border-gray-700/80 bg-[#151b24] p-5">{children}</main>
      </div>
    </div>
  );
}
