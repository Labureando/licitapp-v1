/**
 * Categorías de etiquetas predefinidas
 * Sirven para organizar las etiquetas globales del marketplace
 */
export const TAG_CATEGORIES = {
  INFRASTRUCTURE: {
    id: 'infraestructura',
    name: 'Infraestructura',
    icon: 'building',
    color: '#FF6B6B',
    tags: [
      {
        name: 'Construcción',
        slug: 'construccion',
        keywords: ['construcción', 'edificios', 'obra', 'arquitectura', 'construcciones'],
        icon: 'hammer',
      },
      {
        name: 'Mantenimiento',
        slug: 'mantenimiento',
        keywords: ['mantenimiento', 'reparación', 'conservación', 'mejora', 'obra menor'],
        icon: 'wrench',
      },
      {
        name: 'Ingeniería',
        slug: 'ingenieria',
        keywords: ['ingeniería', 'proyectos', 'diseño', 'cálculo', 'estructuras'],
        icon: 'cog',
      },
    ],
  },

  SERVICES: {
    id: 'servicios',
    name: 'Servicios',
    icon: 'briefcase',
    color: '#4ECDC4',
    tags: [
      {
        name: 'Limpieza',
        slug: 'limpieza',
        keywords: ['limpieza', 'higiene', 'desinfección', 'sanitario', 'aseo'],
        icon: 'broom',
      },
      {
        name: 'Seguridad',
        slug: 'seguridad',
        keywords: ['seguridad', 'vigilancia', 'protección', 'guardería', 'control'],
        icon: 'shield',
      },
      {
        name: 'Logística',
        slug: 'logistica',
        keywords: ['logística', 'transporte', 'distribución', 'envío', 'almacenamiento'],
        icon: 'truck',
      },
    ],
  },

  TECHNOLOGY: {
    id: 'tecnologia',
    name: 'Tecnología',
    icon: 'laptop',
    color: '#5A7CFA',
    tags: [
      {
        name: 'TIC',
        slug: 'tic',
        keywords: ['tic', 'tecnología', 'informática', 'it', 'sistemas'],
        icon: 'code',
      },
      {
        name: 'Telecomunicaciones',
        slug: 'telecomunicaciones',
        keywords: ['telecomunicaciones', 'telecom', 'red', 'internet', 'conectividad'],
        icon: 'wifi',
      },
      {
        name: 'Software',
        slug: 'software',
        keywords: ['software', 'desarrollo', 'programación', 'aplicación', 'sistema'],
        icon: 'code-bracket',
      },
    ],
  },

  EDUCATION: {
    id: 'educacion',
    name: 'Educación',
    icon: 'book',
    color: '#FFA94D',
    tags: [
      {
        name: 'Educación',
        slug: 'educacion',
        keywords: ['educación', 'docencia', 'enseñanza', 'formación', 'pedagogía'],
        icon: 'graduation-cap',
      },
      {
        name: 'Capacitación',
        slug: 'capacitacion',
        keywords: ['capacitación', 'entrenamiento', 'adiestramiento', 'taller', 'curso'],
        icon: 'presentation',
      },
    ],
  },

  HEALTH: {
    id: 'salud',
    name: 'Salud',
    icon: 'heart',
    color: '#FF6B9D',
    tags: [
      {
        name: 'Sanidad',
        slug: 'sanidad',
        keywords: ['sanidad', 'salud', 'médico', 'hospitalario', 'sanitario'],
        icon: 'stethoscope',
      },
      {
        name: 'Farmacia',
        slug: 'farmacia',
        keywords: ['farmacia', 'medicamentos', 'farmacéutico', 'droguería'],
        icon: 'pill',
      },
    ],
  },

  TRANSPORT: {
    id: 'transporte',
    name: 'Transporte',
    icon: 'truck',
    color: '#845EF7',
    tags: [
      {
        name: 'Transporte',
        slug: 'transporte',
        keywords: ['transporte', 'movilidad', 'vehículos', 'flota', 'automóvil'],
        icon: 'truck',
      },
      {
        name: 'Tráfico',
        slug: 'trafico',
        keywords: ['tráfico', 'vías', 'movilidad urbana', 'circulación', 'carreteras'],
        icon: 'road',
      },
    ],
  },

  ENVIRONMENT: {
    id: 'medio-ambiente',
    name: 'Medio Ambiente',
    icon: 'leaf',
    color: '#51CF66',
    tags: [
      {
        name: 'Sostenibilidad',
        slug: 'sostenibilidad',
        keywords: ['sostenibilidad', 'medio ambiente', 'ecología', 'verde', 'sustentable'],
        icon: 'leaf',
      },
      {
        name: 'Energía',
        slug: 'energia',
        keywords: ['energía', 'renovable', 'solar', 'eólica', 'eficiencia'],
        icon: 'zap',
      },
    ],
  },

  ADMINISTRATION: {
    id: 'administracion',
    name: 'Administración',
    icon: 'briefcase',
    color: '#748FFC',
    tags: [
      {
        name: 'Recursos Humanos',
        slug: 'recursos-humanos',
        keywords: ['recursos humanos', 'rrhh', 'personal', 'nómina', 'gestión'],
        icon: 'users',
      },
      {
        name: 'Contabilidad',
        slug: 'contabilidad',
        keywords: ['contabilidad', 'auditoría', 'contable', 'financiero', 'fiscal'],
        icon: 'calculator',
      },
    ],
  },
} as const;

/**
 * Obtener todas las etiquetas globales predefinidas
 */
export function getAllPredefinedTags() {
  const tags: any[] = [];

  Object.values(TAG_CATEGORIES).forEach((category) => {
    category.tags.forEach((tag) => {
      tags.push({
        name: tag.name,
        slug: tag.slug,
        description: `${category.name} - ${tag.name}`,
        category: category.id,
        keywords: tag.keywords,
        icon: tag.icon,
        color: category.color,
        isGlobal: true,
        userId: null,
      });
    });
  });

  return tags;
}

/**
 * Obtener categoría por ID
 */
export function getCategoryById(categoryId: string) {
  return Object.values(TAG_CATEGORIES).find((cat) => cat.id === categoryId);
}

/**
 * Obtener todas las categorías
 */
export function getAllCategories() {
  return Object.values(TAG_CATEGORIES).map((cat) => ({
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    color: cat.color,
    tagCount: cat.tags.length,
  }));
}
