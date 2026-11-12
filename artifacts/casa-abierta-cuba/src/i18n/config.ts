import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

/** Idiomas con traducción disponible (el selector manual puede elegir todos). */
const IDIOMAS_DISPONIBLES = ['es', 'en', 'fr', 'ru', 'zh-CN'];

/** Idiomas que se aceptan del navegador; el resto cae a inglés. */
const IDIOMAS_NAVEGADOR = ['es', 'en', 'ru'];

/** Clave propia donde el selector guarda la elección del usuario. */
export const CLAVE_IDIOMA = 'app_lang';

/**
 * Idioma inicial, sin detector automático:
 * 1. La preferencia guardada por el usuario (`app_lang`).
 * 2. El idioma del navegador si es es/en/ru.
 * 3. Inglés por defecto.
 */
export function getInitialLanguage(): string {
  if (typeof window !== 'undefined') {
    try {
      const guardado = window.localStorage.getItem(CLAVE_IDIOMA);
      if (guardado && IDIOMAS_DISPONIBLES.includes(guardado)) return guardado;
    } catch {
      /* almacenamiento bloqueado: se usa el idioma del navegador */
    }
  }

  const navegador =
    typeof navigator === 'undefined' ? '' : (navigator.language || '').substring(0, 2).toLowerCase();

  return IDIOMAS_NAVEGADOR.includes(navegador) ? navegador : 'en';
}

i18n
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: IDIOMAS_DISPONIBLES,
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
