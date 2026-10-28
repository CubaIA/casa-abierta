/** Capa de datos de Casa Abierta.
 *
 * Con Supabase configurado usa PostgREST + RPCs (RLS es la frontera).
 * Sin credenciales, un almacén local en localStorage replica los flujos
 * con datos de ejemplo para que la demo sea navegable.
 */
import { isSupabaseConfigured } from './env';
import { normalizePhotos } from './images';
import { normalizeRole } from './roles';
import { REQUEST_COLS, supabase } from './supabase';
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

/** Genera un slug a partir del título para la tabla businesses.
 *  Minúsculas, quita acentos, reemplaza espacios por guiones, elimina caracteres especiales.
 *  Ej: "Mi Negocio" -> "mi-negocio".
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}
const SESSION_KEY = 'casa_abierta_session_v1';

export const isDemo = !isSupabaseConfigured;

/* ------------------------------------------------------------------ */
/* Adaptación al esquema real de producción                            */
/*                                                                     */
/* La BD en producción usa: title (no name), images (no photos),       */
/* category/subcategory (no service_type/tourism_category),            */
/* amenities, tags. No tiene host_name/host_story/experience_details/  */
/* recommended_for/lgbt_friendly. El mapeador central abajo traduce    */
/* las filas reales al tipo Business que usan las páginas.             */
/* ------------------------------------------------------------------ */

const LIVE_BUSINESS_COLS =
  'id, title, description, category, subcategory, province, municipality, ' +
  'languages, status, created_at, images, amenities, tags, ' +
  'price_amount, price_currency, verified, legal_validated, featured, schedule, capacity';

const LIVE_BUSINESS_AUTH_COLS = LIVE_BUSINESS_COLS + ', owner_id';

/** Los negocios con featured = true van primero, preservando el resto del orden. */
function featuredFirst(a: Business, b: Business): number {
  return (b.featured === true ? 1 : 0) - (a.featured === true ? 1 : 0);
}

/** Normaliza a string[] cualquier columna text[]/jsonb/text. */
function asArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string') {
    const trimmed = v.trim();
    if (!trimmed) return [];
    return trimmed.split(/[,.]/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/** `schedule` es jsonb en producción: llega como texto, array o `{}`.
 *  Se normaliza a texto plano para que la ficha nunca haga trim() de un objeto. */
function asTextoPlano(v: unknown): string | null {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) {
    const partes = v
      .filter((x): x is string => typeof x === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
    return partes.length ? partes.join(' · ') : null;
  }
  return null;
}

/** Traduce una fila real de `businesses` al tipo Business que esperan las páginas. */
function mapBusinessRow(row: Record<string, unknown>): Business {
  const r = row as Record<string, unknown> & Partial<Business> & {
    title?: string;
    images?: unknown;
    amenities?: unknown;
    tags?: unknown;
    subcategory?: string | null;
  };
  const amenities = Array.isArray(r.amenities) ? r.amenities.join(' · ') : typeof r.amenities === 'string' ? r.amenities : '';
  return {
    ...r,
    name: r.title ?? '',
    title: r.title ?? '',
    host_story: r.host_story ?? '',
    service_type: r.service_type ?? r.category ?? 'servicios',
    tourism_category: r.tourism_category ?? r.subcategory ?? r.category ?? '',
    images: r.images ?? r.photos ?? [],
    languages: asArray(r.languages),
    experience_details: r.experience_details ?? amenities,
    schedule: asTextoPlano(r.schedule),
    recommended_for: asArray(r.recommended_for ?? r.tags),
    lgbt_friendly: r.lgbt_friendly ?? false,
  } as Business;
}

/** Extrae { name, province } desde la fila real de businesses en los joins. */
function joinBusinessName(business: unknown): { name: string; province: string } | null {
  if (!business || typeof business !== 'object') return null;
  const b = business as { name?: string; title?: string; province?: string };
  return { name: b.title ?? b.name ?? 'Negocio', province: b.province ?? '' };
}

function mapBusinessForCards(row: Record<string, unknown>): Business {
  return mapBusinessRow(row);
}

/** Vista pública de un negocio.
 *
 * En producción la migración 008 no concede `license_number` ni
 * `admin_legal_notes` a `anon`/`authenticated`, así que el catálogo y la ficha
 * nunca los reciben. La demo local sí tiene el objeto completo en memoria: se
 * recortan aquí para que el comportamiento sea el mismo y ningún dato legal
 * privado se cuele en el HTML público. */
function comoPublico(b: Business): Business {
  const { license_number: _licencia, admin_legal_notes: _notas, ...resto } = b;
  return resto;
}

/* ------------------------------------------------------------------ */
/* Almacén demo                                                        */
/* ------------------------------------------------------------------ */

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
    avatar_url: null,
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
    avatar_url: null,
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
    title: 'Casa junto al Mar',
    host_name: 'María Pérez',
    description: 'Habitaciones luminosas a dos cuadras de la playa, con desayuno casero y terraza para ver el atardecer sobre el mar.',
    name: 'Casa junto al Mar',
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
    title: 'Mesa Habanera',
    host_name: 'Carlos Domínguez',
    name: 'Mesa Habanera',
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
    title: 'Rutas a Caballo por Viñales',
    host_name: 'Yanet Rodríguez',
    name: 'Rutas a Caballo por Viñales',
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
    title: 'Traslados Varadero–Habana',
    host_name: 'Lázaro Suárez',
    name: 'Traslados Varadero–Habana',
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

/* ------------------------------------------------------------------ */
/* Sesión (demo)                                                       */
/* ------------------------------------------------------------------ */

export interface Session {
  user: { id: string; email: string };
}

/** Guarda el contacto en el almacén demo (Supabase lo guarda en contact_email). */
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

/* ------------------------------------------------------------------ */
/* Catálogo                                                            */
/* ------------------------------------------------------------------ */

export interface CatalogFilters {
  q?: string;
  province?: string;
  service_type?: string;
}

export async function listBusinesses(filters: CatalogFilters = {}): Promise<Business[]> {
  if (supabase) {
    let query = supabase
      .from('businesses')
      .select(LIVE_BUSINESS_COLS)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });
    if (filters.province) query = query.eq('province', filters.province);
    if (filters.service_type) query = query.eq('category', filters.service_type);
    if (filters.q) query = query.or(`title.ilike.%${filters.q}%,municipality.ilike.%${filters.q}%,province.ilike.%${filters.q}%`);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>)
      .map(mapBusinessRow)
      .sort(featuredFirst);
  }

  let rows = [...loadStore().businesses.filter((b) => b.status === 'approved')].sort(featuredFirst);
  if (filters.province) rows = rows.filter((b) => b.province === filters.province);
  if (filters.service_type) rows = rows.filter((b) => b.service_type === filters.service_type);
  if (filters.q) {
    const q = filters.q.toLowerCase();
    rows = rows.filter((b) =>
      [b.name, b.municipality, b.province, b.description].some((v) => v?.toLowerCase().includes(q)),
    );
  }
  return rows.map(comoPublico);
}

