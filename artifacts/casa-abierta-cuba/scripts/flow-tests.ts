/** Pruebas funcionales de los flujos de negocio en modo demo.
 *  Ejecutar: pnpm --filter ./artifacts/casa-abierta-cuba exec tsx scripts/flow-tests.ts
 *  (En producción las mismas reglas las aplica RLS + RPCs en Supabase; ver FASE 3 harness SQL.)
 */
import { webcrypto } from 'node:crypto';

// Shim de localStorage + crypto para el entorno Node (modo demo).
const mem = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
};
if (!(globalThis.crypto as { randomUUID?: unknown }).randomUUID) {
  (globalThis.crypto as Record<string, unknown>).randomUUID = () => webcrypto.randomUUID();
}

const db = await import('../src/lib/marketplace');

let pass = 0;
let fail = 0;
function ok(label: string) {
  pass++;
  console.log(`PASS  ${label}`);
}
function bad(label: string, msg: string) {
  fail++;
  console.log(`FAIL  ${label} — ${msg}`);
}
async function expectOk(label: string, fn: () => Promise<unknown>) {
  try {
    await fn();
    ok(label);
  } catch (e) {
    bad(label, e instanceof Error ? e.message : String(e));
  }
}
async function expectErr(label: string, pattern: RegExp, fn: () => Promise<unknown>) {
  try {
    await fn();
    bad(label, 'no lanzó error (se esperaba rechazo)');
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (pattern.test(msg)) ok(label);
    else bad(label, `error equivocado: ${msg}`);
  }
}
function check(label: string, cond: boolean, detail = '') {
  if (cond) ok(label);
  else bad(label, detail || 'condición falsa');
}

console.log('== FASE 5: pruebas de flujos (modo demo) ==');

// --- Auth ---
const traveler = await db.signIn('viajero@casa.cu', 'demo1234');
check('T1 viajero inicia sesión', traveler.user.email === 'viajero@casa.cu');
await expectErr('T2 login con contraseña mala es rechazado', /incorrectos/i, () =>
  db.signIn('viajero@casa.cu', 'mala'),
);
const provider = await db.signIn('proveedor@casa.cu', 'demo1234');
const providerId = provider.user.id;
const admin = await db.signIn('admin@casa.cu', 'demo1234');
const adminId = admin.user.id;
const travelerId = traveler.user.id;

const fresh = await db.signUp({
  email: 'nuevo@casa.cu',
  password: 'clave123',
  fullName: 'Nuevo Viajero',
  accountType: 'traveler',
});
check('T3 registro de cuenta nueva crea sesión', fresh.user.email === 'nuevo@casa.cu');
const freshProfile = await db.getProfile(fresh.user.id);
check('T4 registro con accountType=traveler da rol traveler', freshProfile?.role === 'traveler');
await db.signOut();
check('T5 cerrar sesión limpia la sesión', db.getDemoSession() === null);
await db.signIn('viajero@casa.cu', 'demo1234');

// --- Catálogo ---
const catalog = await db.listBusinesses();
check('T6 catálogo solo muestra negocios approved', catalog.length === 3 && catalog.every((b) => b.status === 'approved'));
const filtered = await db.listBusinesses({ province: 'Matanzas' });
check('T7 filtro por provincia', filtered.length === 1 && filtered[0].name === 'Casa junto al Mar');
const searched = await db.listBusinesses({ q: 'viñales' });
check('T8 búsqueda por texto (sin acentos falla, con acentos funciona)', searched.length === 1);
const svc = await db.listBusinesses({ service_type: 'gastronomia' });
check('T9 filtro por tipo de servicio', svc.length === 1 && svc[0].service_type === 'gastronomia');

// --- Favoritos ---
const added = await db.toggleFavorite(travelerId, catalog[0].id);
check('T10 viajero agrega favorito', added === true);
const favs = await db.listFavoriteIds(travelerId);
check('T11 favorito visible solo para su dueño', favs.length === 1 && favs[0] === catalog[0].id);
const favsOther = await db.listFavoriteIds(fresh.user.id);
check('T12 otro usuario no ve el favorito ajeno', favsOther.length === 0);
const removed = await db.toggleFavorite(travelerId, catalog[0].id);
check('T13 favorito se puede quitar', removed === false);

// --- Solicitudes ---
await db.createRequest({
  requesterId: travelerId,
  businessId: catalog[0].id,
  message: '¿Tienen habitación para 2 en marzo?',
  serviceRequested: 'alojamiento',
  contactEmail: 'viajero@casa.cu',
});
const myReq = await db.listMyRequests(travelerId);
check('T14 viajero ve su solicitud con estado new', myReq.length === 1 && myReq[0].status === 'new');
const incoming = await db.listIncomingRequests(providerId);
check('T15 proveedor ve la solicitud entrante con nombre del negocio', incoming.length === 1 && incoming[0].business?.name === 'Casa junto al Mar');
const noReq = await db.listIncomingRequests(fresh.user.id);
check('T16 otro proveedor no ve solicitudes ajenas', noReq.length === 0);

