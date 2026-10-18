/** Helpers para limpiar y normalizar la columna de imágenes/fotos de un negocio.
 *
 * En la BD puede llegar como:
 *   - text[] real ('{"img1.jpg","img2.jpg"}')
 *   - texto serializado/JSON (["
https://..."])
 *   - csv por error de escritura
 *
 * Este módulo se usa al mapear filas del catálogo para que los componentes
 * BusinessCard / BusinessDetail siempre reciban string[] válido.
 */
import type { Business } from './types';

export function normalizePhotos(input: unknown): string[] {
  if (Array.isArray(input)) {
    // text[] nativo de PostgREST ya es array, pero puede venir como [""]
    // o con valores inválidos; filtramos solo urls no vacías.
    return input.filter((x): x is string => typeof x === 'string' && x.trim().length > 0);
  }

  if (typeof input === 'string') {
    const raw = input.trim();

    // 1) Intento JSON seguro
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((url) => url.length > 0);
      }
      if (typeof parsed === 'string') {
        // JSON que resolvió a un solo string, tratar como posible lista CSV.
        return splitPhotosCsv(parsed);
      }
    } catch {
      // Intencionalmente no lanzamos: un valor mal formado puede venir de
      // escrituras legacy/manuales; caemos al parseo por coma.
    }

    return splitPhotosCsv(raw);
  }

  return [];
}

/** Divide un string por comas y limpia espacios/urls inválidas. */
function splitPhotosCsv(raw: string): string[] {
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((url) => url.length > 0);
}

/** Extrae la primera foto válida para <img src>.
 *
 * Si el negocio expone un array de fotos, podemos evitar mostrar el logo
 * (normalmente el primer elemento) usando skipFirstLogoWhenAvailable.
 * Cuando no hay segunda foto válida, nos quedamos con la primera.
 */
export function firstPhoto(
  business: Business,
  options?: { skipFirstLogoWhenAvailable?: boolean },
): string | null {
  const photos = resolvePhotos(business);

  if (options?.skipFirstLogoWhenAvailable && photos.length > 1) {
    // Saltar el primer elemento sospechoso (logo) y tomar el siguiente válido.
    for (let i = 1; i < photos.length; i++) {
      const url = photos[i];
      if (typeof url === 'string' && url.trim().length > 0) return url.trim();
    }
  }

  for (const url of photos) {
    if (typeof url === 'string' && url.trim().length > 0) return url.trim();
  }

  return null;
}

/** Actúa como la fuente canónica del campo `photos` en el tipo `Business`. */
export function resolvePhotos(business: Business): string[] {
  if (Array.isArray(business.photos) && business.photos.length) return business.photos;
  if (business.photos === undefined && Array.isArray(business.images)) {
    return normalizePhotos(business.images);
  }
  if (typeof business.images === 'string') {
    return normalizePhotos(business.images);
  }
  return [];
}
