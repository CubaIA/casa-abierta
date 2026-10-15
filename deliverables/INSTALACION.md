# INSTALACION - Casa Abierta Cuba

## Requisitos

- Node.js 20+ (actualmente 22.11.1)
- pnpm 9+ (instalación: `corepack enable && corepack install -g pnpm`)

## Instalación

1. `git clone https://github.com/CubaIA/casa-abierta.git`
2. `cd casa-abierta`
3. `pnpm install` (instala todas las dependencias)
4. `cp .env.example .env` y configura las variables de entorno (Supabase URL, anon key, etc.)

## Desarrollo

- `pnpm dev` — ejecuta el servidor de desarrollo en http://localhost:3000
- `pnpm build` — compila para producción (typecheck + build de todos los filtros)
- `pnpm preview` — preview del build de producción
- `pnpm typecheck` — verifica tipos sin emitir

## Notas de la infraestructura

- El proyecto usa pnpm workspaces: `artifacts/casa-abierta-cuba`, `lib/api-client-react`, `scripts`.
- Para despliegue de Supabase: `supabase pull`, `supabase db push`, `supabase functions deploy`.
- Para despliegue de la aplicación: `pnpm build` y subir `dist/` a un hosting estático.