export async function getBusiness(id: string): Promise<Business | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .select(LIVE_BUSINESS_COLS)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapBusinessRow(data as unknown as Record<string, unknown>) : null;
  }
  const b = loadStore().businesses.find((x) => x.id === id);
  return b ? comoPublico(b) : null;
}

/**
 * WhatsApp del negocio para el botón de contacto directo (best-effort).
 *
 * La migración 001 revoca `select (phone, email)` de `businesses` para
 * anon/authenticated, así que esta lectura puede no estar permitida: en ese
 * caso devuelve `null` (la ficha cae al WhatsApp de soporte) y nunca lanza.
 * `business_contacts` solo responde al dueño o a un admin por RLS.
 */
export async function getBusinessWhatsapp(id: string): Promise<string | null> {
  if (!supabase) {
    const b = loadStore().businesses.find((x) => x.id === id);
    return b?.whatsapp ?? b?.phone ?? null;
  }
  const client = supabase;

  const leer = async (tabla: 'businesses' | 'business_contacts', col: 'id' | 'business_id') => {
    try {
      const { data, error } = await client.from(tabla).select('phone').eq(col, id).maybeSingle();
      if (error || !data) return null;
      const valor = (data as { phone?: string | null }).phone;
      return valor && valor.trim() ? valor.trim() : null;
    } catch {
      return null; // columna privada o tabla ausente: sin contacto directo
    }
  };

  return (await leer('businesses', 'id')) ?? (await leer('business_contacts', 'business_id'));
}

export async function listProvinces(): Promise<string[]> {
  const rows = await listBusinesses();
  return Array.from(new Set(rows.map((b) => b.province))).sort();
}

/* ------------------------------------------------------------------ */
/* Favoritos                                                           */
/* ------------------------------------------------------------------ */

export async function listFavoriteIds(userId: string): Promise<string[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('favorites')
      .select('business_id')
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r) => r.business_id as string);
  }
  return loadStore()
    .favorites.filter((f) => f.user_id === userId)
    .map((f) => f.business_id);
}

export async function toggleFavorite(userId: string, businessId: string): Promise<boolean> {
  if (supabase) {
    const existing = await supabase
      .from('favorites')
      .select('business_id')
      .eq('user_id', userId)
      .eq('business_id', businessId);
    if (existing.error) throw new Error(existing.error.message);
    if ((existing.data ?? []).length > 0) {
      const del = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('business_id', businessId);
      if (del.error) throw new Error(del.error.message);
      return false;
    }
    const ins = await supabase
      .from('favorites')
      .insert({ user_id: userId, business_id: businessId });
    if (ins.error) throw new Error(ins.error.message);
    return true;
  }

  const store = loadStore();
  const idx = store.favorites.findIndex((f) => f.user_id === userId && f.business_id === businessId);
  if (idx >= 0) {
    store.favorites.splice(idx, 1);
    saveStore(store);
    return false;
  }
  store.favorites.push({ user_id: userId, business_id: businessId });
  saveStore(store);
  return true;
}

/* ------------------------------------------------------------------ */
/* Solicitudes                                                         */
/* ------------------------------------------------------------------ */

export async function createRequest(input: {
  requesterId: string;
  businessId: string;
  message: string;
  serviceRequested: string;
  contactEmail?: string;
}): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('requests').insert({
      id: crypto.randomUUID(),
      requester_id: input.requesterId,
      business_id: input.businessId,
      message: input.message,
      service_requested: input.serviceRequested,
      status: 'new',
      contact_email: input.contactEmail ?? null,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  store.requests.unshift({
    id: crypto.randomUUID(),
    requester_id: input.requesterId,
    business_id: input.businessId,
    message: input.message,
    status: 'new',
    service_requested: input.serviceRequested,
    created_at: new Date().toISOString(),
    contact_email: input.contactEmail,
  });
  saveStore(store);
}

export async function listMyRequests(userId: string): Promise<BusinessRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('requests')
      .select(`${REQUEST_COLS}, business:businesses(title, province)`)
      .eq('requester_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      ...(row as unknown as BusinessRow),
      business: joinBusinessName(row.business),
    }));
  }
  return loadStore()
    .requests.filter((r) => r.requester_id === userId)
    .map((r) => ({
      ...r,
      business: {
        name: loadStore().businesses.find((b) => b.id === r.business_id)?.title ?? 'Negocio',
        province: loadStore().businesses.find((b) => b.id === r.business_id)?.province ?? '',
      },
    }));
}

