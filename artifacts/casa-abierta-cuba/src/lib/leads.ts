/**
 * Solicitudes de reserva (leads) de la ficha pública.
 *
 * Cualquier visitante puede pedir disponibilidad sin cuenta: la solicitud se
 * guarda en `public.leads` como `pending` y el anfitrión la ve en su panel y
 * la mueve a `contacted` o `booked`. Sin Supabase configurado se guarda en
 * localStorage para que el modo demostración siga siendo coherente.
 */

import { supabase } from './supabase';
import type { Lead, LeadStatus } from './types';

const CLAVE_DEMO = 'casa-abierta:leads-demo';

/** Aviso único cuando el proyecto aún no tiene la tabla de solicitudes. */
const FALTA_TABLA =
  'La base de datos todavía no tiene la tabla de solicitudes: aplica supabase/migrations/016_leads.sql en el proyecto de Supabase y reintenta.';

function esTablaAusente(mensaje: string): boolean {
  return /42P01|does not exist|Could not find the table|schema cache/i.test(mensaje);
}

function leerDemo(): Lead[] {
  if (typeof window === 'undefined') return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE_DEMO);
    const datos = crudo ? (JSON.parse(crudo) as Lead[]) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarDemo(leads: Lead[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(leads));
  } catch {
    /* almacenamiento lleno o bloqueado: la solicitud ya se envió */
  }
}

export interface NuevoLead {
  businessId: string;
  /** Dueño del negocio (`businesses.owner_id`), destinatario de la solicitud. */
  hostId: string | null;
  fullName: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  budget: string;
  message: string;
}

/** Crea una solicitud de reserva en estado `pending`. */
export async function crearLead(input: NuevoLead): Promise<void> {
  const fila = {
    business_id: input.businessId,
    host_id: input.hostId,
    full_name: input.fullName.trim().slice(0, 120),
    email: input.email.trim().slice(0, 160),
    phone: input.phone.trim().slice(0, 40),
    check_in: input.checkIn || null,
    check_out: input.checkOut || null,
    guests: Number.isFinite(input.guests) && input.guests > 0 ? Math.round(input.guests) : null,
    budget: input.budget.trim().slice(0, 80) || null,
    message: input.message.trim().slice(0, 1000) || null,
    status: 'pending' as LeadStatus,
  };

  if (supabase) {
    const { error } = await supabase.from('leads').insert(fila);
    if (!error) return;
    if (esTablaAusente(error.message) || /row-level security|42501/i.test(error.message)) {
      throw new Error(FALTA_TABLA);
    }
    throw new Error(error.message);
  }

  guardarDemo([
    { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...fila },
    ...leerDemo(),
  ]);
}

/** Solicitudes recibidas por un anfitrión, de la más reciente a la más antigua. */
export async function listarLeadsDelAnfitrion(hostId: string): Promise<Lead[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('host_id', hostId)
      .order('created_at', { ascending: false });
    if (error) {
      // Proyecto sin la migración 016: panel vacío, no error de página.
      if (esTablaAusente(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []) as Lead[];
  }
  return leerDemo().filter((l) => l.host_id === hostId);
}

/** Cambia el estado de una solicitud (`contacted` o `booked`). */
export async function actualizarEstadoLead(id: string, status: LeadStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  const leads = leerDemo();
  const lead = leads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    guardarDemo(leads);
  }
}
