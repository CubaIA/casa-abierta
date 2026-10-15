```
/** Capa de datos de Casa Abierta.
 *
 * Con Supabase configurado usa PostgREST + RPCs (RLS es la frontera).
 * Sin credenciales, un almacén local en localStorage replica los flujos
 * con datos de ejemplo para que la demo sea navegable.
 */
import { isSupabaseConfigured } from './env';
import { BUSINESS_AUTH_COLS, BUSINESS_PUBLIC_COLS, REQUEST_COLS, supabase } from './supabase';
import type {
  AccountStatus,
  Business,
  BusinessRow,
  BusinessStatus,
  Category,
  ContactMessage,
  ContactStatus,
  Profile,
  Report,
  ReportStatus,
  RequestStatus,
  Review,
  Role,
  SubmitBusinessInput,
} from './types';

const DEMO_KEY = 'casa_abierta_demo_v1';
const SESSION_KEY = 'casa_abierta_session_v1';

export const isDemo = !isSupabaseConfigured;

/* ------------------------------------------------------------------ */
/* Almacén demo                                                        */
/* ------------------------------------------------------------------ */

interface DemoStore {
  businesses: Business[];
  requests: BusinessRow[];
  favorites: Array<{ user_id: string; business_id: string }>;
  reviews: Review[];
  reports: Report[];
  messages: ContactMessage[];
}

const demoUuid = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const part = (n: number) => (h + n).toString(16).padStart(8, '0');
  return `${part(1)}-${part(2)}-4${part(3).slice(1)}-a${part(4).slice(1)}-${part(5)}${part(6)}`.slice(0, 36);
};
```