export async function listIncomingRequests(providerId: string): Promise<BusinessRow[]> {
  if (supabase) {
    const mine = await supabase
      .from('businesses')
      .select('id')
      .eq('owner_id', providerId);
    if (mine.error) throw new Error(mine.error.message);
    const ids = (mine.data ?? []).map((b) => b.id as string);
    if (ids.length === 0) return [];
    const { data, error } = await supabase
      .from('requests')
      .select(`${REQUEST_COLS}, business:businesses(title, province)`)
      .in('business_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      ...(row as unknown as BusinessRow),
      business: joinBusinessName(row.business),
    }));
  }
  const store = loadStore();
  const myIds = store.businesses.filter((b) => b.owner_id === providerId).map((b) => b.id);
  return store.requests
    .filter((r) => myIds.includes(r.business_id ?? ''))
    .map((r) => ({
      ...r,
      business: {
        name: store.businesses.find((b) => b.id === r.business_id)?.title ?? 'Negocio',
        province: store.businesses.find((b) => b.id === r.business_id)?.province ?? '',
      },
    }));
}

export async function setRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('requests')
      .update({ status })
      .eq('id', requestId);
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  const row = store.requests.find((r) => r.id === requestId);
  if (row) {
    row.status = status;
    saveStore(store);
  }
}

/** Todas las solicitudes (admin ve todo vía RLS). */
export async function adminListAllRequests(): Promise<BusinessRow[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('requests')
      .select(`${REQUEST_COLS}, business:businesses(title, province)`)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>).map((row) => ({
      ...(row as unknown as BusinessRow),
      business: joinBusinessName(row.business),
    }));
  }
  const store = loadStore();
  return [...store.requests]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((r) => {
      const biz = store.businesses.find((b) => b.id === r.business_id);
      return { ...r, business: { name: biz?.title ?? 'Negocio', province: biz?.province ?? '' } };
    });
}

/** Cambio de estado por admin (RPC cuando hay Supabase; fallback a update directo). */
export async function adminSetRequestStatus(requestId: string, status: RequestStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_request_status', {
      target_request_id: requestId,
      next_status: status,
    });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      await setRequestStatus(requestId, status);
      return;
    }
    throw new Error(error.message);
  }
  await setRequestStatus(requestId, status);
}

/* ------------------------------------------------------------------ */
/* Reseñas                                                             */
/* ------------------------------------------------------------------ */

