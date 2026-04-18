import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';
import { StemmingEngine } from '../engines/stemming.engine';

/**
 * Validador de Contexto
 * Verifica que palabras relacionadas estén presentes
 * Para evitar falsos positivos
 */
@Injectable()
export class ContextValidator {
  private readonly logger = new Logger(ContextValidator.name);

  constructor(private readonly stemming: StemmingEngine) {}

  /**
   * Validar si el texto tiene contexto relevante
   * 
   * Ejemplo:
   * - Si buscamos "limpie" pero la licitación no menciona
   *   "limpieza", "higiene", "desinfección", etc.
   * - Probablemente es un falso positivo
   * 
   * @param text Texto a validar
   * @param contextKeywords Palabras que deberían estar presentes
   * @returns true si hay suficiente contexto
   */
  validateContext(text: string, contextKeywords: string[]): boolean {
    if (!contextKeywords || contextKeywords.length === 0) {
      return true; // Sin palabras contextuales = válido por defecto
    }

    if (!SEARCH_CONFIG.CONTEXT_VALIDATION.ENABLED) {
      return true; // Validación deshabilitada
    }

    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);

    // Contar cuántas palabras contextuales están presentes
    let matchCount = 0;

    for (const keyword of contextKeywords) {
      const hasExact = words.some((w) => w === keyword.toLowerCase());
      const hasStem = words.some((w) =>
        this.stemming.areStemEqual(keyword, w),
      );

      if (hasExact || hasStem) {
        matchCount++;
      }
    }

    // Calcular porcentaje de coincidencia
    const matchPercentage =
      matchCount / contextKeywords.length;

    // Requiere al menos X% de palabras contextuales
    const minRequired =
      SEARCH_CONFIG.CONTEXT_VALIDATION.REQUIRED_MATCH_PERCENTAGE;

    return matchPercentage >= minRequired;
  }

  /**
   * Contar palabras contextuales encontradas
   * 
   * @param text Texto donde buscar
   * @param contextKeywords Palabras a buscar
   * @returns Objeto con detalles
   */
  countContextMatches(
    text: string,
    contextKeywords: string[],
  ): {
    total: number;
    matched: number;
    unmatched: string[];
    percentage: number;
    matchedKeywords: string[];
  } {
    if (!contextKeywords || contextKeywords.length === 0) {
      return {
        total: 0,
        matched: 0,
        unmatched: [],
        percentage: 100,
        matchedKeywords: [],
      };
    }

    const normalizedText = text.toLowerCase();
    const words = normalizedText.split(/\s+/);
    const matched: string[] = [];
    const unmatched: string[] = [];

    for (const keyword of contextKeywords) {
      const hasExact = words.some((w) => w === keyword.toLowerCase());
      const hasStem = words.some((w) =>
        this.stemming.areStemEqual(keyword, w),
      );

      if (hasExact || hasStem) {
        matched.push(keyword);
      } else {
        unmatched.push(keyword);
      }
    }

    return {
      total: contextKeywords.length,
      matched: matched.length,
      unmatched,
      percentage: Math.round((matched.length / contextKeywords.length) * 100),
      matchedKeywords: matched,
    };
  }

  /**
   * Generar palabras contextuales para un término
   * Basado en diccionario de sinónimos
   * 
   * @param term Término de búsqueda
   * @returns Array de palabras contextuales sugeridas
   */
  generateContextKeywords(term: string): string[] {
    // Aquí iría integración con SEMANTIC_KEYWORDS
    // Por ahora retorna vacío
    return [];
  }

  /**
   * Calcular score de confianza basado en contexto
   * 
   * @param matchPercentage Porcentaje de palabras contextuales encontradas (0-100)
   * @returns Score 0-100
   */
  calculateContextConfidenceScore(matchPercentage: number): number {
    // Si 50%+ de palabras contextuales están presentes
    // Confianza media, si 100% confianza alta
    if (matchPercentage >= 100) {
      return 100;
    }
    if (matchPercentage >= 75) {
      return 85;
    }
    if (matchPercentage >= 50) {
      return 60;
    }
    if (matchPercentage >= 25) {
      return 30;
    }
    return 0;
  }
}
