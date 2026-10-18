import { useEffect, useState, useCallback } from 'react';
import { Link } from 'wouter';
import { Save, User } from 'lucide-react';
import { updateProfile } from '@/lib/marketplace';
import { uploadProfileAvatar } from '@/lib/avatars';
import { useAuth } from '@/lib/auth';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const TRIP_STYLES = ['Cultural', 'Aventura', 'Relajo', 'Gastronómico', 'Natural'];
const BUDGET_BANDS = ['Económico', 'Moderado', 'Confort', 'Premium'];

export default function Perfil() {
  const { userId, profile, loading, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [tripStyle, setTripStyle] = useState('');
  const [budgetBand, setBudgetBand] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Mi perfil | Casa Abierta Cuba';
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '');
      setPhone(profile.phone ?? '');
      setCountry(profile.country ?? '');
      setTripStyle(profile.trip_style ?? '');
      setBudgetBand(profile.budget_band ?? '');
      setAvatarUrl(profile.avatar_url ?? null);
    }
  }, [profile]);

  const onAvatarChange = useCallback(
    async (next: string | null) => {
      setAvatarUrl(next);
      if (!userId) return;
      try {
        await updateProfile(userId, { avatar_url: next });
        await refreshProfile();
      } catch {
        // vuelta atrás visual después de intentar persistir
        setAvatarUrl(profile?.avatar_url ?? null);
      }
    },
    [userId, profile, refreshProfile],
  );

  async function onAvatarFile(file: File) {
    if (!userId) return null;
    const url = await uploadProfileAvatar(userId, file);
    if (url) onAvatarChange(url);
    return url;
  }

  if (!loading && !userId) {
    return (
      <div className="page-shell">
        <div className="empty-state">
          <p>Inicia sesión para ver tu perfil.</p>
          <Link href="/entrar" className="button-primary mt-3 inline-flex">Entrar</Link>
        </div>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await updateProfile(userId, {
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        country: country.trim() || null,
        trip_style: tripStyle || null,
        budget_band: budgetBand || null,
      });
      await refreshProfile();
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-2xl">
      <p className="section-kicker">Cuenta</p>
      <h1 className="text-3xl font-extrabold text-azul inline-flex items-center gap-2">
        <User size={26} /> Mi perfil
      </h1>

      {profile && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`badge ${profile.role === 'admin' ? 'badge-red' : profile.role === 'provider' ? 'badge-blue' : 'badge-neutral'}`}>
            {profile.role === 'admin' ? 'Administrador' : profile.role === 'provider' ? 'Anfitrión' : 'Viajero'}
          </span>
          <span className={`badge ${(profile.account_status ?? 'active') === 'active' ? 'badge-green' : 'badge-red'}`}>
            {(profile.account_status ?? 'active') === 'active' ? 'Cuenta activa' : 'Cuenta suspendida'}
          </span>
          <span className="badge badge-neutral">{profile.email}</span>
        </div>
      )}
      {profile?.account_status === 'suspended' && (
        <p className="form-error mt-3">
          Tu cuenta está suspendida: no puedes escribir en la plataforma. Contacta al equipo si crees que es un error.
        </p>
      )}

      <form onSubmit={onSubmit} className="panel mt-5 space-y-4">
        <div className="flex items-center gap-4">
          <ProfileAvatar
            avatarUrl={avatarUrl ?? null}
            userId={userId}
            onAvatarChange={onAvatarChange}
            onUpload={onAvatarFile}
            size={72}
          />
          <div>
            <p className="font-extrabold text-azul">Foto de perfil</p>
            <p className="text-xs text-tinta/60">Se acepta jpeg, png o webp. Se sube a Storage y se vincula a tu cuenta.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="p-name">Nombre completo</label>
            <input id="p-name" className="field-input" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="field-label" htmlFor="p-phone">Teléfono</label>
            <input id="p-phone" className="field-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+53…" />
          </div>
          <div>
            <label className="field-label" htmlFor="p-country">País</label>
            <input id="p-country" className="field-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Ej. Cuba" />
          </div>
          <div>
            <label className="field-label" htmlFor="p-style">Estilo de viaje</label>
            <select id="p-style" className="field-input" value={tripStyle} onChange={(e) => setTripStyle(e.target.value)}>
              <option value="">Selecciona…</option>
              {TRIP_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label" htmlFor="p-budget">Presupuesto</label>
            <select id="p-budget" className="field-input" value={budgetBand} onChange={(e) => setBudgetBand(e.target.value)}>
              <option value="">Selecciona…</option>
              {BUDGET_BANDS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <p className="field-hint">
          El correo y el rol no se pueden editar desde aquí: el rol admin solo se asigna desde Supabase y el correo es
          tu identificador de acceso.
        </p>

        {error && <p className="form-error" role="alert">{error}</p>}
        {saved && <p className="form-success">Perfil guardado.</p>}

        <button className="button-primary" disabled={busy} type="submit">
          <Save size={16} /> {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
