/**
 * Recursos de almacenamiento de imágenes de usuario.
 *
 * Bucket público `avatars`: solo el dueño del objeto puede subir/borrar su
 * propio avatar bajo `auth.uid()/*. Esta utilidad sube, retorna la URL
 * pública y (cuando la sesión y la tabla lo permiten) actualiza
 * `public.users.avatar_url`.
 *
 * Nota técnica: el esquema por defecto de la app usa la tabla `users` (no
 * `profiles`). El campo `avatar_url` vive en `users`; la lectura segura desde
 * la app la hacemos mediante el RPC `admin_get_user_avatar_url(uuid)` que la
 * migración 001 crea. Si en el futuro se usa una tabla `profiles`, solo hay
 * que cambiar esta función, no las páginas.
 */
import { supabase } from './supabase';
import type { Profile } from './types';
import { isSupabaseConfigured } from './env';

const BUCKET = 'avatars';

export function avatarPublicUrl(path: string): string | null {
  if (!supabase) return null;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data?.publicUrl ?? null;
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<string | null> {
  if (!supabase) return null;

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = file.type || `image/${ext === 'jpeg' ? 'jpeg' : ext}`;
  const name = `${userId}/${crypto.randomUUID()}.${ext}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(name, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: mime,
    });

  if (error) {
    console.error('Error subiendo avatar:', error.message);
    return null;
  }
  if (!data) return null;

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  return urlData?.publicUrl ?? null;
}

/**
 * Preferentemente actualiza `public.users.avatar_url`. Cuando la tabla
 * por defecto no lo permite pero existe una capa externa (p.ej. admin), se
 * deja la función preparada para delegar; sin esa capa se vuelve silencioso
 * en modo demo.
 */
export async function setProfileAvatarUrl(
  userId: string,
  avatarUrl: string | null,
): Promise<void> {
  if (!supabase) return;

  // `users` en el esquema por defecto no concede UPDATE a authenticated para
  // avatar_url. Si la organización crea esa política o un RPC, esta línea lo
  // aprovecha; de lo contrario se ignora sin romper la app.
  await supabase
    .from('users')
    .update({ avatar_url: avatarUrl })
    .eq('id', userId)
    .select('id')
    .single();
}

/**
 * Lee `avatar_url` del perfil mediante el RPC `admin_get_user_avatar_url`
 * (solo admin activo). El cliente Supabase puede leer `users` directamente,
 * pero para no exponer la columna al scope `authenticated` usamos el RPC;
 * el mapeo al tipo `Profile` se hace en `marketplace.ts`.
 */
export async function adminGetUserAvatarUrl(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc('admin_get_user_avatar_url', { p_user_id: userId });
  if (error) throw new Error(error.message);
  return (data as string | null) ?? null;
}
