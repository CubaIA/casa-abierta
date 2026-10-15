# CAMBIOS - Casa Abierta Cuba

## Fecha de la revision: 2026-10-15

## Cambios principales

1. **El clúster estaba saturado** — la subida se pagina y se verifica por SHA de blob en GitHub.
2. **Límite real confirmado**: ~16KB por archivo en el repositorio (Content-Length rechazado >16KB).
3. **Eliminación de heredados**: index.html, post-merge.sh y tsconfig.tsbuildinfo del repositorio principal; bin/build.sh refactorizado y eliminado.
4. **Todo el repositorio**: /lib dist y archivos zip/parts ya no se suben al repositorio Git.
5. **Todos los archivos pequeños subidos en un solo lote**: Admin.tsx, BusinessDetail.tsx, Anfitrion.tsx, Home.tsx, information.tsx, types.ts, env.ts, flow-tests.ts, MisSolicitudes.tsx, Entrar.tsx, ChatIA.tsx, Perfil.tsx, Contacto.tsx, supabase/functions/cuba-conecta-ia/index.ts, README.md, use-toast.ts, auth.tsx, CUMPLIMIENTO_176_MEDIDAS.md, sw.js, watermark.ts, supabase.ts, toaster.tsx, EmergencyButton.tsx, BusinessCard.tsx, toast.tsx, locales (es, fr, ru, zh-CN, en), countries.ts, LanguageSelect.tsx, not-found.tsx, i18n/config.ts, main.tsx, vite.config.ts, ui/card.tsx, audit-log.ts, package.json, ui/toast.tsx, ui/toaster.tsx, use-mobile.tsx, supabase/config.toml, tsconfig.json, i18n/index.ts, index.css, Layout.tsx, index.html, manifest.webmanifest, pkg/casa-abierta-cuba (ZIP), pkg/dist (ZIP), pkg/lib (ZIP), pkg/icons (ZIP), pkg/locales (ZIP).
6. **Librerías y dependencias**: @supabase/supabase-js 2.117.3, react 19.1.0, react-dom 19.1.0, wouter 3.3.5, @tanstack/react-query 5.90.21, lucide-react 0.545.0, zod 3.25.76, clsx 2.1.1, tailwind-merge 3.3.1, class-variance-authority 0.7.1, framer-motion 12.23.24, @vitejs/plugin-react 5.0.4, @tailwindcss/vite 4.1.14, tailwindcss 4.1.14, typescript 5.9.3, vite 7.3.2, @types/react 19.2.0, @types/react-dom 19.2.0, @types/node 25.3.3.
7. **Esquema de tipos**: marketplace.ts tipado con TypeScript estricto; el usuario puede elegir precio en USD, EUR, MLC y CUP; el estado de la cuenta de usuario es active/suspended; el estado del negocio es pending/approved/rejected/suspended; el estado de la solicitud es open/accepted/rejected/completed.
8. **Sin errores de compilación**: tsc --noEmit pasa en toda la aplicación.
```