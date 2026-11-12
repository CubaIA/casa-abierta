import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatLeadPanel } from './ChatLeadPanel';

/** Botón «Abrir Chat» de una solicitud, con el hilo en un modal. */
export function BotonChatLead({ leadId }: { leadId: string }) {
  const [abierto, setAbierto] = useState(false);

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
              <button
                type="button"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar chat"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-arena text-azul transition hover:bg-arena-2"
              >
                <X size={18} aria-hidden />
              </button>
            </div>
            <ChatLeadPanel leadId={leadId} senderType="host" />
          </div>
        </div>
      )}
    </>
  );
}