export async function listReviews(businessId: string): Promise<Review[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Review[];
  }
  return loadStore()
    .reviews.filter((r) => r.business_id === businessId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function createReview(input: {
  reviewerId: string;
  requestId: string;
  businessId: string;
  rating: number;
  comment: string;
}): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('reviews').insert({
      request_id: input.requestId,
      business_id: input.businessId,
      reviewer_id: input.reviewerId,
      rating: input.rating,
      comment: input.comment,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  // Refleja la política RLS: solo el viajero dueño de una solicitud completed.
  const req = store.requests.find((r) => r.id === input.requestId);
  if (
    !req ||
    req.status !== 'completed' ||
    req.requester_id !== input.reviewerId ||
    req.business_id !== input.businessId
  ) {
    throw new Error('Solo el viajero de una solicitud completada puede escribir la reseña.');
  }
  if (store.reviews.some((r) => r.request_id === input.requestId)) {
    throw new Error('Ya existe una reseña para esta solicitud.');
  }
  store.reviews.unshift({
    id: crypto.randomUUID(),
    request_id: input.requestId,
    business_id: input.businessId,
    reviewer_id: input.reviewerId,
    rating: input.rating,
    comment: input.comment,
    created_at: new Date().toISOString(),
  });
  saveStore(store);
}

/* ------------------------------------------------------------------ */
/* Alta de negocio (proveedor)                                         */
/* ------------------------------------------------------------------ */

/** Detecta RPCs inexistentes en el esquema real (PostgREST PGRST202). */
function isMissingRpc(message: string): boolean {
  return /Could not find the function|PGRST202/.test(message);
}

/** Guarda la licencia declarada por el anfitrión (dato privado, Ley 149).
 *
 * Va por un RPC SECURITY DEFINER que comprueba que quien escribe es el dueño
 * del negocio: la columna no se expone a `authenticated` para que nadie pueda
 * leer ni alterar la documentación legal de un negocio ajeno.
 */
async function guardarLicenciaNegocio(id: string, license: string | null | undefined): Promise<void> {
  const limpio = (license ?? '').trim();
  if (!limpio || !supabase) return;
  const { error } = await supabase.rpc('provider_set_business_license', {
    target_business_id: id,
    next_license: limpio,
  });
  if (!error) return;
  if (isMissingRpc(error.message)) {
    const { error: updErr } = await supabase.from('businesses').update({ license_number: limpio }).eq('id', id);
    if (updErr) {
      throw new Error(
        'La ficha se creó, pero no se pudo guardar el número de licencia. Aplica ' +
          'supabase/migrations/008_legal_audit.sql en Supabase → SQL Editor (una sola vez) y edítala.',
      );
    }
    return;
  }
  throw new Error(error.message);
}

export async function submitBusiness(providerId: string, input: SubmitBusinessInput): Promise<string> {
  if (supabase) {
    const { data, error } = await supabase.rpc('provider_submit_business', {
      p_title: input.name,
      p_host_name: input.host_name,
      p_description: input.description,
      p_host_story: input.host_story,
      p_service_type: input.service_type,
      p_tourism_category: input.tourism_category,
      p_province: input.province,
      p_municipality: input.municipality,
      p_images: input.photos,
      p_languages: input.languages,
      p_experience_details: input.experience_details,
      p_recommended_for: input.recommended_for,
      p_lgbt_friendly: input.lgbt_friendly,
      p_phone: input.phone,
      p_email: input.email,
    });
    if (!error) {
      const id = data as string;
      await guardarLicenciaNegocio(id, input.license_number);
      return id;
    }
    if (!isMissingRpc(error.message)) throw new Error(error.message);
    // Fallback: inserción directa con las columnas reales de la BD.
    // owner_id se resuelve de la sesión actual cuando providerId no es suficiente.
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) throw new Error('No hay sesión autenticada');
    const id = crypto.randomUUID();
    const slug = generateSlug(input.name);
    const { error: insErr } = await supabase.from('businesses').insert({
      id,
      slug,
      owner_id: authUser.id,
      title: input.name,
      description: input.description,
      category: input.service_type,
      subcategory: input.tourism_category,
      province: input.province,
      municipality: input.municipality,
      languages: input.languages,
      phone: input.phone,
      email: input.email,
      images: input.photos,
      amenities: input.experience_details ? [input.experience_details] : [],
      tags: input.recommended_for,
      status: 'pending',
    });
    if (insErr) throw new Error(insErr.message);
    await guardarLicenciaNegocio(id, input.license_number);
    return id;
  }
  const slug = generateSlug(input.name);
  const store = loadStore();
  const id = crypto.randomUUID();
  const broad =
    input.tourism_category === 'alojamiento'
      ? 'alojamiento'
      : ['experiencias_culturales', 'naturaleza', 'ecoturismo', 'artesanos'].includes(input.tourism_category)
        ? 'experiencias'
        : 'servicios';
  store.businesses.unshift({
    id,
    slug,
    owner_id: providerId,
    name: input.name,
    title: input.name,
    host_name: input.host_name,
    description: input.description,
    host_story: input.host_story,
    service_type: input.service_type,
    category: broad,
    tourism_category: input.tourism_category,
    province: input.province,
    municipality: input.municipality,
    images: input.photos,
    languages: input.languages,
    experience_details: input.experience_details,
    recommended_for: input.recommended_for,
    lgbt_friendly: input.lgbt_friendly,
    license_number: input.license_number?.trim() ?? '',
    legal_validated: false,
    admin_legal_notes: null,
    status: 'pending',
    created_at: new Date().toISOString(),
  });
  saveStore(store);
  return id;
}

export async function listMyBusinesses(ownerId: string): Promise<Business[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .select(LIVE_BUSINESS_AUTH_COLS)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(mapBusinessRow);
  }
  return loadStore()
    .businesses.filter((b) => b.owner_id === ownerId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

/* ------------------------------------------------------------------ */
/* Reportes y mensajes de contacto                                     */
/* ------------------------------------------------------------------ */

export async function createReport(input: {
  reporterId: string;
  targetType: 'business' | 'user' | 'request';
  targetId: string;
  reason: string;
}): Promise<void> {
  if (supabase) {
    // La BD real solo tiene business_id (no target_type/target_id/reason).
    const { error } = await supabase.from('reports').insert({
      reporter_id: input.reporterId,
      business_id: input.targetType === 'business' ? input.targetId : null,
      status: 'open',
    });
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  store.reports.unshift({
    id: crypto.randomUUID(),
    reporter_id: input.reporterId,
    business_id: input.targetType === 'business' ? input.targetId : null,
    status: 'open',
    created_at: new Date().toISOString(),
    resolved_at: null,
  });
  saveStore(store);
}

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  if (supabase) {
    // La BD real usa name/email/subject/message (no sender_id/inquiry_type).
    const { error } = await supabase.from('contact_messages').insert({
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
      status: 'open',
    });
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  store.messages.unshift({
    id: crypto.randomUUID(),
    name: input.name,
    email: input.email,
    subject: input.subject,
    message: input.message,
    status: 'open',
    created_at: new Date().toISOString(),
  });
  saveStore(store);
}

/* ------------------------------------------------------------------ */
/* Perfil                                                              */
/* ------------------------------------------------------------------ */

export async function getProfile(userId: string): Promise<Profile | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    // La BD puede guardar el rol como «anfitrion»: lo entregamos canónico para
    // que menú, panel y guardas comparen siempre contra `provider`.
    const profile = data as Profile;
    return { ...profile, role: normalizeRole(profile.role) ?? profile.role };
  }
  return DEMO_USERS.find((u) => u.id === userId) ?? null;
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, 'full_name' | 'phone' | 'country' | 'trip_style' | 'budget_band' | 'preferred_language' | 'avatar_url'>>,
): Promise<void> {
  if (supabase) {
    // La BD real solo tiene full_name/phone (no country/trip_style/budget_band/
    // preferred_language): filtramos para no romper el UPDATE.
    const allowed = ['full_name', 'phone'] as const;
    const safe: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in patch) safe[key] = patch[key as 'full_name' | 'phone'];
    }
    if (Object.keys(safe).length === 0 && !('avatar_url' in patch)) return;
    const { error } = await supabase.from('users').update(safe).eq('id', userId);
    if (error) throw new Error(error.message);
    return;
  }
  const row = DEMO_USERS.find((u) => u.id === userId);
  if (row) Object.assign(row, patch);
}

/* ------------------------------------------------------------------ */
/* Catálogo de categorías                                               */
/* ------------------------------------------------------------------ */

export async function listCategories(): Promise<Category[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('business_categories')
      .select('key, label, active')
      .order('sort_order');
    if (error) throw new Error(error.message);
    return (data ?? []) as Category[];
  }
  return DEMO_CATEGORIES.map((c) => ({ ...c }));
}

export const DEMO_CATEGORIES: Category[] = [
  { key: 'alojamiento', label: 'Alojamiento', active: true },
  { key: 'gastronomia', label: 'Gastronomía', active: true },
  { key: 'experiencias_culturales', label: 'Experiencias culturales', active: true },
  { key: 'guias_locales', label: 'Guías locales', active: true },
  { key: 'servicios_turisticos', label: 'Servicios turísticos', active: true },
  { key: 'naturaleza', label: 'Naturaleza', active: true },
  { key: 'ecoturismo', label: 'Ecoturismo', active: true },
  { key: 'artesanos', label: 'Artesanías', active: true },
  { key: 'turismo_inclusivo', label: 'Turismo inclusivo', active: true },
];

