import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
      if (!supabase) {
        throw new Error(
          'La asistente IA necesita el backend conectado: configura VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ' +
            'y despliega la Edge Function cuba-conecta-ia (ver docs/INSTALACION.md).',
        );
      }
      const i18n = (await import('i18next')).default;
      const targetLang = i18n.resolvedLanguage || i18n.language || 'es';
      const { data, error: fnError } = await supabase.functions.invoke('cuba-conecta-ia', {
        body: {
          messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...history.slice(-10)],
          targetLang,
        },
      });
      if (fnError) throw new Error(fnError.message);
      const reply: string = data?.content ?? data?.reply ?? '';
      if (!reply) throw new Error('La asistente no devolvió respuesta.');
      setMessages([...history, { role: 'assistant', content: reply }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar con la asistente');
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
