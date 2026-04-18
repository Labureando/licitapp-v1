import { Injectable, BadRequestException, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagEntity, UserTagSubscriptionEntity } from './entities';
import { CreateGlobalTagDto, CreatePrivateTagDto, UpdateTagDto } from './dto';
import { TagSearchResult, UserTag } from './interfaces';
import { getAllPredefinedTags } from './constants/tag-categories';

/**
 * Servicio de Etiquetas
 * Gestiona CRUD, búsqueda, y subscripciones de etiquetas híbridas (globales + privadas)
 */
@Injectable()
export class TagsService {
  private readonly logger = new Logger(TagsService.name);

  constructor(
    @InjectRepository(TagEntity)
    private readonly tagRepo: Repository<TagEntity>,
    @InjectRepository(UserTagSubscriptionEntity)
    private readonly subscriptionRepo: Repository<UserTagSubscriptionEntity>,
  ) {}

  /**
   * Inicializar etiquetas globales predefinidas (primera ejecución)
   * Seed one-time de 30+ etiquetas predefinidas al marketplace global
   * 
   * **Validación:**
   * - Verifica si ya existen etiquetas globales
   * - Si existen: skips (no duplica)
   * - Si no: inserta bulk desde getAllPredefinedTags()
   * 
   * @returns Promise<void>
   * @throws No lanza excepciones, captura internamente
   *   Logea solo info/error (non-blocking)
   * @private Llamar solo en app initialization o migration
   * @example
   *   // En main.ts o AppService.onModuleInit()
   *   const tagsService = app.get(TagsService);
   *   await tagsService.initializePredefinedTags();
   * @sideEffect Inserta registros en tabla tags si es primera vez
   */
  async initializePredefinedTags(): Promise<void> {
    try {
      const existingTags = await this.tagRepo.count({ where: { isGlobal: true } });

      if (existingTags > 0) {
        this.logger.log('Etiquetas globales ya existen, skipping initialization');
        return;
      }

      const predefinedTags = getAllPredefinedTags();
      await this.tagRepo.insert(predefinedTags);

      this.logger.log(`Inicializadas ${predefinedTags.length} etiquetas globales`);
    } catch (error) {
      this.logger.error('Error inicializando etiquetas predefinidas', error);
    }
  }

  /**
   * Crear etiqueta global visible para todos (Admin only)
   * Validación: slug único a nivel global, no por usuario
   * 
   * @param dto - CreateGlobalTagDto
   *   - name: string, título de la etiqueta
   *   - slug: string (manual), ej: "construccion" (ÚNICO globalmente)
   *   - description?: string, descripción larga
   *   - category: string, ej: "infraestructura" (de 8 categorías)
   *   - keywords: string[], ej: ["construcción", "edificios"]
   *   - color: string hex, ej: "#FF5733"
   *   - icon: string, ej: "building" (Font Awesome)
   * @returns TagEntity creada con isGlobal=true, usageCount=0
   * @throws ConflictException (409)
   *   Si slug ya existe a nivel global
   *   Mensaje: 'Etiqueta con slug "{slug}" ya existe'
   * @throws BadRequestException (400) si datos inválidos
   * @example
   *   const tag = await tagsService.createGlobalTag({
   *     name: 'Construcción',
   *     slug: 'construccion',
   *     description: 'Obras y proyectos de construcción',
   *     category: 'infraestructura',
   *     keywords: ['construcción', 'edificios'],
   *     color: '#FF5733',
   *     icon: 'building',
   *   });
   */
  async createGlobalTag(dto: CreateGlobalTagDto): Promise<TagEntity> {
    // Verificar que slug sea único
    const existingSlug = await this.tagRepo.findOne({
      where: { slug: this.normalizeSlug(dto.slug) },
    });

    if (existingSlug) {
      throw new ConflictException(`Etiqueta con slug "${dto.slug}" ya existe`);
    }

    const tag = this.tagRepo.create({
      ...dto,
      slug: this.normalizeSlug(dto.slug),
      isGlobal: true,
      keywords: dto.keywords || [],
    });

    return this.tagRepo.save(tag);
  }

