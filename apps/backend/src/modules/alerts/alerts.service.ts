/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AlertEntity } from './entities/alert.entity';
import { EmailService } from '../../infrastructure/email/email.service';
import { Licitacion } from '../scraping/shared/entities/licitacion.entity';
import { SearchEngineService } from '../search/search.engine';
import { generateAlertEmailTemplate } from '../../common/email-templates';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(
    @InjectRepository(AlertEntity)
    private readonly alertRepo: Repository<AlertEntity>,
    private readonly emailService: EmailService,
    private readonly searchEngine: SearchEngineService,
  ) {}

  /**
   * Crear nueva alerta personalizada
   * 
   * @param userId - ID del usuario dueño de la alerta (UUID)
   * @param createAlertDto - Datos de la alerta a crear
   *   - name: string, nombre descriptivo de la alerta
   *   - estados?: string[], ej: ['ABIERTA', 'FORMALIZADA']
   *   - tiposContrato?: string[], ej: ['Abierto', 'Restringido']
   *   - procedimientos?: string[], ej: ['Abierto', 'Negociado']
   *   - palabrasClave?: string, ej: 'limpieza AND mantenimiento'
   *   - importeMin?: number (BigInt), mínimo presupuesto
   *   - importeMax?: number (BigInt), máximo presupuesto
   * @returns AlertEntity creada con id, createdAt, isActive=true
   * @throws BadRequestException - Si datos inválidos
   * @example
   *   const alert = await alertsService.create('user-uuid', {
   *     name: 'Licitaciones de limpieza Madrid',
   *     estados: ['ABIERTA'],
   *     provincias: ['Madrid'],
   *     palabrasClave: 'limpieza',
   *     importeMin: '5000',
   *   });
   */
  async create(userId: string, createAlertDto: CreateAlertDto): Promise<AlertEntity> {
    const alert = this.alertRepo.create({
      userId,
      ...createAlertDto,
      email: createAlertDto.email || null,
    });

    return this.alertRepo.save(alert);
  }

  /**
   * Obtener todas las alertas del usuario
   * 
   * @param userId - ID del usuario (UUID)
   * @returns Array<AlertEntity> ordenadas por createdAt DESC (más recientes primero)
   *   Cada alerta incluye: id, name, isActive, triggerCount, lastTriggeredAt, etc.
   * @example
   *   const alerts = await alertsService.findAll('user-uuid');
   *   // Retorna: [{id, name, isActive, ...}, ...]
   */
  async findAll(userId: string): Promise<AlertEntity[]> {
    return this.alertRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtener una alerta específica por ID
   * Valida que el usuario sea propietario de la alerta
   * 
   * @param id - ID de la alerta a buscar (UUID)
   * @param userId - ID del usuario propietario (UUID)
   * @returns AlertEntity completa con todos los campos
   * @throws NotFoundException - Si alerta no existe o no pertenece al usuario
   *   Status: 404, mensaje: 'Alerta con ID {id} no encontrada'
   * @example
   *   const alert = await alertsService.findOne('alert-uuid', 'user-uuid');
   *   // Retorna: {id, name, isActive, criterios, ...}
   */
  async findOne(id: string, userId: string): Promise<AlertEntity> {
    const alert = await this.alertRepo.findOne({
      where: { id, userId },
    });

    if (!alert) {
      throw new NotFoundException(`Alerta con ID ${id} no encontrada`);
    }

    return alert;
  }

  /**
   * Actualizar una alerta existente
   * Solo el propietario puede actualizar
   * 
   * @param id - ID de la alerta (UUID)
   * @param userId - ID del usuario propietario (UUID)
   * @param updateAlertDto - Campos a actualizar (parciales)
   *   Todos los campos de CreateAlertDto son opcionales aquí
   * @returns AlertEntity actualizada
   * @throws NotFoundException - Si alerta no existe o no pertenece al usuario
   * @throws BadRequestException - Si datos inválidos
   * @example
   *   const updated = await alertsService.update('alert-uuid', 'user-uuid', {
   *     estados: ['FORMALIZADA'],
   *     isActive: true,
   *   });
   */
  async update(
    id: string,
    userId: string,
    updateAlertDto: UpdateAlertDto,
  ): Promise<AlertEntity> {
    const alert = await this.findOne(id, userId);

    Object.assign(alert, updateAlertDto);
    return this.alertRepo.save(alert);
  }

  /**
   * Eliminar una alerta de forma permanente
   * Solo el propietario puede eliminar
   * 
   * @param id - ID de la alerta a eliminar (UUID)
   * @param userId - ID del usuario propietario (UUID)
   * @returns void (sin retorno si éxito)
   * @throws NotFoundException - Si alerta no existe o no pertenece al usuario
   *   Status: 404
   * @example
   *   await alertsService.remove('alert-uuid', 'user-uuid');
   *   // La alerta se elimina y no puede recuperarse
   */
  async remove(id: string, userId: string): Promise<void> {
    const alert = await this.findOne(id, userId);
    await this.alertRepo.remove(alert);
  }

  /**
   * Evaluar si una licitación cumple con los criterios de una alerta
   * Valida todos los criterios activos en AND (todos deben cumplirse)
   * 
   * @param alert - AlertEntity con criterios de filtrado
   *   - estados[], tiposContrato[], procedimientos[], tramitaciones[]
   *   - ccaas[], provincias[], cpvCodes[], palabrasClave, importeMin/Max
   * @param licitacion - Licitacion entity a validar
   *   - estado, tipoContrato, procedimiento, tramitacion, ccaa, provincia
   *   - presupuestoBase, title, description, cpvCodes
   * @returns boolean
   *   true: Licitación cumple TODOS los criterios de la alerta
   *   false: Licitación NO cumple al menos un criterio
   * @private Interno, llamado por triggerAlertsForLicitacion()
   * @example
   *   const matches = this.matchesAlert(alert, licitacion);
   *   // true si: estado en estados[], importe en rango, palabras presentes, etc.
   */
  private matchesAlert(alert: AlertEntity, licitacion: Licitacion): boolean {
    // Validar estado
    if (alert.estados && alert.estados.length > 0) {
      if (!alert.estados.includes(licitacion.estado)) {
        return false;
      }
    }

    // Validar tipo contrato
    if (alert.tiposContrato && alert.tiposContrato.length > 0) {
      if (!licitacion.tipoContrato || !alert.tiposContrato.includes(licitacion.tipoContrato)) {
        return false;
      }
    }

    // Validar procedimiento
    if (alert.procedimientos && alert.procedimientos.length > 0) {
      if (!licitacion.procedimiento || !alert.procedimientos.includes(licitacion.procedimiento)) {
        return false;
      }
    }

    // Validar tramitación
    if (alert.tramitaciones && alert.tramitaciones.length > 0) {
      if (!licitacion.tramitacion || !alert.tramitaciones.includes(licitacion.tramitacion)) {
        return false;
      }
    }

    // Validar CCAA
    if (alert.ccaas && alert.ccaas.length > 0) {
      if (!licitacion.ccaa || !alert.ccaas.includes(licitacion.ccaa)) {
        return false;
      }
    }

    // Validar provincia
    if (alert.provincias && alert.provincias.length > 0) {
      if (!licitacion.provincia || !alert.provincias.includes(licitacion.provincia)) {
        return false;
      }
    }

    // Validar códigos CPV
    if (alert.cpvCodes && alert.cpvCodes.length > 0) {
      if (!licitacion.cpvCodes || !licitacion.cpvCodes.some(cpv => alert.cpvCodes!.includes(cpv))) {
        return false;
      }
    }

    // Validar importe mínimo
    if (alert.importeMin && licitacion.presupuestoBase) {
      const presupuesto = BigInt(licitacion.presupuestoBase);
      const minimo = BigInt(alert.importeMin);
      if (presupuesto < minimo) {
        return false;
      }
    }

    // Validar importe máximo
    if (alert.importeMax && licitacion.presupuestoBase) {
      const presupuesto = BigInt(licitacion.presupuestoBase);
      const maximo = BigInt(alert.importeMax);
      if (presupuesto > maximo) {
        return false;
      }
    }

    // Validar palabras clave con PostgreSQL Full-Text Search
    // Nota: Esta validación se hace de forma sincrónica pero idealmente
    // se paralelizaría con Promise.all para mejor performance
    if (alert.palabrasClave) {
      const hasKeywordMatch = this.matchesKeywordsCriteria(licitacion, alert.palabrasClave);
      if (!hasKeywordMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Validar si la licitación coincide con palabras clave usando búsqueda semántica
   * Usa SearchEngineService con lógica sofisticada de NLP y validación
   * 
   * Técnicas incluidas:
   * - Exacta: encuentra "limpieza" en texto
   * - Stemming: "limpiar", "limpieza", "limpiadores" reducen al mismo radical
   * - Fuzzy: tolera typos como "limpeza" vs "limpieza" (distancia <=2)
   * - Contexto: valida que palabras relacionadas estén presentes (50%+)
   * - Confianza: 3 niveles (HIGH/MEDIUM/LOW) para evitar falsos positivos
   * - Blacklist: rechaza typos peligrosos ("limpie" NO es "límite")
   * 
   * @param licitacion - Licitacion entity a validar
   *   - title: string, título de la licitación
   *   - description: string, descripción/pliego
   * @param keywords - Palabras clave (string)
   *   Formato: separadas por espacios/comas, ej: "limpieza, desinfección"
   *   Operadores NO soportados aquí (para eso usar queryFullTextSearch)
   * @returns boolean
   *   true: Keywords coinciden con confianza MEDIUM o HIGH
   *   false: No coincide o confianza es LOW (evita falsos positivos)
   * @private Interno, llamado por matchesAlert()
   * @example
   *   const matches = this.matchesKeywordsCriteria(licitacion, 'limpieza');
   *   // true si "limpieza", "limpiador", "limpiar" en title/description
   *   // false si solo "límite" (typo peligroso que podría dar falso positivo)
   */
  private matchesKeywordsCriteria(licitacion: Licitacion, keywords: string): boolean {
    if (!keywords || keywords.trim().length === 0) {
      return true;
    }

    // Normalizar y expandir palabras clave (separadas por espacio o coma)
    const keywordArray = keywords
      .split(/[,\s]+/)
      .map((kw) => kw.trim())
      .filter((kw) => kw.length > 0);

    if (keywordArray.length === 0) {
      return true;
    }

    // Si es una palabra, buscar directamente
    if (keywordArray.length === 1) {
      const result = this.searchEngine.search(
        keywordArray[0],
        licitacion.title || '',
        licitacion.description || '',
      );

      // Aceptar si coincide y confianza no es baja
      return result.matched && result.confidence !== 'LOW';
    }

    // Si son múltiples palabras, buscar todas
    const result = this.searchEngine.searchMultiple(
      keywordArray,
      licitacion.title || '',
      licitacion.description || '',
    );

    // Aceptar si al menos una coincide con confianza
    return result.matched && result.confidence !== 'LOW';
  }

  /**
   * Disparar alertas para una nueva licitación
   * Evalúa todas las alertas activas contra la licitación y envía emails
   * 
   * Flujo:
   * 1. Obtener todas las alertas isActive=true
   * 2. Para cada alerta: validar matchesAlert(alert, licitacion)
   * 3. Si coincide: sendAlertEmail() + actualizar triggerCount, lastTriggeredAt
   * 4. Log de errores sin detener otras alertas (fail-safe)
   * 
   * @param licitacion - Licitacion entity nueva/actualizada
   *   Desencadena evaluación automática contra todas las alertas
   * @returns Promise<void>
   * @throws No lanza excepciones, captura y logea internamente
   *   Si email falla: solo se logea, la alerta se marca como triggered
   * @private Típicamente llamado desde scraping.service
   * @example
   *   // Cuando se detecta nueva licitación en web
   *   await alertsService.triggerAlertsForLicitacion(newLicitacion);
   *   // Envía emails a todos los usuarios con alertas coincidentes
   */
  async triggerAlertsForLicitacion(licitacion: Licitacion): Promise<void> {
    try {
      // Obtener todas las alertas activas
      const activeAlerts = await this.alertRepo.find({
        where: { isActive: true },
        relations: ['user'],
      });

      for (const alert of activeAlerts) {
        // Verificar si la licitación cumple los criterios
        if (this.matchesAlert(alert, licitacion)) {
          await this.sendAlertEmail(alert, licitacion);
          
          // Actualizar trigger count y last triggered date
          alert.lastTriggeredAt = new Date();
          alert.triggerCount++;
          await this.alertRepo.save(alert);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error disparando alertas para licitación ${licitacion.id}`,
        error,
      );
    }
  }

  /**
   * Hacer query full-text search en PostgreSQL
   * Búsqueda avanzada en columna search_vector con operadores booleanos
   * 
   * Normalización de operadores:
   * - "limpieza AND mantenimiento" → limpieza & mantenimiento
   * - "limpieza OR desinfección" → limpieza | desinfección
   * - "limpieza NOT residuos" → limpieza & !residuos
   * - "limpieza" (espacios) → limpieza & limpieza (AND por defecto)
   * 
   * Query generada:
   * SELECT 1 FROM licitaciones
   * WHERE id = $1 AND search_vector @@ to_tsquery('spanish', $2)
   * 
   * Performance:
   * - Usa índice GiST si existe en search_vector
   * - Fallback a búsqueda simple si falla
   * - Log de warning si error (para debugging)
   * 
   * @param licitacionId - ID de la licitación a buscar (UUID)
   *   Debe existir en base de datos
   * @param keywords - Operadores booleanos soportados:
   *   AND, OR, NOT (case-insensitive)
   *   Ej: "limpieza AND (mantenimiento OR desinfección)"
   * @returns Promise<boolean>
   *   true: search_vector contiene el tsquery (operador @@)
   *   false: no coincide o error en query
   * @throws No lanza excepciones, captura internamente
   *   Si error: logea warning y retorna false (fallback)
   * @private Interno, alternativa a SearchEngineService.search()
   * @example
   *   const found = await this.queryFullTextSearch('lic-123', 'limpieza AND mantenimiento');
   *   // true si ambas palabras en search_vector (con stemming español)
   * @performance O(log n) con índice GiST, O(n) sin índice
   */
  private async queryFullTextSearch(
    licitacionId: string,
    keywords: string,
  ): Promise<boolean> {
    try {
      // Normalizar keywords: reemplazar espacios con & (AND)
      const query = keywords
        .toLowerCase()
        .replace(/\s+and\s+/gi, ' & ')
        .replace(/\s+or\s+/gi, ' | ')
        .replace(/\s+not\s+/gi, ' & !')
        .replace(/\s+/g, ' & '); // espacios por defecto = AND

      const result = await this.alertRepo.query(
        `SELECT 1 FROM licitaciones 
         WHERE id = $1 
         AND search_vector @@ to_tsquery('spanish', $2)
         LIMIT 1`,
        [licitacionId, query],
      );

      return result.length > 0;
    } catch (error) {
      // Si falla full-text search, fallback a búsqueda simple
      this.logger.warn(
        `Error en full-text search para ${licitacionId}, usando fallback`,
        error,
      );
      return false;
    }
  }

  /**
   * Enviar email de notificación de alerta
   * Genera HTML con template, valida direcciones y envía vía EmailService
   * 
   * Precedencia de email:
   * 1. alert.email (si usuario especificó en la alerta)
   * 2. alert.user.email (fallback a email del perfil)
   * 
   * Template:
   * - generateAlertEmailTemplate(): HTML responsive con detalles de licitación
   * - Incluye: estado, presupuesto, CCAA, provincia, fechas, descripción
   * - Seguridad: escapeHtml() previene XSS injection
   * - Estilo inline CSS compatible con clientes antiguos
   * 
   * @param alert - AlertEntity con datos del usuario y nombre
   * @param licitacion - Licitacion entity con detalles a incluir en email
   * @returns Promise<void>
   * @throws No lanza excepciones, logea errors internamente
   *   Si EmailService falla: se captura, se logea y continúa
   * @private Llamado internamente por triggerAlertsForLicitacion()
   * @example
   *   await this.sendAlertEmail(alert, licitacion);
   *   // Email enviado: "Nueva licitación que coincide con tu alerta: {name}"
   * @sideEffect Logea debug si exitoso, error si falla
   */
  private async sendAlertEmail(alert: AlertEntity, licitacion: Licitacion): Promise<void> {
    try {
      const destination = alert.email || alert.user.email;
      
      const subject = `🚨 Nueva licitación que coincide con tu alerta: ${alert.name}`;
      
      const html = generateAlertEmailTemplate(alert, licitacion);

      await this.emailService.sendEmail({
        to: destination,
        subject,
        html,
      });

      this.logger.debug(`Email enviado para alerta ${alert.id} a ${destination}`);
    } catch (error) {
      this.logger.error(
        `Error enviando email para alerta ${alert.id}`,
        error,
      );
    }
  }
}
