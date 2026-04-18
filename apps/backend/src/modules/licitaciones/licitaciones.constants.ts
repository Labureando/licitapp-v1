/**
 * Constantes y whitelists para el módulo de Licitaciones
 *
 * Define los valores válidos para cada filtro disponible en licitaciones.
 * Cualquier valor fuera de estas whitelists se IGNORA en los dropdowns
 * pero sigue existiendo en BD (se limpia al re-scrapear).
 *
 * @module licitaciones.constants
 */

/**
 * Estados válidos de una licitación
 *
 * Valores reconocidos:
 * - ABIERTA: Plazo abierto para presentación de ofertas
 * - CERRADA: Plazo cerrado, sin nuevas ofertas
 * - ADJUDICADA: Ya adjudicada a un licitador
 * - RESUELTA: Proceso completado
 * - DESIERTA: Sin ofertas presentadas
 * - ANULADA: Licitación anulada/suspendida
 * - ANUNCIO_PREVIO: Anuncio de licitación futura
 *
 * Excluimos 'DESCONOCIDO' adrede — no aporta valor en filtros
 */
export const VALID_ESTADOS = new Set<string>([
  'ABIERTA',
  'CERRADA',
  'ADJUDICADA',
  'RESUELTA',
  'DESIERTA',
  'ANULADA',
  'ANUNCIO_PREVIO',
]);

/**
 * Tipos de contrato válidos
 *
 * Clasificación principal del tipo de contrato:
 * - OBRAS: Construcción, reparación, mantenimiento
 * - SERVICIOS: Servicios profesionales, consultoría, etc.
 * - SUMINISTROS: Adquisición de bienes/productos
 * - OTROS: Tipos no clasificados
 * - MIXTO: Combinación de obras + servicios o servicios + suministros
 * - PRIVADO: Contratación privada
 * - PATRIMONIAL: Relacionada con patrimonio
 * - ADMINISTRATIVO_ESPECIAL: Sectores especiales (transporte, agua, etc.)
 * - CONCESION_OBRAS: Concesión de obras
 * - CONCESION_SERVICIOS: Concesión de servicios
 * - ACUERDO_MARCO: Acuerdo marco
 * - SISTEMA_DINAMICO: Compra mediante sistema dinámico
 */
export const VALID_TIPOS = new Set<string>([
  'OBRAS',
  'SERVICIOS',
  'SUMINISTROS',
  'OTROS',
  'MIXTO',
  'PRIVADO',
  'PATRIMONIAL',
  'ADMINISTRATIVO_ESPECIAL',
  'CONCESION_OBRAS',
  'CONCESION_SERVICIOS',
  'ACUERDO_MARCO',
  'SISTEMA_DINAMICO',
]);

/**
 * Procedimientos de contratación válidos
 *
 * Define el procedimiento administrativo seguido:
 * - ABIERTO: Abierto a cualquier licitador interesado
 * - RESTRINGIDO: Solo pueden participar licitadores previamente seleccionados
 * - NEGOCIADO_SIN_PUBLICIDAD: Sin publicar la convocatoria públicamente
 * - NEGOCIADO_CON_PUBLICIDAD: Publicado pero con negociación
 * - DIALOGO_COMPETITIVO: Diálogo para definir solución óptima
 * - SIMPLIFICADO: Procedimiento simplificado (importes bajos)
 * - SIMPLIFICADO_ABREVIADO: Versión abreviada de simplificado
 * - CONCURSO_PROYECTOS: Concurso de proyectos
 * - OTROS: Procedimientos especiales no clasificados
 * - SISTEMA_DINAMICO: Sistema dinámico de contratación
 * - ASOCIACION_INNOVACION: Asociación para innovación
 * - NORMAS_INTERNAS: Según normas internas de la organización
 * - BASADO_ACUERDO_MARCO: Basado en acuerdo marco previo
 * - NO_DEFINIDO: Procedimiento no especificado
 */
export const VALID_PROCEDIMIENTOS = new Set<string>([
  'ABIERTO',
  'RESTRINGIDO',
  'NEGOCIADO_SIN_PUBLICIDAD',
  'NEGOCIADO_CON_PUBLICIDAD',
  'DIALOGO_COMPETITIVO',
  'SIMPLIFICADO',
  'SIMPLIFICADO_ABREVIADO',
  'CONCURSO_PROYECTOS',
  'OTROS',
  'SISTEMA_DINAMICO',
  'ASOCIACION_INNOVACION',
  'NORMAS_INTERNAS',
  'BASADO_ACUERDO_MARCO',
  'NO_DEFINIDO',
]);

/**
 * Tramitaciones válidas
 *
 * Define la urgencia/prioridad del procedimiento:
 * - ORDINARIA: Tramitación normal con plazos estándar
 * - URGENTE: Tramitación acelerada por necesidad
 * - EMERGENCIA: Tramitación de emergencia (desastres, crisis)
 */
export const VALID_TRAMITACIONES = new Set<string>([
  'ORDINARIA',
  'URGENTE',
  'EMERGENCIA',
]);

/**
 * Configuración de whitelists para dropdowns
 *
 * Mapeo central para aplicar validación en getFilterOptions()
 * Facilita reutilización y mantenimiento centralizado
 */
export const FILTER_WHITELISTS = {
  estado: VALID_ESTADOS,
  tipoContrato: VALID_TIPOS,
  procedimiento: VALID_PROCEDIMIENTOS,
  tramitacion: VALID_TRAMITACIONES,
} as const;

/**
 * Configuración de órganos para filtros
 *
 * Parámetros de consulta para obtener órganos más activos
 */
export const ORGANOS_FILTER_CONFIG = {
  /** Cantidad de órganos a consultar antes de filtrar (limit) */
  FETCH_LIMIT: 50,
  /** Cantidad de órganos a retornar en respuesta (slice) */
  RETURN_LIMIT: 30,
  /** Nombre a excluir de resultados */
  EXCLUDE_NAME: 'Desconocido',
} as const;

/**
 * Configuración de paginación para búsquedas
 */
export const SEARCH_PAGINATION_CONFIG = {
  /** Página por defecto */
  DEFAULT_PAGE: 1,
  /** Resultados por página por defecto */
  DEFAULT_PAGE_SIZE: 20,
  /** Máximo de resultados permitidos por página */
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Campos de entidad con formato camelCase
 * Requieren escapado con comillas en QueryBuilder
 *
 * Ej: 'tipoContrato' → `"tipoContrato"` en SQL
 */
export const CAMEL_CASE_FIELDS = new Set<string>(['tipoContrato']);

/**
 * Etiquetas/descriptores para cada tipo de filtro
 * Útil para logs, errores y documentación automática
 */
export const FILTER_LABELS = {
  estado: 'Estado de licitación',
  tipoContrato: 'Tipo de contrato',
  procedimiento: 'Procedimiento',
  tramitacion: 'Tramitación',
  ccaa: 'Comunidad Autónoma',
  provincia: 'Provincia',
  cpv: 'Código CPV',
  importe: 'Importe',
  fecha: 'Fecha',
  organo: 'Órgano de contratación',
} as const;
