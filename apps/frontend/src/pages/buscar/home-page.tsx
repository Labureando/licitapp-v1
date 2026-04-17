import { useNavigate } from 'react-router-dom'
import { Search, Bell, Bookmark, BarChart3, Calendar, Settings } from 'lucide-react'
import RadialOrbitalNav, {type OrbitalNavItem} from '../../components/ui/radial-orbital-nav'

const MODULES: OrbitalNavItem[] = [
  {
    id: 1,
    title: 'Buscador',
    description: 'Explora las 288.346 licitaciones públicas indexadas con 12 filtros avanzados.',
    icon: Search,
    path: '/buscar',
    stats: [
      { value: '288K', label: 'totales' },
      { value: '39.9K', label: 'abiertas' },
    ],
  },
  {
    id: 2,
    title: 'Alertas',
    description: 'Notificaciones automáticas cuando aparecen licitaciones que coinciden con tus criterios.',
    icon: Bell,
    path: '/alertas',
    badge: 3,
    stats: [
      { value: '3', label: 'nuevas' },
      { value: '12', label: 'activas' },
    ],
  },
  {
    id: 3,
    title: 'Guardadas',
    description: 'Tus licitaciones favoritas con seguimiento, notas y recordatorios de plazos.',
    icon: Bookmark,
    path: '/guardadas',
    stats: [{ value: '12', label: 'guardadas' }],
  },
  {
    id: 4,
    title: 'Analytics',
    description: 'Dashboards con KPIs del mercado, tendencias por sector y análisis competitivo.',
    icon: BarChart3,
    path: '/analytics',
  },
  {
    id: 5,
    title: 'Calendario',
    description: 'Timeline visual de plazos de presentación y fechas clave de tus licitaciones.',
    icon: Calendar,
    path: '/calendario',
  },
  {
    id: 6,
    title: 'Ajustes',
    description: 'Configuración de cuenta, criterios de búsqueda y preferencias del sistema.',
    icon: Settings,
    path: '/ajustes',
  },
]

export function HomePage() {
  const navigate = useNavigate()

  return (
    <RadialOrbitalNav
      items={MODULES}
      onNavigate={(path) => navigate(path)}
      centerContent={
        <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 animate-pulse">
          <div className="absolute w-24 h-24 rounded-full border border-primary/30 animate-ping opacity-70" />
          <div
            className="absolute w-28 h-28 rounded-full border border-primary/20 animate-ping opacity-50"
            style={{ animationDelay: '0.5s' }}
          />
          <span className="relative text-3xl font-black text-primary-foreground tracking-tighter">
            L
          </span>
        </div>
      }
    />
  )
}