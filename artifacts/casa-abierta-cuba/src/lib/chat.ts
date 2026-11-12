/**
 * Chat interno de cada solicitud (tabla `messages`).
 *
 * Turista y anfitrión comparten el mismo hilo identificado por el id del lead.
 * Con Supabase usa Realtime para que los mensajes aparezcan al instante; en
 * modo demostración guarda la conversación en localStorage.
 */

import { supabase } from './supabase';
import type { ChatMessage } from './types';

const CLAVE_DEMO = 'casa-abierta:chat-demo';

function leerDemo(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE_DEMO);
    const datos = crudo ? (JSON.parse(crudo) as ChatMessage[]) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarDemo(mensajes: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(mensajes));
  } catch {
    /* almacenamiento lleno o bloqueado */
  }
}

/** Historial completo del hilo, del mensaje más antiguo al más reciente. */
export async function listarMensajes(leadId: string): Promise<ChatMessage[]> {
  if (!leadId) return [];

  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('[chat] Error leyendo los mensajes:', error);
      // Proyecto sin la migración 017: hilo vacío en vez de romper la vista.
      if (/42P01|does not exist|schema cache/i.test(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []) as ChatMessage[];
  }

  return leerDemo().filter((m) => m.lead_id === leadId);
}

/** Envía un mensaje al hilo. Devuelve el mensaje guardado si se conoce. */
export async function enviarMensaje(input: {
  leadId: string;
  senderType: 'tourist' | 'host';
  content: string;
}): Promise<ChatMessage | null> {
  const content = input.content.trim().slice(0, 2000);
  if (!content) return null;

  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ lead_id: input.leadId, sender_type: input.senderType, content })
      .select('*')
      .maybeSingle();
    if (error) {
      console.error('[chat] Error enviando el mensaje:', error);
      throw new Error(error.message);
    }
    return (data ?? null) as ChatMessage | null;
  }

  const mensaje: ChatMessage = {
    id: crypto.randomUUID(),
    lead_id: input.leadId,
    sender_type: input.senderType,
    content,
    created_at: new Date().toISOString(),
  };
  guardarDemo([...leerDemo(), mensaje]);
  return mensaje;
}

/**
 * Borra todo el historial del hilo (tabla `messages`).
 * Devuelve `true` solo si el borrado se completó sin error.
 */
export async function borrarMensajes(leadId: string): Promise<boolean> {
  if (!leadId) return false;

  if (supabase) {
    const { error } = await supabase.from('messages').delete().eq('lead_id', leadId);
    if (error) {
      console.error('[chat] Error borrando el historial:', error);
      alert('No se pudo borrar el chat: ' + error.message);
      return false;
    }
    return true;
  }

  guardarDemo(leerDemo().filter((m) => m.lead_id !== leadId));
  return true;
}

/**
 * Escucha los mensajes nuevos del hilo en tiempo real.
 * Devuelve la función para cortar la suscripción.
 */
export function suscribirMensajes(
  leadId: string,
  onNuevo: (mensaje: ChatMessage) => void,
): () => void {
  const client = supabase;
  if (!client || !leadId) return () => {};

  const canal = client
    .channel(`lead-messages-${leadId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages', filter: `lead_id=eq.${leadId}` },
      (payload) => {
        const nuevo = payload.new as ChatMessage;
        if (nuevo?.id) onNuevo(nuevo);
      },
    )
    .subscribe();

  return () => {
    void client.removeChannel(canal);
  };
}
