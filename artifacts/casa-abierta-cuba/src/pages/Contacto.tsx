import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import { createContactMessage } from '@/lib/marketplace';
import { useAuth } from '@/lib/auth';
import { AvisoError } from '@/components/AvisoError';

const INQUIRY_TYPES = [
  { value: 'general', label: 'Consulta general' },
  { value: 'agency', label: 'Agencia de viajes' },
  { value: 'operator', label: 'Operador turístico' },
  { value: 'experience_creator', label: 'Creador de experiencias' },
  { value: 'cultural_project', label: 'Proyecto cultural' },
];

export default function Contacto() {
  const { userId, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [inquiryType, setInquiryType] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = 'Contacto | Casa Abierta Cuba';
    if (profile) {
      if (!name) setName(profile.full_name ?? '');
      if (!email) setEmail(profile.email ?? '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!userId) {
      setError('Inicia sesión para enviar un mensaje de contacto.');
      return;
    }
    if (name.trim().length < 2) {
      setError('Escribe tu nombre.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Escribe un correo válido para poder responderte.');
      return;
    }
    if (subject.trim().length < 3) {
      setError('Escribe un asunto.');
      return;
    }
    if (message.trim().length < 10) {
      setError('El mensaje debe tener al menos 10 caracteres.');
      return;
    }
    setBusy(true);
    try {
      // La BD real no tiene columna inquiry_type: el tipo se antepone al mensaje.
      await createContactMessage({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: `[${inquiryType}] ${message.trim()}`,
      });
      setSent(true);
      setSubject('');
      setMessage('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el mensaje');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page-shell max-w-2xl">
      <p className="section-kicker">Hablemos</p>
      <h1 className="text-3xl font-extrabold text-azul">Contacto</h1>
      <p className="mt-2 text-tinta/70">
        Escríbenos sobre colaboraciones, dudas sobre la plataforma o para reportar un problema. Respondemos desde el
        equipo de Casa Abierta.
      </p>

      <form onSubmit={onSubmit} className="panel mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor="c-name">Tu nombre *</label>
            <input id="c-name" className="field-input" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Cómo te llamas" />
          </div>
          <div>
            <label className="field-label" htmlFor="c-email">Tu correo *</label>
            <input id="c-email" type="email" className="field-input" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Para responderte" />
          </div>
        </div>
        <div>
          <label className="field-label" htmlFor="c-type">Tipo de consulta</label>
          <select id="c-type" className="field-input" value={inquiryType} onChange={(e) => setInquiryType(e.target.value)}>
            {INQUIRY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="c-subject">Asunto *</label>
          <input id="c-subject" className="field-input" required value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="En una frase" />
        </div>
        <div>
          <label className="field-label" htmlFor="c-message">Mensaje *</label>
          <textarea id="c-message" className="field-input" rows={5} required value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Cuéntanos en detalle…" />
        </div>

        <AvisoError mensaje={error} />
        {sent && <p className="form-success">Mensaje enviado. Gracias por escribirnos.</p>}

        <button className="button-primary" disabled={busy} type="submit">
          <Send size={16} /> {busy ? 'Enviando…' : 'Enviar mensaje'}
        </button>

        {!userId && <p className="field-hint">Necesitas iniciar sesión para enviar el mensaje.</p>}
      </form>
    </div>
  );
}
