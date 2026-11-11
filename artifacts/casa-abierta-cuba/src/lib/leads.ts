/**
 * Solicitudes de reserva (leads) de la ficha pública.
 *
 * Cualquier visitante puede pedir disponibilidad sin cuenta: la solicitud se
 * guarda en `public.leads` como `pending` y el anfitrión la ve en su panel y
 * la mueve a `contacted` o `booked`. Sin Supabase configurado se guarda en
 * localStorage para que el modo demostración siga siendo coherente.
 *
 * Nombres de columna exactos de la tabla `leads`:
 * business_id, host_id, tourist_name, tourist_email, tourist_phone,
 * check_in, check_out, guests, budget, message, status.
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

/**
 * Dueño del negocio (`businesses.owner_id`).
 *
 * La ficha pública no puede leer `owner_id` (columna privada para anon), así
 * que cuando el negocio cargado no lo trae se pide por la función
 * `business_host_id`, que solo devuelve ese identificador. Si falla, el lead
 * se envía sin destinatario antes que perder la solicitud.
 */
async function hostDelNegocio(businessId: string): Promise<string | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('business_host_id', {
      target_business_id: businessId,
    });
    if (error) {
      console.warn('[leads] No se pudo resolver el anfitrión del negocio:', error.message);
      return null;
    }
    return typeof data === 'string' && data.trim() ? data : null;
  } catch (error) {
    console.warn('[leads] Error inesperado resolviendo el anfitrión:', error);
    return null;
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
/** Crea una solicitud y devuelve su id (también sirve de enlace al chat). */
export async function crearLead(input: NuevoLead): Promise<string> {
  const leadId = crypto.randomUUID();
  const hostId = input.hostId ?? (await hostDelNegocio(input.businessId));

  const fila = {
    id: leadId,
    business_id: input.businessId,
    host_id: hostId,
    tourist_name: input.fullName.trim().slice(0, 120),
    tourist_email: input.email.trim().slice(0, 160),
    tourist_phone: input.phone.trim().slice(0, 40),
    check_in: input.checkIn || null,
    check_out: input.checkOut || null,
    guests: Number.isFinite(input.guests) && input.guests > 0 ? Math.round(input.guests) : null,
    budget: input.budget.trim().slice(0, 80) || null,
    message: input.message.trim().slice(0, 1000) || null,
    status: 'pending',
  };

  if (supabase) {
    const { error } = await supabase.from('leads').insert(fila);
    if (!error) return leadId;

    // Error exacto en consola para diagnosticar sin adivinar.
    console.error('[leads] Error insertando la solicitud en Supabase:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      fila,
    });

    if (esTablaAusente(error.message) || /row-level security|42501/i.test(error.message)) {
      throw new Error(FALTA_TABLA);
    }
    if (error.message) throw new Error(error.message);
    throw new Error('No se pudo enviar la solicitud.');
  }

  guardarDemo([
    { created_at: new Date().toISOString(), ...fila, status: 'pending' },
    ...leerDemo(),
  ]);
  return leadId;
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
      console.error('[leads] Error leyendo las solicitudes del anfitrión:', error);
      // Proyecto sin la migración 016: panel vacío, no error de página.
      if (esTablaAusente(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []) as Lead[];
  }
  return leerDemo().filter((l) => l.host_id === hostId);
}

/** Todas las solicitudes, para el panel de administración. */
export async function listarTodosLosLeads(): Promise<Lead[]> {
  const client = supabase;
  if (client) {
    const consulta = (cols: string) =>
      client.from('leads').select(cols).order('created_at', { ascending: false });
    // Con el nombre del negocio cuando la relación está en el esquema.
    let { data, error } = await consulta('*, businesses(title)');
    if (error && /Could not find a relationship|PGRST200|schema cache/i.test(error.message)) {
      ({ data, error } = await consulta('*'));
    }
    if (error) {
      console.error('[leads] Error leyendo todas las solicitudes:', error);
      if (esTablaAusente(error.message)) return [];
      throw new Error(error.message);
    }
    // `select()` con columnas dinámicas pierde el tipo: se afirma el resultado.
    return (data ?? []) as unknown as Lead[];
  }
  return leerDemo();
}

/** Solicitudes de un conjunto de casas (panel de agencia). */
export async function listarLeadsDeNegocios(businessIds: string[]): Promise<Lead[]> {
  if (businessIds.length === 0) return [];

  const client = supabase;
  if (client) {
    const orden = { ascending: false } as const;
    const sinJoin = async () => {
      const { data, error } = await client
        .from('leads')
        .select('*')
        .in('business_id', businessIds)
        .order('created_at', orden);
      if (error) {
        console.error('[leads] Error leyendo las solicitudes de la agencia:', error);
        if (esTablaAusente(error.message)) return [];
        throw new Error(error.message);
      }
      return (data ?? []) as unknown as Lead[];
    };

    const { data, error } = await client
      .from('leads')
      .select('*, businesses(title)')
      .in('business_id', businessIds)
      .order('created_at', orden);
    if (error) {
      // Relación no expuesta en el esquema: se leen sin el nombre del negocio.
      if (/Could not find a relationship|PGRST200|schema cache/i.test(error.message)) return sinJoin();
      console.error('[leads] Error leyendo las solicitudes de la agencia:', error);
      if (esTablaAusente(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []) as unknown as Lead[];
  }

  return leerDemo().filter((l) => businessIds.includes(l.business_id));
}

/** Reasigna una solicitud a otra casa de la misma agencia. */
export async function reasignarLead(id: string, businessId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('leads').update({ business_id: businessId }).eq('id', id);
    if (error) {
      console.error('[leads] Error reasignando la solicitud:', error);
      throw new Error(error.message);
    }
    return;
  }
  const leads = leerDemo();
  const lead = leads.find((l) => l.id === id);
  if (lead) {
    lead.business_id = businessId;
    guardarDemo(leads);
  }
}

/** Cambia el estado de una solicitud (`contacted` o `booked`). */
export async function actualizarEstadoLead(id: string, status: LeadStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);
    if (error) {
      console.error('[leads] Error actualizando el estado de la solicitud:', error);
      throw new Error(error.message);
    }
    return;
  }
  const leads = leerDemo();
  const lead = leads.find((l) => l.id === id);
  if (lead) {
    lead.status = status;
    guardarDemo(leads);
  }
}
