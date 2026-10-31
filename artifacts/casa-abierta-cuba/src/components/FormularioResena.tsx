import { useState } from 'react';
import { Star } from 'lucide-react';
import { useLocation } from 'wouter';
import { crearResenaDirecta } from '@/lib/marketplace';

interface FormularioResenaProps {
  businessId: string;
  userId: string | null;
  /** Se ejecuta tras insertar: recarga la lista para que aparezca la nueva. */
  onEnviada: () => Promise<void> | void;
}

const ETIQUETAS = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

/**
 * Formulario para dejar una reseña desde la ficha pública.
 *
 * Solo se muestra con sesión iniciada: si no hay usuario se ofrece el acceso
 * en lugar de un formulario que la RLS rechazaría al enviar.
 */
export function FormularioResena({ businessId, userId, onEnviada }: FormularioResenaProps) {
  const [, navigate] = useLocation();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  if (!userId) {
    return (
      <div className="mt-5 rounded-2xl border border-arena-2 bg-white p-4">
        <p className="text-sm font-semibold text-azul">Inicia sesión para dejar una reseña.</p>
        <p className="mt-1 text-sm text-tinta/65">Solo las cuentas con sesión iniciada pueden valorar este negocio.</p>
        <button type="button" className="button-ghost mt-3" onClick={() => navigate('/entrar')}>
          Iniciar sesión
        </button>
      </div>
    );
  }

  const idUsuario = userId;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (rating < 1) {
      setError('Elige de 1 a 5 estrellas para puntuar el negocio.');
      return;
    }
    setEnviando(true);
    setError(null);
    setEnviada(false);
    try {
      await crearResenaDirecta({ businessId, userId: idUsuario, rating, comment });
      // Éxito: se limpia el formulario y se recarga la lista desde Supabase.
      setRating(0);
      setHover(0);
      setComment('');
      setEnviada(true);
      await onEnviada();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la reseña.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-5 rounded-2xl border border-arena-2 bg-white p-4 sm:p-5">
      <h3 className="text-base font-extrabold text-azul">Dejar una reseña</h3>
      <p className="mt-1 text-sm text-tinta/65">
        Cuenta cómo fue tu experiencia con este negocio. Tu valoración es pública.
      </p>

      <fieldset className="mt-3 border-0 p-0">
        <legend className="field-label p-0">Tu puntuación</legend>
        <div className="mt-1 flex flex-wrap items-center gap-1" role="group" aria-label="Puntuación de 1 a 5 estrellas">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
              aria-pressed={rating === n}
              className="rounded p-0.5 transition hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul"
            >
              <Star
                size={26}
                aria-hidden
                className={(hover || rating) >= n ? 'fill-dorado text-dorado' : 'text-dorado/40'}
              />
            </button>
          ))}
          <span className="ml-2 text-sm font-semibold text-tinta/70" aria-live="polite">
            {rating > 0 ? ETIQUETAS[rating - 1] : 'Elige una puntuación'}
          </span>
        </div>
      </fieldset>

      <label className="field-label mt-4 block" htmlFor="review-comment">
        Tu comentario
      </label>
      <textarea
        id="review-comment"
        className="field-input"
        rows={3}
        maxLength={1000}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Qué te gustó, cómo te atendieron, qué debe saber otro viajero…"
      />

      {error && (
        <p className="mt-3 text-sm font-semibold text-terracota-700" role="alert">
          {error}
        </p>
      )}
      {enviada && !error && (
        <p className="form-success mt-3" role="status">
          ¡Gracias! Tu reseña ya aparece en la ficha.
        </p>
      )}

      <button type="submit" className="button-primary mt-4" disabled={enviando || rating < 1}>
        {enviando ? 'Enviando…' : 'Enviar reseña'}
      </button>
    </form>
  );
}
