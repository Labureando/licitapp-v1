/**
 * Mapeo geográfico España — fuente única de verdad
 *
 * Soporta 3 formatos de código que aparecen en los feeds CODICE:
 *   - NUTS3: "ES614" (provincia Granada)
 *   - NUTS2: "ES61"  (CCAA Andalucía)
 *   - INE:   "18"    (provincia Granada)
 *
 * Referencia: https://ec.europa.eu/eurostat/web/nuts
 */

// ═══════════════════════════════════════════════
// NUTS3 → Provincia
// ═══════════════════════════════════════════════

export const PROVINCIA_BY_NUTS3: Record<string, string> = {
  // Galicia
  ES111: 'A Coruña',
  ES112: 'Lugo',
  ES113: 'Ourense',
  ES114: 'Pontevedra',
  // Asturias
  ES120: 'Asturias',
  // Cantabria
  ES130: 'Cantabria',
  // País Vasco
  ES211: 'Álava',
  ES212: 'Gipuzkoa',
  ES213: 'Bizkaia',
  // Navarra
  ES220: 'Navarra',
  // La Rioja
  ES230: 'La Rioja',
  // Aragón
  ES241: 'Huesca',
  ES242: 'Teruel',
  ES243: 'Zaragoza',
  // Madrid
  ES300: 'Madrid',
  // Castilla y León
  ES411: 'Ávila',
  ES412: 'Burgos',
  ES413: 'León',
  ES414: 'Palencia',
  ES415: 'Salamanca',
  ES416: 'Segovia',
  ES417: 'Soria',
  ES418: 'Valladolid',
  ES419: 'Zamora',
  // Castilla-La Mancha
  ES421: 'Albacete',
  ES422: 'Ciudad Real',
  ES423: 'Cuenca',
  ES424: 'Guadalajara',
  ES425: 'Toledo',
  // Extremadura
  ES431: 'Badajoz',
  ES432: 'Cáceres',
  // Cataluña
  ES511: 'Barcelona',
  ES512: 'Girona',
  ES513: 'Lleida',
  ES514: 'Tarragona',
  // Comunitat Valenciana
  ES521: 'Alicante',
  ES522: 'Castellón',
  ES523: 'Valencia',
  // Illes Balears
  ES532: 'Illes Balears',
  ES530: 'Illes Balears',
  ES531: 'Illes Balears',
  ES533: 'Illes Balears',
  // Andalucía
  ES611: 'Almería',
  ES612: 'Cádiz',
  ES613: 'Córdoba',
  ES614: 'Granada',
  ES615: 'Huelva',
  ES616: 'Jaén',
  ES617: 'Málaga',
  ES618: 'Sevilla',
  // Murcia
  ES620: 'Murcia',
  // Ceuta / Melilla
  ES630: 'Ceuta',
  ES640: 'Melilla',
  // Canarias (por islas, mapeadas a provincia clásica)
  ES703: 'Santa Cruz de Tenerife',
  ES704: 'Las Palmas',
  ES705: 'Las Palmas',
  ES706: 'Santa Cruz de Tenerife',
  ES707: 'Santa Cruz de Tenerife',
  ES708: 'Las Palmas',
  ES709: 'Santa Cruz de Tenerife',
};

// ═══════════════════════════════════════════════
// NUTS2 → CCAA (cuando solo llega NUTS2)
// ═══════════════════════════════════════════════

export const CCAA_BY_NUTS2: Record<string, string> = {
  ES11: 'Galicia',
  ES12: 'Principado de Asturias',
  ES13: 'Cantabria',
  ES21: 'País Vasco',
  ES22: 'Comunidad Foral de Navarra',
  ES23: 'La Rioja',
  ES24: 'Aragón',
  ES30: 'Comunidad de Madrid',
  ES41: 'Castilla y León',
  ES42: 'Castilla-La Mancha',
  ES43: 'Extremadura',
  ES51: 'Cataluña',
  ES52: 'Comunitat Valenciana',
  ES53: 'Illes Balears',
  ES61: 'Andalucía',
  ES62: 'Región de Murcia',
  ES63: 'Ciudad Autónoma de Ceuta',
  ES64: 'Ciudad Autónoma de Melilla',
  ES70: 'Canarias',
};

// ═══════════════════════════════════════════════
// INE (2 dígitos) → Provincia
// ═══════════════════════════════════════════════

