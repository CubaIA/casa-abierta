import { useState } from 'react';
import { CalendarCheck, X } from 'lucide-react';
import type { Business } from '@/lib/types';
import { crearLead } from '@/lib/leads';

const MENSAJE_EXITO =
  '¡Gracias! Tu solicitud ha sido enviada. Nos pondremos en contacto contigo muy pronto para confirmar la disponibilidad.';

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface Formulario {
  nombre: string;
  email: string;
  telefono: string;
  llegada: string;
  salida: string;
  huespedes: string;
  presupuesto: string;
  mensaje: string;
}

const FORMULARIO_VACIO: Formulario = {
  nombre: '',
  email: '',
  telefono: '',
  llegada: '',
  salida: '',
  huespedes: '2',
  presupuesto: '',
  mensaje: '',
};

/**
 * Solicitud de reserva de la ficha pública.
 *
 * Sustituye al contacto directo por WhatsApp: el viajero deja sus datos y
 * fechas, la solicitud se guarda en `leads` como `pending` y el anfitrión la
 * atiende desde su panel. No hace falta cuenta ni sesión.
 */
export function SolicitudReserva({ business }: { business: Business }) {
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<Formulario>(FORMULARIO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviada, setEnviada] = useState(false);

  const campo = (clave: keyof Formulario) => ({
    value: form[clave],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [clave]: e.target.value })),
  });

  function abrir() {
    setError(null);
    setEnviada(false);
    setAbierto(true);
  }

  function cerrar() {
    setAbierto(false);
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (enviando) return;

    if (!form.nombre.trim()) return setError('Escribe tu nombre completo.');
    if (!CORREO_VALIDO.test(form.email.trim())) return setError('Escribe un correo electrónico válido.');
    if (form.telefono.replace(/\D/g, '').length < 6) return setError('Escribe un teléfono o WhatsApp de contacto.');
    if (!form.llegada || !form.salida) return setError('Indica la fecha de llegada y la de salida.');
    if (form.salida < form.llegada) return setError('La fecha de salida no puede ser anterior a la de llegada.');
    const huespedes = Number.parseInt(form.huespedes, 10);
    if (!Number.isFinite(huespedes) || huespedes < 1) return setError('Indica cuántos huéspedes viajan.');

    setEnviando(true);
    setError(null);
    try {
      await crearLead({
        businessId: business.id,
        hostId: business.owner_id ?? null,
        fullName: form.nombre,
        email: form.email,
        phone: form.telefono,
        checkIn: form.llegada,
        checkOut: form.salida,
        guests: huespedes,
        budget: form.presupuesto,
        message: form.mensaje,
      });
      setForm(FORMULARIO_VACIO);
      setEnviada(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="contacto" className="mt-8 scroll-mt-24 rounded-2xl border border-arena-2 bg-white p-5 sm:p-6">
      <h2 className="inline-flex items-center gap-2 text-lg font-extrabold text-azul">
        <CalendarCheck size={18} aria-hidden /> Reserva directo con el anfitrión
      </h2>
      <p className="mt-1 text-sm text-tinta/65">
        Cuéntanos tus fechas y cuántos viajan. El anfitrión recibe tu solicitud y te escribe para confirmar la
        disponibilidad y el precio. No necesitas cuenta.
      </p>

      <button
        type="button"
        onClick={abrir}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-azul px-6 py-4 text-base font-extrabold text-white shadow-lg shadow-azul/25 transition hover:bg-azul-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-azul"
      >
        <CalendarCheck size={20} aria-hidden /> Solicitar Reserva
      </button>

      <p className="mt-2 text-xs text-tinta/55">
        Te contactamos por correo o WhatsApp para confirmar fechas y condiciones.
      </p>

      {abierto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Solicitud de reserva"
          className="fixed inset-0 z-50 overflow-y-auto bg-tinta/60 p-4"
          onClick={cerrar}
        >
          <div
            className="mx-auto my-6 w-full max-w-xl rounded-2xl bg-white p-5 shadow-xl sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-extrabold text-azul">Solicitud de reserva</h3>
                <p className="mt-1 text-sm text-tinta/65">{business.name}</p>
              </div>
              <button
                type="button"
                onClick={cerrar}
                aria-label="Cerrar formulario"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-arena text-azul transition hover:bg-arena-2"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {enviada ? (
              <div className="mt-4">
                <p className="form-success" role="status">
                  {MENSAJE_EXITO}
                </p>
                <button type="button" className="button-ghost mt-3" onClick={cerrar}>
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={enviar} className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="field-label">Nombre completo</span>
                  <input className="field-input" type="text" required maxLength={120} autoComplete="name" {...campo('nombre')} />
                </label>

                <label>
                  <span className="field-label">Correo electrónico</span>
                  <input className="field-input" type="email" required maxLength={160} autoComplete="email" {...campo('email')} />
                </label>

                <label>
                  <span className="field-label">Teléfono / WhatsApp</span>
                  <input className="field-input" type="tel" required maxLength={40} autoComplete="tel" {...campo('telefono')} />
                </label>

                <label>
                  <span className="field-label">Fecha de llegada</span>
                  <input className="field-input" type="date" required {...campo('llegada')} />
                </label>

                <label>
                  <span className="field-label">Fecha de salida</span>
                  <input className="field-input" type="date" required {...campo('salida')} />
                </label>

                <label>
                  <span className="field-label">Número de huéspedes</span>
                  <input className="field-input" type="number" min={1} max={50} required {...campo('huespedes')} />
                </label>

                <label>
                  <span className="field-label">Presupuesto aproximado</span>
                  <input className="field-input" type="text" maxLength={80} placeholder="Ej. 40 USD por noche" {...campo('presupuesto')} />
                </label>

                <label className="sm:col-span-2">
                  <span className="field-label">Mensaje (opcional)</span>
                  <textarea className="field-input" rows={3} maxLength={1000} {...campo('mensaje')} />
                </label>

                {error && (
                  <p className="sm:col-span-2 text-sm font-semibold text-terracota-700" role="alert">
                    {error}
                  </p>
                )}

                <div className="sm:col-span-2">
                  <button type="submit" className="button-primary w-full" disabled={enviando}>
                    {enviando ? 'Enviando…' : 'Enviar solicitud'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
