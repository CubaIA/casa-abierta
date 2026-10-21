import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { CheckCircle2, Flag, Inbox, MessageSquare, RefreshCw, Star, Users, XCircle } from 'lucide-react';
import {
  adminDeleteBusiness,
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
  const { rows: businesses, err, reload, patch } = useAdminData<Business[]>(adminListAllBusinesses);
  const [savingId, setSavingId] = useState<string | null>(null);

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
        </article>
      ))}
    </div>
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
