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
export type ChatLeadPanelHandle = { vaciar: () => void };

export function ChatLeadPanel({
  leadId,
  senderType,
  className = '',
  panelRef,
}: {
  leadId: string;
  senderType: 'tourist' | 'host';
  className?: string;
  panelRef?: React.RefObject<ChatLeadPanelHandle | null>;
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

  useEffect(() => {
    if (!panelRef) return;
    panelRef.current = { vaciar: () => setMensajes([]) };
    return () => {
      panelRef.current = null;
    };
  }, [panelRef]);

  const hiloVacio = !cargando && mensajes.length === 0;

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
    <div className={`flex w-full min-w-0 min-h-0 flex-1 flex-col ${className}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {cargando && <p className="text-sm text-gray-500">Cargando conversación…</p>}
        {hiloVacio && (
          <p className="text-sm text-gray-500">
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
                <p className="whitespace-pre-line break-words">{m.content}</p>
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
        <p className="px-4 pt-2 text-sm font-semibold text-terracota-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={enviar}>
        <div className="p-4 border-t bg-white flex items-end gap-2">
          <label className="sr-only" htmlFor={`chat-mensaje-${leadId}`}>
            Escribe un mensaje
          </label>
          <textarea
            id={`chat-mensaje-${leadId}`}
            className="flex-1 border rounded-lg p-2 text-gray-900 placeholder-gray-400 focus:outline-none resize-none min-h-[44px] max-h-[120px]"
            rows={1}
            maxLength={2000}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje…"
          />
          <button
            type="submit"
            className="bg-brand-blue text-white px-4 py-2 rounded-lg shrink-0 h-[44px] flex items-center justify-center font-semibold"
            disabled={enviando || !texto.trim()}
          >
            <Send size={16} aria-hidden className="mr-1.5" /> {enviando ? '…' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
