import type { Role } from './types';

/**
 * Normaliza el rol que llega de la base de datos o del registro.
 *
 * Históricamente conviven dos nombres para el mismo rol: `provider` (el que
 * usan las políticas RLS y los RPC) y `anfitrion` (el que guardan algunas
 * bases de datos y registros antiguos). Toda comparación de rol en la interfaz
 * debe pasar por aquí para no ocultar el panel de anfitrión por un nombre.
 */
const HOST_ALIASES = ['provider', 'anfitrion', 'anfitriona', 'host', 'proveedor'];

export function normalizeRole(raw: string | null | undefined): Role | null {
  if (!raw) return null;
  const value = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // sin tildes: «anfitrión» se compara como «anfitrion»

  if (value === 'admin' || value === 'administrador') return 'admin';
  if (HOST_ALIASES.includes(value)) return 'provider';
  if (value === 'traveler' || value === 'viajero') return 'traveler';
  return null;
}

/** ¿El rol es de anfitrión o administrador? Tolerante a `provider`/`anfitrion`. */
export function isHostRole(raw: string | null | undefined): boolean {
  const role = normalizeRole(raw);
  return role === 'provider' || role === 'admin';
}

/**
 * ¿El rol puede ver una entrada de menú restringida?
 * `allowed` contiene los nombres canónicos (`provider`, `admin`, `traveler`).
 */
export function hasAllowedRole(allowed: string[] | undefined, raw: string | null | undefined): boolean {
  if (!allowed || allowed.length === 0) return true;
  const role = normalizeRole(raw);
  return role !== null && allowed.includes(role);
}
