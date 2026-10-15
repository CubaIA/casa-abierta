import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Compass, Heart, LogOut, Menu, MessageSquare, ShieldCheck, User, X } from 'lucide-react';
import { useAuth, demoMode } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from './LanguageSelect';
import { CurrencySelect } from './CurrencySelect';
import { EmergencyButton } from './EmergencyButton';

const NAV = [
  { href: '/', key: 'explore', icon: Compass },
  { href: '/solicitudes', key: 'my_requests', icon: MessageSquare, auth: true },
  { href: '/favoritos', key: 'favorites', icon: Heart, auth: true },
  { href: '/anfitrion', key: 'host', icon: User, roles: ['provider', 'admin'] },
  { href: '/admin', key: 'admin', icon: ShieldCheck, roles: ['admin'] },
  { href: '/contacto', key: 'contact', icon: MessageSquare },
];

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const { userId, profile, signOut, loading } = useAuth();
  const { t } = useTranslation();

  const visibleNav = NAV.filter((item) => {
    if (item.auth && !userId) return false;
    if (item.roles && !item.roles.includes(profile?.role ?? '')) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        {t('nav.skip')}
      </a>


      <header className="bg-azul text-white sticky top-0 z-40 shadow-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 font-extrabold text-lg tracking-tight">
            <img src="/icons/logo-completo.png" alt="Casa Abierta Cuba" className="h-8 w-auto object-contain" onError={(e) => {
              const target = e.currentTarget as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }} />
            <span className="flex items-center gap-2" style={{ display: 'none' }}>
              <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-terracota-600 text-sm">CA</span>
              <span>
                Casa <span className="text-dorado">Abierta</span>
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                  location === item.href ? 'bg-white text-azul' : 'text-azul-200 hover:bg-azul-700 hover:text-white'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <LanguageSelect />
            <CurrencySelect onChange={(v) => { try { localStorage.setItem('casa_currency', v); } catch {} }} />
            {!loading && (userId ? (
              <button
                onClick={() => void signOut()}
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-terracota-600 px-3 py-1.5 text-sm font-bold hover:bg-terracota-700"
              >
                <LogOut size={14} /> {t('nav.logout')}
              </button>
            ) : (
              <Link
                href="/entrar"
                className="ml-2 inline-flex items-center gap-1 rounded-full bg-dorado px-3.5 py-1.5 text-sm font-bold text-azul-700 hover:brightness-95"
              >
                <User size={14} /> {t('nav.login')}
              </Link>
            ))}
          </nav>

          <button
            className="md:hidden rounded-md p-2 hover:bg-azul-700"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden border-t border-azul-700 px-4 py-2 flex flex-col gap-1" aria-label="Móvil">
            {visibleNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                  location === item.href ? 'bg-white text-azul' : 'text-azul-200 hover:bg-azul-700'
                }`}
              >
                {t(item.key)}
              </Link>
            ))}
            <div className="px-3 py-2 flex flex-col gap-2">
              <LanguageSelect />
              <CurrencySelect onChange={(v) => { try { localStorage.setItem('casa_currency', v); } catch {} }} />
            </div>
            {userId ? (
              <button
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                className="rounded-lg bg-terracota-600 px-3 py-2 text-left text-sm font-bold"
              >
                {t('nav.logout')}
              </button>
            ) : (
              <Link
                href="/entrar"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-dorado px-3 py-2 text-sm font-bold text-azul-700"
              >
                {t('nav.login')}
              </Link>
            )}
          </nav>
        )}
      </header>

      {demoMode && (
        <div className="bg-dorado text-azul-700 text-center text-xs font-bold px-3 py-1.5" role="status">
          Modo demostración: datos de ejemplo en este navegador. Configura VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY para conectar el backend real.
        </div>
      )}

      <main id="contenido" className="flex-1">
        {children}
      </main>

      <EmergencyButton />
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-azul-700 text-azul-200">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-white text-lg">
            <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-terracota-600 text-sm">CA</span>
            Casa Abierta
          </div>
          <p className="mt-3 text-sm leading-relaxed">
            Plataforma intermediaria digital de conexión turística con Cuba auténtica: alojamientos, gastronomía,
            experiencias y servicios locales verificados.
          </p>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Explorar</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-white">Catálogo</Link></li>
            <li><Link href="/providers" className="hover:text-white">Normas para proveedores</Link></li>
            <li><Link href="/anfitrion" className="hover:text-white">Publicar mi negocio</Link></li>
            <li><Link href="/contacto" className="hover:text-white">Contacto</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Confianza</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">Sobre el proyecto</Link></li>
            <li><Link href="/antifraud" className="hover:text-white">Política antifraude</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacidad</Link></li>
            <li><Link href="/terms" className="hover:text-white">Términos</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Créditos</h3>
          <ul className="space-y-2 text-sm">
            <li className="text-white font-semibold">CEO y Creador: Yoanny Guillén Vargas</li>
            <li>Técnico en Programación, Control y Supervisión de Operaciones Turísticas; Diseñador de Aplicaciones de Servicios.</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-azul">
        <div className="mx-auto max-w-6xl px-4 py-4 text-xs flex flex-wrap items-center justify-center gap-2">
          <span>© 2026 Casa Abierta Cuba. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  );
}
