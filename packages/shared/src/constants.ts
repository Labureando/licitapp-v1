export const DATA_SOURCES = {
  PLACE: 'PLACE',
  PLACE_AGREGADA: 'PLACE_AGREGADA',
  PLACE_MENORES: 'PLACE_MENORES',
  BOE: 'BOE',
  TED: 'TED',
  CAT_PSCP: 'CAT_PSCP',
  PV_EUSKADI: 'PV_EUSKADI',
  MAD: 'MAD',
  GAL: 'GAL',
  AND: 'AND',
  NAV: 'NAV',
  RIO: 'RIO',
  BOCA: 'BOCA',
  BOP: 'BOP',
  BDNS: 'BDNS',
  PRTR: 'PRTR',
} as const;

export const TIPOS_CONTRATO = {
  OBRAS: 'OBRAS',
  SERVICIOS: 'SERVICIOS',
  SUMINISTROS: 'SUMINISTROS',
  CONCESION_OBRAS: 'CONCESION_OBRAS',
  CONCESION_SERVICIOS: 'CONCESION_SERVICIOS',
  MIXTO: 'MIXTO',
  OTRO: 'OTRO',
} as const;

export const ESTADOS_LICITACION = {
  ANUNCIO_PREVIO: 'ANUNCIO_PREVIO',
  ABIERTA: 'ABIERTA',
  CERRADA: 'CERRADA',
  PENDIENTE_ADJUDICACION: 'PENDIENTE_ADJUDICACION',
  ADJUDICADA: 'ADJUDICADA',
  DESIERTA: 'DESIERTA',
  ANULADA: 'ANULADA',
  RESUELTA: 'RESUELTA',
} as const;

export const PROCEDIMIENTOS = {
  ABIERTO: 'ABIERTO',
  RESTRINGIDO: 'RESTRINGIDO',
  NEGOCIADO_SIN_PUBLICIDAD: 'NEGOCIADO_SIN_PUBLICIDAD',
  NEGOCIADO_CON_PUBLICIDAD: 'NEGOCIADO_CON_PUBLICIDAD',
  DIALOGO_COMPETITIVO: 'DIALOGO_COMPETITIVO',
  SIMPLIFICADO: 'SIMPLIFICADO',
  BASADO_ACUERDO_MARCO: 'BASADO_ACUERDO_MARCO',
  OTRO: 'OTRO',
} as const;

export const CCAA = [
  { code: 'AND', name: 'Andalucía' },
  { code: 'ARA', name: 'Aragón' },
  { code: 'AST', name: 'Asturias' },
  { code: 'BAL', name: 'Islas Baleares' },
  { code: 'CAN', name: 'Canarias' },
  { code: 'CTB', name: 'Cantabria' },
  { code: 'CYL', name: 'Castilla y León' },
  { code: 'CLM', name: 'Castilla-La Mancha' },
  { code: 'CAT', name: 'Cataluña' },
  { code: 'VAL', name: 'Comunidad Valenciana' },
  { code: 'EXT', name: 'Extremadura' },
  { code: 'GAL', name: 'Galicia' },
  { code: 'MAD', name: 'Comunidad de Madrid' },
  { code: 'MUR', name: 'Región de Murcia' },
  { code: 'NAV', name: 'Navarra' },
  { code: 'PV', name: 'País Vasco' },
  { code: 'RIO', name: 'La Rioja' },
  { code: 'CEU', name: 'Ceuta' },
  { code: 'MEL', name: 'Melilla' },
] as const;

export const PLANES = {
  FREE: { id: 'FREE', name: 'Gratis', price: 0, maxAlertas: 3 },
  PRO: { id: 'PRO', name: 'Pro', price: 4900, maxAlertas: 10 },
  BUSINESS: { id: 'BUSINESS', name: 'Business', price: 9900, maxAlertas: -1 },
  ENTERPRISE: { id: 'ENTERPRISE', name: 'Enterprise', price: 19900, maxAlertas: -1 },
} as const;