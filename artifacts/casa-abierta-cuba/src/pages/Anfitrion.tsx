import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Building2, Inbox, MessageCircle, PlusCircle, RefreshCw } from 'lucide-react';
import {
  DEMO_CATEGORIES,
  listCategories,
  listIncomingRequests,
  listMyBusinesses,
  setRequestStatus,
  submitBusiness,
  SERVICE_TYPES,
} from '@/lib/marketplace';
import { uploadBusinessImages } from '@/lib/storage';
import type { Business, BusinessRow, RequestStatus, SubmitBusinessInput } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { normalizeRole } from '@/lib/roles';
import { supabase } from '@/lib/supabase';
import { AvisoError } from '@/components/AvisoError';
import {
  ADMIN_WHATSAPP,
  SUPPORT_WHATSAPP,
  mensajeRevisionNegocio,
  whatsappLink,
} from '@/lib/whatsapp';

const REQUEST_STATUS_LABEL: Record<RequestStatus, { label: string; badge: string }> = {
  new: { label: 'Nueva', badge: 'badge-blue' },
  reviewing: { label: 'En revisión', badge: 'badge-gold' },
  accepted: { label: 'Aceptada', badge: 'badge-green' },
  completed: { label: 'Completada', badge: 'badge-green' },
  cancelled: { label: 'Cancelada', badge: 'badge-red' },
};

const BUSINESS_STATUS: Record<string, { label: string; badge: string }> = {
  pending: { label: 'Pendiente de revisión', badge: 'badge-gold' },
  approved: { label: 'Aprobado', badge: 'badge-green' },
  rejected: { label: 'Rechazado', badge: 'badge-red' },
  suspended: { label: 'Suspendido', badge: 'badge-red' },
};

