import { Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Search,
  Bell,
  Bookmark,
  BarChart3,
  Calendar,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { cn } from '@/lib/utils'

interface NavItemDef {
  path: string
  label: string
  icon: LucideIcon
  badge?: number
}

const NAV_PRINCIPAL: NavItemDef[] = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/buscar', label: 'Buscador', icon: Search },
  { path: '/alertas', label: 'Alertas', icon: Bell, badge: 3 },
  { path: '/guardadas', label: 'Guardadas', icon: Bookmark },
]

const NAV_HERRAMIENTAS: NavItemDef[] = [
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/calendario', label: 'Calendario', icon: Calendar },
  { path: '/ajustes', label: 'Ajustes', icon: Settings },
]

function NavItem({ path, label, icon: Icon, badge }: NavItemDef) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
            : 'text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/40'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <span
              className="absolute left-0 top-[22%] h-[56%] w-[2px] rounded-r-full bg-sidebar-primary"
              style={{ boxShadow: '0 0 8px var(--sidebar-primary)' }}
              aria-hidden
            />
          )}
          <Icon size={16} strokeWidth={1.75} className="shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          {badge !== undefined && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function NavSection({ title, items }: { title: string; items: NavItemDef[] }) {
  return (
    <div>
      <h3 className="px-3 pb-2 text-[10px] font-semibold tracking-[0.15em] text-sidebar-foreground/40 uppercase">
        {title}
      </h3>
      <div className="space-y-0.5">
        {items.map((item) => (
          <NavItem key={item.path} {...item} />
        ))}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className="flex flex-col w-60 h-screen bg-sidebar text-sidebar-foreground border-r border-sidebar-border shrink-0">
      {/* ═══ LOGO (link al home orbital) ═══ */}
      <Link
        to="/"
        className="group flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border hover:bg-sidebar-accent/30 transition-colors"
      >
        <div
          className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center transition-shadow"
          style={{ boxShadow: '0 0 16px oklch(from var(--sidebar-primary) l c h / 0.35)' }}
        >
          <span className="font-black text-base text-sidebar-primary-foreground leading-none">
            L
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold tracking-tight truncate">LicitaApp</div>
          <div className="text-[9px] font-bold tracking-[0.18em] text-sidebar-accent-foreground/70">
            PRO · BETA
          </div>
        </div>
      </Link>

      {/* ═══ NAV ═══ */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        <NavSection title="Principal" items={NAV_PRINCIPAL} />
        <NavSection title="Herramientas" items={NAV_HERRAMIENTAS} />
      </nav>

      {/* ═══ FOOTER (user + theme toggle) ═══ */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary/15 border border-sidebar-primary/25 flex items-center justify-center shrink-0">
            <span className="text-[11px] font-bold text-sidebar-accent-foreground">
              DU
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold truncate">Dev User</div>
            <div className="text-[10px] text-sidebar-foreground/40 truncate">
              dev@licitaapp.com
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}