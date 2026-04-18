/**
 * Configuración global del motor de búsqueda
 * Centraliza todos los parámetros ajustables
 */

export const SEARCH_CONFIG = {
  /**
   * Scoring: puntos por tipo de coincidencia
   */
  SCORING: {
    EXACT_TITLE: 50,           // Coincidencia exacta en título
    EXACT_DESCRIPTION: 30,     // Coincidencia exacta en descripción
    STEMMING_TITLE: 20,        // Stemming coincide en título
    STEMMING_DESCRIPTION: 15,  // Stemming coincide en descripción
    FUZZY_MATCH: 10,           // Fuzzy match débil
    CONTEXT_BONUS: 15,         // Bonus por palabras contextuales
    CONFIDENCE_HIGH: 70,       // Score mínimo para confianza alta
    CONFIDENCE_MEDIUM: 50,     // Score mínimo para confianza media
    CONFIDENCE_LOW: 0,         // Score por debajo = baja confianza
  },

  /**
   * Fuzzy: parámetros de tolerancia a typos
   */
  FUZZY: {
    ENABLED: true,
    DEFAULT_DISTANCE: 2,  // Levenshtein distance
    MAX_DISTANCE: 3,
    MIN_WORD_LENGTH: 4,   // No aplicar fuzzy a palabras cortas
  },

  /**
   * Stemming: parámetros de normalización
   */
  STEMMING: {
    ENABLED: true,
    LANGUAGE: 'english', // Cambiar a 'spanish' si necesario
    MIN_WORD_LENGTH: 3,  // No hacer stem de palabras muy cortas
  },

  /**
   * Stopwords: palabras a ignorar
   */
  STOPWORDS: {
    ENABLED: true,
    STRICT_MODE: false, // Si true, ignora más palabras
  },

  /**
   * Validación de contexto
   */
  CONTEXT_VALIDATION: {
    ENABLED: true,
    REQUIRED_MATCH_PERCENTAGE: 0.5, // 50% de palabras contextuales deben coincidir
  },

  /**
   * Blacklist: typos peligrosos que producen falsos positivos
   */
  BLACKLIST: {
    ENABLED: true,
    STRICT: true, // Si true, rechaza más agresivamente
  },

  /**
   * Umbrales generales
   */
  THRESHOLDS: {
    SCORE_MIN_FOR_MATCH: 60,
    SCORE_MIN_FOR_HIGH_CONFIDENCE: 70,
    SCORE_MIN_FOR_MEDIUM_CONFIDENCE: 50,
    SCORE_MIN_FOR_LOW_CONFIDENCE: 0,
  },

  /**
   * Límites de búsqueda
   */
  LIMITS: {
    MAX_QUERY_LENGTH: 200,
    MAX_TEXT_LENGTH: 50000, // Máximo de caracteres a procesar
    MIN_QUERY_LENGTH: 1,
  },
} as const;
