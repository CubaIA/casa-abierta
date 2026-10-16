/** Capa de datos de Casa Abierta.
 *
 * Con Supabase configurado usa PostgREST + RPCs (RLS es la frontera).
 * Sin credenciales, un almacén local en localStorage replica los flujos
 * con datos de ejemplo para que la demo sea navegable.
 */
import { isSupabaseConfigured } from './env';
import { BUSINESS_AUTH_COLS, BUSINESS_PUBLIC_COLS, REQUEST_COLS, supabase } from './supabase';
import type {
  AccountStatus,
  Business,
  BusinessRow,
  BusinessStatus,
  Category,
  ContactMessage,
  ContactStatus,
  Profile,
  Report,
  ReportStatus,
  RequestStatus,
  Review,
  Role,
  SubmitBusinessInput,
} from './types';

const DEMO_KEY = 'casa_abierta_demo_v1';
const SESSION_KEY = 'casa_abierta_session_v1';

export const isDemo = !isSupabaseConfigured;

interface DemoStore {
  businesses: Business[];
  requests: BusinessRow[];
  favorites: Array<{ user_id: string; business_id: string }>;
  reviews: Review[];
  reports: Report[];
  messages: ContactMessage[];
}

const demoUuid = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const part = (n: number) => (h + n).toString(16).padStart(8, '0');
  return `${part(1)}-${part(2)}-4${part(3).slice(1)}-a${part(4).slice(1)}-${part(5)}${part(6)}`.slice(0, 36);
};

export const DEMO_USERS: Array<Profile & { password: string }> = [
  {
    id: demoUuid('viajero'),
    email: 'viajero@casa.cu',
    password: 'demo1234',
    full_name: 'Ana Viajera',
    phone: null,
    role: 'traveler',
    account_status: 'active',
    country: 'México',
    preferred_language: 'español',
    trip_style: 'Cultural',
    budget_band: 'Moderado',
    created_at: new Date().toISOString(),
  },
  {
    id: demoUuid('proveedor'),
    email: 'proveedor@casa.cu',
    password: 'demo1234',
    full_name: 'María Pérez',
    phone: '+5355559876',
    role: 'provider',
    account_status: 'active',
    country: 'Cuba',
    preferred_language: 'español',
    trip_style: null,
    budget_band: null,
    created_at: new Date().toISOString(),
  },
  {
    id: demoUuid('admin'),
    email: 'admin@casa.cu',
    password: 'demo1234',
    full_name: 'Admin Casa Abierta',
    phone: null,
    role: 'admin',
    account_status: 'active',
    country: 'Cuba',
    preferred_language: 'español',
    trip_style: null,
    budget_band: null,
    created_at: new Date().toISOString(),
  },
];

const DEMO_BUSINESSES: Business[] = [
  {
    id: demoUuid('casa-mar'),
    owner_id: demoUuid('proveedor'),
    name: 'Casa junto al Mar',
    host_name: 'María Pérez',
    description: 'Habitaciones luminosas a dos cuadras de la playa, con desayuno casero y terraza para ver el atardecer sobre el mar.',
    host_story: 'Recibo viajeros en mi familia desde hace doce años; mi casa es el primer abrazo cubano que muchos visitantes conocen.',
    service_type: 'alojamiento',
    category: 'alojamiento',
    tourism_category: 'alojamiento',
    province: 'Matanzas',
    municipality: 'Cárdenas',
    photos: [],
    languages: ['español', 'inglés'],
    experience_details: 'Terraza con hamacas, cena casera opcional y paseos en bicicleta por el malecón.',
    recommended_for: ['parejas', 'familias'],
    lgbt_friendly: true,
    status: 'approved',
    created_at: '2026-09-10T10:00:00Z',
  },
  {
    id: demoUuid('sabor-habana'),
    owner_id: demoUuid('proveedor'),
    name: 'Mesa Habanera',
    host_name: 'Carlos Domínguez',
    description: 'Cocina de paladar con platos criollos tradicionales y música en vivo los viernes por la noche.',
    host_story: 'Mi abuela me enseñó que una mesa bien puesta es la mejor manera de conocer una isla.',
    service_type: 'gastronomia',
    category: 'servicios',
    tourism_category: 'gastronomia',
    province: 'La Habana',
    municipality: 'La Habana Vieja',
    photos: [],
    languages: ['español', 'francés'],
    experience_details: 'Menú degustación de cinco platos, clase corta de cocina criolla y sobremesa con son montuno.',
    recommended_for: ['parejas', 'grupos'],
    lgbt_friendly: true,
    status: 'approved',
    created_at: '2026-09-12T10:00:00Z',
  },
  {
    id: demoUuid('vinales-ruta'),
    owner_id: demoUuid('proveedor'),
    name: 'Rutas a Caballo por Viñales',
    host_name: 'Yanet Rodríguez',
    description: 'Cabalgatas guiadas entre mogotes, fincas de tabaco y miradores con el valle al amanecer.',
    host_story: 'Crecí entre estos valles y cada ruta es una excusa para contar su historia a quien llega.',
    service_type: 'experiencias',
    category: 'experiencias',
    tourism_category: 'experiencias_culturales',
    province: 'Pinar del Río',
    municipality: 'Viñales',
    photos: [],
    languages: ['español', 'inglés', 'alemán'],
    experience_details: 'Rutas de 3 y 6 horas, visita a plantaciones y almuerzo campesino incluido.',
    recommended_for: ['aventureros', 'familias'],
    lgbt_friendly: false,
    status: 'approved',
    created_at: '2026-09-15T10:00:00Z',
  },
  {
    id: demoUuid('traslado-playa'),
    owner_id: demoUuid('proveedor'),
    name: 'Traslados Varadero–Habana',
    host_name: 'Lázaro Suárez',
    description: 'Servicio privado de traslado con vehículos cómodos, conductores locales y horarios a la medida.',
    host_story: 'Llevo quince años recorriendo la isla al volante; conozco cada parada digna de una foto.',
    service_type: 'transporte',
    category: 'servicios',
    tourism_category: 'servicios_turisticos',
    province: 'Matanzas',
    municipality: 'Varadero',
    photos: [],
    languages: ['español'],
    experience_details: 'Traslados puerta a puerta, paradas fotográficas y asistencia con equipaje.',
    recommended_for: ['familias', 'grupos'],
    lgbt_friendly: true,
    status: 'pending',
    created_at: '2026-10-01T10:00:00Z',
  },
];

function emptyStore(): DemoStore {
  return {
    businesses: DEMO_BUSINESSES.map((b) => ({ ...b })),
    requests: [],
    favorites: [],
    reviews: [],
    reports: [],
    messages: [],
  };
}

function loadStore(): DemoStore {
  if (typeof localStorage === 'undefined') return emptyStore();
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw) as DemoStore;
  } catch {
    /* corrupto: reinicia */
  }
  const fresh = emptyStore();
  saveStore(fresh);
  return fresh;
}

function saveStore(store: DemoStore) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(DEMO_KEY, JSON.stringify(store));
}

export function resetDemoData() {
  saveStore(emptyStore());
}

export interface Session {
  user: { id: string; email: string };
}

interface DemoRequestRow extends BusinessRow {
  contact_email?: string;
}

export function getDemoSession(): Session | null {
  if (typeof localStorage === 'undefined') return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

function setDemoSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
}

export interface CatalogFilters {
  q?: string;
  province?: string;
  service_type?: string;
}
