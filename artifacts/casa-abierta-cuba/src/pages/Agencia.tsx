import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { Building2, CalendarCheck, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { listMyBusinesses } from '@/lib/marketplace';
import { actualizarEstadoLead, listarLeadsDeNegocios, reasignarLead } from '@/lib/leads';
import type { Business, Lead, LeadStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { esMasterAgent } from '@/lib/roles';
import { AvisoError } from '@/components/AvisoError';

const ESTADO: Record<LeadStatus, { label: string; badge: string }> = {
  pending: { label: 'Pendiente', badge: 'badge-gold' },
  contacted: { label: 'Contactado', badge: 'badge-blue' },
  booked: { label: 'Reservado', badge: 'badge-green' },
};

/**
 * Panel de agencia (Master Agent) para socios B2B.
 *
 * Reúne las solicitudes de reserva de todas las casas del socio, muestra
 * métricas básicas y permite reasignar cada cliente a la casa que
 * corresponda (actualiza el `business_id` del lead).
 */
export default function Agencia() {
  const { userId, profile, loading } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const [asignando, setAsignando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!userId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    try {
      const casas = await listMyBusinesses(userId);
      setBusinesses(casas);
      setLeads(await listarLeadsDeNegocios(casas.map((b) => b.id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el panel de agencia');
    } finally {
      setCargando(false);
    }
  }, [userId]);

  useEffect(() => {
    document.title = 'Panel de agencia | Casa Abierta Cuba';
    if (!loading) void cargar();
  }, [loading, cargar]);

  const cambiarEstado = async (id: string, status: LeadStatus) => {
    setError(null);
    try {
      await actualizarEstadoLead(id, status);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo actualizar la solicitud');
    }
  };

  const asignarCasa = async (lead: Lead, businessId: string) => {
    if (!businessId || businessId === lead.business_id) return;
    setError(null);
    setAsignando(lead.id);
    try {
      await reasignarLead(lead.id, businessId);
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo asignar la casa');
    } finally {
      setAsignando(null);
    }
  };

  if (loading || cargando) {
    return (
      <div className="page-shell">
        <div className="empty-state">Cargando panel de agencia…</div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Este panel es para socios con varias casas. Inicia sesión para entrar.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar</Link>
        </div>
      </div>
    );
  }

  const esMaster = esMasterAgent(profile?.role) || businesses.length > 1;

  if (!esMaster) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Este panel es para agencias y socios con varias casas.</p>
          <p className="mt-1 text-sm text-tinta/60">
            Si gestionas más de un negocio y no lo ves aquí, pide al equipo que active tu perfil de agencia.
          </p>
          <Link href="/anfitrion" className="button-ghost mt-3 inline-flex">Ir a mi panel</Link>
        </div>
      </div>
    );
  }

  const nombreDe = (id: string) =>
    businesses.find((b) => b.id === id)?.name ?? 'Casa sin nombre';

  const pendientes = leads.filter((l) => l.status === 'pending').length;
  const reservados = leads.filter((l) => l.status === 'booked').length;

  return (
    <div className="page-shell">
      <p className="section-kicker">Agencia</p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold text-azul">Panel máster</h1>
          <p className="mt-2 text-tinta/70">
            Gestiona las solicitudes de tu red de casas y asígnalas al alojamiento que corresponda.
          </p>
        </div>
        <button className="button-ghost" onClick={() => void cargar()}>
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      <AvisoError mensaje={error} className="mt-4" />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="panel !p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-tinta/60">
            <CalendarCheck size={14} aria-hidden /> Total de leads
          </p>
          <p className="mt-1 text-3xl font-extrabold text-azul">{leads.length}</p>
        </div>
        <div className="panel !p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-tinta/60">
            <Clock size={14} aria-hidden /> Pendientes
          </p>
          <p className="mt-1 text-3xl font-extrabold text-dorado">{pendientes}</p>
        </div>
        <div className="panel !p-4">
          <p className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-tinta/60">
            <CheckCircle2 size={14} aria-hidden /> Reservados
          </p>
          <p className="mt-1 text-3xl font-extrabold text-verde-700">{reservados}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Building2 size={16} aria-hidden className="text-azul" />
        <p className="text-sm font-semibold text-tinta/70">
          {businesses.length} casa{businesses.length === 1 ? '' : 's'} en tu red
        </p>
      </div>

      <div className="mt-3 space-y-3">
        {leads.length === 0 && (
          <div className="empty-state">Todavía no hay solicitudes para tus casas.</div>
        )}
        {leads.map((l) => {
          const estado = ESTADO[l.status] ?? ESTADO.pending;
          return (
            <article key={l.id} className="panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-extrabold text-azul">{l.tourist_name || 'Visitante'}</h2>
                  <p className="text-xs text-tinta/55">
                    {nombreDe(l.business_id)} · {new Date(l.created_at).toLocaleString('es-ES')}
                  </p>
                </div>
                <span className={`badge ${estado.badge}`}>{estado.label}</span>
              </div>

              <div className="mt-2 grid gap-1 text-sm text-tinta/80 sm:grid-cols-2">
                <p>Llegada: <strong>{l.check_in ?? '—'}</strong></p>
                <p>Salida: <strong>{l.check_out ?? '—'}</strong></p>
                <p>Huéspedes: <strong>{l.guests ?? '—'}</strong></p>
                <p>Presupuesto: <strong>{l.budget ?? 'A consultar'}</strong></p>
                <p>WhatsApp: <a className="text-link" href={`tel:${l.tourist_phone}`}>{l.tourist_phone}</a></p>
                <p>Email: <a className="text-link" href={`mailto:${l.tourist_email}`}>{l.tourist_email}</a></p>
              </div>

              {l.message && <p className="mt-2 text-sm text-tinta/75">{l.message}</p>}

              <div className="mt-3 flex flex-wrap items-end gap-3">
                <label className="min-w-[220px]">
                  <span className="field-label">Asignar a</span>
                  <select
                    className="field-input"
                    value={l.business_id}
                    disabled={asignando === l.id}
                    onChange={(e) => void asignarCasa(l, e.target.value)}
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </label>

                <div className="flex flex-wrap gap-2">
                  {l.status === 'pending' && (
                    <button className="button-ghost !text-xs !py-1 !px-2.5" onClick={() => void cambiarEstado(l.id, 'contacted')}>
                      Marcar contactado
                    </button>
                  )}
                  {l.status !== 'booked' && (
                    <button className="button-primary !text-xs !py-1 !px-2.5" onClick={() => void cambiarEstado(l.id, 'booked')}>
                      Marcar reservado
                    </button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