export const SERVICE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'alojamiento', label: 'Alojamiento' },
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'guia_local', label: 'Guía local' },
  { value: 'experiencias', label: 'Experiencias' },
  { value: 'naturaleza', label: 'Naturaleza' },
  { value: 'ecoturismo', label: 'Ecoturismo' },
  { value: 'artesanos', label: 'Artesanías' },
  { value: 'turismo_inclusivo', label: 'Turismo inclusivo' },
];

/* ------------------------------------------------------------------ */
/* Administración                                                      */
/* ------------------------------------------------------------------ */

/** Negocios de todos los estados (admin ve todo vía RLS). */
export async function adminListAllBusinesses(): Promise<Business[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('businesses')
      .select(LIVE_BUSINESS_AUTH_COLS)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(mapBusinessRow);
  }
  return [...loadStore().businesses].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function adminSetBusinessStatus(id: string, status: BusinessStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_business_status', {
      target_business_id: id,
      next_status: status,
    });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      const { error: updErr } = await supabase.from('businesses').update({ status }).eq('id', id);
      if (updErr) throw new Error(updErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const store = loadStore();
  const b = store.businesses.find((x) => x.id === id);
  if (b) {
    b.status = status;
    saveStore(store);
  }
}

/** Marca o desmarca un negocio como Premium (destacado en el catálogo). */
export async function adminSetBusinessFeatured(id: string, featured: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_business_featured', {
      target_business_id: id,
      next_featured: featured,
    });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      // Proyectos que aún no aplicaron la migración 004: update directo (requiere grant de la columna).
      const { error: updErr } = await supabase.from('businesses').update({ featured }).eq('id', id);
      if (updErr) throw new Error(updErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const store = loadStore();
  const b = store.businesses.find((x) => x.id === id);
  if (b) {
    b.featured = featured;
    saveStore(store);
  }
}

/**
 * Marca o desmarca un negocio como Verificado (sello de calidad).
 *
 * Solo el administrador puede otorgarlo: el RPC comprueba el rol en la BD y
 * hace el UPDATE con SECURITY DEFINER. Si el proyecto aún no aplicó la
 * migración 007, se intenta un UPDATE directo a la columna `verified`.
 */
export async function adminSetBusinessVerified(id: string, verified: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_business_verified', {
      target_business_id: id,
      next_verified: verified,
    });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      const { error: updErr } = await supabase.from('businesses').update({ verified }).eq('id', id);
      if (updErr) throw new Error(updErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const store = loadStore();
  const b = store.businesses.find((x) => x.id === id);
  if (b) {
    b.verified = verified;
    saveStore(store);
  }
}

/* ------------------------------------------------------------------ */
/* Auditoría legal (Ley 149 de 2022)                                   */
/* ------------------------------------------------------------------ */

/** Datos legales privados de un negocio: solo el administrador los lee. */
export interface AdminBusinessLegal {
  license_number: string | null;
  legal_validated: boolean;
  admin_legal_notes: string | null;
}

/** Estado inicial usado mientras se cargan los datos legales de una ficha. */
export const LEGAL_VACIO: AdminBusinessLegal = {
  license_number: null,
  legal_validated: false,
  admin_legal_notes: null,
};

/** Formas de nombrar los argumentos de los RPC de auditoría legal según la
 *  versión de la migración 008 aplicada en cada proyecto.
 *
 *  PostgREST resuelve las funciones por el NOMBRE de sus parámetros: si la BD
 *  tiene p_business_id/p_is_legal/p_notes y la app envía target_business_id/
 *  next_validated/next_notes, la respuesta es PGRST202 («Could not find the
 *  function») aunque la función exista. Se prueban las dos formas para que el
 *  panel funcione con cualquiera de las dos versiones. */
const FORMAS_LEGAL = ['p', 'legacy'] as const;
type FormaLegal = (typeof FORMAS_LEGAL)[number];

function argsValidacionLegal(
  forma: FormaLegal,
  id: string,
  validado: boolean,
  notas: string,
): Record<string, unknown> {
  return forma === 'p'
    ? { p_business_id: id, p_is_legal: validado, p_notes: notas }
    : { target_business_id: id, next_validated: validado, next_notes: notas };
}

function argsLecturaLegal(forma: FormaLegal, id: string): Record<string, unknown> {
  return forma === 'p' ? { p_business_id: id } : { target_business_id: id };
}

/** Mensaje accionable para un fallo real del RPC de auditoría legal. */
function mensajeErrorLegal(detalle: string): string {
  if (/Administrator role required|42501|row-level security|permission denied/i.test(detalle)) {
    return (
      'La base de datos no reconoce tu cuenta como administradora, así que no guardó la auditoría legal. ' +
      'Comprueba que tu usuario tenga el rol admin en la tabla users y reintenta.'
    );
  }
  if (/Business not found|P0002/i.test(detalle)) {
    return 'Este negocio ya no existe en la base de datos: recarga el panel y reintenta.';
  }
  return `No se pudo guardar la auditoría legal: ${detalle}`;
}

