/**
 * Origen de una solicitud (lead): de dónde llegó el visitante.
 *
 * Al cargar la app se guarda en `sessionStorage`:
 *  - los parámetros `utm_source`, `utm_medium` y `utm_campaign` si la URL los
 *    trae;
 *  - si no hay UTM, `document.referrer`.
 *
 * El valor se lee al crear la solicitud y se envía en la columna `source` de
 * `public.leads`. Si el almacenamiento está bloqueado, todo sigue funcionando
 * sin origen.
 */

const CLAVE = 'casa-abierta:lead-source';
const CAMPOS_UTM = ['utm_source', 'utm_medium', 'utm_campaign'] as const;
const MAXIMO = 500;

/** Guarda el origen de la visita. No sobrescribe nada si no hay datos. */
export function capturarOrigenLead(): void {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const partes: string[] = [];
    for (const campo of CAMPOS_UTM) {
      const valor = (params.get(campo) ?? '').trim();
      if (valor) partes.push(`${campo}=${valor.slice(0, 120)}`);
    }

    const referencia = typeof document !== 'undefined' ? document.referrer.trim() : '';
    const origen = partes.length > 0 ? partes.join('&') : referencia;
    if (!origen) return;

    window.sessionStorage.setItem(CLAVE, origen.slice(0, MAXIMO));
  } catch {
    /* sessionStorage bloqueado o lleno: se envía la solicitud sin origen */
  }
}

/** Origen guardado para esta sesión, o `null` si no hay. */
export function origenLead(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const valor = (window.sessionStorage.getItem(CLAVE) ?? '').trim();
    return valor ? valor.slice(0, MAXIMO) : null;
  } catch {
    return null;
  }
}
