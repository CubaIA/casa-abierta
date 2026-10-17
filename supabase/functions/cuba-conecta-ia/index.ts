// ============================================================================
// Cuba Conecta IA — Edge Function de Supabase
//
// Recibe { messages: [{role, content}] } y devuelve { content } del modelo
// gratuito de Groq. La clave GROQ_API_KEY vive SOLO en los secretos de
// Supabase; nunca llega al navegador.
//
// Despliegue:
//   supabase secrets set GROQ_API_KEY=gsk_...
//   supabase functions deploy cuba-conecta-ia
//
// Modelo: openai/gpt-oss-20b (free tier Groq: 30 req/min, 1000 req/día).
// Endpoint OpenAI-compatible: https://api.groq.com/openai/v1/chat/completions
// ============================================================================

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = 'openai/gpt-oss-20b';
const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 2000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const apiKey = Deno.env.get('GROQ_API_KEY');
  if (!apiKey) {
    return json({ error: 'Falta el secreto GROQ_API_KEY en la función.' }, 500);
  }

  let messages: ChatMessage[];
  let targetLang: string | undefined;
  try {
    const body = await req.json();
    messages = body?.messages;
    targetLang = typeof body?.targetLang === 'string' ? body.targetLang : undefined;
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('messages vacío');
    }
  } catch {
    return json({ error: 'Cuerpo inválido: se espera { messages: [...] }.' }, 400);
  }

  // Validación y poda del historial.
  const clean: ChatMessage[] = messages
    .filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === 'system' || m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    )
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (!clean.some((m) => m.role === 'user')) {
    return json({ error: 'Debe haber al menos un mensaje del usuario.' }, 400);
  }

  // Añadir instrucción de traducción al idioma objetivo si se solicita.
  const langMap: Record<string, string> = {
    es: 'español',
    en: 'English',
    fr: 'français',
    ru: 'русский',
    'zh-CN': '简体中文',
  };
  const targetLangStr = targetLang && langMap[targetLang] ? langMap[targetLang] : undefined;
  const systemMsg: ChatMessage = {
    role: 'system',
    content: targetLangStr
      ? `Eres Cuba Conecta IA, un asistente de viaje para Casa Abierta Cuba. Si en el mensaje aparecen descripciones de servicios (casas, alojamientos, carros, traslados, tours, experiencias), tradúcelas automáticamente al ${targetLangStr} manteniendo nombres propios, números y ubicación. Responde en el mismo idioma cuando corresponda.`
      : 'Eres Cuba Conecta IA, un asistente de viaje para Casa Abierta Cuba, útil, preciso y cortés.',
  };
  const msgsForModel = [systemMsg, ...clean.filter((m) => m.role !== 'system')];

  try {
    const groqResponse = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: msgsForModel,
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq error', groqResponse.status, JSON.stringify(data).slice(0, 500));
      const status = groqResponse.status === 429 ? 429 : 502;
      return json(
        {
          error:
            groqResponse.status === 429
              ? 'La asistente está recibiendo muchas consultas, inténtalo en un minuto.'
              : 'El modelo no respondió correctamente.',
        },
        status,
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.length === 0) {
      return json({ error: 'Respuesta vacía del modelo.' }, 502);
    }
    return json({ content });
  } catch (e) {
    console.error('Error llamando a Groq', e);
    return json({ error: 'No se pudo conectar con el modelo.' }, 502);
  }
});
