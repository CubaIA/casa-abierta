/**
 * Solicitudes de agencias y tour operadores (tabla `partners`).
 *
 * El formulario B2B es público y no pide cuenta: la agencia deja sus datos y
 * el equipo los revisa en el panel de administración. Sin Supabase configurado
 * se guarda en localStorage para que el modo demostración siga siendo útil.
 */

import { supabase } from './supabase';

export type PartnerStatus = 'new' | 'contacted' | 'active';

export interface Partner {
  id: string;
  agency_name: string;
  contact_name: string;
  email: string;
  country: string;
  website: string | null;
  annual_clients: string | null;
  message: string | null;
  status: PartnerStatus;
  created_at: string;
}

export interface NuevoPartner {
  agencyName: string;
  contactName: string;
  email: string;
  country: string;
  website: string;
  annualClients: string;
  message: string;
}

const CLAVE_DEMO = 'casa-abierta:partners-demo';

const FALTA_TABLA =
  'La base de datos todavía no tiene la tabla de partners: aplica supabase/migrations/019_partners.sql en el proyecto de Supabase y reintenta.';

function esTablaAusente(mensaje: string): boolean {
  return /42P01|does not exist|Could not find the table|schema cache/i.test(mensaje);
}

function leerDemo(): Partner[] {
  if (typeof window === 'undefined') return [];
  try {
    const crudo = window.localStorage.getItem(CLAVE_DEMO);
    const datos = crudo ? (JSON.parse(crudo) as Partner[]) : [];
    return Array.isArray(datos) ? datos : [];
  } catch {
    return [];
  }
}

function guardarDemo(partners: Partner[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CLAVE_DEMO, JSON.stringify(partners));
  } catch {
    /* almacenamiento lleno o bloqueado: la solicitud ya se envió */
  }
}

/** Guarda la solicitud de una agencia en estado `new`. */
export async function crearPartner(input: NuevoPartner): Promise<void> {
  const fila = {
    agency_name: input.agencyName.trim().slice(0, 160),
    contact_name: input.contactName.trim().slice(0, 120),
    email: input.email.trim().slice(0, 160),
    country: input.country.trim().slice(0, 80),
    website: input.website.trim().slice(0, 200) || null,
    annual_clients: input.annualClients.trim().slice(0, 80) || null,
    message: input.message.trim().slice(0, 2000) || null,
    status: 'new' as PartnerStatus,
  };

  if (supabase) {
    const { error } = await supabase.from('partners').insert(fila);
    if (!error) return;
    console.error('[partners] Error guardando la solicitud:', error);
    if (esTablaAusente(error.message) || /row-level security|42501/i.test(error.message)) {
      throw new Error(FALTA_TABLA);
    }
    throw new Error(error.message || 'No se pudo enviar la solicitud.');
  }

  guardarDemo([
    { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...fila },
    ...leerDemo(),
  ]);
}

/** Todas las solicitudes B2B, de la más reciente a la más antigua. */
export async function listarPartners(): Promise<Partner[]> {
  const cliente = supabase;
  if (cliente) {
    const { data, error } = await cliente
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[partners] Error leyendo las solicitudes:', error);
      if (esTablaAusente(error.message)) return [];
      throw new Error(error.message);
    }
    return (data ?? []) as Partner[];
  }
  return leerDemo();
}

/** Cambia el estado de seguimiento de una solicitud B2B. */
export async function actualizarEstadoPartner(id: string, status: PartnerStatus): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('partners').update({ status }).eq('id', id);
    if (error) {
      console.error('[partners] Error actualizando el estado:', error);
      throw new Error(error.message);
    }
    return;
  }
  const partners = leerDemo();
  const partner = partners.find((p) => p.id === id);
  if (partner) {
    partner.status = status;
    guardarDemo(partners);
  }
}
