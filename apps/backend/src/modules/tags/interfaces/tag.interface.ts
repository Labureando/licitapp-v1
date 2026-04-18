/**
 * Resultado de búsqueda de etiquetas (autocomplete)
 */
export interface TagSearchResult {
  id: string;
  name: string;
  slug: string;
  category?: string;
  icon?: string;
  color?: string;
  isGlobal: boolean;
  usageCount: number;
  isSubscribed?: boolean;
}

/**
 * Etiqueta completa con información de suscripción del usuario
 */
export interface UserTag extends TagSearchResult {
  isPinned: boolean;
  subscribedAt?: Date;
}

/**
 * Opción de respuesta para crear etiqueta
 */
export interface CreateTagResponse {
  success: boolean;
  message: string;
  tag?: {
    id: string;
    name: string;
    slug: string;
    isGlobal: boolean;
  };
  error?: string;
}