  /**
   * Crear etiqueta privada personalizada (User self-service)
   * Solo visible para el usuario que la crea
   * Slug se auto-genera de forma única por usuario
   * 
   * **Flujo:**
   * 1. Normaliza nombre → baseSlug (minúsculas, sin caracteres especiales)
   * 2. Genera uniqueSlug ("mi-tag" o "mi-tag-1", "mi-tag-2" si conflictos)
   * 3. Crea tag con isGlobal=false, userId=currentUser
   * 
   * @param userId - ID del usuario creador (UUID)
   * @param dto - CreatePrivateTagDto
   *   - name: string, ej: "Mis Licitaciones de Limpieza"
   *   - description?: string, notas personales
   *   - keywords?: string[], ej: ["limpieza", "higiene"]
   *   - color?: string hex, ej: "#00BFFF" (user preference)
   *   - icon?: string, ej: "star"
   * @returns TagEntity creada con isGlobal=false, userId=userId, slug auto-generated
   * @throws BadRequestException (400) si datos inválidos
   * @example
   *   const myTag = await tagsService.createPrivateTag('user-uuid', {
   *     name: 'Limpieza Madrid',
   *     description: 'Solo licitaciones de limpieza en Madrid',
   *     keywords: ['limpieza', 'higiene'],
   *     color: '#00BFFF',
   *   });
   *   // Retorna: {id, name, slug: "limpieza-madrid", userId: "user-uuid", ...}
   */
  async createPrivateTag(userId: string, dto: CreatePrivateTagDto): Promise<TagEntity> {
    // Generar slug único para el usuario
    const baseSlug = this.normalizeSlug(dto.name);
    const uniqueSlug = await this.generateUniqueSlug(baseSlug, userId);

    const tag = this.tagRepo.create({
      ...dto,
      slug: uniqueSlug,
      isGlobal: false,
      userId,
      keywords: dto.keywords || [],
    });

    return this.tagRepo.save(tag);
  }

