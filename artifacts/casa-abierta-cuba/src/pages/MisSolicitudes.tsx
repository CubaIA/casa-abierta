import { useCallback, useEffect, useState } from 'react';
import { Link } from 'wouter';
import { MessageSquare, RefreshCw, Star } from 'lucide-react';
import { createReview, listMyRequests, setRequestStatus } from '@/lib/marketplace';
import type { BusinessRow, RequestStatus } from '@/lib/types';
import { useAuth } from '@/lib/auth';
import { AvisoError } from '@/components/AvisoError';

const STATUS_LABEL: Record<RequestStatus, { label: string; badge: string }> = {
  new: { label: 'Enviada', badge: 'badge-blue' },
  reviewing: { label: 'En revisión', badge: 'badge-gold' },
  accepted: { label: 'Aceptada', badge: 'badge-green' },
  completed: { label: 'Completada', badge: 'badge-green' },
  cancelled: { label: 'Cancelada', badge: 'badge-red' },
};

export default function MisSolicitudes() {
  const { userId, loading } = useAuth();
  const [rows, setRows] = useState<BusinessRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<BusinessRow | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      setRows(await listMyRequests(userId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando solicitudes');
    }
  }, [userId]);

  useEffect(() => {
    document.title = 'Mis solicitudes | Casa Abierta Cuba';
    if (!loading) void load();
  }, [loading, load]);

  async function onCancel(row: BusinessRow) {
    try {
      await setRequestStatus(row.id, 'cancelled');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar');
    }
  }

  if (!userId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Inicia sesión para ver tus solicitudes.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <p className="section-kicker">Viajero</p>
      <h1 className="text-3xl font-extrabold text-azul">Mis solicitudes</h1>
      <p className="mt-2 text-tinta/70">Seguimiento de las consultas que enviaste a anfitriones.</p>

      <AvisoError mensaje={error} className="mt-4" />

      <div className="mt-6 space-y-4">
        {rows === null && <div className="empty-state">Cargando…</div>}
        {rows?.length === 0 && (
          <div className="empty-state">
            <MessageSquare size={28} className="mx-auto mb-2 opacity-50" />
            <p>Todavía no has enviado solicitudes.</p>
            <Link href="/" className="button-primary mt-3 inline-flex">Explorar el catálogo</Link>
          </div>
        )}
        {rows?.map((row) => {
          const st = STATUS_LABEL[row.status];
          return (
            <article key={row.id} className="panel">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-extrabold text-azul">{row.business?.name ?? 'Negocio'}</h2>
                  <p className="text-xs text-tinta/55">
                    {row.business?.province} · {new Date(row.created_at).toLocaleDateString('es-ES')}
                    {row.service_requested && <> · Servicio: {row.service_requested}</>}
                  </p>
                </div>
                <span className={`badge ${st.badge}`}>{st.label}</span>
              </div>
              <p className="mt-2 text-sm text-tinta/80">{row.message}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {(row.status === 'new' || row.status === 'reviewing' || row.status === 'accepted') && (
                  <button
                    className="button-ghost !text-terracota-600 !border-terracota-500"
                    onClick={() => void onCancel(row)}
                  >
                    Cancelar solicitud
                  </button>
                )}
                {row.status === 'completed' && (
                  <button className="button-ghost" onClick={() => setReviewTarget(row)}>
                    <Star size={15} /> Escribir reseña
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {reviewTarget && (
        <ReviewDialog
          row={reviewTarget}
          authorId={userId}
          onClose={() => setReviewTarget(null)}
          onDone={() => {
            setReviewTarget(null);
            void load();
          }}
        />
      )}
    </div>
  );
}

function ReviewDialog({
  row,
  authorId,
  onClose,
  onDone,
}: {
  row: BusinessRow;
  authorId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await createReview({
        reviewerId: authorId,
        requestId: row.id,
        businessId: row.business_id ?? '',
        rating,
        comment: comment.trim(),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la reseña');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-tinta/60 p-4" role="dialog" aria-modal="true" aria-label="Escribir reseña">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl">
        <h2 className="text-xl font-extrabold text-azul">Reseña de {row.business?.name ?? 'tu experiencia'}</h2>
        <p className="mt-1 text-sm text-tinta/60">Tu reseña será pública para otros viajeros.</p>

        <div className="mt-4 flex items-center gap-1" role="radiogroup" aria-label="Puntuación">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} estrellas`}
              onClick={() => setRating(n)}
              className="p-1"
            >
              <Star size={26} className={n <= rating ? 'fill-dorado text-dorado' : 'text-tinta/25'} />
            </button>
          ))}
        </div>

        <label className="field-label mt-4" htmlFor="review-comment">Comentario</label>
        <textarea
          id="review-comment"
          className="field-input"
          rows={3}
          required
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="¿Cómo fue tu experiencia?"
        />

        <AvisoError mensaje={error} />

        <div className="mt-4 flex gap-2 justify-end">
          <button type="button" className="button-ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="button-primary" disabled={busy}>
            {busy ? 'Guardando…' : 'Publicar reseña'}
          </button>
        </div>
      </form>
    </div>
  );
}
