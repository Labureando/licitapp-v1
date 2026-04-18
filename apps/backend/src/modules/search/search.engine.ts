import { Injectable, Logger } from '@nestjs/common';
import { StemmingEngine } from './engines/stemming.engine';
import { FuzzyEngine } from './engines/fuzzy.engine';
import { RankingEngine } from './engines/ranking.engine';
import { ContextValidator } from './validators/context.validator';
import { BlacklistValidator } from './validators/blacklist.validator';
import { ScoringValidator } from './validators/scoring.validator';
import { ScoreCalculator } from './scoring/score-calculator';
import { ConfidenceEvaluator } from './scoring/confidence-evaluator';
import { SearchResult, SearchOptions, SearchContext } from './interfaces/search-result.interface';
import { SEARCH_CONFIG } from './constants/search-config';
import { filterStopwords } from './constants/stopwords';

/**
 * Motor de Búsqueda Principal
 * Orquesta todos los engines, validadores y calculadores
 * 
 * Características:
 * - Stemming: reduce palabras a raíz
 * - Fuzzy matching: tolera typos (distancia Levenshtein)
 * - Ranking inteligente: calcula puntuación por relevancia
 * - Validación de contexto: verifica palabras relacionadas
 * - Protección contra falsos positivos: blacklist de typos peligrosos
 * - Evaluación de confianza: 3 niveles HIGH/MEDIUM/LOW
 */
@Injectable()
export class SearchEngineService {
  private readonly logger = new Logger(SearchEngineService.name);

  constructor(
    private readonly stemming: StemmingEngine,
    private readonly fuzzy: FuzzyEngine,
    private readonly ranking: RankingEngine,
    private readonly contextValidator: ContextValidator,
    private readonly blacklistValidator: BlacklistValidator,
    private readonly scoringValidator: ScoringValidator,
    private readonly scoreCalculator: ScoreCalculator,
    private readonly confidenceEvaluator: ConfidenceEvaluator,
  ) {}

  /**
   * Buscar un término único en título y descripción
   * 
   * @param searchTerm Término a buscar
   * @param title Campo de título
   * @param description Campo de descripción
   * @param options Opciones de búsqueda (default: todas habilitadas)
   * @returns SearchResult con coincidencia, score y confianza
   */
  search(
    searchTerm: string,
    title: string,
    description: string,
    options: SearchOptions = {},
  ): SearchResult {
    try {
      // Validar entrada
      if (!searchTerm || !title || !description) {
        return this.createEmptyResult('Entrada vacía');
      }

      if (searchTerm.length > SEARCH_CONFIG.LIMITS.MAX_QUERY_LENGTH) {
        return this.createEmptyResult('Término muy largo');
      }

      // Aplicar opciones por defecto
      const finalOptions = this.applyDefaultOptions(options);

      // Procesar búsqueda
      const { score, breakdown } = this.calculateScore(
        searchTerm,
        title,
        description,
        finalOptions,
      );

      // Validar contexto si se pide
      const hasContext = finalOptions.validateContext
        ? this.contextValidator.validateContext(
            title + ' ' + description,
            [searchTerm],
          )
        : true;

      // Determinar confianza
      const confidence = this.confidenceEvaluator.evaluateConfidence({
        score,
        hasExactMatch: breakdown?.exactMatch ? breakdown.exactMatch > 0 : false,
        hasContext,
        isInBlacklist: false,
      });

      // Validar si es coincidencia suficiente
      const threshold = finalOptions.scoreThreshold ||
        SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH;
      const matched = score >= threshold && confidence !== 'LOW';

      // Generar razón detallada
      const reason = this.generateReason(breakdown, score, confidence, matched);

      return {
        matched,
        score: Math.round(score),
        confidence,
        reason,
        breakdown,
      };
    } catch (error) {
      this.logger.error(`Error en búsqueda: ${error.message}`, error.stack);
      return this.createEmptyResult(`Error: ${error.message}`);
    }
  }

