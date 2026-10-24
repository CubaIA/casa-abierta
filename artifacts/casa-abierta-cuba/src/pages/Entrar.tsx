import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { LogIn, UserPlus } from 'lucide-react';
import { useAuth, demoMode } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Mode = 'login' | 'signup';

export default function Entrar() {
  const { signIn, signUp, userId, loading } = useAuth();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [accountType, setAccountType] = useState<'traveler' | 'provider'>('traveler');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Entrar | Casa Abierta Cuba';
  }, []);

  useEffect(() => {
    if (!loading && userId) navigate('/');
  }, [loading, userId, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);      try {
        const mail = email.trim();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
          throw new Error('Introduce un correo electrónico válido.');
        }
        if (mode === 'login') {
          const perfil = await signIn(mail, password);
          // Los administradores entran directamente al panel; el resto, al catálogo.
          navigate(perfil?.role === 'admin' ? '/admin' : '/');
        } else {
          if (fullName.trim().length < 2) throw new Error('Indica tu nombre completo.');
          if (password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres.');
          await signUp({ email: mail, password, fullName: fullName.trim(), accountType });
          navigate('/');
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'No se pudo completar la operación';
        // Login: credenciales incorrectas → mensaje personalizado
        const isLogin = mode === 'login';
        const wrongCreds = isLogin &&
          (typeof err === 'object' && err !== null &&
           (String((err as { code?: string | null }).code ?? '') === 'invalid_credentials' ||
            /invalid credentials/i.test(message) ||
            /Correo o contraseña/i.test(message)));
        if (wrongCreds) {
          setError('Correo o contraseña incorrectos. Verifica tus datos.');
        } else if (
          isLogin &&
          (typeof err === 'object' && err !== null &&
           (String((err as { code?: string | null }).code ?? '') === 'email_not_confirmed' ||
            /not confirmed/i.test(message)))
        ) {
          setError('Debes verificar tu correo electrónico. Revisa tu bandeja de entrada.');
        } else {
          setError(message);
        }
      } finally {
        setBusy(false);
      }
  }

  return (
    <div className="page-shell max-w-lg">
      <p className="section-kicker">Cuenta</p>
      <h1 className="text-3xl font-extrabold text-azul">
        {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
      </h1>
      <p className="mt-2 text-tinta/70">
        {mode === 'login'
          ? 'Accede para guardar favoritos, enviar solicitudes y gestionar tu negocio.'
          : 'Únete como viajero para explorar y solicitar, o como anfitrión para publicar tu negocio.'}
      </p>

      <div className="mt-5 flex gap-2" role="tablist" aria-label="Modo">
        <button
          role="tab"
          aria-selected={mode === 'login'}
          className={`button-ghost ${mode === 'login' ? '!bg-azul !text-white !border-azul' : ''}`}
          onClick={() => setMode('login')}
          type="button"
        >
          <LogIn size={15} /> Iniciar sesión
        </button>
        <button
          role="tab"
          aria-selected={mode === 'signup'}
          className={`button-ghost ${mode === 'signup' ? '!bg-azul !text-white !border-azul' : ''}`}
          onClick={() => setMode('signup')}
          type="button"
        >
          <UserPlus size={15} /> Registrarme
        </button>
      </div>

      <form onSubmit={onSubmit} className="panel mt-4 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="field-label" htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              className="field-input"
              required
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Tu nombre y apellido"
            />
          </div>
        )}

        <div>
          <label className="field-label" htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            className="field-input"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label className="field-label" htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            className="field-input"
            required
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
          />
          <button
            type="button"
            className="ml-2 text-xs font-semibold text-azul hover:underline"
            onClick={() => document.getElementById('reset-password')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
        <div id="reset-password" className="mt-2 text-xs text-tinta/60">
          <button
            type="button"
            className="font-semibold text-azul hover:underline"
            onClick={async () => {
              const mail = email.trim();
              if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail)) {
                setError('Escribe tu correo para reenviar las instrucciones de recuperación.');
                return;
              }
              if (supabase) {
                try {
                  await supabase.auth.resetPasswordForEmail(mail);
                  setError('Revisa tu bandeja de entrada para cambiar tu contraseña.');
        } catch (err) {
          setError('No se pudo enviar el correo. Intenta más tarde.');
        }
              } else {
                setError('No se pudo enviar el correo. Intenta más tarde.');
              }
            }}
          >
            Reenviar instrucciones de recuperación
          </button>
        </div>

        {mode === 'signup' && (
          <fieldset>
            <legend className="field-label">Tipo de cuenta</legend>
            <div className="grid grid-cols-2 gap-2">
              <label className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${accountType === 'traveler' ? 'border-azul bg-azul-200/40' : 'border-arena-2'}`}>
                <input
                  type="radio"
                  name="accountType"
                  className="sr-only"
                  checked={accountType === 'traveler'}
                  onChange={() => setAccountType('traveler')}
                />
                <strong className="block">Viajero</strong>
                Exploro, guardo y envío solicitudes
              </label>
              <label className={`cursor-pointer rounded-xl border-2 p-3 text-sm ${accountType === 'provider' ? 'border-azul bg-azul-200/40' : 'border-arena-2'}`}>
                <input
                  type="radio"
                  name="accountType"
                  className="sr-only"
                  checked={accountType === 'provider'}
                  onChange={() => setAccountType('provider')}
                />
                <strong className="block">Anfitrión</strong>
                Publico mi negocio o servicio
              </label>
            </div>
            <p className="field-hint">El rol administrador nunca puede asignarse desde el registro; se configura desde Supabase.</p>
          </fieldset>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}

        <button className="button-primary w-full justify-center" disabled={busy} type="submit">
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>

        {demoMode && (
          <div className="rounded-xl bg-arena border border-arena-2 p-3 text-xs text-tinta/70">
            <strong>Modo demo:</strong> prueba con <code>viajero@casa.cu</code>, <code>proveedor@casa.cu</code> o{' '}
            <code>admin@casa.cu</code> — contraseña <code>demo1234</code>.
          </div>
        )}
      </form>
    </div>
  );
}