export async function adminGetBusinessLegal(id: string): Promise<AdminBusinessLegal> {
  if (supabase) {
    for (const forma of FORMAS_LEGAL) {
      const { data, error } = await supabase.rpc('admin_get_business_legal', argsLecturaLegal(forma, id));
      if (!error) {
        const fila = (Array.isArray(data) ? data[0] : data) as Partial<AdminBusinessLegal> | null;
        return {
          license_number: fila?.license_number ?? null,
          legal_validated: fila?.legal_validated === true,
          admin_legal_notes: fila?.admin_legal_notes ?? null,
        };
      }
      if (!isMissingRpc(error.message)) throw new Error(error.message);
    }
    // Proyecto sin la migración 008: se intenta la lectura directa. Si los
    // permisos la bloquean se devuelve el estado vacío, nunca un error fatal.
    const { data: fila, error: readErr } = await supabase
      .from('businesses')
      .select('license_number, legal_validated, admin_legal_notes')
      .eq('id', id)
      .maybeSingle();
    if (readErr || !fila) return LEGAL_VACIO;
    const f = fila as unknown as Partial<AdminBusinessLegal>;
    return {
      license_number: f.license_number ?? null,
      legal_validated: f.legal_validated === true,
      admin_legal_notes: f.admin_legal_notes ?? null,
    };
  }
  const b = loadStore().businesses.find((x) => x.id === id);
  if (!b) return LEGAL_VACIO;
  return {
    license_number: b.license_number ?? null,
    legal_validated: b.legal_validated === true,
    admin_legal_notes: b.admin_legal_notes ?? null,
  };
}

/**
 * Valida (o retira la validación de) la documentación legal de un negocio y
 * guarda las notas privadas de auditoría.
 *
 * Toda la escritura va por el RPC `admin_set_business_legal` (SECURITY DEFINER
 * + comprobación de rol): `legal_validated` y `admin_legal_notes` no se
 * conceden a `authenticated`, y un UPDATE directo sobre ellas no cambiaría
 * nada (RLS lo deja en 0 filas) sin devolver error. Por eso tampoco existe un
 * respaldo por UPDATE: si el RPC falta, se pide aplicar la migración 008. Esto
 * también impide que un anfitrión se auto-valide editando su propia ficha.
 */
export async function adminSetBusinessLegal(
  id: string,
  legalValidated: boolean,
  adminNotes: string,
): Promise<void> {
  const notas = adminNotes.trim();
  if (supabase) {
    for (const forma of FORMAS_LEGAL) {
      const { error } = await supabase.rpc(
        'admin_set_business_legal',
        argsValidacionLegal(forma, id, legalValidated, notas),
      );
      if (!error) return;
      // PGRST202: esa forma de parámetros no existe en el proyecto; se prueba la otra.
      if (isMissingRpc(error.message)) continue;
      throw new Error(mensajeErrorLegal(error.message));
    }
    throw new Error(
      'No se pudo guardar la auditoría legal: la función admin_set_business_legal no está en la base de datos. ' +
        'Aplica una sola vez supabase/migrations/008_legal_audit.sql en el SQL Editor de Supabase y reintenta.',
    );
  }
  const store = loadStore();
  const b = store.businesses.find((x) => x.id === id);
  if (!b) throw new Error('Negocio no encontrado');
  b.legal_validated = legalValidated;
  b.admin_legal_notes = notas || null;
  saveStore(store);
}

export async function adminDeleteBusiness(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_delete_business', { target_business_id: id });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      const { error: delErr } = await supabase.from('businesses').delete().eq('id', id);
      if (delErr) throw new Error(delErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const store = loadStore();
  store.businesses = store.businesses.filter((b) => b.id !== id);
  saveStore(store);
}

/* ------------------------------------------------------------------ */
/* Edición de un negocio desde el panel admin                          */
/* ------------------------------------------------------------------ */

export interface AdminEditBusinessInput {
  /** Descripción nueva (ya validada en la interfaz). */
  description: string;
  /** WhatsApp/teléfono de contacto. `null` o vacío = no modificarlo. */
  phone?: string | null;
  /** Lista completa de fotos; el elemento 0 es la portada del catálogo. */
  images: string[];
  /** «Conoce a tu anfitrión». `undefined` = no modificarlo. */
  host_story?: string;
  /** «Detalles de la experiencia». `undefined` = no modificarlo. */
  experience_details?: string;
}

/**
 * Edita descripción, WhatsApp, fotos y los dos textos de la ficha (historia del
 * anfitrión y detalles de la experiencia) desde el panel admin.
 *
 * El UPDATE directo sobre `businesses` depende de los privilegios/RLS de cada
 * proyecto, y la columna de fotos se llama `images` en la BD de producción pero
 * `photos` en la migración 001: por eso se prueban las variantes y se comprueba
 * leyendo la fila. Ojo: si RLS no deja pasar el UPDATE **no hay error**, solo 0
 * filas afectadas, así que sin esa verificación el guardado parecería correcto.
 * Último recurso: la RPC `admin_edit_business` (migración 005, SECURITY DEFINER).
 */
export async function adminEditBusiness(id: string, input: AdminEditBusinessInput): Promise<void> {
  await guardarFichaBase(id, input);
  // Los textos narrativos van en un UPDATE aparte: si la BD no permite
  // escribirlos, descripción, WhatsApp y fotos ya quedaron guardados y el
  // error dice exactamente qué falta en lugar de perder toda la edición.
  await guardarFichaNarrativa(id, input);
}

/** Descripción, WhatsApp y fotos: el guardado histórico del panel admin. */
async function guardarFichaBase(id: string, input: AdminEditBusinessInput): Promise<void> {
  const description = input.description.trim();
  const images = input.images;
  const phone = input.phone?.trim() || null;

  if (supabase) {
    const variantes: Array<{ col: 'images' | 'photos'; conTel: boolean }> = [
      { col: 'images', conTel: phone !== null },
      { col: 'images', conTel: false },
      { col: 'photos', conTel: phone !== null },
      { col: 'photos', conTel: false },
    ];

    for (const v of variantes) {
      const payload: Record<string, unknown> = { description, [v.col]: images };
      if (v.conTel && phone) payload.phone = phone;
      const { error } = await supabase.from('businesses').update(payload).eq('id', id);
      if (error) continue; // columna inexistente o permiso denegado: siguiente variante
      const persistido = await edicionPersistida(id, description, images, v.col);
      if (persistido === false) continue; // 0 filas afectadas por RLS
      if (phone && !v.conTel) await guardarTelefono(id, phone);
      return;
    }

    const { error: rpcErr } = await supabase.rpc('admin_edit_business', {
      target_business_id: id,
      next_description: description,
      next_phone: phone ?? '',
      next_images: images,
    });
    if (!rpcErr) return;
    if (!isMissingRpc(rpcErr.message)) throw new Error(rpcErr.message);

    throw new Error(
      'La base de datos no permite que el administrador edite este negocio. Aplica ' +
        'supabase/migrations/005_admin_edit_business.sql en Supabase → SQL Editor (una sola vez) y reintenta.',
    );
  }

  const store = loadStore();
  const b = store.businesses.find((x) => x.id === id);
  if (!b) throw new Error('Negocio no encontrado');
  b.description = description;
  b.images = images;
  if (phone) (b as Business & { phone?: string | null }).phone = phone;
  saveStore(store);
}

/** Lee la fila tras el UPDATE para confirmar que se guardó de verdad.
 *  `null` = no se pudo verificar (se confía en que el UPDATE no dio error). */
async function edicionPersistida(
  id: string,
  description: string,
  images: string[],
  col: 'images' | 'photos',
): Promise<boolean | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('businesses')
    .select(`description, ${col}`)
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  const fila = data as Record<string, unknown>;
  const fotosBd = normalizePhotos(fila[col]);
  return (
    String(fila.description ?? '').trim() === description &&
    fotosBd.length === images.length &&
    fotosBd.every((url, i) => url === images[i])
  );
}

