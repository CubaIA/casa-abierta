import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { enviarMensaje, listarMensajes, suscribirMensajes } from '@/lib/chat';
import type { ChatMessage } from '@/lib/types';

/**
 * Conversación de una solicitud de reserva.
 *
 * Se usa en el panel del anfitrión (dentro de un modal) y en la ruta pública
 * `/chat/:id` del turista. Los mensajes llegan en vivo por Supabase Realtime.
 */
export function ChatLeadPanel({
  leadId,
  senderType,
  className = '',
}: {
  leadId: string;
  senderType: 'tourist' | 'host';
  className?: string;
}) {
  const [mensajes, setMensajes] = useState<ChatMessage[]>([]);
  const [texto, setTexto] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const finRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    setError(null);

    listarMensajes(leadId)
      .then((lista) => {
        if (vivo) setMensajes(lista);
      })
      .catch((e: unknown) => {
        if (vivo) setError(e instanceof Error ? e.message : 'No se pudo cargar la conversación');
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });

    const cortar = suscribirMensajes(leadId, (nuevo) => {
      setMensajes((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]));
    });

    return () => {
      vivo = false;
      cortar();
    };
  }, [leadId]);

  useEffect(() => {
    finRef.current?.scrollIntoView({ block: 'nearest' });
  }, [mensajes.length]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const guardado = await enviarMensaje({ leadId, senderType, content: limpio });
      if (guardado) {
        setMensajes((prev) => (prev.some((m) => m.id === guardado.id) ? prev : [...prev, guardado]));
      }
      setTexto('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el mensaje');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={`flex w-full min-w-0 flex-col ${className}`}>
      <div className="max-h-[50vh] min-h-[160px] w-full min-w-0 space-y-2 overflow-y-auto overscroll-contain rounded-xl border border-arena-2 bg-arena/20 p-3">
        {cargando && <p className="text-sm text-tinta/60">Cargando conversación…</p>}
        {!cargando && mensajes.length === 0 && (
          <p className="text-sm text-tinta/60">
            Todavía no hay mensajes. Escribe el primero para coordinar la reserva.
          </p>
        )}
        {mensajes.map((m) => {
          const propio = m.sender_type === senderType;
          return (
            <div key={m.id} className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                  propio ? 'bg-azul text-white' : 'bg-white text-tinta/85 border border-arena-2'
                }`}
              >
                <p className="whitespace-pre-line">{m.content}</p>
                <p className={`mt-1 text-[10px] ${propio ? 'text-white/70' : 'text-tinta/45'}`}>
                  {m.sender_type === 'host' ? 'Anfitrión' : 'Turista'} ·{' '}
                  {new Date(m.created_at).toLocaleString('es-ES')}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={finRef} />
      </div>

      {error && (
        <p className="mt-2 text-sm font-semibold text-terracota-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={enviar} className="mt-2 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-end">
        <label className="w-full min-w-0 sm:flex-1">
          <span className="sr-only">Escribe un mensaje</span>
          <textarea
            className="field-input resize-none"
            rows={2}
            maxLength={2000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje…"
          />
        </label>
        <button
          type="submit"
          className="button-primary w-full shrink-0 justify-center !py-2.5 sm:w-auto"
          disabled={enviando || !texto.trim()}
        >
          <Send size={16} aria-hidden /> {enviando ? '…' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}