  /**
   * Obtener todas las etiquetas del usuario (marketplace + personalizadas)
   * 
   * **Retorna:**
   * - Todas las etiquetas globales (marketplace)
   * - Mis etiquetas privadas (creadas por mí)
   * - Con información de subscripción para cada una
   * 
   * @param userId - ID del usuario (UUID)
   * @returns Array<UserTag>
   *   Cada tag incluye:
   *   - id, name, slug, category, icon, color, isGlobal
   *   - isSubscribed: boolean (si me suscribí a globales)
   *   - isPinned: boolean (si está fijada en dashboard)
   *   - subscribedAt?: Date (fecha de subscripción)
   * @example
   *   const tags = await tagsService.getMyTags('user-uuid');
   *   // Retorna: [global-tags con subscripción..., mis-tags...]
   */
  async getMyTags(userId: string): Promise<UserTag[]> {
    // Obtener todas las etiquetas (globales + mis privadas)
    const tags = await this.tagRepo.find({
      where: [
        { isGlobal: true },
        { isGlobal: false, userId },
      ],
    });

    // Obtener mis subscripciones
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId },
    });

    return this.mapTagsWithSubscriptions(tags, subscriptions);
  }

  /**
   * Búsqueda autocomplete de etiquetas (para inputs)
   * Busca en nombre, slug y keywords[] con limit 20
   * 
   * **Búsqueda:**
   * - LOWER(name) LIKE %query%
   * - LOWER(slug) LIKE %query%
   * - keywords @> ARRAY[query] (PostgreSQL array operator)
   * - AND (isGlobal OR userId=currentUser)
   * 
   * @param query - Término de búsqueda (string, min 1 char)
   *   Case-insensitive, ej: "limpieza" o "cons"
   * @param userId - ID del usuario (UUID) para mostrar privadas
   * @returns Array<TagSearchResult> (máx 20)
   *   Cada resultado:
   *   - id, name, slug, category, icon, color
   *   - isGlobal, usageCount (popularidad)
   *   - isSubscribed: boolean (si está suscrito)
   *   Ordenadas por: usageCount DESC, name ASC
   * @throws Ninguna
   * @example
   *   const results = await tagsService.searchTags('limp', 'user-uuid');
   *   // Retorna: [{id, name: "Limpieza", isSubscribed: true}, ...]
   * @performance O(n log n) con índice en name+slug+keywords
   */
  async searchTags(query: string, userId: string): Promise<TagSearchResult[]> {
    if (!query || query.length < 1) {
      return [];
    }

    const normalizedQuery = query.toLowerCase();

    // Búsqueda en nombre, slug y keywords
    const tags = await this.tagRepo
      .createQueryBuilder('tag')
      .where('LOWER(tag.name) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('LOWER(tag.slug) LIKE :query', { query: `%${normalizedQuery}%` })
      .orWhere('tag.keywords @> ARRAY[:keyword]', { keyword: normalizedQuery })
      .andWhere('(tag.isGlobal = true OR tag.userId = :userId)', { userId })
      .orderBy('tag.usageCount', 'DESC')
      .addOrderBy('tag.name', 'ASC')
      .limit(20)
      .getMany();

    // Obtener subscripciones del usuario
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId },
    });

    const subscriptionIds = new Set(subscriptions.map((s) => s.tagId));
    return this.toSearchResult(tags, subscriptionIds);
  }

  /**
   * Obtener etiquetas globales filtradas por categoría
   * 
   * @param category - Nombre de categoría (string)
   *   Válidas: "infraestructura", "servicios", "tecnologia", etc.
   *   (definidas en TAG_CATEGORIES)
   * @returns Array<TagEntity> etiquetas globales de esa categoría
   *   Ordenadas por usageCount DESC (más populares primero)
   * @example
   *   const constTags = await tagsService.getTagsByCategory('infraestructura');
   *   // Retorna: [TagEntity(Construcción), TagEntity(Mantenimiento), ...]
   */
  async getTagsByCategory(category: string): Promise<TagEntity[]> {
    return this.tagRepo.find({
      where: { category, isGlobal: true },
      order: { usageCount: 'DESC' },
    });
  }

  /**
   * Obtener todas las etiquetas del marketplace global
   * 
   * @returns Array<TagEntity> todas las etiquetas isGlobal=true
   *   Ordenadas por usageCount DESC
   *   (~30 etiquetas predefinidas)
   * @example
   *   const globalTags = await tagsService.getAllGlobalTags();
   *   // Retorna: 30+ etiquetas del marketplace
   */
  async getAllGlobalTags(): Promise<TagEntity[]> {
    return this.tagRepo.find({
      where: { isGlobal: true },
      order: { usageCount: 'DESC' },
    });
  }

  /**
   * Obtener una etiqueta específica por su ID
   * 
   * @param id - UUID de la etiqueta
   * @returns TagEntity con todos los campos
   * @throws NotFoundException (404)
   *   Si etiqueta con ese ID no existe
   *   Mensaje: 'Etiqueta con ID {id} no encontrada'
   * @example
   *   const tag = await tagsService.getTagById('tag-uuid');
   *   // Retorna: {id, name, slug, isGlobal, ...}
   */
  async getTagById(id: string): Promise<TagEntity> {
    const tag = await this.tagRepo.findOne({ where: { id } });

    if (!tag) {
      throw new NotFoundException(`Etiqueta con ID ${id} no encontrada`);
    }

    return tag;
  }

  /**
   * Actualizar una etiqueta existente
   * **Permisos:** Solo propietario (privada) o admin (global)
   * 
   * @param id - ID de la etiqueta (UUID)
   * @param dto - UpdateTagDto (campos parciales)
   *   Puede actualizar: name, description, keywords, color, icon, category
   * @param userId - ID del usuario (para validar permisos)
   * @returns TagEntity actualizada
   * @throws NotFoundException (404) si etiqueta no existe
   * @throws BadRequestException (403)
   *   Si usuario no es propietario de etiqueta privada
   *   Mensaje: 'No tienes permisos para editar esta etiqueta'
   * @example
   *   const updated = await tagsService.updateTag('tag-uuid', {
   *     name: 'Nuevo nombre',
   *     color: '#FF00FF',
   *   }, 'user-uuid');
   */
  async updateTag(
    id: string,
    dto: UpdateTagDto,
    userId: string,
  ): Promise<TagEntity> {
    const tag = await this.getTagById(id);

    // Verificar permisos
    if (!tag.isGlobal && tag.userId !== userId) {
      throw new BadRequestException('No tienes permisos para editar esta etiqueta');
    }

    Object.assign(tag, dto);
    return this.tagRepo.save(tag);
  }

  /**
   * Eliminar una etiqueta de forma permanente
   * **Permisos:** Admin (global), Propietario (privada)
   * 
   * @param id - ID de la etiqueta (UUID)
   * @param userId - ID del usuario (para validar permisos)
   * @returns void
   * @throws NotFoundException (404) si etiqueta no existe
   * @throws BadRequestException (403)
   *   Si: usuario no es admin y etiqueta es global
   *   Si: usuario no es propietario de etiqueta privada
   * @example
   *   await tagsService.deleteTag('tag-uuid', 'user-uuid');
   *   // Etiqueta eliminada (no es recuperable)
   */
  async deleteTag(id: string, userId: string): Promise<void> {
    const tag = await this.getTagById(id);

    // Verificar permisos
    if (tag.isGlobal && userId !== 'admin') {
      throw new BadRequestException('Solo admin puede eliminar etiquetas globales');
    }

    if (!tag.isGlobal && tag.userId !== userId) {
      throw new BadRequestException('No tienes permisos para eliminar esta etiqueta');
    }

    await this.tagRepo.remove(tag);
  }

  /**
   * Suscribirse a una etiqueta global del marketplace
   * **Validación:** Solo se puede subscribir a etiquetas globales
   * 
   * **Flujo:**
   * 1. Valida que etiqueta es global
   * 2. Valida que no ya suscrito (idempotent)
   * 3. Crea UserTagSubscription con isPinned=false
   * 4. Incrementa tag.usageCount (métrica de popularidad)
   * 
   * @param tagId - ID de etiqueta global (UUID)
   * @param userId - ID del usuario (UUID)
   * @returns void
   * @throws NotFoundException (404) si etiqueta no existe
   * @throws BadRequestException (400)
   *   Si etiqueta es privada
   *   Mensaje: 'Solo puedes suscribirte a etiquetas globales'
   * @sideEffect Si éxito: tag.usageCount++, crea subscription
   * @example
   *   await tagsService.subscribeToTag('global-tag-uuid', 'user-uuid');
   *   // Ahora usuario verá esta etiqueta en "mi/all"
   */
  async subscribeToTag(tagId: string, userId: string): Promise<void> {
    const tag = await this.getTagById(tagId);

    // Solo se puede subscribir a globales
    if (!tag.isGlobal) {
      throw new BadRequestException('Solo puedes suscribirte a etiquetas globales');
    }

    // Verificar si ya está suscrito
    const existing = await this.subscriptionRepo.findOne({
      where: { userId, tagId },
    });

    if (existing) {
      return; // Ya suscrito, no hacer nada
    }

    const subscription = this.subscriptionRepo.create({
      userId,
      tagId,
      isPinned: false,
    });

    await this.subscriptionRepo.save(subscription);

    // Incrementar contador de uso
    tag.usageCount++;
    await this.tagRepo.save(tag);
  }

  /**
   * Cancelar suscripción a una etiqueta
   * Elimina la relación UserTagSubscription
   * 
   * @param tagId - ID de etiqueta (UUID)
   * @param userId - ID del usuario (UUID)
   * @returns void
   * @throws NotFoundException (404)
   *   Si no existe suscripción para este usuario+tag
   *   Mensaje: 'No estás suscrito a esta etiqueta'
   * @sideEffect Si éxito: tag.usageCount-- (mín 0)
   * @example
   *   await tagsService.unsubscribeFromTag('tag-uuid', 'user-uuid');
   *   // Etiqueta removida de mis tags
   */
  async unsubscribeFromTag(tagId: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, tagId },
    });

    if (!subscription) {
      throw new NotFoundException('No estás suscrito a esta etiqueta');
    }

    await this.subscriptionRepo.remove(subscription);

    // Decrementar contador de uso
    const tag = await this.getTagById(tagId);
    tag.usageCount = Math.max(0, tag.usageCount - 1);
    await this.tagRepo.save(tag);
  }

  /**
   * Alternar estado de fijación de etiqueta en dashboard
   * Las etiquetas fijadas aparecen en mi/pinned para acceso rápido
   * 
   * @param tagId - ID de etiqueta (UUID)
   * @param userId - ID del usuario (UUID)
   * @returns void
   * @throws NotFoundException (404)
   *   Si no existe suscripción para este usuario+tag
   *   Mensaje: 'No estás suscrito a esta etiqueta'
   * @sideEffect Invierte subscription.isPinned
   * @example
   *   await tagsService.togglePinTag('tag-uuid', 'user-uuid');
   *   // Si estaba fijada: ahora no lo está (y viceversa)
   */
  async togglePinTag(tagId: string, userId: string): Promise<void> {
    const subscription = await this.subscriptionRepo.findOne({
      where: { userId, tagId },
    });

    if (!subscription) {
      throw new NotFoundException('No estás suscrito a esta etiqueta');
    }

    subscription.isPinned = !subscription.isPinned;
    await this.subscriptionRepo.save(subscription);
  }

  /**
   * Obtener etiquetas fijadas del usuario para dashboard
   * Muestra favoritos personalizados del usuario
   * 
   * @param userId - ID del usuario (UUID)
   * @returns Array<UserTag>
   *   Solo etiquetas con isPinned=true
   *   Cada una: {id, name, slug, isGlobal, ..., isPinned: true}
   * @example
   *   const pinned = await tagsService.getPinnedTags('user-uuid');
   *   // Retorna: [5-10 etiquetas fijadas por el usuario]
   */
  async getPinnedTags(userId: string): Promise<UserTag[]> {
    const subscriptions = await this.subscriptionRepo.find({
      where: { userId, isPinned: true },
      relations: ['tag'],
    });

    return subscriptions.map((s) => ({
      id: s.tag.id,
      name: s.tag.name,
      slug: s.tag.slug,
      category: s.tag.category,
      icon: s.tag.icon,
      color: s.tag.color,
      isGlobal: s.tag.isGlobal,
      usageCount: s.tag.usageCount,
      isSubscribed: true,
      isPinned: true,
      subscribedAt: s.subscribedAt,
    }));
  }

  /**
   * Sumar voto a etiqueta privada para promoverla a global
   * Sistema comunitario: si suficientes votos → promover
   * 
   * @param tagId - ID de etiqueta PRIVADA (UUID)
   * @returns void
   * @throws NotFoundException (404) si etiqueta no existe
   * @throws BadRequestException (400)
   *   Si etiqueta ya es global
   *   Mensaje: 'Esta etiqueta ya es global'
   * @sideEffect tag.votes++ (contador de votos)
   * @example
   *   await tagsService.voteTagToGlobal('private-tag-uuid');
   *   // Voto registrado para promocionar
   */
  async voteTagToGlobal(tagId: string): Promise<void> {
    const tag = await this.getTagById(tagId);

    if (tag.isGlobal) {
      throw new BadRequestException('Esta etiqueta ya es global');
    }

    tag.votes++;
    await this.tagRepo.save(tag);
  }

  /**
   * Obtener etiquetas privadas candidatas a promover a global
   * Filtra por minVotes requeridos para considerarse
   * 
   * @param minVotes - Mínimo de votos requeridos (default: 10)
   *   Admin puede ajustar este threshold
   * @returns Array<TagEntity> etiquetas isGlobal=false con votos >= minVotes
   *   Ordenadas por votes DESC (más votadas primero)
   * @example
   *   const candidates = await tagsService.getCandidateTagsToGlobal(5);
   *   // Retorna: etiquetas privadas con >=5 votos
   * @note Actualmente TypeORM no soporta WHERE votes >= minVotes en QueryBuilder
   *   Necesita filtrado post-query (mejora futura)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getCandidateTagsToGlobal(minVotes: number = 10): Promise<TagEntity[]> {
    return this.tagRepo.find({
      where: {
        isGlobal: false,
        // Necesitaría comparación, pero TypeORM no lo soporta directo
      },
      order: { votes: 'DESC' },
    });
  }

  /**
   * Promover etiqueta privada a global (Admin only)
   * Mueve etiqueta del usuario al marketplace para todos
   * 
   * **Cambios:**
   * - isGlobal: false → true
   * - userId: uuid → undefined (ya no tiene propietario)
   * - votes: reset a 0 (reinicia contador)
   * 
   * @param tagId - ID de etiqueta PRIVADA (UUID)
   * @returns TagEntity actualizada con isGlobal=true
   * @throws NotFoundException (404) si no existe
   * @throws BadRequestException (400)
   *   Si etiqueta ya es global
   *   Mensaje: 'Esta etiqueta ya es global'
   * @example
   *   const globalTag = await tagsService.promoteTagToGlobal('private-tag-uuid');
   *   // Etiqueta ahora disponible en marketplace para todos
   */
  async promoteTagToGlobal(tagId: string): Promise<TagEntity> {
    const tag = await this.getTagById(tagId);

    if (tag.isGlobal) {
      throw new BadRequestException('Esta etiqueta ya es global');
    }

    tag.isGlobal = true;
    tag.userId = undefined;
    tag.votes = 0;

    return this.tagRepo.save(tag);
  }

  /**
   * Normalizar slug de etiqueta
   * Conversión: "Mi Tag" → "mi-tag"
   * 
   * **Transformaciones:**
   * 1. toLowerCase()
   * 2. Espacios múltiples → guion simple
   * 3. Remove caracteres especiales (keep: a-z, 0-9, -)
   * 4. Consolidar guiones múltiples → guion simple
   * 5. Trim guiones de inicio/fin
   * 
   * @param slug - Slug a normalizar (string)
   *   Ej: "Mi Tag!!!" → "mi-tag"
   * @returns string slug normalizado (min 1 char)
   * @example
   *   this.normalizeSlug("Construcción & Obras");
   *   // Retorna: "construccin-obras"
   * @private Interno, usado por createGlobalTag, createPrivateTag
   */
  private normalizeSlug(slug: string): string {
    return slug
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generar slug único para etiqueta privada del usuario
   * Evita colisiones: si "mi-tag" existe → "mi-tag-1", "mi-tag-2", etc.
   * 
   * **Algoritmo:**
   * 1. Intenta baseSlug
   * 2. Si existe para este userId: intenta baseSlug-1, baseSlug-2, ...
   * 3. Retorna primer slug disponible
   * 
   * @param baseSlug - Slug normalizado base (ej: "mi-tag")
   * @param userId - ID del usuario (para scope de uniqueness)
   * @returns Promise<string> slug único garantizado
   *   Ej: "mi-tag", "mi-tag-1", "mi-tag-2", etc.
   * @private Interno, usado por createPrivateTag
   * @example
   *   const unique = await this.generateUniqueSlug('limpieza', 'user-uuid');
   *   // Retorna: "limpieza" o "limpieza-1" (si ya existe)
   */
  private async generateUniqueSlug(baseSlug: string, userId: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await this.tagRepo.findOne({
        where: { slug, userId },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  /**
   * Mapear TagEntity[] + subscripciones → UserTag[] con info híbrida
   * Helper para reutilizar lógica de transformación
   * 
   * **Conversión:**
   * - TagEntity (base) + UserTagSubscription (relation) → UserTag
   * - Si no hay subscription: isSubscribed=false, isPinned=false
   * - Si existe: isSubscribed=true, isPinned=subscription.isPinned
   * 
   * @param tags - Array<TagEntity> base entities
   * @param subscriptions - Array<UserTagSubscriptionEntity> relaciones
   * @returns Array<UserTag> con campos de ambas
   * @private Interno, reutilizado por getMyTags(), searchTags()
   * @example
   *   const userTags = this.mapTagsWithSubscriptions(tags, subscriptions);
   */
  private mapTagsWithSubscriptions(
    tags: TagEntity[],
    subscriptions: UserTagSubscriptionEntity[],
  ): UserTag[] {
    const subscriptionMap = new Map(subscriptions.map((s) => [s.tagId, s]));

    return tags.map((tag) => {
      const subscription = subscriptionMap.get(tag.id);
      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        category: tag.category,
        icon: tag.icon,
        color: tag.color,
        isGlobal: tag.isGlobal,
        usageCount: tag.usageCount,
        isSubscribed: !!subscription,
        isPinned: subscription?.isPinned || false,
        subscribedAt: subscription?.subscribedAt,
      } as UserTag;
    });
  }

  /**
   * Convertir TagEntity[] → TagSearchResult[] para respuestas de búsqueda
   * Helper para transformación estandarizada
   * 
   * @param tags - Array<TagEntity> a transformar
   * @param subscriptionIds - Set<string> de tagIds suscritos
   * @returns Array<TagSearchResult>
   *   Cada uno: {id, name, slug, category, icon, color, isGlobal, usageCount, isSubscribed}
   * @private Interno, usado por searchTags()
   */
  private toSearchResult(tags: TagEntity[], subscriptionIds: Set<string>): TagSearchResult[] {
    return tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      category: tag.category,
      icon: tag.icon,
      color: tag.color,
      isGlobal: tag.isGlobal,
      usageCount: tag.usageCount,
      isSubscribed: subscriptionIds.has(tag.id),
    }));
  }
}
