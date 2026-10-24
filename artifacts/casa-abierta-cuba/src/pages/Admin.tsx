import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Flag, Inbox, MessageSquare, Pencil, Plus, RefreshCw, Star, Users, XCircle } from 'lucide-react';
import {
  adminDeleteBusiness,
  adminEditBusiness,
  adminGetRequestContact,
  adminListAllBusinesses,
  adminListAllRequests,
  adminListContactMessages,
  adminListReports,
  adminListUsers,
  adminSetBusinessFeatured,
  adminSetBusinessStatus,
  adminSetContactMessageStatus,
  adminSetReportStatus,
  adminSetRequestStatus,
  adminSetUserRole,
  adminSetUserStatus,
} from '@/lib/marketplace';
import { removeBusinessImages, uploadBusinessImages } from '@/lib/storage';
import { resolvePhotos } from '@/lib/images';
import { supabase } from '@/lib/supabase';
import type { Business, BusinessRow, ContactMessage, Profile, Report, RequestStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AdminLayout, type AdminTabItem } from '@/components/AdminLayout';

type Tab = 'businesses' | 'users' | 'requests' | 'reports' | 'messages';

/** Secciones del panel mostradas en la sidebar de administración. */
const ADMIN_TABS: AdminTabItem[] = [
  { key: 'businesses', label: 'Negocios', icon: CheckCircle2 },
  { key: 'users', label: 'Usuarios', icon: Users },
  { key: 'requests', label: 'Solicitudes', icon: MessageSquare },
  { key: 'reports', label: 'Reportes', icon: Flag },
  { key: 'messages', label: 'Mensajes', icon: Inbox },
];

export default function Admin() {
  const { userId, profile, loading } = useAuth();
  const [tab, setTab] = useState<Tab>('businesses');
  const [error, setError] = useState<string | null>(null);

  if (!loading && (!userId || profile?.role !== 'admin')) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Esta sección es solo para administradores.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar como admin</Link>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout items={ADMIN_TABS} active={tab} onSelect={(key) => setTab(key as Tab)}>
      {error && <p className="form-error mb-4" role="alert">{error}</p>}
      {tab === 'businesses' && <BusinessesTab onError={setError} />}
      {tab === 'users' && <UsersTab onError={setError} />}
      {tab === 'requests' && <RequestsTab onError={setError} />}
      {tab === 'reports' && <ReportsTab onError={setError} />}
      {tab === 'messages' && <MessagesTab onError={setError} />}
    </AdminLayout>
  );
}

