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
