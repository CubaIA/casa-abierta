import { supabase } from './supabase';

const BUCKET = 'business-photos';

/**
 * Sube una lista de archivos File al bucket business-photos,
 * organizados en la carpeta {userId}/businesses/{businessId}/.
 * Devuelve la lista de URLs públicas.
 */
export async function uploadBusinessImages(
  userId: string,
  businessId: string,
  files: File[],
): Promise<string[]> {
  if (!supabase) return [];

  const urls: string[] = [];
  const folder = `${userId}/businesses/${businessId}`;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mime = file.type || `image/${ext === 'jpeg' ? 'jpeg' : ext}`;
    const name = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(name, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: mime,
      });

    if (error) {
      console.error(`Error subiendo ${file.name}:`, error.message);
      continue;
    }
    if (!data) continue;

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
    if (urlData?.publicUrl) urls.push(urlData.publicUrl);
  }

  return urls;
}

/** Convierte la URL pública de una foto en su ruta dentro del bucket. */
function pathDesdeUrlPublica(url: string): string | null {
  const marca = `/${BUCKET}/`;
  const i = url.indexOf(marca);
  if (i === -1) return null;
  const ruta = decodeURIComponent(url.slice(i + marca.length).split('?')[0]);
  return ruta || null;
}

/**
 * Borra del bucket las fotos que el administrador ha quitado de un negocio.
 * Es best-effort: RLS solo permite borrar objetos de la propia carpeta, así que
 * un fallo puntual no debe impedir que la edición del negocio se guarde.
 */
export async function removeBusinessImages(urls: string[]): Promise<void> {
  if (!supabase || urls.length === 0) return;
  const paths = urls
    .map(pathDesdeUrlPublica)
    .filter((p): p is string => p !== null);
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.warn('No se pudieron borrar fotos del bucket:', error.message);
}
