# Casa Abierta Cuba 🇨🇺

Marketplace turístico en español para descubrir y ofrecer alojamientos, gastronomía,
experiencias y servicios locales en Cuba, con anfitriones revisados y solicitudes
registradas dentro de la plataforma.

Creado por **Yoanny Guillén Vargas**. Desarrollado con asistencia de DeepSeek, ChatGPT,
Replit y Freebuff.

## Arranque rápido

```bash
pnpm install
pnpm --filter ./artifacts/casa-abierta-cuba dev      # http://localhost:3000
pnpm run build                                       # typecheck + build de todo el workspace
```

**Modo demostración (sin configurar nada):** si faltan las variables de Supabase, la app
arranca con un almacén local en el navegador (datos de ejemplo) para poder navegar todos
los flujos. Cuentas demo:

| Rol       | Correo              | Contraseña |
|-----------|---------------------|------------|
| Viajero   | viajero@casa.cu     | demo1234   |
| Anfitrión | proveedor@casa.cu   | demo1234   |
| Admin     | admin@casa.cu       | demo1234   |

**Producción (Supabase):** crea `.env` en `artifacts/casa-abierta-cuba/` con
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`, aplica la migración y despliega la Edge
Function. El manual completo está en [`../docs/INSTALACION.md`](../docs/INSTALACION.md).

## Qué incluye

- **Catálogo público** con búsqueda, filtro por provincia y tipo de servicio.
- **Fichas de negocio** con historia del anfitrión, idiomas, reseñas y reporte.
- **Cuentas**: viajero y anfitrión (registro); admin solo desde Supabase (seguro).
- **Favoritos, solicitudes de contacto y reseñas** (reseñas solo con solicitud completada).
- **Panel de anfitrión**: alta de negocio (queda en revisión), solicitudes entrantes con
  transiciones de estado.
- **Panel admin**: aprobar/rechazar/eliminar negocios, roles y suspensión de usuarios,
  solicitudes (con contacto del viajero vía RPC), reportes y mensajes.
- **Cuba Conecta IA**: asistente de viaje servido por Edge Function + Groq
  (modelo gratuito `openai/gpt-oss-20b`); la clave nunca llega al navegador.
- **PWA instalable**: manifest, service worker e iconos incluidos.

## Estructura

```
artifacts/casa-abierta-cuba/
├── src/
│   ├── lib/            # env, supabase, marketplace (datos), auth (contexto), types
│   ├── components/     # Layout (header/footer), BusinessCard, ui/
│   ├── pages/          # Home, BusinessDetail, Entrar, Perfil, MisSolicitudes,
│   │                   # Favoritos, Anfitrion, Admin, Contacto, ChatIA, information, 404
│   ├── App.tsx         # router (wouter)
│   └── index.css       # sistema de diseño (Tailwind v4 @theme)
├── public/             # manifest.webmanifest, sw.js, icons/
├── supabase/
│   ├── migrations/001_casa_abierta_completo.sql   # TODO el esquema + RLS + RPCs + storage
│   └── functions/cuba-conecta-ia/index.ts         # asistente IA (Groq)
└── scripts/flow-tests.ts                          # pruebas de flujos (modo demo)
```

## Scripts

| Comando | Qué hace |
|---|---|
| `pnpm --filter ./artifacts/casa-abierta-cuba dev` | servidor de desarrollo en :3000 |
| `pnpm run typecheck` | TypeScript en todo el workspace |
| `pnpm run build` | typecheck + build de producción (`dist/`) |
| `pnpm --filter ./artifacts/casa-abierta-cuba exec tsx scripts/flow-tests.ts` | 37 pruebas de flujos de negocio |

## Seguridad

- La clave anon de Supabase es pública **por diseño**: la frontera es RLS (ver
  `001_casa_abierta_completo.sql` y su harness de 66 pruebas en PostgreSQL real).
- `contact_email` del viajero no se concede en select a ningún rol; solo el admin la lee
  con la RPC `admin_get_request_contact`.
- `GROQ_API_KEY` vive solo en los secretos de Supabase.
- Un admin suspendido pierde todos los poderes admin (`casa_abierta_is_admin` exige
  cuenta activa).
