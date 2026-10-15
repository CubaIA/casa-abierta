# CUMPLIMIENTO_176_MEDIDAS.md
Casa Abierta Cuba — Alineación con las 176 Medidas de Transformaciones Económicas y Sociales

## Resumen
El proyecto contribuye a la digitalización, IA, comercio electrónico, mercados cambiarios digitales y gobernanza de datos, en línea con el enfoque de transformación digital del país.

## Énfasis: Eje Temático 21 — Transformaciones 163–172
| Transformación | Alineación | Implementación |
|---|---|---|
| 163 | Fortalecer la infraestructura digital y conectividad para servicios públicos/privados | PWA, despliegue en Cloudflare, Edge Functions, arquitectura ligera (<50MB) |
| 164 | Impulsar la interoperabilidad y estandarización de sistemas | APIs REST/RPC, migraciones SQL controladas, RLS |
| 165 | Promover el gobierno digital y servicios en línea | Plataforma intermediaria digital, panel admin auditado, flujos automatizados |
| 166 | Fomento a la innovación y startups tecnológicas | Plataforma para anfitriones locales (economía colaborativa) |
| 167 | Capacitación en TICs y economía del conocimiento | Documentación detallada (docs/), código abierto/entregable claro |
| 168 | Ciberseguridad, protección de datos y privacidad | RLS, claves no expuestas al navegador (Edge Function), mínimo privilegio, políticas de privacidad |
| 169 | Plataformas digitales con IA para compras públicas | Cuba Conecta IA (Edge Function + Groq) como asistente inteligente; arquitectura extensible a compras/licitaciones |
| 170 | Sistemas automatizados, auditables y públicos para licitaciones | Panel admin con trazabilidad, registro de auditoría (fecha/hora/actor), RLS, logs documentales |
| 171 | Digitalización de procesos económicos y facturación | Flujos automatizados, trazabilidad de solicitudes/pagos, estructura preparada para facturación electrónica |
| 172 | Economía del conocimiento, IA y datos | Uso responsable de IA, gobernanza de datos (RLS), almacenamiento en Supabase, separación entre datos públicos/privados |

## Comercio electrónico y pagos
- Soporte para pasarelas legales para Cuba: Transfermóvil, EnZona, QvaPay, PSAV (criptomonedas reguladas por BCC).
- Opciones internacionales: Zelle, criptomonedas (con advertencias legales).
- Stripe/PayPal solo si gestionado a través de entidad legal constituida fuera de Cuba.
- QR para pagos Transfermóvil/EnZona.

## Mercado cambiario digital
- Soporte multi-moneda (USD, EUR, MLC, CUP) y ampliable.

## Gobernanza de datos e IA
- Principio de minimización, separación de claves (anon vs secretos), RLS estricto.
- IA con clave en secretos del backend (Edge Function). Traducción automática al idioma seleccionado.

## Cumplimiento y trazabilidad
- Registro de auditoría (actor único: Yoanny Guillén Vargas - CEO).
- Sello de tiempo (OpenTimestamps) para hash de entregables.
- Documentación de autoría (AUTHORSHIP.md).
- Términos/Privacidad con declaración de propiedad intelectual.
