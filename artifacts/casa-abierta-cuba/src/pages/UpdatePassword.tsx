import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { AvisoError, WHATSAPP_AYUDA } from '@/components/AvisoError';
import { normalizeRole } from '@/lib/roles';

/** Página de destino tras cambiar la contraseña: su propio panel si lo tiene. */
function destinoPorRol(role: string | null): string {
  const normalizado = normalizeRole(role);
  if (normalizado === 'admin') return '/admin';
  if (normalizado === 'provider') return '/anfitrion';
  return '/';
}

/**
 * Vista dedicada de Supabase para los enlaces de recuperación
 * (`.../#access_token=...&type=recovery`).
 *
 * La ruta se abre automáticamente al detectar el evento PASSWORD_RECOVERY o
 * `type=recovery` en la URL; el guardado usa `auth.updateUser`.
 */
export default function UpdatePassword() {
  const { updatePassword, passwordRecovery, userId, loading, role } = useAuth();
  const [, navigate] = useLocation();
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Nueva contraseña | Casa Abierta Cuba';
  }, []);

  // Sin sesión ni marca de recuperación el enlace ya no sirve (caducó o se usó).
  const enlaceSinValidez = !loading && !userId && !passwordRecovery;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmacion) {
      setError('Las dos contraseñas no coinciden. Revísalas e inténtalo otra vez.');
      return;
    }

    setBusy(true);
    try {
      await updatePassword(password);
      setExito(true);
      const destino = destinoPorRol(role);
      window.setTimeout(() => navigate(destino, { replace: true }), 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la nueva contraseña.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-lg">
      <p className="section-kicker">Cuenta</p>
      <h1 className="text-3xl font-extrabold text-azul">Crea tu nueva contraseña</h1>
      <p className="mt-2 text-tinta/70">
        Escribe la contraseña con la que quieres entrar a Casa Abierta Cuba. Después volverás
        automáticamente a tu panel.
      </p>

      {enlaceSinValidez ? (
        <div className="panel mt-4 space-y-3">
          <p className="flex items-start gap-2 text-sm text-tinta/80">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-azul" aria-hidden />
            Este enlace de recuperación ya caducó o se usó antes. Pide uno nuevo desde la pantalla
            de acceso y ábrelo desde el mismo dispositivo.
          </p>
          <button
            type="button"
            className="button-primary w-full justify-center"
            onClick={() => navigate('/entrar')}
          >
            Pedir un enlace nuevo
          </button>
          <p className="text-center text-xs text-tinta/60">
            ¿Sigues sin poder entrar?{' '}
            <a
              href={WHATSAPP_AYUDA}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-azul underline decoration-dotted underline-offset-2"
            >
              Escríbenos por WhatsApp
            </a>
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="panel mt-4 space-y-4">
          <div>
            <label className="field-label" htmlFor="nueva-password">Nueva contraseña</label>
            <input
              id="nueva-password"
              type="password"
              className="field-input"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={exito}
            />
          </div>

          <div>
            <label className="field-label" htmlFor="confirmar-password">Repite la contraseña</label>
            <input
              id="confirmar-password"
              type="password"
              className="field-input"
              required
              autoComplete="new-password"
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              placeholder="La misma contraseña"
              disabled={exito}
            />
          </div>

          {error && <AvisoError mensaje={error} />}

          {exito && (
            <p
              className="flex items-center gap-2 rounded-xl border border-azul/30 bg-azul-200/40 p-3 text-sm font-semibold text-azul"
              role="status"
            >
              <ShieldCheck size={18} aria-hidden /> Contraseña actualizada correctamente. Te
              llevamos a tu panel…
            </p>
          )}

          <button className="button-primary w-full justify-center" type="submit" disabled={busy || exito}>
            <KeyRound size={16} aria-hidden /> {busy ? 'Guardando…' : exito ? 'Guardado' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  );
}