  /**
   * Buscar múltiples términos (palabra clave expandida por sinónimos)
   * 
   * @param searchTerms Array de términos (ej: ["limpieza", "higiene", "desinfección"])
   * @param title Campo de título
   * @param description Campo de descripción
   * @param options Opciones de búsqueda
   * @returns SearchResult
   */
  searchMultiple(
    searchTerms: string[],
    title: string,
    description: string,
    options: SearchOptions = {},
  ): SearchResult {
    if (!searchTerms || searchTerms.length === 0) {
      return this.createEmptyResult('Sin términos para buscar');
    }

    // Buscar cada término y tomar el mejor resultado
    const results = searchTerms
      .map((term) => this.search(term, title, description, options))
      .filter((r) => r.matched);

    if (results.length === 0) {
      return this.createEmptyResult('Ningún término coincide');
    }

    // Retornar el mejor resultado
    const best = results.reduce((best, current) =>
      current.score > best.score ? current : best,
    );

    return {
      ...best,
      reason: `Mejor coincidencia de ${searchTerms.length} términos: ${best.reason}`,
    };
  }

  /**
   * Buscar en texto con expansión por sinónimos
   * Usado por alerts.service para búsquedas semánticas
   * 
   * @param keywords Array de palabras clave
   * @param title Título donde buscar
   * @param description Descripción donde buscar
   * @param contextKeywords Palabras para validación contextual (opcional)
   * @returns SearchResult
   */
  searchWithSemantics(
    keywords: string[],
    title: string,
    description: string,
    contextKeywords?: string[],
  ): SearchResult {
    // Si se proporciona contexto, usarlo
    const options: SearchOptions = {
      validateContext: !!contextKeywords,
      allowFuzzy: true,
      applyStemming: true,
    };

    // Si hay palabras contextuales, validar
    if (contextKeywords && contextKeywords.length > 0) {
      const hasContext = this.contextValidator.validateContext(
        title + ' ' + description,
        contextKeywords,
      );

      if (!hasContext) {
        return this.createEmptyResult('No hay contexto relevante');
      }
    }

    return this.searchMultiple(keywords, title, description, options);
  }

  /**
   * Buscar en lote (para procesar muchas licitaciones)
   * Retorna solo las que coinciden
   * 
   * @param searchTerms Términos a buscar
   * @param items Array de items {title, description}
   * @returns Array de items que coinciden con score
   */
  searchBatch<
    T extends { title: string; description: string },
  >(
    searchTerms: string[],
    items: T[],
    options: SearchOptions = {},
  ): Array<T & { searchScore: number; searchConfidence: 'HIGH' | 'MEDIUM' | 'LOW' }> {
    const results: Array<T & { searchScore: number; searchConfidence: 'HIGH' | 'MEDIUM' | 'LOW' }> = [];

    for (const item of items) {
      const result = this.searchMultiple(searchTerms, item.title, item.description, options);

      if (result.matched) {
        results.push({
          ...item,
          searchScore: result.score,
          searchConfidence: result.confidence,
        });
      }
    }

    // Ordenar por score descendente
    return results.sort((a, b) => b.searchScore - a.searchScore);
  }

