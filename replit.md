# Casa Abierta Cuba

Marketplace turístico para descubrir y ofrecer alojamientos, servicios locales y experiencias auténticas en Cuba.

## Run & Operate

- Abrir la vista previa del artefacto Casa Abierta para ejecutar la aplicación web.
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Variable compartida requerida: `SUPABASE_URL`
- Secreto requerido: `SUPABASE_ANON_KEY` (clave pública anon/publishable; nunca usar `service_role` en el navegador)
- Migración y primer administrador: `artifacts/casa-abierta/supabase/migrations/001_casa_abierta.sql` y `artifacts/casa-abierta/docs/supabase-setup.md`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter, Tailwind CSS
- Auth y datos: Supabase Auth, PostgreSQL, Storage y RLS
- Build: bundle estático de producción con Vite

## Where things live

- `artifacts/casa-abierta/src/lib/marketplace.ts` — operaciones del catálogo.
- `artifacts/casa-abierta/src/lib/supabase.ts` — cliente Supabase y tipos de dominio.
- `artifacts/casa-abierta/supabase/migrations/001_casa_abierta.sql` — esquema, RLS, Storage y funciones administrativas.
- `artifacts/casa-abierta/docs/supabase-setup.md` — configuración y primer administrador.

## Architecture decisions

- La clave pública anon/publishable de Supabase se incluye en el navegador por diseño; RLS es la frontera de seguridad.
- El registro público no permite elevarse a administrador; el primer admin se configura desde Supabase SQL Editor.
- Los negocios existentes se conservan y los nuevos empiezan en `pending`; revisar políticas RLS previas antes de aplicar la migración.

## Product

Plataforma turística en español para Cuba con catálogo, registro de proveedores, autenticación, favoritos, solicitudes de contacto y moderación/gestión de usuarios.

## User preferences

Marca Casa Abierta 🇨🇺. Usar los colores azul, rojo y blanco de Cuba y priorizar móviles.

## Gotchas

La tabla Supabase `businesses` debe tener una columna UUID `id` compatible y campos alineados con la app antes de aplicar la migración. Revisar políticas RLS permisivas existentes.

## Pointers

- Consulta `.local/skills/pnpm-workspace/SKILL.md` para la estructura y convenciones.
