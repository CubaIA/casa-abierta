import { useRef, useState, useCallback } from 'react';
import { Camera, Loader2 } from 'lucide-react';

interface ProfileAvatarProps {
  /** URL actual del avatar, o null/string vacío cuando no hay. */
  avatarUrl: string | null;
  /** ID del usuario autenticado (para la subida). */
  userId: string | null;
  /** Callback opcional después de una subida exitosa. */
  onAvatarChange?: (avatarUrl: string | null) => void;
  /** Tamaño opcional en px del círculo. */
  size?: number;
  /** Si true, la subida se ejecuta directamente; si false, se invoca onUpload. */
  allowUpload?: boolean;
  /** Si false, no se pasa el input, solo se renderiza la imagen/placeholder. */
  upload?: boolean;
  /** Invocado cuando el usuario elige un archivo (subida controlada externamente). */
  onUpload?: (file: File) => Promise<string | null>;
  className?: string;
}

export function ProfileAvatar({
  avatarUrl,
  userId,
  onAvatarChange,
  size = 48,
  allowUpload = true,
  upload = true,
  onUpload,
  className = '',
}: ProfileAvatarProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const readFile = useCallback(async (file: File) => {
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    try {
      let avatarUrl: string | null | undefined;
      if (!upload && onUpload) {
        avatarUrl = await onUpload(file);
      } else if (allowUpload && userId) {
        const { uploadProfileAvatar } = await import('../lib/avatars');
        avatarUrl = await uploadProfileAvatar(userId, file);
        if (avatarUrl) onAvatarChange?.(avatarUrl);
      }
      return avatarUrl ?? null;
    } catch (err) {
      console.error('Error con el avatar:', err);
      return null;
    }
  }, [userId, upload, onUpload, allowUpload, onAvatarChange]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void readFile(file);
    // reset para permitir re-elegir el mismo archivo
    if (fileRef.current) fileRef.current.value = '';
  }

  function removePreview() {
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
    if (onAvatarChange) onAvatarChange(null);
  }

  const display = preview ?? avatarUrl;

  const circle = `grid size-[${size}px] place-items-center rounded-full overflow-hidden ring-2 ring-white/80 bg-arena shadow-sm`;

  return (
    <div className={circle + ' ' + className}>
      {display ? (
        <img
          src={display}
          alt="Avatar"
          loading="lazy"
          className="h-full w-full rounded-full object-cover"
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.opacity = '0';
          }}
        />
      ) : (
        <span className="grid place-items-center rounded-full bg-arena text-azul font-extrabold text-white/90">
          {size >= 72 ? '🤠' : ''}
          {size < 80 && <span style={{ fontSize: size >= 40 ? 'inherit' : '10px' }}>
            {(avatarUrl ?? '').slice(0, 2).toUpperCase() || 'CA'}
          </span>}
        </span>
      )}
      {upload ? (
        <label
          title="Cambiar foto"
          className="grid place-items-center rounded-full bg-white/80 text-arena transition hover:bg-white cursor-pointer opacity-0 group-hover:opacity-100 focus-within:opacity-100"
          style={{ opacity: 0 }}
          aria-label="Cambiar foto de perfil"
        >
          {busy ? (
            <Loader2 size={size >= 64 ? 22 : 16} className="text-arena animate-spin" aria-hidden />
          ) : (
            <Camera size={size >= 64 ? 22 : 16} aria-hidden />
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={onFile}
            disabled={busy || (!userId && allowUpload)}
          />
        </label>
      ) : null}
      {preview && (
        <button
          type="button"
          onClick={removePreview}
          className="-translate-x-1/2 -translate-y-1/2 absolute z-10 grid h-6 w-6 place-items-center rounded-full bg-tinta text-white text-xs"
          aria-label="Quitar foto"
        >
          ×
        </button>
      )}
    </div>
  );
}
