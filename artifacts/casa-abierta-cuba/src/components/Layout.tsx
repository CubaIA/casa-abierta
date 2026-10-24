import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  Sparkles,
  Bot,
  Briefcase,
  Compass,
  Facebook,
  Globe,
  Heart,
  Instagram,
  LogOut,
  Menu,
  MessageCircle,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  X,
} from 'lucide-react';
import { useAuth, demoMode } from '@/lib/auth';
import { useTranslation } from 'react-i18next';
import { LanguageSelect } from './LanguageSelect';
import { CurrencySelect } from './CurrencySelect';
import { EmergencyButton } from './EmergencyButton';
import { SocialsCasaAbierta } from './AdminLayout';
import { NAV_SECTIONS } from '@/lib/sections';

const NAV = [
  { href: '/', key: 'explore', icon: Compass },
  { href: '/solicitudes', key: 'my_requests', icon: MessageSquare, auth: true },
  { href: '/favoritos', key: 'favorites', icon: Heart, auth: true },
  { href: '/anfitrion', key: 'host', icon: User, roles: ['provider', 'admin'] },
  { href: '/admin', key: 'admin', icon: ShieldCheck, roles: ['admin'] },
  { href: '/contacto', key: 'contact', icon: MessageSquare },
  { href: '/chat', key: 'chat_ia', icon: Bot, auth: true },
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

  /* El menú lateral se cierra al navegar y bloquea el scroll de la página
   * mientras está abierto (además de cerrarse con Escape). */
  useEffect(() => setOpen(false), [location]);

  useEffect(() => {
    if (!open) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', alPulsar);
    return () => {
      document.body.style.overflow = previo;
      window.removeEventListener('keydown', alPulsar);
    };
  }, [open]);

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-2">
        {t('nav.skip')}
      </a>


      {/* En la portada la cabecera se funde con la foto: sin sombra que marque corte. */}
      <header
        className={`bg-azul text-white sticky top-0 z-40 ${location === '/' ? '' : 'shadow-md'}`}
      >
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 shrink-0 items-center" aria-label="Casa Abierta Cuba — inicio">
            {/* El logo oficial ya incluye el nombre, no se repite en HTML. */}
            <img
              src="/img/logo-oficial.png"
              alt="Casa Abierta Cuba"
              width={56}
              height={56}
              className="h-12 w-12 max-w-[50px] shrink-0 rounded-full object-contain md:h-14 md:w-14 md:max-w-[60px]"
              decoding="async"
            />
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

      </header>

      {/* ---------------------------------------------------------- */}
      {/* Menú lateral móvil: todas las secciones + cuenta            */}
      {/* ---------------------------------------------------------- */}
      {open && (
        <div
          className="fixed inset-0 z-[60] flex justify-end md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
        >
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <aside className="relative flex h-full w-[86%] max-w-sm flex-col overflow-y-auto bg-azul text-white shadow-2xl">
            <div className="flex items-center justify-between gap-3 border-b border-azul-700 px-4 py-3">
              <Link href="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center gap-2">
                <img
                  src="/img/logo-oficial.png"
                  alt=""
                  aria-hidden
                  width={40}
                  height={40}
                  className="h-10 w-10 shrink-0 rounded-full object-contain"
                  decoding="async"
                />
                <span className="truncate text-sm font-extrabold">Casa Abierta Cuba</span>
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="shrink-0 rounded-full p-2 hover:bg-azul-700"
              >
                <X size={20} aria-hidden />
              </button>
            </div>

            <nav aria-label="Secciones" className="px-3 pb-1 pt-4">
              <p className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-dorado">
                Secciones
              </p>
              <ul>
                {NAV_SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const activo = location === section.path;
                  return (
                    <li key={section.path}>
                      <Link
                        href={section.path}
                        onClick={() => setOpen(false)}
                        aria-current={activo ? 'page' : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                          activo ? 'bg-white text-azul' : 'text-azul-200 hover:bg-azul-700 hover:text-white'
                        }`}
                      >
                        <Icon size={18} aria-hidden className={activo ? 'text-terracota-600' : 'text-dorado'} />
                        {section.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <nav aria-label="Mi cuenta" className="mt-2 border-t border-azul-700 px-3 pb-1 pt-3">
              <p className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-dorado">
                Mi cuenta
              </p>
              <ul>
                {visibleNav
                  .filter((item) => item.href !== '/')
                  .map((item) => {
                    const Icon = item.icon;
                    const activo = location === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setOpen(false)}
                          aria-current={activo ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold ${
                            activo ? 'bg-white text-azul' : 'text-azul-200 hover:bg-azul-700 hover:text-white'
                          }`}
                        >
                          <Icon size={18} aria-hidden className={activo ? 'text-terracota-600' : 'text-dorado'} />
                          {t(item.key)}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </nav>

            <div className="mt-auto flex flex-col gap-3 border-t border-azul-700 px-4 py-4">
              <div className="flex items-center gap-2">
                <LanguageSelect />
                <CurrencySelect
                  onChange={(v) => {
                    try {
                      localStorage.setItem('casa_currency', v);
                    } catch {}
                  }}
                />
              </div>
              {userId ? (
                <button
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-terracota-600 px-3 py-2 text-sm font-bold hover:bg-terracota-700"
                >
                  <LogOut size={14} aria-hidden /> {t('nav.logout')}
                </button>
              ) : (
                <Link
                  href="/entrar"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center gap-1 rounded-full bg-dorado px-3 py-2 text-sm font-bold text-azul-700 hover:brightness-95"
                >
                  <User size={14} aria-hidden /> {t('nav.login')}
                </Link>
              )}
            </div>
          </aside>
        </div>
      )}

      <main id="contenido" className="flex-1 pb-[76px] md:pb-0">
        {children}
      </main>

      <EmergencyButton />
      <Footer />
      <BottomNav />
      {userId && !loading && <ChatIaFab />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Botón rápido de IA siempre visible para usuarios autenticados       */
/* ------------------------------------------------------------------ */
function ChatIaFab() {
  return (
    <Link
      href="/chat"
      className="fixed bottom-20 right-4 z-50 h-14 w-14 shrink-0 grid place-items-center rounded-full bg-azul shadow-xl ring-2 ring-white/80 transition hover:bg-azul-700 hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      aria-label="Preguntar a Cuba Conecta IA"
    >
      <Sparkles size={24} className="text-dorado" aria-hidden />
      <span className="sr-only">Chat IA</span>
    </Link>
  );
}
/* ------------------------------------------------------------------ */
/* Menú de navegación inferior (solo móvil, estilo Airbnb)             */
/* ------------------------------------------------------------------ */
const BOTTOM_NAV = [
  { href: '/', label: 'Explora', icon: Search },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
  { href: '/solicitudes', label: 'Viajes', icon: Briefcase },
  { href: '/contacto', label: 'Mensajes', icon: MessageCircle },
  { href: '/perfil', label: 'Perfil', icon: User },
];

function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-arena-2 bg-white/95 backdrop-blur md:hidden"
      aria-label="Navegación inferior"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] pt-1">
        {BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const activo = item.href === '/' ? location === '/' : location.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={activo ? 'page' : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                  activo ? 'text-terracota-600' : 'text-tinta/55 hover:text-azul'
                }`}
              >
                <Icon size={21} strokeWidth={activo ? 2.4 : 1.9} aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-16 bg-azul-700 text-azul-200">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <div className="flex items-center gap-2.5 font-extrabold text-white text-lg">
            <img
              src="/img/logo-oficial.png"
              alt="Casa Abierta Cuba"
              width={64}
              height={64}
              className="h-16 w-16 max-w-[64px] shrink-0 rounded-full object-contain"
              loading="lazy"
              decoding="async"
            />
            <span>
              Casa Abierta Cuba
              <span className="block text-[11px] font-medium text-azul-200">Una puerta abierta al mundo</span>
            </span>
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
          <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3">Redes</h3>
          <ul className="space-y-2 text-sm">
            <li className="text-white font-semibold">CEO y Creador: Yoanny Guillén Vargas</li>
            <li>Técnico en Programación, Control y Supervisión de Operaciones Turísticas; Diseñador de Aplicaciones de Servicios.</li>
          </ul>
          <p className="mt-3 text-xs text-azul-200 flex flex-wrap gap-1 items-center">
            <span className="font-semibold text-white">Sígueme en redes:</span>
            <a href="https://instagram.com/mirry.93" target="_blank" rel="noopener noreferrer" className="text-dorado hover:text-white underline decoration-dotted underline-offset-2">@mirry.93</a>
          </p>
          <p className="mt-3 text-xs font-semibold text-white">Casa Abierta Cuba — @casaabiertacuba</p>
          <div className="mt-1.5">
            <SocialsCasaAbierta />
          </div>
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
          <span className="ml-2">Hecho con 🇨🇺 por @mirry.93</span>
        </div>
      </div>
    </footer>
  );
}

