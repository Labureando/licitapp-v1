import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Search,
  Bell,
  Bookmark,
  BarChart3,
  Calendar,
  Settings,
} from 'lucide-react'
import type { OrbitalNavItem } from '@/components/ui/radial-orbital-nav'

/**
 * Hook que sustituye al antiguo HOME_MODULES estático.
 * Devuelve los 6 módulos del orbital con títulos/descripciones traducidos.
 *
 * Las stats siguen hardcoded por ahora (288K/39.9K, 3/12, etc.) — cuando
 * tengamos endpoints de stats, las metemos aquí con useQuery.
 */
export function useHomeModules(): OrbitalNavItem[] {
  const { t } = useTranslation('home')

  return useMemo<OrbitalNavItem[]>(
    () => [
      {
        id: 1,
        title: t('modules.buscador.title'),
        description: t('modules.buscador.description'),
        icon: Search,
        path: '/buscar',
        stats: [
          { value: '288K', label: t('modules.buscador.stats.total') },
          { value: '39.9K', label: t('modules.buscador.stats.open') },
        ],
      },
      {
        id: 2,
        title: t('modules.alertas.title'),
        description: t('modules.alertas.description'),
        icon: Bell,
        path: '/alertas',
        badge: 3,
        stats: [
          { value: '3', label: t('modules.alertas.stats.new') },
          { value: '12', label: t('modules.alertas.stats.active') },
        ],
      },
      {
        id: 3,
        title: t('modules.guardadas.title'),
        description: t('modules.guardadas.description'),
        icon: Bookmark,
        path: '/guardadas',
        stats: [{ value: '12', label: t('modules.guardadas.stats.saved') }],
      },
      {
        id: 4,
        title: t('modules.analytics.title'),
        description: t('modules.analytics.description'),
        icon: BarChart3,
        path: '/analytics',
      },
      {
        id: 5,
        title: t('modules.calendario.title'),
        description: t('modules.calendario.description'),
        icon: Calendar,
        path: '/calendario',
      },
      {
        id: 6,
        title: t('modules.ajustes.title'),
        description: t('modules.ajustes.description'),
        icon: Settings,
        path: '/ajustes',
      },
    ],
    [t]
  )
}