  /**
   * Calcular score interno
   * @private
   */
  private calculateScore(
    searchTerm: string,
    title: string,
    description: string,
    options: SearchOptions,
  ): {
    score: number;
    breakdown: SearchResult['breakdown'];
  } {
    const ranking = this.ranking.getScoreBreakdown(searchTerm, title, description);

    // Componentes de scoring
    let baseScore = Math.max(ranking.titleScore, ranking.descriptionScore);
    let contextBonus = 0;
    let fuzzyPenalty = 0;

    // Si no hay coincidencia exacta, intentar con stemming y fuzzy
    if (baseScore === 0 && options.applyStemming) {
      const stemScore = this.ranking.scoreMultipleMatches(
        [searchTerm],
        title,
        description,
      );
      baseScore = stemScore * 0.8; // Reducir confianza del stemming
    }

    if (baseScore === 0 && options.allowFuzzy) {
      // Intentar fuzzy search
      if (
        this.fuzzy.searchInText(
          searchTerm,
          title + ' ' + description,
          options.fuzzyDistance || SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
        )
      ) {
        baseScore = 30; // Score bajo para fuzzy
      }
    }

    // Aplicar contexto si se pide
    if (options.validateContext && baseScore > 0) {
      const contextMatches = this.contextValidator.countContextMatches(
        title + ' ' + description,
        [searchTerm],
      );
      contextBonus = this.scoreCalculator.calculateContextBonus(
        contextMatches.percentage,
      );
    }

    // Calcular penalización si necesario
    if (ranking.hasFuzzyMatch && !ranking.hasExactMatch) {
      fuzzyPenalty = 10;
    }

    // Score final
    const finalScore = this.scoreCalculator.calculateFinalScore({
      baseScore,
      contextBonus,
      fuzzyPenalty,
      hasExactMatch: ranking.hasExactMatch,
      hasStemMatch: ranking.hasStemMatch,
    });

    return {
      score: finalScore,
      breakdown: {
        exactMatch: ranking.hasExactMatch
          ? SEARCH_CONFIG.SCORING.EXACT_TITLE
          : 0,
        stemming: ranking.hasStemMatch
          ? SEARCH_CONFIG.SCORING.STEMMING_TITLE
          : 0,
        fuzzy: ranking.hasFuzzyMatch
          ? SEARCH_CONFIG.SCORING.FUZZY_MATCH
          : 0,
        contextual: contextBonus,
        total: Math.round(finalScore),
      },
    };
  }

  /**
   * Generar descripción de resultado
   * @private
   */
  private generateReason(
    breakdown: SearchResult['breakdown'],
    score: number,
    confidence: 'HIGH' | 'MEDIUM' | 'LOW',
    matched: boolean,
  ): string {
    if (!matched) {
      return `Score ${Math.round(score)} insuficiente (mínimo requerido: ${SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH})`;
    }

    const parts: string[] = [];

    if (breakdown?.exactMatch && breakdown.exactMatch > 0) {
      parts.push(`Exacto (+${breakdown.exactMatch})`);
    }
    if (breakdown?.stemming && breakdown.stemming > 0) {
      parts.push(`Stemming (+${breakdown.stemming})`);
    }
    if (breakdown?.fuzzy && breakdown.fuzzy > 0) {
      parts.push(`Aproximado (+${breakdown.fuzzy})`);
    }
    if (breakdown?.contextual && breakdown.contextual > 0) {
      parts.push(`Contexto (+${breakdown.contextual})`);
    }

    return (
      `Coincidencia ${confidence}: ${parts.join(', ')}` +
      ` (Total: ${Math.round(score)}/100)`
    );
  }

  /**
   * Crear resultado vacío
   * @private
   */
  private createEmptyResult(reason: string): SearchResult {
    return {
      matched: false,
      score: 0,
      confidence: 'LOW',
      reason,
      breakdown: {
        exactMatch: 0,
        stemming: 0,
        fuzzy: 0,
        contextual: 0,
        total: 0,
      },
    };
  }

  /**
   * Aplicar opciones por defecto
   * @private
   */
  private applyDefaultOptions(options: SearchOptions): Required<SearchOptions> {
    return {
      fields: options.fields ?? 'both',
      allowFuzzy: options.allowFuzzy ?? true,
      fuzzyDistance: options.fuzzyDistance ?? SEARCH_CONFIG.FUZZY.DEFAULT_DISTANCE,
      applyStemming: options.applyStemming ?? true,
      ignoreStopwords: options.ignoreStopwords ?? true,
      scoreThreshold: options.scoreThreshold ?? SEARCH_CONFIG.THRESHOLDS.SCORE_MIN_FOR_MATCH,
      validateContext: options.validateContext ?? true,
      useBlacklist: options.useBlacklist ?? true,
    };
  }
}