/** Best-effort: escribe el WhatsApp en `businesses.phone` cuando la variante
 *  usada para guardar descripción/fotos no lo incluía. */
async function guardarTelefono(id: string, phone: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('businesses').update({ phone }).eq('id', id);
  if (error) console.warn('No se pudo guardar el WhatsApp del negocio:', error.message);
}

/* ---------------- Textos narrativos de la ficha ---------------- */

/** Columnas de «Conoce a tu anfitrión» y «Detalles de la experiencia» con sus
 *  alias conocidos: la migración 001 usa host_story/experience_details y la BD
 *  de producción puede tener host_bio/amenities (text[]). */
const FICHA_NARRATIVA: Array<{
  campo: 'host_story' | 'experience_details';
  cols: Array<{ col: string; array: boolean }>;
}> = [
  {
    campo: 'host_story',
    cols: [
      { col: 'host_story', array: false },
      { col: 'host_bio', array: false },
    ],
  },
  {
    campo: 'experience_details',
    cols: [
      { col: 'experience_details', array: false },
      { col: 'amenities', array: true },
    ],
  },
];

const ETIQUETA_FICHA: Record<'host_story' | 'experience_details', string> = {
  host_story: '«Conoce a tu anfitrión»',
  experience_details: '«Detalles de la experiencia»',
};

/** PostgREST devuelve PGRST204 (schema cache) o 42703 cuando la columna no existe. */
function esColumnaAusente(mensaje: string): boolean {
  return /42703|PGRST204|column .* does not exist|Could not find the .* column/i.test(mensaje);
}

/**
 * Guarda «Conoce a tu anfitrión» y «Detalles de la experiencia».
 *
 * Se intenta primero el UPDATE directo (con el nombre canónico y, si la columna
 * no existe, con el alias de la BD real) porque las columnas no están
 * restringidas a nivel de tabla; si RLS/grants lo silencian o lo bloquean, se
 * usa el RPC `admin_edit_business` de 6 argumentos (migración 009).
 */
async function guardarFichaNarrativa(id: string, input: AdminEditBusinessInput): Promise<void> {
  const valores: Array<{ campo: 'host_story' | 'experience_details'; texto: string }> = [];
  if (input.host_story !== undefined) valores.push({ campo: 'host_story', texto: input.host_story.trim() });
  if (input.experience_details !== undefined) {
    valores.push({ campo: 'experience_details', texto: input.experience_details.trim() });
  }
  if (valores.length === 0) return;

  if (!supabase) {
    const store = loadStore();
    const b = store.businesses.find((x) => x.id === id);
    if (!b) throw new Error('Negocio no encontrado');
    for (const v of valores) b[v.campo] = v.texto;
    saveStore(store);
    return;
  }

  const pendientes: string[] = [];
  for (const valor of valores) {
    const candidatas = FICHA_NARRATIVA.find((f) => f.campo === valor.campo)?.cols ?? [];
    let guardado = false;
    for (const { col, array } of candidatas) {
      const payload: Record<string, unknown> = {
        [col]: array ? (valor.texto ? [valor.texto] : []) : valor.texto,
      };
      const { error } = await supabase.from('businesses').update(payload).eq('id', id);
      if (error) {
        if (esColumnaAusente(error.message)) continue; // otro nombre de columna
        break; // permiso o valor rechazado: se intenta el RPC
      }
      const persistido = await textoPersistido(id, col, valor.texto);
      if (persistido === false) break; // 0 filas afectadas por RLS
      guardado = true;
      break;
    }
    if (!guardado) pendientes.push(ETIQUETA_FICHA[valor.campo]);
  }
  if (pendientes.length === 0) return;

  // Los textos de la firma son posicionales/nombrados: se envían ambos para no
  // depender de si el RPC tiene la firma de 006 argumentos o la heredada.
  const { error: rpcErr } = await supabase.rpc('admin_edit_business', {
    target_business_id: id,
    next_description: input.description.trim(),
    next_phone: input.phone?.trim() ?? '',
    next_images: input.images,
    next_host_story: input.host_story?.trim() ?? null,
    next_experience_details: input.experience_details?.trim() ?? null,
  });
  if (!rpcErr) return;
  if (!isMissingRpc(rpcErr.message)) throw new Error(rpcErr.message);

  throw new Error(
    `Se guardaron descripción, WhatsApp y fotos, pero no ${pendientes.join(' ni ')}: la base de datos no ` +
      'permite escribir esas columnas. Aplica una sola vez ' +
      'supabase/migrations/009_admin_edit_narrative.sql en Supabase → SQL Editor y reintenta.',
  );
}