export default function Anfitrion() {
  const { userId, profile, loading } = useAuth();
  const [tab, setTab] = useState<'form' | 'businesses' | 'requests'>('businesses');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [requests, setRequests] = useState<BusinessRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const [bs, rs] = await Promise.all([listMyBusinesses(userId), listIncomingRequests(userId)]);
      setBusinesses(bs);
      setRequests(rs);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando tu panel');
    }
  }, [userId]);

  useEffect(() => {
    document.title = 'Panel de anfitrión | Casa Abierta Cuba';
    if (!loading) void load();
  }, [loading, load]);

  if (!userId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Inicia sesión como anfitrión para publicar tu negocio.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar</Link>
        </div>
      </div>
    );
  }

  // Los viajeros no ven el panel; «provider», «anfitrion» y «admin» sí.
  if (profile && normalizeRole(profile.role) === 'traveler') {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Tu cuenta es de viajero. Los anfitriones publican negocios; si quieres publicar, contacta con nosotros
            para revisar el cambio de rol.</p>
          <Link href="/contacto" className="button-primary mt-3 inline-flex">Contactar al equipo</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <p className="section-kicker">Anfitrión</p>
      <h1 className="text-3xl font-extrabold text-azul">Mi panel</h1>
      <p className="mt-2 text-tinta/70">
        Publica tus servicios y responde a las solicitudes de viajeros. Toda alta se revisa antes de aparecer en el
        catálogo.
      </p>

      <div className="mt-5 flex flex-wrap gap-2" role="tablist">
        <button className={`button-ghost ${tab === 'businesses' ? '!bg-azul !text-white !border-azul' : ''}`} onClick={() => setTab('businesses')} role="tab" aria-selected={tab === 'businesses'}>
          <Building2 size={15} /> Mis negocios ({businesses.length})
        </button>
        <button className={`button-ghost ${tab === 'requests' ? '!bg-azul !text-white !border-azul' : ''}`} onClick={() => setTab('requests')} role="tab" aria-selected={tab === 'requests'}>
          <Inbox size={15} /> Solicitudes ({requests.length})
        </button>
        <button className={`button-ghost ${tab === 'form' ? '!bg-azul !text-white !border-azul' : ''}`} onClick={() => setTab('form')} role="tab" aria-selected={tab === 'form'}>
          <PlusCircle size={15} /> Nueva publicación
        </button>
      </div>

      <div className="panel mt-5 border-2 border-dorado bg-azul-50">
        <p className="text-sm font-extrabold text-azul">Registrarse y publicar tu negocio es GRATIS.</p>
        <p className="mt-1 text-sm text-tinta/75">
          El plan Premium es opcional y sirve para destacar tu negocio y obtener mayor visibilidad, gestionado por Casa
          Abierta Cuba.
        </p>
        <a
          href="https://wa.me/+5356289645?text=Hola,%20quiero%20información%20sobre%20promoción%20fuera%20de%20la%20app%20de%20mi%20negocio%20en%20Casa%20Abierta%20Cuba"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-bold text-white hover:brightness-95"
        >
          <MessageCircle size={15} aria-hidden /> ¿Deseas promoción fuera de la app? Contáctanos
        </a>
      </div>

      <AvisoError mensaje={error} className="mt-4" />

      {tab === 'businesses' && (
        <div className="mt-5 space-y-3">
          <div className="flex justify-between items-center">
            <PaymentButton />
            <button className="button-ghost" onClick={() => void load()}>
              <RefreshCw size={14} /> Actualizar
            </button>
          </div>
          {businesses.length === 0 && (
            <div className="empty-state">
              <p>Aún no has publicado ningún negocio.</p>
              <button className="button-primary mt-3" onClick={() => setTab('form')}>Crear mi primera ficha</button>
            </div>
          )}
          {businesses.map((b) => {
            const st = BUSINESS_STATUS[b.status] ?? { label: b.status, badge: 'badge-neutral' };
            return (
              <article key={b.id} className="panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-azul">{b.name}</h2>
                    <p className="text-xs text-tinta/55">{b.municipality}, {b.province} · {b.service_type}</p>
                  </div>
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                </div>
                <p className="mt-2 text-sm text-tinta/75">{b.description}</p>
                {b.status === 'approved' && (
                  <Link href={`/negocio/${b.id}`} className="text-link mt-2 inline-flex text-sm">Ver en el catálogo</Link>
                )}
              </article>
            );
          })}
        </div>
      )}

      {tab === 'requests' && (
        <div className="mt-5 space-y-3">
          {requests.length === 0 && (
            <div className="empty-state">
              <p>No hay solicitudes todavía. Cuando un viajero te escriba, aparecerá aquí.</p>
            </div>
          )}
          {requests.map((r) => {
            const st = REQUEST_STATUS_LABEL[r.status];
            return (
              <article key={r.id} className="panel">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-extrabold text-azul">{r.business?.name ?? 'Negocio'}</h2>
                    <p className="text-xs text-tinta/55">
                      {new Date(r.created_at).toLocaleDateString('es-ES')} · Servicio: {r.service_requested || '—'}
                    </p>
                  </div>
                  <span className={`badge ${st.badge}`}>{st.label}</span>
                </div>
                <p className="mt-2 text-sm text-tinta/80">{r.message}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === 'new' && (
                    <RequestStatusButton id={r.id} to="reviewing" onDone={load}>Marcar en revisión</RequestStatusButton>
                  )}
                  {(r.status === 'new' || r.status === 'reviewing') && (
                    <RequestStatusButton id={r.id} to="accepted" onDone={load} variant="primary">Aceptar</RequestStatusButton>
                  )}
                  {r.status === 'accepted' && (
                    <RequestStatusButton id={r.id} to="completed" onDone={load} variant="primary">Marcar completada</RequestStatusButton>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {tab === 'form' && (
        <BusinessForm
          onDone={() => {
            setTab('businesses');
            void load();
          }}
        />
      )}
    </div>
  );
}

function RequestStatusButton({
  id,
  to,
  onDone,
  children,
  variant,
}: {
  id: string;
  to: RequestStatus;
  onDone: () => Promise<void> | void;
  children: React.ReactNode;
  variant?: 'primary';
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col">
      <button
        className={variant === 'primary' ? 'button-primary !py-2 !px-4 text-sm' : 'button-ghost !text-sm'}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          try {
            await setRequestStatus(id, to);
            await onDone();
          } catch (e) {
            setErr(e instanceof Error ? e.message : 'No se pudo actualizar');
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? '…' : children}
      </button>
      {err && <span className="text-xs text-terracota-600 mt-1">{err}</span>}
    </span>
  );
}

const PROVINCES = [
  'Pinar del Río', 'Artemisa', 'Mayabeque', 'La Habana', 'Matanzas', 'Cienfuegos', 'Villa Clara',
  'Sancti Spíritus', 'Ciego de Ávila', 'Camagüey', 'Las Tunas', 'Holguín', 'Granma',
  'Santiago de Cuba', 'Guantánamo', 'Isla de la Juventud',
];

function BusinessForm({ onDone }: { onDone: () => void }) {
  const { userId, profile } = useAuth();
  const [categories, setCategories] = useState(DEMO_CATEGORIES);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  /** Declaración jurada de licencias y aceptación del tratamiento de datos. */
  const [legalAccepted, setLegalAccepted] = useState(false);

  const [form, setForm] = useState<SubmitBusinessInput>({
    name: '',
    host_name: profile?.full_name ?? '',
    description: '',
    host_story: '',
    service_type: 'alojamiento',
    tourism_category: 'alojamiento',
    province: 'La Habana',
    municipality: '',
    photos: [],
    languages: ['español'],
    experience_details: '',
    recommended_for: [],
    lgbt_friendly: false,
    phone: profile?.phone ?? '',
    email: profile?.email ?? '',
    // La licencia ya no se pide en el formulario: la registra el administrador
    // cuando el anfitrión envía la foto por WhatsApp. El tipo se mantiene.
    license_number: '',
  });

  useEffect(() => {
    listCategories()
      .then((cats) => setCategories(cats.filter((c) => c.active)))
      .catch(() => setCategories(DEMO_CATEGORIES));
  }, []);

  const set = <K extends keyof SubmitBusinessInput>(key: K, value: SubmitBusinessInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);

    if (form.name.trim().length < 2) return setError('Ponle un nombre a tu negocio (mínimo 2 caracteres).');
    if (form.description.trim().length < 20) return setError('La descripción debe tener al menos 20 caracteres.');
    if (form.host_story.trim().length < 20) return setError('Cuenta tu historia como anfitrión (mínimo 20 caracteres).');
    if (!form.municipality.trim()) return setError('Indica el municipio.');
    if (form.phone.trim().length < 5) return setError('Indica un teléfono de contacto válido.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('El correo de contacto no es válido.');
    if (!legalAccepted) {
      return setError('Debes marcar la declaración jurada de licencias y la aceptación del tratamiento de datos.');
    }

    if (!userId) return setError('Inicia sesión para publicar un negocio.');
    if (photos.length > 8) return setError('No puedes subir más de 8 fotos.');
    setBusy(true);
    try {
      const photoUrls = userId && supabase ? await uploadBusinessImages(userId, 'pending', photos) : [];
      await submitBusiness(userId, {
        ...form,
        name: form.name.trim(),
        municipality: form.municipality.trim(),
        photos: photoUrls.length ? photoUrls : form.photos,
      });
      // La ficha ya está guardada como «pending»: se abre el chat del
      // administrador con el aviso de revisión y el estado de la licencia.
      window.open(
        whatsappLink(ADMIN_WHATSAPP, mensajeRevisionNegocio(form.name, form.license_number)),
        '_blank',
        'noopener,noreferrer',
      );
      setSuccess(true);
      setTimeout(onDone, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar la ficha');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel mt-5 space-y-4">
      <h2 className="text-xl font-extrabold text-azul">Nueva publicación</h2>
      <p className="text-sm text-tinta/65 -mt-2">Los campos con * son obligatorios. Estado inicial: pendiente de revisión.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="field-label" htmlFor="b-name">Nombre del negocio *</label>
          <input id="b-name" className="field-input" required value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej. Casa junto al Mar" />
        </div>
        <div>
          <label className="field-label" htmlFor="b-host">Nombre del anfitrión *</label>
          <input id="b-host" className="field-input" required value={form.host_name} onChange={(e) => set('host_name', e.target.value)} />
        </div>
        <div>
          <label className="field-label" htmlFor="b-service">Tipo de servicio *</label>
          <select id="b-service" className="field-input" value={form.service_type} onChange={(e) => set('service_type', e.target.value)}>
            {SERVICE_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="b-cat">Categoría turística *</label>
          <select id="b-cat" className="field-input" value={form.tourism_category} onChange={(e) => set('tourism_category', e.target.value)}>
            {categories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="b-province">Provincia *</label>
          <select id="b-province" className="field-input" value={form.province} onChange={(e) => set('province', e.target.value)}>
            {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="b-muni">Municipio *</label>
          <input id="b-muni" className="field-input" required value={form.municipality} onChange={(e) => set('municipality', e.target.value)} placeholder="Ej. Cárdenas" />
        </div>
        <div>
          <label className="field-label" htmlFor="b-phone">Teléfono de contacto *</label>
          <input id="b-phone" className="field-input" required value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+53 5 555 9876" />
        </div>
        <div>
          <label className="field-label" htmlFor="b-email">Correo de contacto *</label>
          <input id="b-email" type="email" className="field-input" required value={form.email} onChange={(e) => set('email', e.target.value)} />
          <p className="field-hint">No se muestra en el catálogo público.</p>
        </div>
      </div>

      {/* Documentación legal: opcional. La licencia no se pide en el formulario
          (es un dato privado que solo registra el administrador); el anfitrión
          la envía por WhatsApp si quiere optar al sello «Verificado». */}
      <div className="rounded-xl border border-arena-2 bg-arena/40 p-3">
        <p className="field-label !mb-1">Documentación legal (opcional)</p>
        <p className="text-sm leading-relaxed text-tinta/75">
          Para obtener el sello de 'Verificado', debe enviar una foto de su licencia legal directamente a nuestro
          WhatsApp de soporte (+53 5 6289645). Este documento es de uso estrictamente confidencial y solo se utiliza
          para comprobar que su negocio opera según dicta la ley.
        </p>
        <a
          href={whatsappLink(
            SUPPORT_WHATSAPP,
            'Hola, quiero enviar la foto de mi licencia legal para obtener el sello de Verificado en Casa Abierta Cuba',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-verde px-4 py-2 text-sm font-bold text-white hover:brightness-95"
        >
          <MessageCircle size={15} aria-hidden /> Enviar mi licencia por WhatsApp
        </a>
      </div>

      <div>
        <label className="field-label" htmlFor="b-photos">Fotos del negocio</label>
        <div className="mt-1 flex flex-wrap gap-2">
          {photoPreview.map((url, i) => (
            <span key={url} className="relative inline-block w-[84px] h-[84px] overflow-hidden rounded-xl border border-arena-2 bg-azul-900">
              <img src={url} alt={`preview ${i}`} className="h-full w-full object-cover" />
              <button
                type="button"
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 text-white text-xs font-semibold hover:bg-black/50"
                onClick={() => {
                  const rest = photos.filter((_, j) => j !== i);
                  setPhotos(rest);
                  setPhotoPreview(photoPreview.filter((_, j) => j !== i));
                }}
              >
                ✕
              </button>
            </span>
          ))}
          <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-xl border-2 border-dashed border-arena-2 bg-white/50 px-3 py-2 text-sm text-tinta/70 hover:bg-white/80 hover:border-arena transition">
            <span className="relative flex h-8 w-8 items-center justify-center">
              <input
                id="b-photos"
                type="file"
                multiple
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (!files.length) return;
                  setPhotos((prev) => [...prev, ...files]);
                  setPhotoPreview((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
                  e.target.value = '';
                }}
              />
              <svg className="h-4 w-4 text-arena" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </span>
            Añadir fotos
          </label>
        </div>
        <p className="mt-1 text-xs text-tinta/60">Puedes subir hasta 8 fotos. Las últimas subidas se usarán como portada del catálogo.</p>
      </div>

      <div>
        <label className="field-label" htmlFor="b-desc">Descripción del negocio *</label>
        <textarea id="b-desc" className="field-input" rows={3} required value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="20 a 1200 caracteres: qué ofreces, qué incluye, ambiente…" />
        <p className="field-hint">{form.description.length}/1200 caracteres (mínimo 20)</p>
      </div>

      <div>
        <label className="field-label" htmlFor="b-story">Conoce a tu anfitrión *</label>
        <textarea id="b-story" className="field-input" rows={3} required value={form.host_story} onChange={(e) => set('host_story', e.target.value)} placeholder="Tu historia, tu casa, tu barrio…" />
        <p className="field-hint">{form.host_story.length}/1200 caracteres (mínimo 20)</p>
      </div>

      <div>
        <label className="field-label" htmlFor="b-exp">Detalles de la experiencia</label>
        <textarea id="b-exp" className="field-input" rows={2} value={form.experience_details} onChange={(e) => set('experience_details', e.target.value)} placeholder="Actividades, idiomas, qué incluye…" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="field-label" htmlFor="b-langs">Idiomas</label>
        <input
          id="b-langs"
          className="field-input"
          value={form.languages.join(', ')}
          onChange={(e) => set('languages', parseTagList(e.target.value))}
          placeholder="ej. español, inglés, francés"
        />
        <p className="field-hint">Separa con comas o puntos; el formulario acepta ambos al guardar.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="b-rec">Recomendado para</label>
        <input
          id="b-rec"
          className="field-input"
          value={form.recommended_for.join(', ')}
          onChange={(e) => set('recommended_for', parseTagList(e.target.value))}
          placeholder="ej. parejas, familias, grupos"
        />
        <p className="field-hint">Separa con comas o puntos; el formulario acepta ambos al guardar.</p>
      </div>
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-semibold">
        <input type="checkbox" checked={form.lgbt_friendly} onChange={(e) => set('lgbt_friendly', e.target.checked)} />
        Ofrecemos un entorno LGBT friendly (declaración de servicio, no es una certificación oficial)
      </label>

      <label className="flex items-start gap-2 rounded-xl border-2 border-verde-600/40 bg-verde/5 p-3 text-sm font-semibold text-tinta">
        <input
          type="checkbox"
          required
          className="mt-0.5"
          checked={legalAccepted}
          onChange={(e) => setLegalAccepted(e.target.checked)}
        />
        <span>
          Declaro bajo juramento que cuento con las licencias y permisos legales vigentes para operar, y acepto la
          política de tratamiento de datos personales.
        </span>
      </label>

      <AvisoError mensaje={error} />
      {success && <p className="form-success">¡Ficha enviada! La revisaremos y te avisaremos su estado.</p>}

      <button className="button-primary" disabled={busy || !legalAccepted} type="submit">
        {busy ? 'Enviando…' : 'Enviar a revisión'}
      </button>
      {!legalAccepted && (
        <p className="text-xs text-tinta/60">
          Para enviar la ficha necesitas aceptar la declaración jurada y el tratamiento de datos.
        </p>
      )}
    </form>
  );
}

/** Convierte un texto libre en lista de etiquetas.
 *  Acepta comas y/o puntos como separadores; elimina vacíos y normaliza espacios.
 *  Este helper vive aquí para que el input de idiomas/recomendado sea libre
 *  durante la edición (puede escribir comas y espacios sin efecto adverso).
 */
function parseTagList(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,.]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function PaymentButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    setBusy(true);
    setError(null);
    try {
      if (!supabase) {
        setError('Supabase no configurado');
        return;
      }
      const amount = 10; // Monto ejemplo para destacar negocio
      const remoteId = `cac_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const returnUrl = `${window.location.origin}/payment/success`;
      const cancelUrl = `${window.location.origin}/payment/cancel`;

      const { data, error } = await supabase.functions.invoke('qvapay-checkout', {
        body: {
          amount,
          description: 'Destacar negocio en Casa Abierta Cuba',
          remote_id: remoteId,
          return_url: returnUrl,
          cancel_url: cancelUrl,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió URL de pago');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error iniciando pago');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button className="button-primary" disabled={busy} onClick={handlePayment} type="button">
        {busy ? 'Generando pago…' : 'Destacar mi negocio (QvaPay)'}
      </button>
      {error && <span className="text-xs text-terracota-600">{error}</span>}
      <span className="text-xs text-tinta/60">
        ¿No dispones de QvaPay? Comunícate con la administración de Casa Abierta Cuba para coordinar otra forma de pago.
      </span>
    </div>
  );
}
