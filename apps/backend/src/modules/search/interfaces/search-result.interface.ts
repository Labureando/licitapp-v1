/**
 * Resultado de una búsqueda con puntuación y confianza
 * Usado por todos los engines y validadores
 */
export interface SearchResult {
  /**
   * ¿Coincide la búsqueda?
   * true si score >= umbral de confianza
   */
  matched: boolean;

  /**
   * Puntuación numérica (0-100)
   * 0 = no relacionado en absoluto
   * 100 = coincidencia exacta perfecta
   */
  score: number;

  /**
   * Nivel de confianza en el resultado
   * HIGH: muy probable que sea correcto
   * MEDIUM: probablemente correcto
   * LOW: podría ser falso positivo
   */
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';

  /**
   * Razón detallada del resultado
   * Para logging y debugging
   * 
   * @example
   * "Exacto en título (50) + stemming coincide (20) + contexto confirmado (15)"
   */
  reason: string;

  /**
   * Desglose de puntuación (DEBUG)
   * Muestra qué componentes aportaron puntos
   */
  breakdown?: {
    exactMatch?: number;
    stemming?: number;
    fuzzy?: number;
    contextual?: number;
    total: number;
  };
}

/**
 * Opciones de búsqueda avanzada
 */
export interface SearchOptions {
  /**
   * Campos a buscar (title, description, ambos)
   * @default 'both'
   */
  fields?: 'title' | 'description' | 'both';

  /**
   * Permitir fuzzy matching (typos)
   * @default true
   */
  allowFuzzy?: boolean;

  /**
   * Distancia máxima para fuzzy (1-3)
   * 1: muy estricto, 3: muy permisivo
   * @default 2
   */
  fuzzyDistance?: number;

  /**
   * Aplicar stemming (reducir a raíz)
   * @default true
   */
  applyStemming?: boolean;

  /**
   * Ignorar stopwords (palabras comunes)
   * @default true
   */
  ignoreStopwords?: boolean;

  /**
   * Umbral mínimo de score para considerar coincidencia
   * @default 60
   */
  scoreThreshold?: number;

  /**
   * Validar contexto (palabras relacionadas)
   * @default true
   */
  validateContext?: boolean;

  /**
   * Usar blacklist de typos peligrosos
   * @default true
   */
  useBlacklist?: boolean;
}

/**
 * Contexto de búsqueda
 * Información adicional sobre qué se busca y dónde
 */
export interface SearchContext {
  /**
   * ID único de la búsqueda (para logging)
   */
  searchId?: string;

  /**
   * Palabras clave que deberían estar presentes para confirmar
   * @example ["limpieza", "higiene", "desinfección"] para confirmar "limpie"
   */
  contextKeywords?: string[];

  /**
   * Tipo de entidad siendo buscada
   * @example "licitacion", "organo", "usuario"
   */
  entityType?: string;

  /**
   * Información adicional para logging
   */
  metadata?: Record<string, any>;
}
