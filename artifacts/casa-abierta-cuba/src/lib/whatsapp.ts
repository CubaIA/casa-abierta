/**
 * Enlaces de WhatsApp (wa.me) de Casa Abierta Cuba.
 *
 * Centraliza el número de soporte, los mensajes prellenados y la lectura del
 * WhatsApp de cada negocio, para que la ficha, el panel y el pie de página
 * abran siempre el chat correcto.
 */

/** Soporte de Casa Abierta Cuba: +53 5 6289645. */
export const SUPPORT_WHATSAPP = '5356289645';

/** Mensajes que se escriben solos al abrir el chat. */
export const MENSAJE_NEGOCIO = 'Hola, vengo de Casa Abierta Cuba y me interesa tu servicio';
export const MENSAJE_PREMIUM =
  'Hola, quiero activar el Plan Premium para mi negocio en Casa Abierta Cuba y pagar con QvaPay';
export const MENSAJE_SOPORTE = 'Hola, necesito ayuda con Casa Abierta Cuba';

/**
 * Deja el número en dígitos internacionales (sin +, espacios ni guiones).
 * Los móviles cubanos se guardan a veces con 8 dígitos: se les antepone 53.
 * Devuelve `null` cuando el valor no parece un teléfono.
 */
export function normalizarTelefono(crudo: unknown): string | null {
  if (typeof crudo !== 'string' && typeof crudo !== 'number') return null;
  let digitos = String(crudo).replace(/\D/g, '');
  if (!digitos) return null;
  if (digitos.startsWith('00')) digitos = digitos.slice(2);
  if (digitos.length === 8 && digitos.startsWith('5')) return `53${digitos}`;
  if (digitos.length < 8 || digitos.length > 15) return null;
  return digitos;
}

/** Enlace wa.me con el mensaje ya escrito. Sin número válido usa el soporte. */
export function whatsappLink(telefono: string | null | undefined, mensaje: string): string {
  const numero = normalizarTelefono(telefono) ?? SUPPORT_WHATSAPP;
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

/** Campos donde puede vivir el WhatsApp de un negocio (según el esquema). */
export interface NegocioConContacto {
  whatsapp?: unknown;
  phone?: unknown;
  telefono?: unknown;
  experience_details?: unknown;
  textos_adicionales?: unknown;
  amenities?: unknown;
  description?: unknown;
  host_story?: unknown;
}

/** Número con prefijo de país (+53 / 0053 / 53). */
const PATRON_INTERNACIONAL = /(?:\+|00)?53[\s.\-()]*\d(?:[\s.\-()]*\d){7,8}/;
/** Móvil local precedido de la palabra whatsapp/teléfono. */
const PATRON_CON_PALABRA =
  /(?:whats?app|wsp|tel[eé]fono|tel\.?|celular|m[oó]vil)\D{0,20}(\d(?:[\s.\-]*\d){7,8})/i;

/**
 * WhatsApp del negocio, o `null` si no se puede leer.
 *
 * Primero los campos de contacto directos; si la base de datos no los expone
 * al público (columnas privadas), se busca el número dentro de los textos
 * públicos de la ficha como último recurso.
 */
export function telefonoDeNegocio(negocio: NegocioConContacto | null | undefined): string | null {
  if (!negocio) return null;

  const directo =
    normalizarTelefono(negocio.whatsapp) ??
    normalizarTelefono(negocio.phone) ??
    normalizarTelefono(negocio.telefono);
  if (directo) return directo;

  const textos = [
    negocio.experience_details,
    negocio.textos_adicionales,
    negocio.amenities,
    negocio.description,
    negocio.host_story,
  ].filter((v): v is string => typeof v === 'string' && v.trim().length > 0);

  for (const texto of textos) {
    const internacional = texto.match(PATRON_INTERNACIONAL)?.[0];
    if (internacional) {
      const numero = normalizarTelefono(internacional);
      if (numero) return numero;
    }
    const conPalabra = texto.match(PATRON_CON_PALABRA)?.[1];
    if (conPalabra) {
      const numero = normalizarTelefono(conPalabra);
      if (numero) return numero;
    }
  }

  return null;
}
