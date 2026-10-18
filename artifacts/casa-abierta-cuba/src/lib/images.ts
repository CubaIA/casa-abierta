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

/** Extrae el primer valor útil para <img src> sin depender del orden en BD. */
export function firstPhoto(business: Business): string | null {
  // Preferimos el campo que el mapeador ya normaliza (photos).
  const photos = business.photos ?? [];
  for (const url of photos) {
    if (typeof url === 'string' && url.trim().length > 0) return url.trim();
  }

  // Fallback directo desde images (puede ser texto crudo en legacy).
  if (typeof business.images === 'string') {
    const parsed = normalizePhotos(business.images);
    if (parsed.length) return parsed[0];
  }

  if (Array.isArray(business.images)) {
    for (const url of business.images) {
      if (typeof url === 'string' && url.trim().length > 0) return url.trim();
    }
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