/** Carga de datos con recarga manual, compartida por las pestañas. */
function useAdminData<T>(loader: () => Promise<T>) {
  const [rows, setRows] = useState<T | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setErr(null);
    loader()
      .then((v) => {
        if (!cancelled) setRows(v);
      })
      .catch((e: unknown) => {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Error cargando datos');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  /** Actualiza las filas ya cargadas sin volver a consultar el servidor. */
  const patch = useCallback((updater: (prev: T) => T) => {
    setRows((prev) => (prev === null ? prev : updater(prev)));
  }, []);

  return { rows, err, reload, patch };
}

function wrap(fn: () => Promise<void>, onError: (m: string | null) => void, reload: () => void) {
  return async () => {
    onError(null);
    try {
      await fn();
      reload();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Operación no completada');
    }
  };
}

/* ---------------- Negocios ---------------- */

function BusinessesTab({ onError }: { onError: (m: string | null) => void }) {
  const { userId } = useAuth();
  const { rows: businesses, err, reload, patch } = useAdminData<Business[]>(adminListAllBusinesses);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  /** Alterna Premium de forma optimista y revierte si Supabase falla. */
  const toggleFeatured = async (business: Business) => {
    const next = business.featured !== true;
    const previous = business.featured ?? null;
    onError(null);
    setSavingId(business.id);
    patch((prev) => prev.map((b) => (b.id === business.id ? { ...b, featured: next } : b)));
    try {
      await adminSetBusinessFeatured(business.id, next);
    } catch (e) {
      patch((prev) => prev.map((b) => (b.id === business.id ? { ...b, featured: previous } : b)));
      onError(e instanceof Error ? e.message : 'No se pudo actualizar Premium');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button className="button-ghost" onClick={reload}><RefreshCw size={14} /> Actualizar</button>
      </div>
      {err && <p className="form-error">{err}</p>}
      {businesses === null && !err && <div className="empty-state">Cargando…</div>}
      {businesses?.length === 0 && <div className="empty-state">No hay negocios registrados.</div>}
      {businesses?.map((b) => (
        <article key={b.id} className="panel">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-extrabold text-azul">{b.name}</h2>
              <p className="text-xs text-tinta/55">{b.municipality}, {b.province} · {b.service_type} · {b.status}</p>
            </div>
            <span className={`badge ${b.status === 'approved' ? 'badge-green' : b.status === 'pending' ? 'badge-gold' : 'badge-red'}`}>
              {b.status}
            </span>
          </div>
          <p className="mt-2 text-sm text-tinta/75">{b.description}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={`button-ghost !text-sm ${editId === b.id ? '!bg-azul !text-white !border-azul' : ''}`}
              aria-expanded={editId === b.id}
              onClick={() => setEditId(editId === b.id ? null : b.id)}
            >
              <Pencil size={14} /> Editar
            </button>
            {b.status !== 'approved' && (
              <button
                className="button-primary !py-1.5 !px-3 text-sm"
                onClick={wrap(() => adminSetBusinessStatus(b.id, 'approved'), onError, reload)}
              >
                Aprobar
              </button>
            )}
            {b.status !== 'rejected' && (
              <button
                className="button-ghost !text-sm !text-terracota-600 !border-terracota-500"
                onClick={wrap(() => adminSetBusinessStatus(b.id, 'rejected'), onError, reload)}
              >
                Rechazar
              </button>
            )}
            {b.status !== 'suspended' && (
              <button
                className="button-ghost !text-sm"
                onClick={wrap(() => adminSetBusinessStatus(b.id, 'suspended'), onError, reload)}
              >
                Suspender
              </button>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={b.featured === true}
              aria-label={`Premium: ${b.name}`}
              title={b.featured === true ? 'Quitar Premium' : 'Marcar como Premium'}
              disabled={savingId === b.id}
              className={`button-ghost !text-sm ${
                b.featured === true ? '!bg-yellow-500 !border-yellow-500 !text-black' : ''
              } ${savingId === b.id ? 'opacity-60' : ''}`}
              onClick={() => toggleFeatured(b)}
            >
              <Star size={14} fill={b.featured === true ? 'currentColor' : 'none'} /> Premium
            </button>
            <button
              className="button-ghost !text-sm !text-terracota-600 !border-terracota-500"
              onClick={wrap(async () => {
                if (confirm(`¿Eliminar "${b.name}" de forma permanente?`)) await adminDeleteBusiness(b.id);
              }, onError, reload)}
            >
              <XCircle size={14} /> Eliminar
            </button>
          </div>
          {editId === b.id && (
            <BusinessEditor
              business={b}
              ownerId={userId}
              onError={onError}
              onCancel={() => setEditId(null)}
              onSaved={(next) => {
                patch((prev) => prev.map((x) => (x.id === b.id ? { ...x, ...next } : x)));
                setEditId(null);
              }}
            />
          )}
        </article>
      ))}
    </div>
  );
}

/* ---------------- Edición de un negocio ---------------- */

/** Fotos nuevas seleccionadas por el admin, con su preview local. */
interface FotoNueva {
  file: File;
  preview: string;
}

/** Editor inline de descripción, WhatsApp y fotos de un negocio. */
function BusinessEditor({
  business,
  ownerId,
  onError,
  onCancel,
  onSaved,
}: {
  business: Business;
  ownerId: string | null;
  onError: (m: string | null) => void;
  onCancel: () => void;
  onSaved: (next: Partial<Business>) => void;
}) {
  const [description, setDescription] = useState(business.description ?? '');
  const [phone, setPhone] = useState(
    String((business as Business & { phone?: string | null }).phone ?? ''),
  );
  const [fotos, setFotos] = useState<string[]>(resolvePhotos(business));
  const [quitadas, setQuitadas] = useState<string[]>([]);
  const [nuevas, setNuevas] = useState<FotoNueva[]>([]);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // El teléfono no viene en la lista del admin (columna acotada): se intenta leer aparte.
  useEffect(() => {
    if (!supabase) return;
    let vivo = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('businesses')
          .select('phone')
          .eq('id', business.id)
          .maybeSingle();
        if (!vivo || error || !data) return;
        const valor = (data as { phone?: string | null }).phone;
        if (valor) setPhone((prev) => (prev.trim() ? prev : String(valor)));
      } catch {
        // Columna no legible en este proyecto: el admin puede escribirla a mano.
      }
    })();
    return () => {
      vivo = false;
    };
  }, [business.id]);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setLocalErr(null);
    onError(null);

    const desc = description.trim();
    if (desc.length < 10) {
      setLocalErr('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    if (fotos.length === 0 && nuevas.length === 0) {
      setLocalErr('El negocio necesita al menos una foto.');
      return;
    }

    setBusy(true);
    try {
      let subidas: string[] = [];
      if (nuevas.length) {
        if (!supabase || !ownerId) {
          throw new Error('No hay sesión con Supabase: no se pueden subir fotos.');
        }
        subidas = await uploadBusinessImages(ownerId, business.id, nuevas.map((n) => n.file));
        if (!subidas.length) {
          throw new Error('No se pudieron subir las fotos: comprueba el formato (jpg/png/webp) y el tamaño.');
        }
      }
      const finales = [...fotos, ...subidas];
      await adminEditBusiness(business.id, { description: desc, phone, images: finales });
      if (quitadas.length) void removeBusinessImages(quitadas);
      nuevas.forEach((n) => URL.revokeObjectURL(n.preview));
      onSaved({ description: desc, images: finales, photos: finales });
    } catch (err) {
      setLocalErr(err instanceof Error ? err.message : 'No se pudo guardar la edición');
    } finally {
      setBusy(false);
    }
  }

  const quitarFoto = (i: number) => {
    const url = fotos[i];
    setFotos(fotos.filter((_, j) => j !== i));
    setQuitadas((prev) => [...prev, url]);
  };

  const quitarNueva = (i: number) => {
    URL.revokeObjectURL(nuevas[i].preview);
    setNuevas(nuevas.filter((_, j) => j !== i));
  };

  return (
    <form onSubmit={guardar} className="mt-3 space-y-4 rounded-xl border border-arena-2 bg-arena/50 p-4">
      <div>
        <label className="field-label" htmlFor={`edit-desc-${business.id}`}>Descripción</label>
        <textarea
          id={`edit-desc-${business.id}`}
          className="field-input"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="20 a 1200 caracteres: qué ofreces, qué incluye, ambiente…"
        />
        <p className="field-hint">{description.trim().length}/1200 caracteres</p>
      </div>

      <div>
        <label className="field-label" htmlFor={`edit-phone-${business.id}`}>WhatsApp / teléfono de contacto</label>
        <input
          id={`edit-phone-${business.id}`}
          className="field-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+53 5 555 9876"
        />
        <p className="field-hint">Déjalo vacío o igual para no modificarlo.</p>
      </div>

      <div>
        <span className="field-label">Fotos del negocio</span>
        <div className="mt-1 flex flex-wrap gap-2">
          {fotos.map((url, i) => (
            <span
              key={url}
              className="relative inline-block h-20 w-20 overflow-hidden rounded-xl border border-arena-2 bg-azul-900"
            >
              <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-0 top-0 rounded-br-md bg-azul px-1 py-0.5 text-[9px] font-extrabold uppercase text-white">
                  Portada
                </span>
              )}
              <button
                type="button"
                aria-label={`Quitar foto ${i + 1}`}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 text-sm font-semibold text-white hover:bg-black/50"
                onClick={() => quitarFoto(i)}
              >
                ✕
              </button>
            </span>
          ))}
          {nuevas.map((n, i) => (
            <span
              key={n.preview}
              className="relative inline-block h-20 w-20 overflow-hidden rounded-xl border-2 border-dashed border-azul bg-azul-900"
            >
              <img src={n.preview} alt={`Foto nueva ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute left-0 top-0 rounded-br-md bg-verde px-1 py-0.5 text-[9px] font-extrabold uppercase text-white">
                Nueva
              </span>
              <button
                type="button"
                aria-label={`Quitar foto nueva ${i + 1}`}
                className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/30 text-sm font-semibold text-white hover:bg-black/50"
                onClick={() => quitarNueva(i)}
              >
                ✕
              </button>
            </span>
          ))}
          <label className="cursor-pointer inline-flex items-center gap-1.5 self-start rounded-xl border-2 border-dashed border-arena-2 bg-white/60 px-3 py-2 text-sm text-tinta/70 transition hover:border-arena hover:bg-white">
            <input
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                setNuevas((prev) => [
                  ...prev,
                  ...files.map((f) => ({ file: f, preview: URL.createObjectURL(f) })),
                ]);
                e.target.value = '';
              }}
            />
            <Plus size={16} aria-hidden /> Añadir fotos
          </label>
        </div>
        <p className="mt-1 text-xs text-tinta/60">
          La primera foto es la portada del catálogo. Las fotos que quites se borran también del almacenamiento al guardar.
        </p>
      </div>

      {localErr && <p className="form-error" role="alert">{localErr}</p>}

      <div className="flex flex-wrap gap-2">
        <button className="button-primary !py-1.5 !px-3 text-sm" type="submit" disabled={busy}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button className="button-ghost !text-sm" type="button" onClick={onCancel} disabled={busy}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

/* ---------------- Usuarios ---------------- */

function UsersTab({ onError }: { onError: (m: string | null) => void }) {
  const { userId: myId } = useAuth();
  const { rows: users, err, reload } = useAdminData<Profile[]>(adminListUsers);

  return (
    <div className="space-y-3">
      {err && <p className="form-error">{err}</p>}
      {users === null && !err && <div className="empty-state">Cargando…</div>}
      {users?.map((u) => (
        <article key={u.id} className="panel !p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-azul">{u.full_name || 'Sin nombre'}</p>
            <p className="text-xs text-tinta/55">{u.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'provider' ? 'badge-blue' : 'badge-neutral'}`}>
              {u.role}
            </span>
            <span className={`badge ${(u.account_status ?? 'active') === 'active' ? 'badge-green' : 'badge-red'}`}>
              {u.account_status ?? 'active'}
            </span>
            {u.id !== myId && (
              <>
                <button
                  className="button-ghost !text-xs !py-1 !px-2.5"
                  onClick={wrap(
                    () => adminSetUserRole(u.id, u.role === 'admin' ? 'traveler' : 'admin'),
                    onError,
                    reload,
                  )}
                >
                  {u.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                </button>
                <button
                  className="button-ghost !text-xs !py-1 !px-2.5"
                  onClick={wrap(
                    () => adminSetUserStatus(u.id, (u.account_status ?? 'active') === 'active' ? 'suspended' : 'active'),
                    onError,
                    reload,
                  )}
                >
                  {(u.account_status ?? 'active') === 'active' ? 'Suspender' : 'Reactivar'}
                </button>
              </>
            )}
          </div>
        </article>
      ))}
      <p className="field-hint">
        En producción los roles y estados se modifican con RPCs protegidas (admin_set_user_role / admin_set_user_status);
        el registro público nunca puede autoasignarse admin.
      </p>
    </div>
  );
}

/* ---------------- Solicitudes ---------------- */

const ADMIN_REQUEST_STATUSES: RequestStatus[] = ['new', 'reviewing', 'accepted', 'completed', 'cancelled'];

function RequestsTab({ onError }: { onError: (m: string | null) => void }) {
  const { rows: requests, err, reload } = useAdminData<BusinessRow[]>(adminListAllRequests);

  return (
    <div className="space-y-3">
      {err && <p className="form-error">{err}</p>}
      {requests === null && !err && <div className="empty-state">Cargando…</div>}
      {requests?.length === 0 && (
        <div className="empty-state"><Inbox size={24} className="mx-auto mb-2 opacity-50" />No hay solicitudes.</div>
      )}
      {requests?.map((r) => (
        <RequestCard key={r.id} row={r} onError={onError} reload={reload} />
      ))}
    </div>
  );
}

function RequestCard({
  row,
  onError,
  reload,
}: {
  row: BusinessRow;
  onError: (m: string | null) => void;
  reload: () => void;
}) {
  const [contact, setContact] = useState<string | null>(null);

  return (
    <article className="panel !p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-extrabold text-azul">{row.business?.name ?? 'Negocio'}</h2>
          <p className="text-xs text-tinta/55">
            {new Date(row.created_at).toLocaleString('es-ES')} · Servicio: {row.service_requested || '—'}
          </p>
        </div>
        <span className="badge badge-blue">{row.status}</span>
      </div>
      <p className="mt-2 text-sm text-tinta/80">{row.message}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          className="field-input !w-auto !py-1.5 text-sm"
          aria-label={`Estado de la solicitud ${row.id.slice(0, 8)}`}
          value={row.status}
          onChange={async (e) => {
            onError(null);
            try {
              await adminSetRequestStatus(row.id, e.target.value as RequestStatus);
              reload();
            } catch (err) {
              onError(err instanceof Error ? err.message : 'No se pudo cambiar el estado');
            }
          }}
        >
          {ADMIN_REQUEST_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button
          className="button-ghost !text-xs !py-1 !px-2.5"
          onClick={async () => {
            onError(null);
            try {
              setContact(await adminGetRequestContact(row.id));
            } catch (err) {
              onError(err instanceof Error ? err.message : 'No se pudo leer el contacto');
            }
          }}
        >
          Ver contacto del viajero
        </button>
        {contact !== null && <span className="badge badge-gold">{contact || 'sin correo guardado'}</span>}
      </div>
    </article>
  );
}

/* ---------------- Reportes ---------------- */

function ReportsTab({ onError }: { onError: (m: string | null) => void }) {
  const { rows: reports, err, reload } = useAdminData<Report[]>(adminListReports);

  return (
    <div className="space-y-3">
      {err && <p className="form-error">{err}</p>}
      {reports === null && !err && <div className="empty-state">Cargando…</div>}
      {reports?.length === 0 && (
        <div className="empty-state"><Flag size={24} className="mx-auto mb-2 opacity-50" />No hay reportes.</div>
      )}
      {reports?.map((r) => (
        <article key={r.id} className="panel !p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-azul">Reporte de negocio{r.business_id ? '' : ' (sin negocio)'}</p>
            <span className={`badge ${r.status === 'resolved' ? 'badge-green' : r.status === 'open' ? 'badge-red' : 'badge-gold'}`}>
              {r.status}
            </span>
          </div>
          {r.business_id && (
            <p className="mt-1 text-sm text-tinta/80">
              Negocio: <Link href={`/negocio/${r.business_id}`} className="text-link">ver ficha</Link>
            </p>
          )}
          <p className="text-xs text-tinta/50">{new Date(r.created_at).toLocaleString('es-ES')}</p>
          {r.status !== 'resolved' && r.status !== 'dismissed' && (
            <div className="mt-2 flex gap-2">
              <button className="button-ghost !text-xs !py-1 !px-2.5" onClick={wrap(() => adminSetReportStatus(r.id, 'reviewing'), onError, reload)}>
                En revisión
              </button>
              <button className="button-primary !text-xs !py-1 !px-2.5" onClick={wrap(() => adminSetReportStatus(r.id, 'resolved'), onError, reload)}>
                Resolver
              </button>
              <button className="button-ghost !text-xs !py-1 !px-2.5" onClick={wrap(() => adminSetReportStatus(r.id, 'dismissed'), onError, reload)}>
                Descartar
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

/* ---------------- Mensajes ---------------- */

function MessagesTab({ onError }: { onError: (m: string | null) => void }) {
  const { rows: messages, err, reload } = useAdminData<ContactMessage[]>(adminListContactMessages);

  return (
    <div className="space-y-3">
      {err && <p className="form-error">{err}</p>}
      {messages === null && !err && <div className="empty-state">Cargando…</div>}
      {messages?.length === 0 && (
        <div className="empty-state"><Inbox size={24} className="mx-auto mb-2 opacity-50" />No hay mensajes.</div>
      )}
      {messages?.map((m) => (
        <article key={m.id} className="panel !p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-bold text-azul">{m.subject}</p>
            <span className={`badge ${m.status === 'resolved' ? 'badge-green' : m.status === 'open' ? 'badge-red' : 'badge-gold'}`}>
              {m.status}
            </span>
          </div>
          <p className="text-xs text-tinta/55">{m.name} · {m.email} · {new Date(m.created_at).toLocaleString('es-ES')}</p>
          <p className="mt-1.5 text-sm text-tinta/80">{m.message}</p>
          {m.status === 'open' && (
            <div className="mt-2 flex gap-2">
              <button className="button-ghost !text-xs !py-1 !px-2.5" onClick={wrap(() => adminSetContactMessageStatus(m.id, 'reviewing'), onError, reload)}>
                En revisión
              </button>
              <button className="button-primary !text-xs !py-1 !px-2.5" onClick={wrap(() => adminSetContactMessageStatus(m.id, 'resolved'), onError, reload)}>
                Resolver
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
