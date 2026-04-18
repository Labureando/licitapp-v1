import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';

/**
 * Validador de Scoring
 * Evalúa si una puntuación es suficiente para considerar coincidencia
 */
@Injectable()
export class ScoringValidator {
  private readonly logger = new Logger(ScoringValidator.name);

  /**
   * Determinar nivel de confianza basado en puntuación
   * 
   * @param score Puntuación (0-100)
   * @returns 'HIGH' | 'MEDIUM' | 'LOW'
   */
  getConfidenceLevel(score: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (score >= SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_HIGH_CONFIDENCE) {
      return 'HIGH';
    }
    if (score >= SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MEDIUM_CONFIDENCE) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Validar si un score es suficiente para alertar
   * 
   * @param score Puntuación
   * @param threshold Umbral mínimo (opcional)
   * @returns true si score >= threshold
   */
  isScoreSufficient(
    score: number,
    threshold: number = SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH,
  ): boolean {
    return score >= threshold;
  }

  /**
   * Calcular ajuste de score por confianza
   * Penaliza scores bajos con factor de confianza
   * 
   * @param score Puntuación raw
   * @param confidence Nivel de confianza
   * @returns Score ajustado
   */
  adjustScoreByConfidence(
    score: number,
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
  ): number {
    if (confidence === 'HIGH') {
      return score; // Sin ajuste
    }
    if (confidence === 'MEDIUM') {
      return Math.floor(score * 0.9); // Reducir 10%
    }
    // LOW
    return Math.floor(score * 0.7); // Reducir 30%
  }

  /**
   * Obtener descripción del score
   * Para logging y debugging
   * 
   * @param score Puntuación
   * @returns Descripción legible
   */
  getScoreDescription(score: number): string {
    if (score >= 90) {
      return 'Excelente coincidencia (exacta o muy cercana)';
    }
    if (score >= 70) {
      return 'Muy buena coincidencia (probablemente correcta)';
    }
    if (score >= 50) {
      return 'Buena coincidencia (requiere validación contextual)';
    }
    if (score >= 30) {
      return 'Coincidencia débil (alto riesgo de falso positivo)';
    }
    return 'No hay coincidencia significativa';
  }

  /**
   * Calcular score mínimo recomendado basado en riesgo
   * 
   * @param strictMode true para modo conservador (menos falsos positivos)
   * @returns Umbral recomendado
   */
  getRecommendedThreshold(strictMode: boolean = false): number {
    if (strictMode || SEARCH_CONFIG.BLACKLIST.STRICT) {
      return 75; // Más exigente
    }
    return SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH;
  }

  /**
   * Validar múltiples scores
   * Retorna información sobre distribución
   * 
   * @param scores Array de scores
   * @param threshold Umbral mínimo
   * @returns Estadísticas
   */
  validateMultipleScores(
    scores: number[],
    threshold: number = SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH,
  ): {
    total: number;
    passing: number;
    failing: number;
    passingPercentage: number;
    average: number;
    max: number;
    min: number;
  } {
    const passing = scores.filter((s) => s >= threshold).length;
    const failing = scores.length - passing;
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);

    return {
      total: scores.length,
      passing,
      failing,
      passingPercentage: Math.round((passing / scores.length) * 100),
      average: Math.round(average),
      max,
      min,
    };
  }

  /**
   * Generar reporte de validación de score
   * 
   * @param score Puntuación a validar
   * @param context Contexto adicional
   * @returns Reporte detallado
   */
  generateValidationReport(score: number, context?: string): string {
    const confidence = this.getConfidenceLevel(score);
    const isSufficient = this.isScoreSufficient(score);
    const description = this.getScoreDescription(score);

    return (
      `[Score: ${score}] ` +
      `Confianza: ${confidence} | ` +
      `Válido: ${isSufficient ? 'SÍ' : 'NO'} | ` +
      `${description}` +
      (context ? ` | Contexto: ${context}` : '')
    );
  }
}
