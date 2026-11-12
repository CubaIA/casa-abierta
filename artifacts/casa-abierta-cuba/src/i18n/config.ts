import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

/** Idiomas con traducción disponible (el selector manual puede elegir todos). */
const IDIOMAS_DISPONIBLES = ['es', 'en', 'fr', 'ru', 'zh-CN'];

/** Idiomas que se detectan desde el navegador; el resto cae a inglés. */
const IDIOMAS_NAVEGADOR = ['es', 'en', 'ru'];

/** Clave donde el detector guarda la preferencia manual del usuario. */
const CLAVE_PREFERENCIA = 'i18nextLng';

/** Preferencia manual guardada, si existe y es un idioma disponible. */
function leerPreferencia(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const guardado = window.localStorage.getItem(CLAVE_PREFERENCIA);
    return guardado && IDIOMAS_DISPONIBLES.includes(guardado) ? guardado : null;
  } catch {
    /* almacenamiento bloqueado: se usa el idioma del navegador */
    return null;
  }
}

/**
 * Idioma del navegador: es-ES → es, en-US → en, ru → ru. Cualquier otro
 * idioma (alemán, francés, chino…) usa inglés como fallback.
 */
export function idiomaDelNavegador(): string {
  const navegador = typeof navigator === 'undefined' ? '' : navigator.language || '';
  const base = navegador.toLowerCase().split('-')[0];
  return IDIOMAS_NAVEGADOR.includes(base) ? base : 'en';
}

/** Primera carga: manda la preferencia guardada; si no hay, el navegador. */
const idiomaInicial = leerPreferencia() ?? idiomaDelNavegador();

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    lng: idiomaInicial,
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
    detection: {
      order: ['localStorage', 'navigator', 'querystring', 'htmlTag', 'cookie'],
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
