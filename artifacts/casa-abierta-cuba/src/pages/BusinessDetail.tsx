import { useCallback, useEffect, useState } from 'react';
import { useLocation, useParams } from 'wouter';
import { ArrowLeft, Flag, Heart, MapPin, Send, Star, Users } from 'lucide-react';
import {
  createReport,
  createRequest,
  getBusiness,
  listFavoriteIds,
  listReviews,
  toggleFavorite,
} from '@/lib/marketplace';
import type { Business, Review } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { SERVICE_TYPES } from '@/lib/marketplace';

export default function BusinessDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';
  const [, navigate] = useLocation();
  const { userId, profile } = useAuth();

  const [business, setBusiness] = useState<Business | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [requestOpen, setRequestOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [serviceRequested, setServiceRequested] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const b = await getBusiness(id);
      if (!b) {
        setStatus('error');
        setErrorMessage('No encontramos ese negocio. Puede que haya sido retirado del catálogo.');
        return;
      }
      setBusiness(b);
      setReviews(await listReviews(id));
      if (userId) {
        const ids = await listFavoriteIds(userId);
        setFavorite(ids.includes(id));
      }
      setStatus('ready');
    } catch (e) {
      setStatus('error');
      setErrorMessage(e instanceof Error ? e.message : 'Error cargando el negocio');
    }
  }, [id, userId]);

  useEffect(() => {
    if (!id) return;
    void load();
  }, [id, load]);

  useEffect(() => {
    if (business) document.title = `${business.name} | Casa Abierta Cuba`;
  }, [business]);

  async function onFavorite() {
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      const next = await toggleFavorite(userId, id);
      setFavorite(next);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : 'No se pudo actualizar el favorito');
    }
  }

  async function onRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !profile) {
      navigate('/entrar');
      return;
    }
    setRequestError(null);
    if (message.trim().length < 10) {
      setRequestError('Cuéntanos un poco más (mínimo 10 caracteres).');
      return;
    }
    setSending(true);
    try {
      await createRequest({
        requesterId: userId,
        businessId: id,
        message: message.trim(),
        serviceRequested: serviceRequested || business?.service_type || '',
        contactEmail: profile.email,
      });
      setSent(true);
      setMessage('');
    } catch (e) {
      setRequestError(e instanceof Error ? e.message : 'No se pudo enviar la solicitud');
    } finally {
      setSending(false);
    }
  }

  async function onReport(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      navigate('/entrar');
      return;
    }
    try {
      await createReport({ reporterId: userId, targetType: 'business', targetId: id, reason: reportReason.trim() });
      setReportSent(true);
      setReportReason('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'No se pudo enviar el reporte');
    }
  }

  if (status === 'loading') {
    return <div className="page-shell"><div className="empty-state">Cargando ficha…</div></div>;
  }

  if (status === 'error' || !business) {
    return (
      <div className="page-shell">
        <p className="form-error" role="alert">{errorMessage}</p>
        <button className="button-ghost mt-4" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Volver al catálogo
        </button>
      </div>
    );
  }

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <div className="page-shell">
      <button className="button-ghost mb-5" onClick={() => navigate('/')}>
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {business.photos[0] ? (
            <img
              src={business.photos[0]}
              alt={business.name}
              className="w-full h-64 sm:h-80 object-cover rounded-2xl border border-arena-2"
            />
          ) : (
            <div className="business-visual !h-56 rounded-2xl border border-arena-2">
              <span aria-hidden className="text-6xl">🏠</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="badge badge-blue">{business.service_type}</span>
            {business.lgbt_friendly && <span className="badge badge-green">LGBT friendly</span>}
            {avg !== null && (
              <span className="badge badge-gold inline-flex items-center gap-1">
                <Star size={12} className="fill-current" /> {avg.toFixed(1)} · {reviews.length} reseña{reviews.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-azul">{business.name}</h1>
          <p className="mt-1 text-tinta/60 inline-flex items-center gap-1">
            <MapPin size={15} /> {business.municipality}, {business.province}
          </p>

          <p className="mt-4 text-tinta/85 leading-relaxed">{business.description}</p>

          <section className="panel mt-6">
            <h2 className="text-lg font-extrabold text-azul">Conoce a tu anfitrión</h2>
            <p className="mt-1 font-semibold">{business.host_name}</p>
            <p className="mt-2 text-sm text-tinta/75 leading-relaxed">{business.host_story}</p>
            {business.experience_details && (
              <p className="mt-3 text-sm text-tinta/75 leading-relaxed">{business.experience_details}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-tinta/70">
              {business.languages.length > 0 && (
                <span className="inline-flex items-center gap-1">🌐 {business.languages.join(', ')}</span>
              )}
              {business.recommended_for.length > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Users size={15} /> Recomendado para: {business.recommended_for.join(', ')}
                </span>
              )}
            </div>
          </section>

          <section className="mt-6" aria-label="Reseñas">
            <h2 className="text-lg font-extrabold text-azul">Reseñas de viajeros</h2>
            {reviews.length === 0 ? (
              <p className="mt-2 text-sm text-tinta/60">
                Aún no hay reseñas. Las reseñas se escriben al completar una solicitud.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="panel !p-4">
                    <div className="flex items-center gap-1 text-dorado" aria-label={`${r.rating} de 5`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} className={i < r.rating ? 'fill-dorado' : 'opacity-30'} />
                      ))}
                    </div>
                    <p className="mt-1.5 text-sm text-tinta/80">{r.comment}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <div className="mt-6">
            <button
              className="text-sm text-terracota-600 font-semibold inline-flex items-center gap-1 hover:underline"
              onClick={() => setReportOpen((v) => !v)}
            >
              <Flag size={14} /> Reportar esta publicación
            </button>
            {reportOpen && (
              reportSent ? (
                <p className="form-success">Reporte enviado. El equipo de Casa Abierta lo revisará.</p>
              ) : (
                <form onSubmit={onReport} className="panel mt-3">
                  <label className="field-label" htmlFor="report-reason">¿Qué está mal en esta publicación?</label>
                  <textarea
                    id="report-reason"
                    className="field-input"
                    rows={3}
                    required
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe el problema (fotos engañosas, datos falsos, etc.)"
                  />
                  <button className="button-primary mt-3" type="submit">Enviar reporte</button>
                </form>
              )
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="panel sticky top-24">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-extrabold text-azul">Solicitar contacto</h2>
              <button
                onClick={() => void onFavorite()}
                aria-pressed={favorite}
                aria-label={favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                className={`rounded-full p-2 border transition ${
                  favorite ? 'bg-terracota-600 border-terracota-600 text-white' : 'border-arena-2 text-tinta/50 hover:border-terracota-600'
                }`}
              >
                <Heart size={18} className={favorite ? 'fill-white' : ''} />
              </button>
            </div>
            <p className="mt-1 text-sm text-tinta/65">
              Envía tu consulta al anfitrión. Casa Abierta registra la solicitud y facilita la conexión; no procesa
              pagos ni reservas.
            </p>

            {!userId && (
              <div className="mt-4">
                <p className="text-sm text-tinta/70">Necesitas una cuenta para enviar solicitudes.</p>
                <button className="button-primary mt-2 w-full justify-center" onClick={() => navigate('/entrar')}>
                  Entrar o registrarme
                </button>
              </div>
            )}

            {userId && requestOpen === false && !sent && (
              <button className="button-primary mt-4 w-full justify-center" onClick={() => setRequestOpen(true)}>
                <Send size={16} /> Enviar solicitud
              </button>
            )}

            {userId && sent && (
              <p className="form-success">
                ¡Solicitud enviada! Sigue su estado en <strong>Mis solicitudes</strong>.
              </p>
            )}

            {userId && requestOpen && !sent && (
              <form onSubmit={onRequest} className="mt-4 space-y-3">
                <div>
                  <label className="field-label" htmlFor="req-service">¿Qué necesitas?</label>
                  <select
                    id="req-service"
                    className="field-input"
                    value={serviceRequested}
                    onChange={(e) => setServiceRequested(e.target.value)}
                  >
                    <option value="">Selecciona un servicio</option>
                    {SERVICE_TYPES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="req-message">Mensaje para el anfitrión</label>
                  <textarea
                    id="req-message"
                    className="field-input"
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Fechas, cantidad de personas, qué buscas…"
                  />
                  <p className="field-hint">
                    Tu correo ({profile?.email}) se guarda con la solicitud para que el equipo pueda gestionarla; no se
                    muestra públicamente.
                  </p>
                </div>
                {requestError && <p className="form-error" role="alert">{requestError}</p>}
                <button className="button-primary w-full justify-center" disabled={sending} type="submit">
                  {sending ? 'Enviando…' : 'Enviar solicitud'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      {errorMessage && status === 'ready' && <p className="form-error mt-4" role="alert">{errorMessage}</p>}
    </div>
  );
}
