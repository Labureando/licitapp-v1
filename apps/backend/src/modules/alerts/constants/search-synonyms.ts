/**
 * Diccionario semántico para búsqueda contextual de alertas
 * 
 * Mapea palabras clave a conjuntos de sinónimos del dominio de licitaciones.
 * Permite que una alerta por "limpieza" también encuentre "higiene", "desinfección", etc.
 * 
 * Uso: expandSearchTerms("limpieza") → ["limpieza", "limpiar", "higiene", "desinfección", ...]
 */

export const SEMANTIC_KEYWORDS = {
  limpieza: [
    'limpieza',
    'limpiar',
    'limpio',
    'higiene',
    'desinfección',
    'sanitario',
    'aseo',
    'limpiadores',
  ],

  mantenimiento: [
    'mantenimiento',
    'reparación',
    'conservación',
    'mejora',
    'ajuste',
    'revisión',
    'corrección',
  ],

  construcción: [
    'construcción',
    'obra',
    'edificación',
    'infraestructura',
    'reforma',
    'ampliación',
    'rehabilitación',
    'edificio',
  ],

  transporte: [
    'transporte',
    'logística',
    'distribución',
    'envío',
    'flota',
    'viajes',
    'movilidad',
  ],

  tecnología: [
    'tecnología',
    'informática',
    'sistemas',
    'software',
    'it',
    'digital',
    'data',
    'sistemas informáticos',
  ],

  salud: [
    'salud',
    'médico',
    'sanitario',
    'enfermería',
    'hospital',
    'clínica',
    'asistencia médica',
    'farmacéutico',
  ],

  educación: [
    'educación',
    'formación',
    'enseñanza',
    'docencia',
    'capacitación',
    'entrenamiento',
    'escuela',
    'universidad',
  ],

  seguridad: [
    'seguridad',
    'vigilancia',
    'custodia',
    'protección',
    'seguridad pública',
    'vigilante',
  ],

  jardinería: [
    'jardinería',
    'jardinero',
    'paisajismo',
    'jardín',
    'plantas',
    'arboles',
    'mantenimiento de espacios verdes',
  ],

  catering: [
    'catering',
    'alimentación',
    'comidas',
    'comida',
    'menú',
    'restaurante',
    'cocina',
    'alimentos',
  ],

  consultoría: [
    'consultoría',
    'consultor',
    'asesoramiento',
    'asesor',
    'consulta',
    'análisis',
    'estrategia',
  ],

  comunicación: [
    'comunicación',
    'publicidad',
    'marketing',
    'prensa',
    'medios',
    'relaciones públicas',
    'difusión',
  ],

  gestión: [
    'gestión',
    'administración',
    'management',
    'coordinación',
    'supervisión',
    'control',
  ],

  finanzas: [
    'finanzas',
    'auditoría',
    'contabilidad',
    'contable',
    'fiscal',
    'impuestos',
  ],

  legal: [
    'legal',
    'jurídico',
    'derecho',
    'abogado',
    'asesoría legal',
    'consulta legal',
  ],

  logística: [
    'logística',
    'almacén',
    'depósito',
    'inventario',
    'distribución',
    'suministro',
  ],

  agua: [
    'agua',
    'abastecimiento',
    'hidráulica',
    'fontanería',
    'tuberías',
    'saneamiento',
  ],

  electricidad: [
    'electricidad',
    'eléctrico',
    'energía',
    'instalación eléctrica',
    'electricista',
    'cableado',
  ],

  carreteras: [
    'carretera',
    'asfalto',
    'pavimento',
    'vía',
    'acera',
    'bordillo',
    'alumbrado',
  ],
};

/**
 * Expandir términos de búsqueda a sus sinónimos
 * 
 * Si la palabra clave coincide con un grupo de sinónimos, retorna todo el grupo.
 * Sino, retorna la palabra original.
 * 
 * @param keyword - Palabra a expandir
 * @returns Array con la palabra original y/o sus sinónimos
 * 
 * @example
 * expandSearchTerms("limpieza") 
 * → ["limpieza", "limpiar", "limpio", "higiene", "desinfección", ...]
 * 
 * expandSearchTerms("plomería")
 * → ["plomería"] // palabra no encontrada, retorna como está
 */
export function expandSearchTerms(keyword: string): string[] {
  const normalized = keyword.toLowerCase().trim();

  // Buscar en el diccionario
  for (const [key, synonyms] of Object.entries(SEMANTIC_KEYWORDS)) {
    // Si la palabra clave está en los sinónimos de este grupo
    if (synonyms.some((s) => normalized.includes(s) || s.includes(normalized))) {
      return synonyms;
    }
  }

  // Si no encuentra coincidencia, retorna la palabra original
  return [normalized];
}

/**
 * Expandir múltiples términos
 * 
 * @param keywords - Texto con múltiples palabras separadas por espacios
 * @returns Set con todos los términos únicos expandidos
 * 
 * @example
 * expandMultipleTerms("limpieza y mantenimiento")
 * → Set { "limpieza", "limpiar", ..., "mantenimiento", "reparación", ... }
 */
export function expandMultipleTerms(keywords: string): Set<string> {
  const terms = keywords
    .toLowerCase()
    .split(/[\s,;]+/)
    .filter((t) => t.length > 0);

  const expanded = new Set<string>();

  for (const term of terms) {
    const synonyms = expandSearchTerms(term);
    synonyms.forEach((s) => expanded.add(s));
  }

  return expanded;
}

/**
 * Buscar con sinónimos en texto (búsqueda en memoria)
 * 
 * Usa el diccionario de sinónimos para encontrar coincidencias contextualmente relevantes.
 * Útil como fallback si PostgreSQL full-text search no está disponible.
 * 
 * @param text - Texto a buscar dentro
 * @param keywords - Palabras clave a buscar
 * @returns true si encuentra coincidencia semántica
 * 
 * @example
 * searchWithSynonyms("Servicios de higiene e desinfección", "limpieza")
 * → true (porque "higiene" está en sinónimos de "limpieza")
 */
export function searchWithSynonyms(text: string, keywords: string): boolean {
  const expandedTerms = expandMultipleTerms(keywords);
  const normalizedText = text.toLowerCase();

  // Retorna true si ALGUNO de los términos expandidos está en el texto
  return Array.from(expandedTerms).some((term) => normalizedText.includes(term));
}
