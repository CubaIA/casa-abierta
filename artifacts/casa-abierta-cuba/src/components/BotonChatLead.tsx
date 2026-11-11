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
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-tinta/60 p-3 sm:items-center sm:p-4"
          onClick={() => setAbierto(false)}
        >
          <div
            className="my-4 w-full max-w-lg overflow-x-hidden rounded-2xl bg-white p-3 shadow-xl sm:my-6 sm:p-5 max-h-[90dvh] overflow-y-auto sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-azul">Chat con el turista</h3>
                <p className="text-xs text-tinta/55">Los mensajes llegan en tiempo real.</p>
              </div>
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