export const PROVINCIA_BY_INE: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería',
  '05': 'Ávila', '06': 'Badajoz', '07': 'Illes Balears', '08': 'Barcelona',
  '09': 'Burgos', '10': 'Cáceres', '11': 'Cádiz', '12': 'Castellón',
  '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña', '16': 'Cuenca',
  '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León',
  '25': 'Lleida', '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid',
  '29': 'Málaga', '30': 'Murcia', '31': 'Navarra', '32': 'Ourense',
  '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas', '36': 'Pontevedra',
  '37': 'Salamanca', '38': 'Santa Cruz de Tenerife', '39': 'Cantabria',
  '40': 'Segovia', '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona',
  '44': 'Teruel', '45': 'Toledo', '46': 'Valencia', '47': 'Valladolid',
  '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza', '51': 'Ceuta',
  '52': 'Melilla',
};

// ═══════════════════════════════════════════════
// Provincia → CCAA
// ═══════════════════════════════════════════════

export const CCAA_BY_PROVINCIA: Record<string, string> = {
  'Almería': 'Andalucía', 'Cádiz': 'Andalucía', 'Córdoba': 'Andalucía',
  'Granada': 'Andalucía', 'Huelva': 'Andalucía', 'Jaén': 'Andalucía',
  'Málaga': 'Andalucía', 'Sevilla': 'Andalucía',
  'Huesca': 'Aragón', 'Teruel': 'Aragón', 'Zaragoza': 'Aragón',
  'Asturias': 'Principado de Asturias',
  'Illes Balears': 'Illes Balears',
  'Las Palmas': 'Canarias', 'Santa Cruz de Tenerife': 'Canarias',
  'Cantabria': 'Cantabria',
  'Albacete': 'Castilla-La Mancha', 'Ciudad Real': 'Castilla-La Mancha',
  'Cuenca': 'Castilla-La Mancha', 'Guadalajara': 'Castilla-La Mancha',
  'Toledo': 'Castilla-La Mancha',
  'Ávila': 'Castilla y León', 'Burgos': 'Castilla y León', 'León': 'Castilla y León',
  'Palencia': 'Castilla y León', 'Salamanca': 'Castilla y León', 'Segovia': 'Castilla y León',
  'Soria': 'Castilla y León', 'Valladolid': 'Castilla y León', 'Zamora': 'Castilla y León',
  'Barcelona': 'Cataluña', 'Girona': 'Cataluña', 'Lleida': 'Cataluña', 'Tarragona': 'Cataluña',
  'Alicante': 'Comunitat Valenciana', 'Castellón': 'Comunitat Valenciana', 'Valencia': 'Comunitat Valenciana',
  'Badajoz': 'Extremadura', 'Cáceres': 'Extremadura',
  'A Coruña': 'Galicia', 'Lugo': 'Galicia', 'Ourense': 'Galicia', 'Pontevedra': 'Galicia',
  'Madrid': 'Comunidad de Madrid',
  'Murcia': 'Región de Murcia',
  'Navarra': 'Comunidad Foral de Navarra',
  'Álava': 'País Vasco', 'Bizkaia': 'País Vasco', 'Gipuzkoa': 'País Vasco',
  'La Rioja': 'La Rioja',
  'Ceuta': 'Ciudad Autónoma de Ceuta',
  'Melilla': 'Ciudad Autónoma de Melilla',
};

// ═══════════════════════════════════════════════
// Lista canónica ordenada
// ═══════════════════════════════════════════════

export const CCAA_LIST = [
  'Andalucía', 'Aragón', 'Canarias', 'Cantabria', 'Castilla-La Mancha',
  'Castilla y León', 'Cataluña', 'Ciudad Autónoma de Ceuta',
  'Ciudad Autónoma de Melilla', 'Comunidad de Madrid',
  'Comunidad Foral de Navarra', 'Comunitat Valenciana', 'Extremadura',
  'Galicia', 'Illes Balears', 'La Rioja', 'País Vasco',
  'Principado de Asturias', 'Región de Murcia',
] as const;

export type CCAA = (typeof CCAA_LIST)[number];

// ═══════════════════════════════════════════════
// Aliases de grafía
// ═══════════════════════════════════════════════

