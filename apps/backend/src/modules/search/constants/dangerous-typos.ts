/**
 * Blacklist de typos peligrosos
 * Palabras que al hacer fuzzy search podrían crear falsos positivos
 * Si fuzzy match cae en esta lista, se rechaza
 */
export const DANGEROUS_TYPOS = {
  // "limpie" podría ser typo de "limpieza"
  // Pero también podría confundirse con "límite", "limpiar"
  limpie: ['limite', 'límite', 'limpiar'],

  // "mantenimie" → "mantenimiento" o "mantener"?
  mantenimie: ['mantener', 'mantiene', 'mantenido'],

  // "construccio" → "construcción"
  // Pero no confundir con "construcciones"
  construccio: ['construcciones'],

  // "transporta" → "transporte" o "transporta" (verbo)?
  transporta: ['transporte', 'transportes'],

  // "segurida" → "seguridad" o "seguro"?
  segurida: ['seguro', 'seguros', 'segurances'],

  // "tecnolo" → "tecnología"
  // Pero no confundir con términos técnicos específicos
  tecnolo: ['tecnico', 'técnico'],

  // "educacio" → "educación" o "educador"?
  educacio: ['educador', 'educadores'],

  // "sanita" → "sanitario" o "sanidad"?
  sanita: ['sanidad', 'sanitarios'],
} as const;

/**
 * Verificar si un fuzzy match está en la blacklist peligrosa
 * @param originalTerm Término original buscado
 * @param fuzzyMatch Resultado del match fuzzy
 * @returns true si el match está en blacklist (debe rechazarse)
 */
export function isInDangerousBlacklist(
  originalTerm: string,
  fuzzyMatch: string,
): boolean {
  const normalized = originalTerm.toLowerCase();

  const dangerous = DANGEROUS_TYPOS[normalized as keyof typeof DANGEROUS_TYPOS];
  if (!dangerous) {
    return false; // No está en blacklist, permitir
  }

  const fuzzyLower = fuzzyMatch.toLowerCase();
  return (Array.from(dangerous) as string[]).includes(fuzzyLower);
}

/**
 * Obtener alternativas seguras para un término
 * @param term Término que produjo falsos positivos
 * @returns Sugerencias de términos alternativos seguros
 */
export function getSafeAlternatives(term: string): string[] {
  const normalized = term.toLowerCase();
  const dangerous = DANGEROUS_TYPOS[normalized as keyof typeof DANGEROUS_TYPOS];

  if (!dangerous) {
    return [];
  }

  // Retornar las alternativas peligrosas como sugerencia
  return Array.from(dangerous);
}
