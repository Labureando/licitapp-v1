import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';
import { isInDangerousBlacklist } from '../constants/dangerous-typos';

/**
 * Motor de Fuzzy Matching
 * Encuentra coincidencias aproximadas (tolera typos)
 * 
 * Usa distancia de Levenshtein:
 * - "limpieza" vs "limpeza" = distancia 1 (falta 'i')
 * - "limpieza" vs "limpie" = distancia 2 (faltan 'za')
 */
@Injectable()
export class FuzzyEngine {
  private readonly logger = new Logger(FuzzyEngine.name);

  /**
   * Calcular distancia de Levenshtein entre dos strings
   * Retorna el número mínimo de ediciones para transformar uno en otro
   * 
   * @param s1 String 1
   * @param s2 String 2
   * @returns Distancia de Levenshtein
   */
  levenshteinDistance(s1: string, s2: string): number {
    const a = s1.toLowerCase();
    const b = s2.toLowerCase();

    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix: number[][] = [];

    // Inicializar matriz
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    // Calcular distancia
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitución
            matrix[i][j - 1] + 1,     // inserción
            matrix[i - 1][j] + 1,     // deleción
          );
        }
      }
    }

    return matrix[b.length][a.length];
  }

  /**
   * Verificar si dos palabras tienen match fuzzy
   * 
   * @param word1 Palabra 1
   * @param word2 Palabra 2
   * @param maxDistance Distancia máxima permitida (default: 2)
   * @returns true si la distancia es <= maxDistance
   */
  isFuzzyMatch(
    word1: string,
    word2: string,
    maxDistance: number = SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
  ): boolean {
    // No aplicar fuzzy a palabras muy cortas
    if (
      word1.length < SEARCH_CONFIG.FUZZY.MIN_WORD_LENGTH ||
      word2.length < SEARCH_CONFIG.FUZZY.MIN_WORD_LENGTH
    ) {
      return word1.toLowerCase() === word2.toLowerCase();
    }

    // Verificar blacklist de typos peligrosos
    if (SEARCH_CONFIG.BLACKLIST.ENABLED) {
      if (isInDangerousBlacklist(word1, word2)) {
        this.logger.debug(
          `[Blacklist] Fuzzy match "${word1}" -> "${word2}" rechazado (peligroso)`,
        );
        return false;
      }
    }

    const distance = this.levenshteinDistance(word1, word2);
    return distance <= maxDistance;
  }

  /**
   * Encontrar palabras similares en un array
   * 
   * @param searchTerm Término a buscar
   * @param candidates Array de palabras candidatas
   * @param maxDistance Distancia máxima
   * @returns Array de palabras similares
   */
  findSimilarWords(
    searchTerm: string,
    candidates: string[],
    maxDistance: number = SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
  ): Array<{ word: string; distance: number }> {
    return candidates
      .map((candidate) => ({
        word: candidate,
        distance: this.levenshteinDistance(searchTerm, candidate),
      }))
      .filter((item) => item.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }

  /**
   * Calcular porcentaje de similitud (0-100%)
   * 
   * @param word1 Palabra 1
   * @param word2 Palabra 2
   * @returns Porcentaje de similitud
   */
  similarityPercentage(word1: string, word2: string): number {
    const maxLen = Math.max(word1.length, word2.length);
    if (maxLen === 0) return 100;

    const distance = this.levenshteinDistance(word1, word2);
    return Math.round(((maxLen - distance) / maxLen) * 100);
  }

  /**
   * Buscar en texto con fuzzy tolerance
   * 
   * @param searchTerm Término a buscar
   * @param text Texto donde buscar
   * @param maxDistance Distancia máxima
   * @returns true si encuentra coincidencia fuzzy
   */
  searchInText(
    searchTerm: string,
    text: string,
    maxDistance: number = SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
  ): boolean {
    const words = text.toLowerCase().split(/\s+/);
    return words.some((word) =>
      this.isFuzzyMatch(searchTerm, word, maxDistance),
    );
  }

  /**
   * Buscar múltiples términos en texto con tolerancia fuzzy
   * Retorna el primero que encuentra
   * 
   * @param searchTerms Array de términos
   * @param text Texto donde buscar
   * @param maxDistance Distancia máxima
   * @returns Término que encontró o null
   */
  searchMultipleInText(
    searchTerms: string[],
    text: string,
    maxDistance: number = SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
  ): string | null {
    for (const term of searchTerms) {
      if (this.searchInText(term, text, maxDistance)) {
        return term;
      }
    }
    return null;
  }
}
