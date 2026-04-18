import { Module } from '@nestjs/common';
import { SearchEngineService } from './search.engine';
import { StemmingEngine } from './engines/stemming.engine';
import { FuzzyEngine } from './engines/fuzzy.engine';
import { RankingEngine } from './engines/ranking.engine';
import { ContextValidator } from './validators/context.validator';
import { BlacklistValidator } from './validators/blacklist.validator';
import { ScoringValidator } from './validators/scoring.validator';
import { ScoreCalculator } from './scoring/score-calculator';
import { ConfidenceEvaluator } from './scoring/confidence-evaluator';

/**
 * Módulo de Búsqueda
 * Exporta SearchEngineService para inyección en otros módulos
 * 
 * Inyecta automáticamente:
 * - Engines: Stemming, Fuzzy, Ranking
 * - Validadores: Context, Blacklist, Scoring
 * - Calculadores: Score, Confidence
 */
@Module({
  providers: [
    SearchEngineService,
    StemmingEngine,
    FuzzyEngine,
    RankingEngine,
    ContextValidator,
    BlacklistValidator,
    ScoringValidator,
    ScoreCalculator,
    ConfidenceEvaluator,
  ],
  exports: [SearchEngineService],
})
export class SearchModule {}
