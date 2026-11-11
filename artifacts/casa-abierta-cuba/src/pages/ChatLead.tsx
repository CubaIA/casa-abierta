import { useEffect } from 'react';
import { Link, useParams } from 'wouter';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { ChatLeadPanel } from '@/components/ChatLeadPanel';

/**
 * Chat público del turista: `/chat/{lead_id}`.
 *
 * El enlace se muestra al enviar la solicitud. El identificador del lead es la
 * única credencial necesaria, así que conviene que el viajero lo guarde.
 */
export default function ChatLead() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? '';

  useEffect(() => {
    document.title = 'Chat de tu solicitud | Casa Abierta Cuba';
  }, []);

  return (
    <div className="page-shell max-w-2xl">
      <Link href="/" className="text-link inline-flex items-center gap-1 text-sm">
        <ArrowLeft size={15} aria-hidden /> Volver al catálogo
      </Link>

      <h1 className="mt-3 inline-flex items-center gap-2 text-2xl font-extrabold text-azul">
        <MessageCircle size={22} aria-hidden /> Chat con el anfitrión
      </h1>
      <p className="mt-1 text-sm text-tinta/70">
        Aquí puedes responder a tu solicitud de reserva. Guarda este enlace: es tu acceso a la conversación.
      </p>

      {id ? (
        <div className="mt-4 rounded-2xl border border-arena-2 bg-white p-4 sm:p-5">
          <ChatLeadPanel leadId={id} senderType="tourist" />
        </div>
      ) : (
        <div className="empty-state mt-4">Este enlace de chat no es válido.</div>
      )}
    </div>
  );
}
