/* Actualización del marketplace para Fase 4 */
import { isSupabaseConfigured } from './env';
import { supabase } from './supabase';
// ... resto del contenido ya tenemos localmente
export const DEMO_CATEGORIES = [
  { key: 'alojamiento', label: 'Alojamiento', active: true },
  { key: 'gastronomia', label: 'Gastronomía', active: true },
  { key: 'experiencias_culturales', label: 'Experiencias culturales', active: true },
  { key: 'guias_locales', label: 'Guías locales', active: true },
  { key: 'servicios_turisticos', label: 'Servicios turísticos', active: true },
  { key: 'naturaleza', label: 'Naturaleza', active: true },
  { key: 'ecoturismo', label: 'Ecoturismo', active: true },
  { key: 'artesanos', label: 'Artesanías', active: true },
  { key: 'turismo_inclusivo', label: 'Turismo inclusivo', active: true },
];
