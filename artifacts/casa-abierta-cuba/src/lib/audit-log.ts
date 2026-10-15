export interface AuditEntry {
  timestamp: string;
  action: string;
  actor: string;
}

const AUDIT_ACTOR = 'Yoanny Guillén Vargas (CEO)';

export function logAudit(action: string): void {
  // Documental: no altera almacenamiento externo. Úsalo para dejar trazas intencionales.
  try {
    // eslint-disable-next-line no-console
    console.info('[AUDIT]', new Date().toISOString(), action, AUDIT_ACTOR);
  } catch {
    /* noop */
  }
}

export const AUDIT_CEO = AUDIT_ACTOR;
