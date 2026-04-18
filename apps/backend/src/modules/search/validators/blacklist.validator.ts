import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';
import { isInDangerousBlacklist, getSafeAlternatives } from '../constants/dangerous-typos';

/**
 * Validador de Blacklist
 * Rechaza fuzzy matches que son peligrosos (podrían causar falsos positivos)
 */
@Injectable()
export class BlacklistValidator {
  private readonly logger = new Logger(BlacklistValidator.name);

  /**
   * Validar si un fuzzy match está permitido
   * 
   * @param originalTerm Término original buscado
   * @param fuzzyMatch Resultado del fuzzy match
   * @param score Puntuación del match
   * @returns { valid: boolean, reason?: string }
   */
  validateFuzzyMatch(
    originalTerm: string,
    fuzzyMatch: string,
    score: number,
  ): { valid: boolean; reason?: string } {
    if (!SEARCH_CONFIG.BLACKLIST.ENABLED) {
      return { valid: true };
    }

    // Verificar blacklist
    if (isInDangerousBlacklist(originalTerm, fuzzyMatch)) {
      return {
        valid: false,
        reason: `Fuzzy match "${fuzzyMatch}" está en blacklist para "${originalTerm}" (peligro de falso positivo)`,
      };
    }

    return { valid: true };
  }

  /**
   * Obtener alternativas seguras si un término es peligroso
   * 
   * @param term Término que produjo falsos positivos
   * @returns Array de alternativas sugeridas
   */
  getSafeAlternatives(term: string): string[] {
    return getSafeAlternatives(term);
  }

  /**
   * Verificar si un término es potencialmente peligroso
   * (tiende a producir muchos falsos positivos)
   * 
   * @param term Término a verificar
   * @returns true si es peligroso
   */
  isTermDangerous(term: string): boolean {
    const normalized = term.toLowerCase();
    const alternatives = getSafeAlternatives(normalized);
    return alternatives.length > 0;
  }

  /**
   * Registrar un falso positivo detectado
   * Para mejorar el blacklist con el tiempo
   * 
   * @param searchTerm Término buscado
   * @param incorrectMatch Coincidencia incorrecta
   * @param correctMatch Coincidencia correcta (si se conoce)
   */
  reportFalsePositive(
    searchTerm: string,
    incorrectMatch: string,
    correctMatch?: string,
  ): void {
    this.logger.warn(
      `[Falso Positivo] "${searchTerm}" → "${incorrectMatch}" ` +
      (correctMatch ? `(debería ser "${correctMatch}")` : '(desconocido)'),
    );

    // Aquí iría código para persistir falsos positivos
    // Permitiría mejorar el blacklist automáticamente
  }

  /**
   * Sugerir mejoras al blacklist basado en falsos positivos
   * 
   * @param term Término problemático
   * @returns Sugerencia de actualización
   */
  suggestBlacklistUpdate(term: string): {
    term: string;
    shouldAddToBlacklist: boolean;
    reason: string;
  } {
    const normalized = term.toLowerCase();

    return {
      term: normalized,
      shouldAddToBlacklist: this.isTermDangerous(normalized),
      reason: `Término "${normalized}" produce falsos positivos frecuentes`,
    };
  }

  /**
   * Filtrar resultados de fuzzy match removiendo peligrosos
   * 
   * @param originalTerm Término buscado
   * @param fuzzyMatches Array de fuzzy matches
   * @returns Array filtrado sin matches peligrosos
   */
  filterDangerousFuzzyMatches(
    originalTerm: string,
    fuzzyMatches: string[],
  ): string[] {
    return fuzzyMatches.filter(
      (match) => !isInDangerousBlacklist(originalTerm, match),
    );
  }
}
