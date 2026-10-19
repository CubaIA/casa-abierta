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
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
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
    }),
    [userId, email, profile, loading, signIn, signUp, signOut, refreshProfile],
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
