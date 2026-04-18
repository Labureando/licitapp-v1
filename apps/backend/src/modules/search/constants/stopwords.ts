/**
 * Palabras comunes que no aportan significado
 * Se ignoran para evitar falsos positivos
 */
export const STOPWORDS = new Set([
  // Artículos
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',

  // Preposiciones
  'de', 'a', 'en', 'por', 'para', 'con', 'sin', 'sobre', 'entre',
  'hacia', 'desde', 'hasta', 'durante', 'ante', 'bajo', 'cabe', 'mediante',

  // Conjunciones
  'y', 'o', 'pero', 'mas', 'sino', 'ni', 'porque', 'pues', 'luego',

  // Verbos auxiliares comunes
  'es', 'son', 'esta', 'estan', 'estamos', 'estoy', 'soy', 'somos',
  'ha', 'han', 'he', 'hemos', 'hay', 'sea', 'sean', 'fuera', 'fueron',

  // Adverbios comunes
  'muy', 'mas', 'menos', 'bien', 'mal', 'mejor', 'peor', 'solo', 'solamente',
  'apenas', 'ya', 'aun', 'todavia', 'siempre', 'nunca', 'jamás', 'alguna', 'alguno',

  // Otras palabras comunes
  'que', 'cual', 'quien', 'como', 'cuando', 'donde', 'cuanto',
  'del', 'al', 'este', 'ese', 'aquel', 'mismo', 'otro', 'tal', 'cual',
  'aqui', 'alli', 'hoy', 'ayer', 'mañana', 'ahora', 'luego',

  // Palabras de licitaciones comunes (bajo aporte semántico)
  'servicio', 'servicios', 'contrato', 'licitacion', 'licitaciones',
  'adjudicacion', 'ejecucion', 'realizacion', 'desarrollo', 'proceso',
  'procedimiento', 'tramite', 'requisito', 'condicion', 'obligacion',
]);

/**
 * Palabras que deben preservarse aunque sean cortas
 * Son importantes para búsquedas incluso si son cortas
 */
export const STOPWORDS_EXCEPTIONS = new Set([
  'it', 'ai', 'sql', 'cad', 'bim', 'iot', 'qr', 'api',
  'bid', 'dol', 'eur', 'gbp', 'mxn', 'ars', 'clp',
]);

/**
 * Filtrar stopwords de un texto
 * @param words Array de palabras
 * @returns Array sin stopwords
 */
export function filterStopwords(words: string[]): string[] {
  return words.filter(
    (word) =>
      !STOPWORDS.has(word.toLowerCase()) ||
      STOPWORDS_EXCEPTIONS.has(word.toLowerCase()),
  );
}

/**
 * Verificar si una palabra es stopword
 */
export function isStopword(word: string): boolean {
  const lower = word.toLowerCase();
  return STOPWORDS.has(lower) && !STOPWORDS_EXCEPTIONS.has(lower);
}
