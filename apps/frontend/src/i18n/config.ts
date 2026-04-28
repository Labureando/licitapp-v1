import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// ─── Traducciones ES (completas) ───
import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esSettings from './locales/es/settings.json';
import esAlerts from './locales/es/alerts.json';
import esLanding from './locales/es/landing.json';

// ─── Traducciones CA ───
import caCommon from './locales/ca/common.json';
import caAuth from './locales/ca/auth.json';
import caSettings from './locales/ca/settings.json';
import caAlerts from './locales/ca/alerts.json';
import caLanding from './locales/ca/landing.json';

// ─── Traducciones GL ───
import glCommon from './locales/gl/common.json';
import glAuth from './locales/gl/auth.json';
import glSettings from './locales/gl/settings.json';
import glAlerts from './locales/gl/alerts.json';
import glLanding from './locales/gl/landing.json';

// ─── Traducciones EU ───
import euCommon from './locales/eu/common.json';
import euAuth from './locales/eu/auth.json';
import euSettings from './locales/eu/settings.json';
import euAlerts from './locales/eu/alerts.json';
import euLanding from './locales/eu/landing.json';

// ─── Traducciones EN ───
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enSettings from './locales/en/settings.json';
import enAlerts from './locales/en/alerts.json';
import enLanding from './locales/en/landing.json';

// ─── Traducciones PT ───
import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';
import ptSettings from './locales/pt/settings.json';
import ptAlerts from './locales/pt/alerts.json';
import ptLanding from './locales/pt/landing.json';

import esSearch from './locales/es/search.json';
import esHome from './locales/es/home.json';
import caSearch from './locales/ca/search.json';
import caHome from './locales/ca/home.json';
import glSearch from './locales/gl/search.json';
import glHome from './locales/gl/home.json';
import euSearch from './locales/eu/search.json';
import euHome from './locales/eu/home.json';
import enSearch from './locales/en/search.json';
import enHome from './locales/en/home.json';
import ptSearch from './locales/pt/search.json';
import ptHome from './locales/pt/home.json';

/**
 * Idiomas soportados.
 * Los marcados con `needsReview: true` necesitan ser revisados por nativo
 * antes de marketing real en ese mercado.
 */
export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸', needsReview: false },
  { code: 'ca', name: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿', needsReview: true },
  { code: 'gl', name: 'Galego', flag: '🏴󠁥󠁳󠁧󠁡󠁿', needsReview: true },
  { code: 'eu', name: 'Euskera', flag: '🏴󠁥󠁳󠁰󠁶󠁿', needsReview: true },
  { code: 'en', name: 'English', flag: '🇬🇧', needsReview: false },
  { code: 'pt', name: 'Português', flag: '🇵🇹', needsReview: true },
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number]['code'];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: {
        common: esCommon,
        auth: esAuth,
        settings: esSettings,
        alerts: esAlerts,
        landing: esLanding,
        search: esSearch,    
        home: esHome,
      },
      ca: {
        common: caCommon,
        auth: caAuth,
        settings: caSettings,
        alerts: caAlerts,
        landing: caLanding,
        search: caSearch,    
        home: caHome,
      },
      gl: {
        common: glCommon,
        auth: glAuth,
        settings: glSettings,
        alerts: glAlerts,
        landing: glLanding,
        search: glSearch,    
        home: glHome,
      },
      eu: {
        common: euCommon,
        auth: euAuth,
        settings: euSettings,
        alerts: euAlerts,
        landing: euLanding,
        search: euSearch,    
        home: euHome,
      },
      en: {
        common: enCommon,
        auth: enAuth,
        settings: enSettings,
        alerts: enAlerts,
        landing: enLanding,
        search: enSearch,    
        home: enHome,
      },
      pt: {
        common: ptCommon,
        auth: ptAuth,
        settings: ptSettings,
        alerts: ptAlerts,
        landing: ptLanding,
        search: ptSearch,    
        home: ptHome,
      },
    },
    // Detecta del navegador si es un idioma que soportamos, fallback a ES
    fallbackLng: 'es',
    supportedLngs: SUPPORTED_LANGUAGES.map((l) => l.code),
    defaultNS: 'common',
    ns: ['common', 'auth', 'settings', 'alerts', 'landing', 'search', 'home'],
    interpolation: {
      escapeValue: false, // React ya escapa
    },
    detection: {
      // Orden de detección
      order: ['localStorage', 'navigator', 'htmlTag'],
      // Qué claves usar en localStorage
      lookupLocalStorage: 'licitapp-language',
      // Dónde guardar la elección del user
      caches: ['localStorage'],
    },
    react: {
      useSuspense: false, // Evitamos suspense para simplificar
    },
  });

export default i18n;