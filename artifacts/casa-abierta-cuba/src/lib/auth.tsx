import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { isSupabaseConfigured } from './env';
import * as db from './marketplace';
import type { Profile, Role } from './types';
import { supabase } from './supabase';

interface AuthContextValue {
  userId: string | null;
  email: string | null;
  profile: Profile | null;
  role: Role | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<Profile | null>;
  signUp: (input: { email: string; password: string; fullName: string; accountType: 'traveler' | 'provider' }) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** La URL trae un enlace de recuperación (`type=recovery`) o Supabase emitió PASSWORD_RECOVERY. */
  passwordRecovery: boolean;
  /** Guarda la contraseña nueva del usuario recuperado (`auth.updateUser`). */
  updatePassword: (nueva: string) => Promise<void>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Detecta el enlace de recuperación de Supabase.
 *
 * Supabase lo devuelve con los tokens en el hash
 * (`#access_token=…&type=recovery`), que el enrutador no interpreta como ruta:
 * sin esta comprobación el usuario aterrizaba en la portada como si nada.
 */
export function esEnlaceDeRecuperacion(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  if (hash) {
    const desdeHash = new URLSearchParams(hash);
    if (desdeHash.get('type') === 'recovery') return true;
  }
  return new URLSearchParams(window.location.search).get('type') === 'recovery';
}

/** Limpia del hash los tokens de un solo uso ya consumidos. */
function limpiarHashDeRecuperacion() {
  if (typeof window === 'undefined') return;
  if (!/type=recovery/.test(window.location.hash)) return;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  const loadProfile = useCallback(async (id: string) => {
    try {
      const p = await db.getProfile(id);
      setProfile(p);
      return p;
    } catch {
      setProfile(null);
      return null;
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) await loadProfile(userId);
  }, [userId, loadProfile]);

  useEffect(() => {
    let cancelled = false;

    if (supabase) {
      // Se comprueba antes de getSession: esa llamada consume el hash.
      if (esEnlaceDeRecuperacion()) setPasswordRecovery(true);
      supabase.auth.getSession().then(async ({ data }) => {
        if (cancelled) return;
        const user = data.session?.user;
        if (user) {
          setUserId(user.id);
          setEmail(user.email ?? null);
          await loadProfile(user.id);
        }
        setLoading(false);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        // El enlace «Reset Password» llega como PASSWORD_RECOVERY.
        if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true);
        const user = session?.user;
        setUserId(user?.id ?? null);
        setEmail(user?.email ?? null);
        if (user) void loadProfile(user.id);
        else setProfile(null);
      });
      return () => {
        cancelled = true;
        sub.subscription.unsubscribe();
      };
    }

    const session = db.getDemoSession();
    if (session) {
      setUserId(session.user.id);
      setEmail(session.user.email);
      void loadProfile(session.user.id);
    }
    setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [loadProfile]);

  const signIn = useCallback(
    async (mail: string, password: string) => {
      const session = await db.signIn(mail, password);
      setUserId(session.user.id);
      setEmail(session.user.email);
      return await loadProfile(session.user.id);
    },
    [loadProfile],
  );

  const signUp = useCallback(
    async (input: { email: string; password: string; fullName: string; accountType: 'traveler' | 'provider' }) => {
      const session = await db.signUp(input);
      setUserId(session.user.id);
      setEmail(session.user.email);
      await loadProfile(session.user.id);
    },
    [loadProfile],
  );

  const signOut = useCallback(async () => {
    await db.signOut();
    setUserId(null);
    setEmail(null);
    setProfile(null);
  }, []);

  const updatePassword = useCallback(async (nueva: string) => {
    if (!supabase) {
      throw new Error('La recuperación de contraseña necesita conexión con la plataforma.');
    }
    const { error } = await supabase.auth.updateUser({ password: nueva });
    if (error) throw error;
    setPasswordRecovery(false);
    limpiarHashDeRecuperacion();
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    setPasswordRecovery(false);
    limpiarHashDeRecuperacion();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      userId,
      email,
      profile,
      role: profile?.role ?? null,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      passwordRecovery,
      updatePassword,
      clearPasswordRecovery,
    }),
    [
      userId,
      email,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      passwordRecovery,
      updatePassword,
      clearPasswordRecovery,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

/** Indica si la app corre en modo demostración (sin Supabase). */
export const demoMode = !isSupabaseConfigured;