/** Confirma que el UPDATE de un texto narrativo no fue silenciado por RLS.
 *  `null` = no se pudo comprobar (se confía en que el UPDATE no dio error). */
async function textoPersistido(id: string, col: string, esperado: string): Promise<boolean | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('businesses').select(col).eq('id', id).maybeSingle();
  if (error || !data) return null;
  const bruto = (data as unknown as Record<string, unknown>)[col];
  const texto = Array.isArray(bruto)
    ? bruto.filter((x): x is string => typeof x === 'string').join(' · ')
    : String(bruto ?? '');
  return texto.trim() === esperado.trim();
}

export async function adminListUsers(): Promise<Profile[]> {
  if (supabase) {
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) throw new Error(error.message);
    return (data ?? []) as Profile[];
  }
  return DEMO_USERS.map(({ password: _p, ...p }) => p);
}

export async function adminSetUserRole(id: string, role: Role): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_user_role', { target_user_id: id, next_role: role });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      const { error: updErr } = await supabase.from('users').update({ role }).eq('id', id);
      if (updErr) throw new Error(updErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const row = DEMO_USERS.find((u) => u.id === id);
  if (row) row.role = role;
}

export async function adminSetUserStatus(id: string, status: AccountStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_user_status', { target_user_id: id, next_status: status });
    if (!error) return;
    // La BD real no tiene la columna account_status en users: sin RPC no hay
    // forma de persistir suspensiones; se informa claramente al admin.
    if (isMissingRpc(error.message)) {
      throw new Error('La BD real no tiene account_status en users: la suspensión requiere crear esa columna/RPC en Supabase.');
    }
    throw new Error(error.message);
  }
  const row = DEMO_USERS.find((u) => u.id === id);
  if (row) row.account_status = status;
}

export async function adminListReports(): Promise<Report[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Report[];
  }
  return [...loadStore().reports].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function adminSetReportStatus(
  id: string,
  status: ReportStatus,
  note = '',
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc('admin_set_report_status', {
      target_report_id: id,
      next_status: status,
      next_note: note,
    });
    if (!error) return;
    if (isMissingRpc(error.message)) {
      const { error: updErr } = await supabase
        .from('reports')
        .update(status === 'resolved' ? { status, resolved_at: new Date().toISOString() } : { status })
        .eq('id', id);
      if (updErr) throw new Error(updErr.message);
      return;
    }
    throw new Error(error.message);
  }
  const store = loadStore();
  const r = store.reports.find((x) => x.id === id);
  if (r) {
    r.status = status;
    if (status === 'resolved') r.resolved_at = new Date().toISOString();
    saveStore(store);
  }
}

export async function adminListContactMessages(): Promise<ContactMessage[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as ContactMessage[];
  }
  return [...loadStore().messages].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function adminSetContactMessageStatus(id: string, status: ContactStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const store = loadStore();
  const m = store.messages.find((x) => x.id === id);
  if (m) {
    m.status = status;
    saveStore(store);
  }
}

/** Única vía de leer contact_email de una solicitud (RPC; privacidad). */
export async function adminGetRequestContact(requestId: string): Promise<string | null> {
  if (supabase) {
    const { data, error } = await supabase.rpc('admin_get_request_contact', {
      p_request_id: requestId,
    });
    if (error) throw new Error(error.message);
    return (data as string | null) ?? null;
  }
  const row = loadStore().requests.find((r) => r.id === requestId) as DemoRequestRow | undefined;
  return row?.contact_email ?? null;
}

/* ------------------------------------------------------------------ */
/* Autenticación                                                       */
/* ------------------------------------------------------------------ */

export async function signIn(email: string, password: string): Promise<Session> {
  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const code = (error as { code?: string }).code;
      if (code === 'email_not_confirmed' || /not confirmed/i.test(error.message)) {
        throw new Error('Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
      }
      throw new Error(error.message);
    }
    return { user: { id: data.user.id, email: data.user.email ?? email } };
  }
  const user = DEMO_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) throw new Error('Correo o contraseña incorrectos (modo demo: usa viajero@casa.cu / demo1234).');
  const session: Session = { user: { id: user.id, email: user.email } };
  setDemoSession(session);
  return session;
}

export async function signUp(input: {
  email: string;
  password: string;
  fullName: string;
  accountType: 'traveler' | 'provider';
}): Promise<Session> {
  if (supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: { data: { full_name: input.fullName, account_type: input.accountType } },
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('No se pudo crear la cuenta. Revisa tu correo de confirmación.');
    if (!data.session) {
      // Alta con «Confirmar correo» activo en Supabase: aún no hay sesión.
      throw new Error('Cuenta creada. Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.');
    }
    return { user: { id: data.user.id, email: data.user.email ?? input.email } };
  }
  if (DEMO_USERS.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error('Ese correo ya está registrado en la demo.');
  }
  const slug = generateSlug(input.fullName || input.email);
  const user: Profile & { password: string } = {
    id: crypto.randomUUID(),
    email: input.email,
    password: input.password,
    full_name: input.fullName,
    phone: null,
    role: input.accountType,
    account_status: 'active',
    country: null,
    preferred_language: 'español',
    trip_style: null,
    budget_band: null,
    avatar_url: null,
    created_at: new Date().toISOString(),
  };
  DEMO_USERS.push(user);
  const session: Session = { user: { id: user.id, email: user.email } };
  setDemoSession(session);
  return session;
}

export async function signOut(): Promise<void> {
  if (supabase) {
    await supabase.auth.signOut();
    return;
  }
  setDemoSession(null);
}
