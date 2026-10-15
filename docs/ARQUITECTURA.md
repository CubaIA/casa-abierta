# ARQUITECTURA - Casa Abierta Cuba

## Resumen
Aplicación React 19 + Vite + TypeScript con i18n (es/en/fr/ru/zh-CN), Supabase (auth + RLS + SQL RPCs), PWA y Dark Mode.

## Estructura
```
app/
  pages/          # 11 páginas (Home, BusinessDetail, Admin, Anfitrion...)
  lib/            # marketplace.ts (tipados), supabase.ts, auth.tsx, types, countries, env
  components/     # ui/* (card, toast, toaster), BusinessCard, CurrencySelect, LanguageSelect, EmergencyButton, Layout
  hooks/          # use-toast, use-mobile
  i18n/           # config (loadPath /locales/{{lng}}/{{ns}}.json), index
```

## Persistencia
- Supabase: users, businesses, favorites, requests, reviews, reports, contact_messages + RLS + RPCs (casa_abierta_is_admin, provider_submit_business...)
- Storage: business-photos (público, 5MB, jpeg/png/webp)
- i18next-http-backend en /locales/{{lng}}/common.json; localStorage como detector.

## Seguridad
- RLS: políticas permisivas + restrictivas (guards). casa_abierta_is_admin exige role+account_status.
- El email del viajero solo se puede leer vía RPC admin_get_request_contact.
- Email y phone de businesses con nullable (alter drop not null).

## PWA
- /public/sw.js registra en producción; manifest.webmanifest con iconos 192/512/maskable.
- Tailwind CSS v4 + @tailwindcss/vite, fonts Montserrat/Poppins.
```