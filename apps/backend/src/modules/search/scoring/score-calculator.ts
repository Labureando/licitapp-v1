import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';

/**
 * Calculador de Score
 * Orquesta los engines para calcular puntuación final
 */
@Injectable()
export class ScoreCalculator {
  private readonly logger = new Logger(ScoreCalculator.name);

  /**
   * Calcular score total de una búsqueda
   * 
   * Toma en cuenta:
   * - Score base de ranking
   * - Bonificación por contexto
   * - Penalización por fuzzy match
   * 
   * @param params Parámetros de scoring
   * @returns Score normalizado (0-100)
   */
  calculateFinalScore(params: {
    baseScore: number;
    contextBonus?: number;
    fuzzyPenalty?: number;
    hasExactMatch?: boolean;
    hasStemMatch?: boolean;
  }): number {
    let score = params.baseScore;

    // Aplicar bonificación por contexto
    if (params.contextBonus && params.contextBonus > 0) {
      score += params.contextBonus;
    }

    // Aplicar penalización por fuzzy match
    if (params.fuzzyPenalty && params.fuzzyPenalty > 0) {
      score -= params.fuzzyPenalty;
    }

    // Bonus por coincidencias exactas
    if (params.hasExactMatch) {
      score = Math.min(score + 10, 100);
    }

    // Bonus por stem matches
    if (params.hasStemMatch) {
      score = Math.min(score + 5, 100);
    }

    // Normalizar entre 0 y 100
    return Math.max(0, Math.min(score, 100));
  }

  /**
   * Calcular bonificación de contexto
   * Cuantas más palabras contextuales, más bonus
   * 
   * @param matchPercentage Porcentaje de palabras contextuales encontradas
   * @returns Puntos de bonificación (0-15)
   */
  calculateContextBonus(matchPercentage: number): number {
    if (matchPercentage >= 100) {
      return SEARCH_CONFIG.SCORING.CONTEXT_BONUS; // Bonus máximo
    }
    if (matchPercentage >= 75) {
      return Math.floor(SEARCH_CONFIG.SCORING.CONTEXT_BONUS * 0.75);
    }
    if (matchPercentage >= 50) {
      return Math.floor(SEARCH_CONFIG.SCORING.CONTEXT_BONUS * 0.5);
    }
    if (matchPercentage >= 25) {
      return Math.floor(SEARCH_CONFIG.SCORING.CONTEXT_BONUS * 0.25);
    }
    return 0;
  }

  /**
   * Calcular penalización por fuzzy match
   * Fuzzy matches son menos confiables
   * 
   * @param distance Distancia de Levenshtein
   * @returns Puntos de penalización (0-15)
   */
  calculateFuzzyPenalty(distance: number): number {
    if (distance === 0) {
      return 0; // Coincidencia exacta, sin penalización
    }
    if (distance === 1) {
      return 2; // Pequeña penalización
    }
    if (distance === 2) {
      return 5; // Mediana penalización
    }
    if (distance === 3) {
      return 10; // Mayor penalización
    }
    return 15; // Penalización máxima
  }

  /**
   * Calcular score mínimo requerido basado en factores de riesgo
   * 
   * @param isFuzzyMatch true si se usó fuzzy matching
   * @param hasContext true si hay palabras contextuales
   * @returns Umbral mínimo recomendado
   */
  calculateDynamicThreshold(
    isFuzzyMatch: boolean,
    hasContext: boolean,
  ): number {
    let threshold: number = SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH;

    if (isFuzzyMatch && !hasContext) {
      // Fuzzy sin contexto = muy riesgoso
      threshold = 80;
    } else if (isFuzzyMatch && hasContext) {
      // Fuzzy con contexto = riesgo moderado
      threshold = 65;
    } else if (!isFuzzyMatch && !hasContext) {
      // Exacto pero sin contexto = sigue siendo riesgoso
      threshold = 55;
    }
    // else: Exacto con contexto = umbral normal

    return threshold;
  }

  /**
   * Calcular influencia de cada componente en el score final
   * Para debugging y análisis
   * 
   * @param components Componentes del scoring
   * @returns Desglose de influencia
   */
  analyzeScoreInfluence(components: {
    baseScore: number;
    contextBonus: number;
    fuzzyPenalty: number;
  }): {
    baseInfluence: number;
    contextInfluence: number;
    fuzzyInfluence: number;
    total: number;
  } {
    const total = Math.max(
      components.baseScore + components.contextBonus - components.fuzzyPenalty,
      0,
    );

    const baseInfluence = total > 0 ? (components.baseScore / total) * 100 : 0;
    const contextInfluence =
      total > 0 ? (components.contextBonus / total) * 100 : 0;
    const fuzzyInfluence =
      total > 0 ? (components.fuzzyPenalty / total) * 100 : 0;

    return {
      baseInfluence: Math.round(baseInfluence),
      contextInfluence: Math.round(contextInfluence),
      fuzzyInfluence: Math.round(fuzzyInfluence),
      total: Math.round(total),
    };
  }

  /**
   * Generar log detallado de scoring
   * 
   * @param term Término buscado
   * @param score Score final
   * @param components Desglose de componentes
   * @returns String con detalles
   */
  generateScoringLog(
    term: string,
    score: number,
    components?: {
      baseScore?: number;
      contextBonus?: number;
      fuzzyPenalty?: number;
    },
  ): string {
    let log = `[Score: ${term}] Final: ${Math.round(score)}/100`;

    if (components) {
      const base = components.baseScore || 0;
      const bonus = components.contextBonus || 0;
      const penalty = components.fuzzyPenalty || 0;

      log += ` | Base: ${base} + Contexto: ${bonus} - Fuzzy: ${penalty}`;
    }

    return log;
  }
}
