import { useTranslation } from 'react-i18next';
import {
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from './config';

/**
 * Hook para gestionar el idioma actual y cambiarlo.
 *
 * Uso:
 *   const { current, change, available } = useLanguage();
 *   change('en');
 */
export function useLanguage() {
  const { i18n } = useTranslation();

  return {
    /** Código del idioma actual ('es', 'ca', etc.) */
    current: (i18n.language?.split('-')[0] || 'es') as SupportedLanguage,

    /** Cambia el idioma. Se persiste automáticamente en localStorage. */
    change: (lang: SupportedLanguage) => i18n.changeLanguage(lang),

    /** Lista de idiomas soportados con metadata */
    available: SUPPORTED_LANGUAGES,

    /** Metadata del idioma actual */
    currentMeta:
      SUPPORTED_LANGUAGES.find(
        (l) => l.code === (i18n.language?.split('-')[0] || 'es')
      ) || SUPPORTED_LANGUAGES[0],
  };
}