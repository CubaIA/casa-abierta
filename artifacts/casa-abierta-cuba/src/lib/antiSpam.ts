/**
 * Protecciones anti-spam de los formularios públicos (reseña y reserva).
 *
 * No piden cuenta ni cambian la base de datos: solo filtran envíos
 * automáticos antes de escribir y limitan cuántos envíos reales hace un
 * dispositivo por hora (localStorage). Todo es aditivo: si algo falla
 * (localStorage bloqueado), el formulario sigue funcionando.
 */

/** Tiempo mínimo que una persona tarda en rellenar el formulario. */
export const MS_MINIMOS = 4_000;

/** Envíos permitidos por dispositivo y por hora, para cada formulario. */
export const MAX_ENVIOS_HORA = 3;
const VENTANA_MS = 60 * 60 * 1000;
const PREFIJO = 'casa-abierta:envios:';

/** Aviso que se muestra al superar el límite de envíos. */
export const MENSAJE_LIMITE = 'Has enviado varias solicitudes. Inténtalo de nuevo más tarde.';

/** Nombre de los formularios que llevan su propio contador. */
export type FormularioProtegido = 'resenas' | 'solicitudes';

function leerMarcas(clave: string): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave);
    const datos = crudo ? (JSON.parse(crudo) as unknown) : [];
    if (!Array.isArray(datos)) return [];
    const ahora = Date.now();
    return datos
      .filter((n): n is number => typeof n === 'number' && Number.isFinite(n))
      .filter((n) => ahora - n < VENTANA_MS && n <= ahora);
  } catch {
    return [];
  }
}

/** Indica si el dispositivo aún puede enviar este formulario. */
export function puedeEnviar(clave: FormularioProtegido): boolean {
  return leerMarcas(clave).length < MAX_ENVIOS_HORA;
}

/** Anota un envío real (solo cuando la solicitud/reseña se guardó). */
export function registrarEnvio(clave: FormularioProtegido): void {
  if (typeof window === 'undefined') return;
  try {
    const marcas = [...leerMarcas(clave), Date.now()];
    window.localStorage.setItem(PREFIJO + clave, JSON.stringify(marcas));
  } catch {
    /* almacenamiento lleno o bloqueado: no se bloquea al visitante */
  }
}

/** Cuenta enlaces `http…` y `www.` en un texto libre. */
export function contarEnlaces(texto: string): number {
  const coincidencias = texto.match(/\b(?:https?:\/\/|www\.)\S+/gi);
  return coincidencias ? coincidencias.length : 0;
}

/** Nombre válido: entre 2 y 60 caracteres ya recortados. */
export function validarNombre(nombre: string): string | null {
  const limpio = nombre.trim();
  if (limpio.length < 2) return 'Escribe tu nombre (mínimo 2 caracteres).';
  if (limpio.length > 60) return 'El nombre no puede superar los 60 caracteres.';
  return null;
}

/** Comentario de reseña válido: entre 10 y 1000 caracteres. */
export function validarComentarioResena(comentario: string): string | null {
  const limpio = comentario.trim();
  if (limpio.length < 10) return 'Escribe un comentario de al menos 10 caracteres.';
  if (limpio.length > 1000) return 'El comentario no puede superar los 1000 caracteres.';
  return null;
}

/** Texto libre sin exceso de enlaces (más de 2 se considera spam). */
export function validarEnlaces(texto: string): string | null {
  if (contarEnlaces(texto) > 2) return 'El texto no puede incluir más de 2 enlaces.';
  return null;
}

/** Envío automático: campo trampa relleno o formulario enviado demasiado rápido. */
export function esEnvioAutomatico(trampa: string, abiertoEn: number): boolean {
  if (trampa.trim() !== '') return true;
  const transcurrido = Date.now() - abiertoEn;
  return !Number.isFinite(transcurrido) || transcurrido < MS_MINIMOS;
}
