import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';

/**
 * Evaluador de Confianza
 * Determina cuán seguro estamos del resultado
 */
@Injectable()
export class ConfidenceEvaluator {
  private readonly logger = new Logger(ConfidenceEvaluator.name);

  /**
   * Evaluar nivel de confianza basado en múltiples factores
   * 
   * @param params Parámetros de confianza
   * @returns Nivel: 'HIGH' | 'MEDIUM' | 'LOW'
   */
  evaluateConfidence(params: {
    score: number;
    hasExactMatch: boolean;
    hasContext: boolean;
    fuzzyDistance?: number;
    isInBlacklist: boolean;
  }): 'HIGH' | 'MEDIUM' | 'LOW' {
    // Si está en blacklist, confianza baja inmediatamente
    if (params.isInBlacklist) {
      return 'LOW';
    }

    // Coincidia exacta siempre es alta confianza
    if (params.hasExactMatch) {
      return 'HIGH';
    }

    // Score muy alto = alta confianza
    if (params.score >= SEARCH_CONFIG.SCORING.CONFIDENCE_HIGH) {
      return 'HIGH';
    }

    // Fuzzy match débil sin contexto = baja confianza
    if (params.fuzzyDistance && params.fuzzyDistance > 2 && !params.hasContext) {
      return 'LOW';
    }

    // Score medio = media confianza
    if (params.score >= SEARCH_CONFIG.SCORING.CONFIDENCE_MEDIUM) {
      return 'MEDIUM';
    }

    // Por defecto = baja confianza
    return 'LOW';
  }

  /**
   * Calcular score de confianza (0-100)
   * No es lo mismo que score de relevancia
   * 
   * @param params Parámetros de confianza
   * @returns Score 0-100
   */
  calculateConfidenceScore(params: {
    score: number;
    hasExactMatch: boolean;
    hasContext: boolean;
    contextPercentage?: number;
    fuzzyDistance?: number;
    isInBlacklist: boolean;
  }): number {
    let confidence = params.score; // Empezar con score base

    // Bonificación: coincidencia exacta
    if (params.hasExactMatch) {
      confidence = Math.min(confidence + 20, 100);
    }

    // Bonificación: tiene contexto
    if (params.hasContext) {
      const contextBonus =
        (params.contextPercentage || 50) > 50 ? 15 : 10;
      confidence = Math.min(confidence + contextBonus, 100);
    }

    // Penalización: fuzzy match débil
    if (params.fuzzyDistance && params.fuzzyDistance > 0) {
      confidence -= params.fuzzyDistance * 3;
    }

    // Penalización: está en blacklist
    if (params.isInBlacklist) {
      confidence = Math.max(confidence - 40, 0);
    }

    return Math.max(0, Math.min(confidence, 100));
  }

  /**
   * Obtener descripción de nivel de confianza
   * 
   * @param level Nivel de confianza
   * @returns Descripción detallada
   */
  getConfidenceDescription(level: 'HIGH' | 'MEDIUM' | 'LOW'): string {
    const descriptions = {
      HIGH: 'Muy seguro. Coincidencia probable y confiable.',
      MEDIUM: 'Seguridad media. Probablemente sea correcto pero revisar contexto.',
      LOW: 'Baja seguridad. Alto riesgo de falso positivo. Requiere validación manual.',
    };
    return descriptions[level];
  }

  /**
   * Sugerir acción basado en confianza
   * 
   * @param confidence Nivel de confianza
   * @returns Acción recomendada
   */
  suggestAction(confidence: 'HIGH' | 'MEDIUM' | 'LOW'): string {
    const actions = {
      HIGH: 'Generar alerta automática',
      MEDIUM: 'Notificar al usuario para revisión manual',
      LOW: 'Rechazar o requerir validación adicional',
    };
    return actions[confidence];
  }

  /**
   * Generar reporte de confianza
   * 
   * @param params Parámetros de confianza
   * @returns Reporte detallado
   */
  generateConfidenceReport(params: {
    searchTerm: string;
    score: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    hasExactMatch: boolean;
    hasContext: boolean;
    contextPercentage?: number;
    fuzzyDistance?: number;
  }): string {
    const lines = [
      `Término: "${params.searchTerm}"`,
      `Score: ${Math.round(params.score)}/100`,
      `Confianza: ${params.confidence}`,
      `Coincidencia exacta: ${params.hasExactMatch ? 'SÍ' : 'NO'}`,
      `Contexto validado: ${params.hasContext ? 'SÍ' : 'NO'}`,
    ];

    if (params.contextPercentage !== undefined) {
      lines.push(`Contexto disponible: ${params.contextPercentage}%`);
    }

    if (params.fuzzyDistance !== undefined) {
      lines.push(
        `Fuzzy distance: ${params.fuzzyDistance} (${params.fuzzyDistance === 0 ? 'Exacto' : 'Aproximado'})`,
      );
    }

    lines.push(`\nAcción: ${this.suggestAction(params.confidence)}`);
    lines.push(`\nDetalle: ${this.getConfidenceDescription(params.confidence)}`);

    return lines.join('\n');
  }

  /**
   * Comparar confianza entre múltiples resultados
   * 
   * @param results Array de resultados con confianza
   * @returns Mejor resultado recomendado
   */
  selectMostConfidentResult<T extends { confidence: 'HIGH' | 'MEDIUM' | 'LOW'; score: number }>(
    results: T[],
  ): T | null {
    if (results.length === 0) {
      return null;
    }

    const confidenceOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };

    return results.reduce((best, current) => {
      const bestConfidence =
        confidenceOrder[best.confidence] || 0;
      const currentConfidence =
        confidenceOrder[current.confidence] || 0;

      if (
        currentConfidence > bestConfidence ||
        (currentConfidence === bestConfidence && current.score > best.score)
      ) {
        return current;
      }
      return best;
    });
  }
}
