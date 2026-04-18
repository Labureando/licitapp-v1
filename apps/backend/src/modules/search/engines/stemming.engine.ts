import { Injectable, Logger } from '@nestjs/common';
import { SEARCH_CONFIG } from '../constants/search-config';

/**
 * Motor de Stemming
 * Reduce palabras a su raíz para normalización
 * 
 * Ejemplo:
 * - "limpieza", "limpiar", "limpio", "limpiadores"
 * - Todos se reducen a stem similar: "limp"
 */
@Injectable()
export class StemmingEngine {
  private readonly logger = new Logger(StemmingEngine.name);

  /**
   * Crear stem de una palabra
   * Reduces la palabra a su raíz
   * 
   * @param word Palabra a reducir
   * @returns Stem de la palabra
   */
  stem(word: string): string {
    if (!word || word.length < SEARCH_CONFIG.STEMMING.MIN_WORD_LENGTH) {
      return word;
    }

    // Implementación básica de stemming sin dependencias externas
    // Para producción, usar: npm install natural
    // import * as natural from 'natural';
    // const stemmer = new natural.PorterStemmer();
    // return stemmer.stem(word);

    return this.basicStem(word);
  }

  /**
   * Crear stems de múltiples palabras
   * 
   * @param words Array de palabras
   * @returns Array con stems
   */
  stemMany(words: string[]): string[] {
    return words.map((word) => this.stem(word));
  }

  /**
   * Stemming básico sin dependencias
   * Implementa reglas simples en español
   * 
   * Para mejor calidad, usar "natural" package
   * @private
   */
  private basicStem(word: string): string {
    const w = word.toLowerCase();

    // Reglas simples de stemming para español
    // Remover sufijos comunes

    // -ción → -ci
    if (w.endsWith('ción')) {
      return w.slice(0, -4) + 'ci';
    }

    // -aciones → -aci
    if (w.endsWith('aciones')) {
      return w.slice(0, -7) + 'aci';
    }

    // -anza → -anz
    if (w.endsWith('anza')) {
      return w.slice(0, -4) + 'anz';
    }

    // -mente → (remover)
    if (w.endsWith('mente')) {
      return w.slice(0, -5);
    }

    // -dad → -da
    if (w.endsWith('dad')) {
      return w.slice(0, -3) + 'da';
    }

    // -idad → -ida
    if (w.endsWith('idad')) {
      return w.slice(0, -4) + 'ida';
    }

    // -ador → -ad
    if (w.endsWith('ador')) {
      return w.slice(0, -4) + 'ad';
    }

    // -dora → -d
    if (w.endsWith('dora')) {
      return w.slice(0, -4) + 'd';
    }

    // -ible → -ib
    if (w.endsWith('ible')) {
      return w.slice(0, -4) + 'ib';
    }

    // -ismo → -ism
    if (w.endsWith('ismo')) {
      return w.slice(0, -4) + 'ism';
    }

    // -ista → -ist
    if (w.endsWith('ista')) {
      return w.slice(0, -4) + 'ist';
    }

    // -osos → -os
    if (w.endsWith('osos')) {
      return w.slice(0, -4) + 'os';
    }

    // -osa → -os
    if (w.endsWith('osa')) {
      return w.slice(0, -3) + 'os';
    }

    // -ero → -er
    if (w.endsWith('ero')) {
      return w.slice(0, -3) + 'er';
    }

    // -era → -er
    if (w.endsWith('era')) {
      return w.slice(0, -3) + 'er';
    }

    // -ería → -eri
    if (w.endsWith('ería')) {
      return w.slice(0, -4) + 'eri';
    }

    // -icencia → -icen
    if (w.endsWith('icencia')) {
      return w.slice(0, -7) + 'icen';
    }

    // -izar → -iz
    if (w.endsWith('izar')) {
      return w.slice(0, -4) + 'iz';
    }

    // -ización → -iz
    if (w.endsWith('ización')) {
      return w.slice(0, -7) + 'iz';
    }

    // -ación → -ac
    if (w.endsWith('ación')) {
      return w.slice(0, -5) + 'ac';
    }

    // -ing → -ing (mantener para términos técnicos)
    // -ed → -ed (mantener para términos técnicos)

    // Si no coincide ninguna regla, retornar palabra completa
    return w;
  }

  /**
   * Comparar dos palabras por stemming
   * Retorna true si ambas tienen el mismo stem
   * 
   * @param word1 Primera palabra
   * @param word2 Segunda palabra
   * @returns true si los stems son iguales
   */
  areStemEqual(word1: string, word2: string): boolean {
    return this.stem(word1) === this.stem(word2);
  }

  /**
   * Encontrar todas las palabras que comparten stem
   * 
   * @param word Palabra de referencia
   * @param words Array de palabras a comparar
   * @returns Array de palabras con el mismo stem
   */
  findStemMatches(word: string, words: string[]): string[] {
    const stem = this.stem(word);
    return words.filter((w) => this.stem(w) === stem);
  }
}
