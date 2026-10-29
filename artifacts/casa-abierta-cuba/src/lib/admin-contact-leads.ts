/** Registro silencioso de contactos para el panel de analítica. */

import { supabase } from './supabase';

export interface AdminContactLeads {
  business_id: string;
  count: number;
}

/**
 * Cantidad de contactos registrados para un negocio.
 *
 * La tabla `contact_leads` existe solo en proyectos que aplicaron la migración
 * 011. En esos proyectos el panel la lee mediante la función
 * `admin_count_contact_leads` (RLS protegida + comprobación de rol).
 */
export async function adminCountContactLeads(id: string): Promise<AdminContactLeads> {
  if (!supabase) {
    return { business_id: id, count: 0 };
  }
  const { data, error } = await supabase.rpc('admin_count_contact_leads', { p_business_id: id });
  if (!error) {
    return { business_id: id, count: Number(data ?? 0) };
  }
  if (/Could not find the function|PGRST202/i.test(error.message)) {
    return { business_id: id, count: 0 };
  }
  throw new Error(error.message);
}