const CCAA_ALIASES: Record<string, string> = {
  'andalucia': 'Andalucía', 'andalucía': 'Andalucía',
  'aragon': 'Aragón', 'aragón': 'Aragón',
  'asturias': 'Principado de Asturias', 'principado de asturias': 'Principado de Asturias',
  'baleares': 'Illes Balears', 'illes balears': 'Illes Balears', 'islas baleares': 'Illes Balears',
  'canarias': 'Canarias', 'islas canarias': 'Canarias',
  'cantabria': 'Cantabria',
  'castilla-la mancha': 'Castilla-La Mancha', 'castilla la mancha': 'Castilla-La Mancha',
  'castilla y leon': 'Castilla y León', 'castilla y león': 'Castilla y León',
  'cataluna': 'Cataluña', 'cataluña': 'Cataluña', 'catalunya': 'Cataluña',
  'ceuta': 'Ciudad Autónoma de Ceuta',
  'madrid': 'Comunidad de Madrid', 'comunidad de madrid': 'Comunidad de Madrid',
  'c. madrid': 'Comunidad de Madrid', 'c.a. madrid': 'Comunidad de Madrid',
  'melilla': 'Ciudad Autónoma de Melilla',
  'murcia': 'Región de Murcia', 'region de murcia': 'Región de Murcia', 'región de murcia': 'Región de Murcia',
  'navarra': 'Comunidad Foral de Navarra', 'comunidad foral de navarra': 'Comunidad Foral de Navarra',
  'nafarroa': 'Comunidad Foral de Navarra',
  'pais vasco': 'País Vasco', 'país vasco': 'País Vasco', 'euskadi': 'País Vasco',
  'la rioja': 'La Rioja', 'rioja': 'La Rioja',
  'valencia': 'Comunitat Valenciana', 'comunitat valenciana': 'Comunitat Valenciana',
  'comunidad valenciana': 'Comunitat Valenciana', 'c. valenciana': 'Comunitat Valenciana',
  'extremadura': 'Extremadura',
  'galicia': 'Galicia', 'galiza': 'Galicia',
};

const PROVINCIA_ALIASES: Record<string, string> = {
  'alava': 'Álava', 'araba': 'Álava',
  'avila': 'Ávila',
  'caceres': 'Cáceres',
  'cadiz': 'Cádiz',
  'castellon': 'Castellón', 'castello': 'Castellón',
  'cordoba': 'Córdoba',
  'malaga': 'Málaga',
  'almeria': 'Almería',
  'jaen': 'Jaén',
  'leon': 'León',
  'la coruna': 'A Coruña', 'a coruna': 'A Coruña', 'coruna': 'A Coruña',
  'vizcaya': 'Bizkaia',
  'guipuzcoa': 'Gipuzkoa',
  'gerona': 'Girona',
  'lerida': 'Lleida',
  'orense': 'Ourense',
  'baleares': 'Illes Balears', 'islas baleares': 'Illes Balears',
  'las palmas': 'Las Palmas',
  'santa cruz de tenerife': 'Santa Cruz de Tenerife', 'tenerife': 'Santa Cruz de Tenerife',
  'rioja': 'La Rioja',
};

// ═══════════════════════════════════════════════
// API pública
// ═══════════════════════════════════════════════

