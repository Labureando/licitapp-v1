import { useNavigate } from 'react-router-dom'
import RadialOrbitalNav from '@/components/ui/radial-orbital-nav'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { useHomeModules } from '../config/use-home-modules'

export function HomePage() {
  const navigate = useNavigate()
  const HOME_MODULES = useHomeModules()

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* ═══ Top bar: brand + theme toggle ═══ */}
      <div className="absolute top-4 left-6 right-6 z-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-md bg-primary flex items-center justify-center"
            style={{ boxShadow: '0 0 16px oklch(from var(--primary) l c h / 0.35)' }}
          >
            <span className="text-primary-foreground font-black text-sm leading-none">
              L
            </span>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-foreground leading-none">
              LicitaApp
            </div>
            <div className="text-[9px] font-bold tracking-[0.18em] text-primary/80 mt-0.5">
              PRO · BETA
            </div>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* ═══ Orbital nav ═══ */}
      <RadialOrbitalNav
        items={HOME_MODULES}
        onNavigate={(path) => navigate(path)}
        centerContent={
          <div
            className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center animate-pulse"
            style={{ boxShadow: '0 0 40px oklch(from var(--primary) l c h / 0.5)' }}
          >
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

      {/* ═══ Bottom hint ═══ */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40">
        <span className="text-[11px] text-muted-foreground">
          Pulsa un módulo para ver detalles · Click en{' '}
          <kbd className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border">
            Abrir módulo
          </kbd>{' '}
          para navegar
        </span>
      </div>
    </div>
  )
}