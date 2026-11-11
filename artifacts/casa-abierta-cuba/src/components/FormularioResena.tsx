import { useState } from 'react';
import { Star } from 'lucide-react';
import { crearResenaPublica } from '@/lib/marketplace';

interface FormularioResenaProps {
  businessId: string;
  /** Se ejecuta tras insertar: recarga la lista de reseñas aprobadas. */
  onEnviada: () => Promise<void> | void;
}

const ETIQUETAS = ['Muy mala', 'Mala', 'Regular', 'Buena', 'Excelente'];

/**
 * Formulario para dejar una reseña desde la ficha pública.
 *
 * Se muestra a cualquier visitante, con o sin cuenta: la reseña se guarda en
 * `reviews` con `status = 'pending'` y solo aparece en la ficha cuando el
 * equipo la aprueba desde el panel de administración.
 */
export function FormularioResena({ businessId, onEnviada }: FormularioResenaProps) {
  const [nombre, setNombre] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;
    if (rating < 1) {
      setError('Elige de 1 a 5 estrellas para puntuar el negocio.');
      return;
    }
    if (!nombre.trim()) {
      setError('Escribe tu nombre para que otros viajeros sepan quién opina.');
      return;
    }
    setEnviando(true);
    setError(null);
    setEnviada(false);
    try {
      await crearResenaPublica({ businessId, authorName: nombre, rating, comment });
      setNombre('');
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
        No necesitas cuenta. Tu reseña se publica en la ficha después de que el equipo la revise.
      </p>

      <label className="field-label mt-4 block" htmlFor="review-author">
        Tu nombre
      </label>
      <input
        id="review-author"
        className="field-input"
        type="text"
        maxLength={80}
        autoComplete="name"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Ej. María de España"
      />

      <fieldset className="mt-4 border-0 p-0">
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
          ¡Gracias! Tu reseña ha sido enviada y será revisada por nuestro equipo.
        </p>
      )}

      <button type="submit" className="button-primary mt-4" disabled={enviando || rating < 1}>
        {enviando ? 'Enviando…' : 'Enviar Reseña'}
      </button>
    </form>
  );
}
