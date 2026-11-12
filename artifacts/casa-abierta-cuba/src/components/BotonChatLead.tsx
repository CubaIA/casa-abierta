import { useRef, useState } from 'react';
import { MessageCircle, Trash2, X } from 'lucide-react';
import { ChatLeadPanel, type ChatLeadPanelHandle } from './ChatLeadPanel';
import { borrarMensajes } from '@/lib/chat';

/** Botón «Abrir Chat» de una solicitud, con el hilo en un modal. */
export function BotonChatLead({ leadId }: { leadId: string }) {
  const [abierto, setAbierto] = useState(false);
  const [borrando, setBorrando] = useState(false);
  const panelRef = useRef<ChatLeadPanelHandle | null>(null);

  async function borrarChat() {
    const confirmado = window.confirm(
      '¿Estás seguro de que quieres borrar todo el historial de este chat? Esta acción no se puede deshacer.',
    );
    if (!confirmado || borrando) return;

    setBorrando(true);
    try {
      await borrarMensajes(leadId);
      panelRef.current?.vaciar();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : 'No se pudo borrar el chat');
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className="button-ghost !text-xs !py-1 !px-2.5"
        onClick={() => setAbierto(true)}
        aria-haspopup="dialog"
      >
        <MessageCircle size={14} aria-hidden /> Abrir Chat
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Chat de la solicitud"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-base font-extrabold text-azul">Chat con el turista</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={borrarChat}
                  disabled={borrando}
                  aria-label="Borrar chat"
                  title="Borrar chat"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-terracota/10 text-terracota-700 transition hover:bg-terracota-700 hover:text-white disabled:opacity-50"
                >
                  <Trash2 size={17} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  aria-label="Cerrar chat"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-arena text-azul transition hover:bg-arena-2"
                >
                  <X size={18} aria-hidden />
                </button>
              </div>
            </div>
            <ChatLeadPanel leadId={leadId} senderType="host" panelRef={panelRef} />
          </div>
        </div>
      )}
    </>
  );
}
