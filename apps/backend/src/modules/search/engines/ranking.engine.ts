import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';
import { StemmingEngine } from './stemming.engine';
import { FuzzyEngine } from './fuzzy.engine';

/**
 * Motor de Ranking
 * Calcula puntuaciones para determinar relevancia
 */
@Injectable()
export class RankingEngine {
  private readonly logger = new Logger(RankingEngine.name);

  constructor(
    private readonly stemming: StemmingEngine,
    private readonly fuzzy: FuzzyEngine,
  ) {}

  /**
   * Calcular puntuación de coincidencia en texto
   * 
   * Retorna puntos por:
   * - Coincidencia exacta
   * - Stemming coincide
   * - Fuzzy match
   * - Ubicación (título vs descripción)
   * 
   * @param searchTerm Término a buscar
   * @param text Texto donde buscar
   * @param isTitleField true si es el campo título
   * @returns Puntuación (0-100)
   */
  scoreMatch(
    searchTerm: string,
    text: string,
    isTitleField: boolean = false,
  ): number {
    if (!searchTerm || !text) {
      return 0;
    }

    const words = text.toLowerCase().split(/\s+/);
    let score = 0;

    // 1. Búsqueda de coincidencia exacta
    const exactMatch = words.some(
      (word) => word === searchTerm.toLowerCase(),
    );
    if (exactMatch) {
      score += isTitleField
        ? SEARCH_CONFIG.SCORING.EXACT_TITLE
        : SEARCH_CONFIG.SCORING.EXACT_DESCRIPTION;
      return score; // Coincidencia exacta = máxima puntuación
    }

    // 2. Búsqueda con stemming
    const stemMatch = words.some((word) =>
      this.stemming.areStemEqual(searchTerm, word),
    );
    if (stemMatch) {
      score += isTitleField
        ? SEARCH_CONFIG.SCORING.STEMMING_TITLE
        : SEARCH_CONFIG.SCORING.STEMMING_DESCRIPTION;
      return score; // Stemming match = muy buena puntuación
    }

    // 3. Búsqueda fuzzy
    const fuzzyMatch = words.some((word) =>
      this.fuzzy.isFuzzyMatch(
        searchTerm,
        word,
        SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
      ),
    );
    if (fuzzyMatch) {
      // Calcular similitud para darle más puntos si es muy similar
      const bestSimilarity = Math.max(
        ...words.map((word) => this.fuzzy.similarityPercentage(searchTerm, word)),
      );
      score += Math.floor(
        (SEARCH_CONFIG.SCORING.FUZZY_MATCH * bestSimilarity) / 100,
      );
    }

    return score;
  }

  /**
   * Calcular puntuación para búsqueda múltiple
   * 
   * @param searchTerms Array de términos
   * @param title Campo de título
   * @param description Campo de descripción
   * @returns Puntuación total
   */
  scoreMultipleMatches(
    searchTerms: string[],
    title: string,
    description: string,
  ): number {
    let totalScore = 0;

    for (const term of searchTerms) {
      const titleScore = this.scoreMatch(term, title, true);
      const descScore = this.scoreMatch(term, description, false);
      const maxScore = Math.max(titleScore, descScore);
      totalScore += maxScore;
    }

    // Normalizar a máximo 100
    return Math.min(totalScore, 100);
  }

  /**
   * Obtener desglose detallado de scoring
   * Útil para debugging
   * 
   * @param searchTerm Término a buscar
   * @param title Campo de título
   * @param description Campo de descripción
   * @returns Objeto con desglose
   */
  getScoreBreakdown(
    searchTerm: string,
    title: string,
    description: string,
  ): {
    titleScore: number;
    descriptionScore: number;
    totalScore: number;
    hasExactMatch: boolean;
    hasStemMatch: boolean;
    hasFuzzyMatch: boolean;
  } {
    const titleScore = this.scoreMatch(searchTerm, title, true);
    const descriptionScore = this.scoreMatch(searchTerm, description, false);
    const totalScore = Math.max(titleScore, descriptionScore);

    const titleWords = title.toLowerCase().split(/\s+/);
    const descWords = description.toLowerCase().split(/\s+/);
    const allWords = [...titleWords, ...descWords];

    const hasExactMatch = allWords.some(
      (w) => w === searchTerm.toLowerCase(),
    );
    const hasStemMatch = allWords.some((w) =>
      this.stemming.areStemEqual(searchTerm, w),
    );
    const hasFuzzyMatch = allWords.some((w) =>
      this.fuzzy.isFuzzyMatch(searchTerm, w),
    );

    return {
      titleScore,
      descriptionScore,
      totalScore,
      hasExactMatch,
      hasStemMatch,
      hasFuzzyMatch,
    };
  }

  /**
   * Normalizar puntuación a rango 0-100
   * @param score Puntuación raw
   * @returns Puntuación normalizada
   */
  normalizeScore(score: number): number {
    return Math.min(Math.max(score, 0), 100);
  }
}
