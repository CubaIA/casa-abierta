import { useTranslation } from 'react-i18next';
import { CLAVE_IDIOMA } from '@/i18n/config';

const LANGS = [
  { code: 'es', label: 'ES' },
  { code: 'en', label: 'EN' },
  { code: 'fr', label: 'FR' },
  { code: 'ru', label: 'RU' },
  { code: 'zh-CN', label: '中文' },
];

export function LanguageSelect() {
  const { i18n } = useTranslation();
  const current = i18n.resolvedLanguage || i18n.language || 'es';

  /** Cambia el idioma y guarda la elección para que sobreviva a la recarga. */
  const cambiarIdioma = (idioma: string) => {
    void i18n.changeLanguage(idioma);
    try {
      window.localStorage.setItem(CLAVE_IDIOMA, idioma);
    } catch {
      /* almacenamiento bloqueado: el cambio se aplica solo en esta sesión */
    }
  };
  return (
    <select
      aria-label="Idioma"
      className="rounded-full bg-white/10 px-2 py-1 text-sm font-semibold text-white hover:bg-white/20"
      value={current}
      onChange={(e) => cambiarIdioma(e.target.value)}
    >
      {LANGS.map((l) => (
        <option key={l.code} value={l.code} className="text-black">
          {l.label}
        </option>
      ))}
    </select>
  );
}