await db.setRequestStatus(myReq[0].id, 'accepted');
check('T17 proveedor acepta la solicitud', (await db.listIncomingRequests(providerId))[0].status === 'accepted');
await db.setRequestStatus(myReq[0].id, 'completed');
check('T18 solicitud pasa a completed', (await db.listMyRequests(travelerId))[0].status === 'completed');

// --- Reseñas ---
await expectErr('T19 reseña con solicitud ajena es rechazada (autoría)', /solicitud completada/i, () =>
  db.createReview({ authorId: fresh.user.id, requestId: myReq[0].id, businessId: catalog[0].id, rating: 5, comment: 'x' }),
);
await db.createReview({
  authorId: travelerId,
  requestId: myReq[0].id,
  businessId: catalog[0].id,
  rating: 5,
  comment: 'Excelente hospitalidad',
});
const reviews = await db.listReviews(catalog[0].id);
check('T20 reseña creada y visible', reviews.length === 1 && reviews[0].rating === 5);
await expectErr('T21 segunda reseña del mismo request → rechazada (unique)', /Ya existe una reseña/i, () =>
  db.createReview({ authorId: travelerId, requestId: myReq[0].id, businessId: catalog[0].id, rating: 4, comment: 'x' }),
);

// --- Reportes y contacto ---
await expectOk('T22 viajero crea reporte', () =>
  db.createReport({ reporterId: travelerId, targetType: 'business', targetId: catalog[0].id, reason: 'Fotos engañosas' }),
);
const adminReports = await db.adminListReports();
check('T23 admin ve el reporte', adminReports.length === 1 && adminReports[0].status === 'open');
await db.adminSetReportStatus(adminReports[0].id, 'resolved', 'Revisado');
check('T24 admin resuelve el reporte', (await db.adminListReports())[0].status === 'resolved');

await expectOk('T25 mensaje de contacto', () =>
  db.createContactMessage({ senderId: travelerId, inquiryType: 'agency', subject: 'Colaboración', message: 'Somos una agencia en Cancún' }),
);
const adminMsgs = await db.adminListContactMessages();
check('T26 admin ve mensajes de contacto', adminMsgs.length === 1);
await db.adminSetContactMessageStatus(adminMsgs[0].id, 'resolved');
check('T27 admin marca mensaje como resuelto', (await db.adminListContactMessages())[0].status === 'resolved');

// --- Alta de negocio (proveedor) ---
const newBizId = await db.submitBusiness(providerId, {
  name: 'Paladar El Buen Sabor',
  host_name: 'Rosa Campos',
  description: 'Cocina casara criolla con recetas familiares transmitidas por tres generaciones.',
  host_story: 'Mi cocina huele a la casa de mi abuela; ahí recibo a quien quiere comer como un cubano.',
  service_type: 'gastronomia',
  tourism_category: 'gastronomia',
  province: 'La Habana',
  municipality: 'Centro Habana',
  photos: [],
  languages: ['español'],
  experience_details: 'Menú del día y cena con música.',
  recommended_for: ['parejas'],
  lgbt_friendly: true,
  phone: '+5352223344',
  email: 'rosa@casa.cu',
});
check('T28 proveedor envía alta de negocio', typeof newBizId === 'string');
const myBusinesses = await db.listMyBusinesses(providerId);
check('T29 alta queda pendiente y visible para su dueño', myBusinesses.some((b) => b.id === newBizId && b.status === 'pending'));
const catalogAfter = await db.listBusinesses();
check('T30 negocio pending NO aparece en el catálogo público', !catalogAfter.some((b) => b.id === newBizId));
await db.adminSetBusinessStatus(newBizId, 'approved');
check('T31 admin aprueba → aparece en catálogo', (await db.listBusinesses()).some((b) => b.id === newBizId));

// --- Admin: usuarios ---
const users = await db.adminListUsers();
check('T32 admin lista usuarios', users.length >= 4 && !('password' in (users[0] as Record<string, unknown>)));
await db.adminSetUserRole(fresh.user.id, 'provider');
check('T33 admin cambia rol a traveler→provider', (await db.getProfile(fresh.user.id))?.role === 'provider');
await db.adminSetUserStatus(fresh.user.id, 'suspended');
check('T34 admin suspende usuario', (await db.getProfile(fresh.user.id))?.account_status === 'suspended');
await db.adminDeleteBusiness(newBizId);
check('T35 admin elimina negocio', !(await db.getBusiness(newBizId)));

// --- Contact email vía admin ---
const reqContact = await db.adminGetRequestContact(myReq[0].id);
check('T36 admin lee el contacto de la solicitud', reqContact === 'viajero@casa.cu');

// --- Reset demo ---
db.resetDemoData();
check('T37 reset de datos demo', (await db.listBusinesses()).length === 3);

console.log(`\n== RESULTADO: ${pass} PASS / ${fail} FAIL ==`);
process.exit(fail > 0 ? 1 : 0);
