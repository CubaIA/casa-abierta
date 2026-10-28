import { MessageCircle } from 'lucide-react';

/** Soporte por WhatsApp: +53 5 6289645 (el mismo número del pie de página). */
export const WHATSAPP_AYUDA = 'https://wa.me/5356289645';

/** Texto humano único para los fallos técnicos de la plataforma. */
export const MENSAJE_ERROR_AMIGABLE =
  '¡Ups! Parece que tuvimos un problema técnico (¡culpa de los apagones o del servidor!). ' +
  'No te preocupes, escríbenos directo a nuestro WhatsApp y te ayudamos a reservar ahora mismo.';

/**
 * Errores que el usuario no debe leer nunca tal cual: credenciales, red caída y
 * respuestas crudas de Supabase (Postgres/Auth). Los mensajes de validación en
 * español («Escribe tu nombre») NO entran aquí y se muestran tal cual.
 */
const PATRONES_TECNICOS = [
  /invalid login credentials/i,
  /invalid_credentials/i,
  /email not confirmed/i,
  /failed to fetch/i,
  /load failed/i,
  /network ?error/i,
  /\bfetch\b/i,
  /typeerror/i,
  /cannot read/i,
  /is not a function/i,
  /unexpected token/i,
  /\bjwt\b/i,
  /pgrst\d*/i,
  /postgrest/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /permission denied/i,
  /row-level security/i,
  /duplicate key/i,
  /violates/i,
  /database error/i,
  /auth(api)?error/i,
  /apikey|api key/i,
  /supabase/i,
  /service unavailable|bad gateway|gateway timeout/i,
  /\b(400|401|403|404|429|500|502|503|504)\b/,
  /timeout|timed out|aborted|abort/i,
];

/** ¿El mensaje viene de la base de datos o de la red, en vez de ser un aviso claro? */
export function esMensajeTecnico(mensaje: string | null | undefined): boolean {
  if (!mensaje) return false;
  return PATRONES_TECNICOS.some((patron) => patron.test(mensaje));
}

interface AvisoErrorProps {
  mensaje: string | null | undefined;
  className?: string;
  /** Panel de administración: muestra el mensaje tal cual.
   *
   * Los diagnósticos de configuración (RPC que falta, migración sin aplicar,
   * permisos, RLS) solo le sirven a quien administra la plataforma. Sin este
   * modo se sustituían por el aviso amable de WhatsApp y el admin se quedaba
   * sin saber por qué no se guardó nada. */
  operador?: boolean;
}

/**
 * Aviso de error con dos caras:
 *  - mensaje de validación claro → se muestra como siempre (`.form-error`);
 *  - fallo técnico → texto amable + botón de WhatsApp funcionando.
 */
export function AvisoError({ mensaje, className = '', operador = false }: AvisoErrorProps) {
  if (!mensaje) return null;

  if (operador || !esMensajeTecnico(mensaje)) {
    return (
      <p className={`form-error ${className}`} role="alert">
        {mensaje}
      </p>
    );
  }

  return (
    <div className={`form-error ${className}`} role="alert">
      <p className="leading-relaxed">
        ¡Ups! Parece que tuvimos un problema técnico (¡culpa de los apagones o del servidor!). No te
        preocupes, escríbenos directo a nuestro WhatsApp{' '}
        <a
          href={WHATSAPP_AYUDA}
          target="_blank"
          rel="noopener noreferrer"
          className="font-extrabold underline decoration-2 underline-offset-2 hover:text-terracota-600"
        >
          haciendo clic aquí
        </a>{' '}
        y te ayudamos a reservar ahora mismo.
      </p>
      <a
        href={WHATSAPP_AYUDA}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95"
      >
        <MessageCircle size={16} aria-hidden /> Escribir por WhatsApp
      </a>
    </div>
  );
}
