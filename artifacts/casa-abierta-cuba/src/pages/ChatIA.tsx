import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/env';
import { isDemo } from '@/lib/marketplace';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  '¿Qué provincia debo visitar para conocer la Cuba rural?',
  '¿Cómo preparo mi primer viaje a Cuba?',
  'Recomiéndame experiencias culturales en La Habana',
];

const SYSTEM_PROMPT =
  'Eres "Cuba Conecta IA", el asistente turístico de Casa Abierta Cuba. ' +
  'Ayudas a viajeros a planear viajes a Cuba: destinos, cultura, gastronomía, transporte, ' +
  'costumbres y consejos prácticos. Respondes en español, con calidez y precisión, en un tono ' +
  'cercano. Recuerda que Casa Abierta es una plataforma de conexión con anfitriones locales y ' +
  'no procesa pagos ni reservas. Si no conoces algo, dilo con honestidad. Máximo 150 palabras por respuesta.';

const MSG_NO_DISPONIBLE =
  'La asistente no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
const MSG_CONEXION =
  'No se pudo conectar con la asistente. Revisa tu conexión e inténtalo de nuevo.';

/** Fallo devuelto por la propia Edge Function: su mensaje ya está en español y
 *  se puede mostrar tal cual al usuario. */
class ErrorFuncion extends Error {}

interface CuerpoChat {
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  targetLang: string;
}

/** Llama a la Edge Function `cuba-conecta-ia`.
 *  1) Siempre que hay cliente de Supabase se usa `supabase.functions.invoke`.
 *  2) Si el cliente no se pudo crear pero sí hay URL y clave anónima, se llama
 *     directamente a `<url>/functions/v1/cuba-conecta-ia` (mismos permisos).
 *  3) Solo si no hay ninguna configuración se rinde, con un mensaje amable.
 *  Ningún fallo bloquea el envío: se intenta y el error se traduce abajo. */
async function pedirRespuesta(body: CuerpoChat): Promise<string> {
  let data: { content?: string; reply?: string } | null = null;
  let mensajeFuncion: string | null = null;

  if (supabase) {
    const { data: resData, error } = await supabase.functions.invoke('cuba-conecta-ia', {
      body,
    });
    data = resData;
    if (error) {
      const texto = textoErrorFuncion(error as { message?: string; details?: unknown; name?: string });
      if (texto) throw new ErrorFuncion(texto);
      // Sin texto usable: se distingue fallo de red de fallo del servidor.
      throw new Error(
        (error as { name?: string }).name === 'FunctionsFetchError' ? MSG_CONEXION : MSG_NO_DISPONIBLE,
      );
    }
  } else if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    const base = SUPABASE_URL.replace(/\/+$/, '');
    const res = await fetch(`${base}/functions/v1/cuba-conecta-ia`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { error?: unknown; content?: string } | null;
    if (!res.ok) {
      const texto = typeof json?.error === 'string' && json.error ? json.error : null;
      if (texto) mensajeFuncion = texto;
      else if (res.status === 429)
        mensajeFuncion = 'La asistente está recibiendo muchas consultas, inténtalo en un minuto.';
      else if (res.status >= 500 || res.status === 404) throw new Error(MSG_NO_DISPONIBLE);
      else throw new Error(MSG_CONEXION);
    } else {
      data = json;
    }
  } else {
    throw new Error(MSG_NO_DISPONIBLE);
  }

  if (mensajeFuncion) throw new ErrorFuncion(mensajeFuncion);
  const reply = data?.content ?? data?.reply ?? '';
  if (!reply) throw new ErrorFuncion('La asistente no devolvió respuesta. Inténtalo de nuevo.');
  return reply;
}

/** Extrae el texto amigable de un error de `functions.invoke`. Devuelve el
 *  mensaje que lanzó la propia función (ya en español) o null si solo hay un
 *  texto técnico, para que entonces se use el mensaje genérico. */
