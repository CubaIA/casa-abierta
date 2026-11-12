import { useEffect, useState } from 'react';
import { Building2, CheckCircle2, Globe2, Headset, Send } from 'lucide-react';
import { AvisoError } from '@/components/AvisoError';
import { crearPartner } from '@/lib/partners';

/**
 * Landing B2B para agencias y tour operadores internacionales.
 *
 * Página pública e independiente del resto del catálogo: solo capta la
 * solicitud en la tabla `partners` y la deja para el panel de administración.
 */
export default function Partners() {
  const [agencyName, setAgencyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('');
  const [website, setWebsite] = useState('');
  const [annualClients, setAnnualClients] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Partners B2B | Casa Abierta Cuba';
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (agencyName.trim().length < 2) {
      setError('Escribe el nombre de la agencia.');
      return;
    }
    if (contactName.trim().length < 2) {
      setError('Escribe el nombre de la persona de contacto.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Escribe un correo válido para poder responderte.');
      return;
    }
    if (country.trim().length < 2) {
      setError('Indica el país de la agencia.');
      return;
    }
    setBusy(true);
    try {
      await crearPartner({
        agencyName,
        contactName,
        email,
        country,
        website,
        annualClients,
        message,
      });
      setSent(true);
      setAgencyName('');
      setContactName('');
      setEmail('');
      setCountry('');
      setWebsite('');
      setAnnualClients('');
      setMessage('');
    } catch (err) {
      // El detalle real de Supabase ya se registra en consola; aquí se muestra.
      console.error('[operadores] No se pudo enviar la solicitud:', err);
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-3xl">
      <p className="section-kicker">Programa de partners</p>
      <h1 className="text-3xl font-extrabold text-azul sm:text-4xl">
        Conviértete en Partner de Casa Abierta Cuba
      </h1>
      <p className="mt-3 text-base text-tinta/80">
        ¿Eres una agencia o tour operador? Conecta con nuestra red de alojamientos, guías y transporte, y gestiona las
        solicitudes de tus clientes desde un solo panel.
      </p>
      <p className="mt-3 text-sm text-tinta/70">
        Te damos acceso a nuestra red de proveedores locales verificados, tecnología para gestionar reservas y
        solicitudes sin fricción, y asistencia local en Cuba para resolver cualquier imprevisto sobre el terreno.
      </p>

      <ul className="mt-5 grid gap-3 sm:grid-cols-3">
        <li className="panel !p-4">
          <Building2 size={20} className="text-terracota-600" aria-hidden />
          <p className="mt-2 text-sm font-bold text-azul">Red de proveedores locales</p>
          <p className="mt-1 text-xs text-tinta/70">
            Alojamientos, guías y transporte en un mismo lugar, con datos verificados.
          </p>
        </li>
        <li className="panel !p-4">
          <Globe2 size={20} className="text-terracota-600" aria-hidden />
          <p className="mt-2 text-sm font-bold text-azul">Tecnología de reservas</p>
          <p className="mt-1 text-xs text-tinta/70">
            Centraliza las solicitudes de tus clientes y sigue su estado desde un panel.
          </p>
        </li>
        <li className="panel !p-4">
          <Headset size={20} className="text-terracota-600" aria-hidden />
          <p className="mt-2 text-sm font-bold text-azul">Asistencia local en Cuba</p>
          <p className="mt-1 text-xs text-tinta/70">
            Un equipo en destino que acompaña a tu grupo cuando hace falta.
          </p>
        </li>
      </ul>

      <form onSubmit={onSubmit} className="panel mt-6 space-y-4">
        <h2 className="text-lg font-extrabold text-azul">Cuéntanos sobre tu agencia</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="p-agency">Nombre de la agencia *</label>
            <input
              id="p-agency"
              className="field-input"
              required
              maxLength={160}
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Ej. Caribe Travel Group"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="p-contact">Nombre del contacto *</label>
            <input
              id="p-contact"
              className="field-input"
              required
              maxLength={120}
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Nombre y apellidos"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="p-email">Email *</label>
            <input
              id="p-email"
              type="email"
              className="field-input"
              required
              maxLength={160}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contacto@agencia.com"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="p-country">País *</label>
            <input
              id="p-country"
              className="field-input"
              required
              maxLength={80}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Ej. España"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="p-website">Sitio web</label>
            <input
              id="p-website"
              type="url"
              className="field-input"
              maxLength={200}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://tuagencia.com"
            />
          </div>
          <div>
            <label className="field-label" htmlFor="p-clients">Volumen anual de clientes (aprox)</label>
            <input
              id="p-clients"
              className="field-input"
              maxLength={80}
              value={annualClients}
              onChange={(e) => setAnnualClients(e.target.value)}
              placeholder="Ej. 250 viajeros al año"
            />
          </div>
        </div>

        <div>
          <label className="field-label" htmlFor="p-message">Mensaje / Servicios requeridos</label>
          <textarea
            id="p-message"
            className="field-input"
            rows={4}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Qué servicios necesitas (alojamiento, guías, transporte…), mercados emisores y fechas previstas."
          />
        </div>

        <AvisoError mensaje={error} />
        {sent && (
          <p className="form-success inline-flex items-start gap-2" role="status">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden />
            Gracias. Nuestro equipo se pondrá en contacto contigo en menos de 24h.
          </p>
        )}

        <button className="button-primary" type="submit" disabled={busy}>
          <Send size={16} aria-hidden /> {busy ? 'Enviando…' : 'Enviar solicitud'}
        </button>
      </form>
    </div>
  );
}