function stripAccents(s: string): string {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeCCAA(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = stripAccents(raw.toLowerCase().trim())
    .replace(/^(c\.a\.?|c\.|ca\s+)/i, '')
    .trim();
  return CCAA_ALIASES[key] ?? null;
}

export function normalizeProvincia(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const clean = raw.trim();
  if (CCAA_BY_PROVINCIA[clean]) return clean;
  const key = stripAccents(clean.toLowerCase());
  return PROVINCIA_ALIASES[key] ?? null;
}

export function getCCAAFromProvincia(provincia: string | null | undefined): string | null {
  if (!provincia) return null;
  const canonical = normalizeProvincia(provincia) ?? provincia.trim();
  return CCAA_BY_PROVINCIA[canonical] ?? null;
}

/**
 * Resuelve código NUTS3/NUTS2/INE → {provincia, ccaa}
 */
export function getGeoFromCode(code: string | null | undefined): {
  provincia: string | null;
  ccaa: string | null;
} {
  if (!code) return { provincia: null, ccaa: null };
  const raw = String(code).trim().toUpperCase();

  if (/^ES[0-9]{3}$/.test(raw)) {
    const provincia = PROVINCIA_BY_NUTS3[raw] ?? null;
    const ccaa = provincia ? CCAA_BY_PROVINCIA[provincia] ?? null : null;
    if (!provincia) {
      const nuts2 = raw.slice(0, 4);
      return { provincia: null, ccaa: CCAA_BY_NUTS2[nuts2] ?? null };
    }
    return { provincia, ccaa };
  }

  if (/^ES[0-9]{2}$/.test(raw)) {
    return { provincia: null, ccaa: CCAA_BY_NUTS2[raw] ?? null };
  }

  const ineMatch = raw.match(/^(\d{2})(\d{3})?$/);
  if (ineMatch) {
    const provCode = ineMatch[1];
    const provincia = PROVINCIA_BY_INE[provCode] ?? null;
    const ccaa = provincia ? CCAA_BY_PROVINCIA[provincia] ?? null : null;
    return { provincia, ccaa };
  }

  return { provincia: null, ccaa: null };
}

// ═══════════════════════════════════════════════
// Inferencia por texto libre
// ═══════════════════════════════════════════════

const MUNICIPIO_TO_PROVINCIA: Record<string, string> = {
  'madrid': 'Madrid', 'alcala de henares': 'Madrid', 'alcobendas': 'Madrid',
  'alcorcon': 'Madrid', 'fuenlabrada': 'Madrid', 'getafe': 'Madrid',
  'leganes': 'Madrid', 'mostoles': 'Madrid', 'parla': 'Madrid',
  'pozuelo de alarcon': 'Madrid', 'torrejon de ardoz': 'Madrid',
  'las rozas': 'Madrid',
  'barcelona': 'Barcelona', 'badalona': 'Barcelona', 'hospitalet': 'Barcelona',
  'sabadell': 'Barcelona', 'terrassa': 'Barcelona', 'mataro': 'Barcelona',
  'santa coloma de gramenet': 'Barcelona',
  'valencia': 'Valencia', 'gandia': 'Valencia', 'torrent': 'Valencia', 'paterna': 'Valencia',
  'sevilla': 'Sevilla', 'dos hermanas': 'Sevilla', 'alcala de guadaira': 'Sevilla',
  'malaga': 'Málaga', 'marbella': 'Málaga', 'mijas': 'Málaga', 'fuengirola': 'Málaga',
  'benalmadena': 'Málaga', 'torremolinos': 'Málaga', 'estepona': 'Málaga', 'velez-malaga': 'Málaga',
  'zaragoza': 'Zaragoza',
  'murcia': 'Murcia', 'cartagena': 'Murcia', 'lorca': 'Murcia',
  'palma': 'Illes Balears', 'palma de mallorca': 'Illes Balears',
  'las palmas de gran canaria': 'Las Palmas', 'telde': 'Las Palmas',
  'bilbao': 'Bizkaia', 'getxo': 'Bizkaia', 'barakaldo': 'Bizkaia',
  'alicante': 'Alicante', 'elche': 'Alicante', 'benidorm': 'Alicante',
  'torrevieja': 'Alicante', 'elx': 'Alicante',
  'cordoba': 'Córdoba',
  'valladolid': 'Valladolid',
  'vigo': 'Pontevedra', 'pontevedra': 'Pontevedra',
  'a coruna': 'A Coruña', 'la coruna': 'A Coruña', 'santiago de compostela': 'A Coruña',
  'gijon': 'Asturias', 'oviedo': 'Asturias', 'aviles': 'Asturias',
  'granada': 'Granada', 'albolote': 'Granada',
  'cadiz': 'Cádiz', 'jerez': 'Cádiz', 'algeciras': 'Cádiz',
  'donostia': 'Gipuzkoa', 'san sebastian': 'Gipuzkoa', 'irun': 'Gipuzkoa',
  'pamplona': 'Navarra', 'iruna': 'Navarra',
  'vitoria': 'Álava', 'gasteiz': 'Álava',
  'santander': 'Cantabria',
  'logrono': 'La Rioja',
  'badajoz': 'Badajoz', 'merida': 'Badajoz',
  'caceres': 'Cáceres',
  'albacete': 'Albacete',
  'toledo': 'Toledo',
  'ceuta': 'Ceuta', 'melilla': 'Melilla',
  'avila': 'Ávila',
  'burgos': 'Burgos',
  'leon': 'León',
  'cabra': 'Córdoba', 'coristanco': 'A Coruña',
};

/**
 * Extrae provincia de texto libre: "Albolote (Granada)", "Madrid", "CABRA"
 */
export function inferProvinciaFromText(text: string | null | undefined): string | null {
  if (!text) return null;
  const normalized = stripAccents(text.toLowerCase());

  // "(Granada)" o similar
  const parentMatch = normalized.match(/\(([^)]+)\)/);
  if (parentMatch) {
    const inside = parentMatch[1].trim();
    const asProv = normalizeProvincia(inside);
    if (asProv) return asProv;
  }

  // Nombre de provincia directo
  for (const canonicalProv of Object.keys(CCAA_BY_PROVINCIA)) {
    const normProv = stripAccents(canonicalProv.toLowerCase());
    if (normalized.includes(normProv)) return canonicalProv;
  }

  // Municipio conocido (palabra completa)
  for (const [municipio, provincia] of Object.entries(MUNICIPIO_TO_PROVINCIA)) {
    const re = new RegExp(`\\b${municipio}\\b`);
    if (re.test(normalized)) return provincia;
  }

  return null;
}