function textoErrorFuncion(error: { message?: string; details?: unknown }): string | null {
  const detalles = error.details;
  let cuerpo: { error?: unknown } | null = null;
  if (typeof detalles === 'string') {
    try {
      cuerpo = JSON.parse(detalles) as { error?: unknown };
    } catch {
      cuerpo = null;
    }
  } else if (detalles && typeof detalles === 'object') {
    cuerpo = detalles as { error?: unknown };
  }
  if (typeof cuerpo?.error === 'string' && cuerpo.error) return cuerpo.error;

  const msg = (error.message ?? '').trim();
  if (!msg || /^(failed to fetch|edge function|network|relay|non-2xx|typeerror)/i.test(msg)) {
    return null;
  }
  return msg;
}

/** Mensaje permisivo para el usuario: nada de textos técnicos de configuración. */
function mensajeFallo(e: unknown): string {
  if (e instanceof ErrorFuncion) return e.message;
  const raw = e instanceof Error ? e.message : '';
  if (raw === MSG_NO_DISPONIBLE) return MSG_NO_DISPONIBLE;
  if (raw === MSG_CONEXION) return MSG_CONEXION;
  if (/fetch|network|conex|timeout|abort/i.test(raw)) return MSG_CONEXION;
  return MSG_NO_DISPONIBLE;
}

export default function ChatIA() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'Cuba Conecta IA | Casa Abierta Cuba';
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput('');
    const history = [...messages, { role: 'user' as const, content }];
    setMessages(history);
    setBusy(true);

    try {
      const i18n = (await import('i18next')).default;
      const targetLang = i18n.resolvedLanguage || i18n.language || 'es';
      const reply = await pedirRespuesta({
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10)],
        targetLang,
      });
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch (e) {
      console.warn('Cuba Conecta IA — fallo al enviar:', e);
      setError(mensajeFallo(e));
      setMessages(history);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-3xl">
      <p className="section-kicker">Asistente</p>
      <h1 className="text-3xl font-extrabold text-azul inline-flex items-center gap-2">
        <Sparkles className="text-dorado" size={26} /> Cuba Conecta IA
      </h1>
      <p className="mt-2 text-tinta/70">
        Pregúntale sobre destinos, cultura y logística de tu viaje. Funciona con el modelo gratuito
        <code className="mx-1 rounded bg-arena px-1.5 py-0.5 text-sm">openai/gpt-oss-20b</code>
        de Groq servido desde una Edge Function (tu clave nunca llega al navegador).
      </p>

      <div className="panel mt-5 flex flex-col h-[60vh] min-h-[420px]">
        <div className="flex-1 overflow-y-auto space-y-3 pr-1" aria-live="polite">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3">
              <span className="grid h-14 w-14 place-items-center rounded-full bg-azul-200 text-azul">
                <Bot size={26} />
              </span>
              <p className="text-sm text-tinta/65 max-w-sm">
                ¡Hola! Soy tu asistente de viaje por Cuba. Elige una pregunta o escribe la tuya.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} className="button-ghost !text-xs !py-1.5 !px-3" onClick={() => void send(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === 'user'
                    ? 'bg-azul text-white rounded-br-md'
                    : 'bg-arena text-tinta rounded-bl-md border border-arena-2'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-arena border border-arena-2 px-4 py-2.5 text-sm text-tinta/60">
                Pensando…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && <p className="form-error" role="alert">{error}</p>}

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
        >
          <label className="sr-only" htmlFor="chat-input">Mensaje</label>
          <input
            id="chat-input"
            className="field-input flex-1"
            placeholder={isDemo ? 'Conecta Supabase para activar la asistente…' : 'Escribe tu pregunta sobre Cuba…'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button className="button-primary" type="submit" disabled={busy || !input.trim()} aria-label="Enviar">
            <Send size={17} />
          </button>
        </form>
      </div>

      <p className="mt-3 text-xs sm:text-sm leading-relaxed text-tinta/60">
        La IA puede cometer errores. Verifica la información con el anfitrión. Las respuestas generadas no constituyen asesoramiento legal ni contractual.
      </p>
    </div>
  );
}
