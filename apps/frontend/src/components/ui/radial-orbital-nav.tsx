

import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { Badge } from './badge'
import { Button } from './button'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { cn } from '../../lib/utils'

export interface OrbitalNavItem {
  id: number
  title: string
  description: string
  icon: React.ElementType
  path: string
  badge?: number | string
  stats?: { label: string; value: string }[]
}

interface RadialOrbitalNavProps {
  items: OrbitalNavItem[]
  centerContent?: React.ReactNode
  onNavigate?: (path: string) => void
  radius?: number
}

export default function RadialOrbitalNav({
  items,
  centerContent,
  onNavigate,
  radius = 220,
}: RadialOrbitalNavProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const { t } = useTranslation('home')
  const containerRef = useRef<HTMLDivElement>(null)
  const orbitRef = useRef<HTMLDivElement>(null)

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedId(null)
    }
  }

  const toggleItem = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id))
  }

  const calculatePosition = (index: number, total: number) => {
    // Start from top (-90°) and distribute evenly clockwise
    const angle = ((index / total) * 360 - 90) % 360
    const radian = (angle * Math.PI) / 180
    const x = radius * Math.cos(radian)
    const y = radius * Math.sin(radian)
    return { x, y, angle }
  }

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      className="w-full h-screen flex flex-col items-center justify-center bg-background overflow-hidden"
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          ref={orbitRef}
          className="absolute w-full h-full flex items-center justify-center"
        >
          {/* ═══ CENTER ═══ */}
          <div className="absolute z-10 flex items-center justify-center">
            {centerContent ?? (
              <div className="relative w-16 h-16 rounded-full bg-primary flex items-center justify-center animate-pulse">
                <div className="absolute w-20 h-20 rounded-full border border-primary/30 animate-ping opacity-70" />
                <div
                  className="absolute w-24 h-24 rounded-full border border-primary/20 animate-ping opacity-50"
                  style={{ animationDelay: '0.5s' }}
                />
                <div className="w-8 h-8 rounded-full bg-primary-foreground/80 backdrop-blur-md" />
              </div>
            )}
          </div>

          {/* Orbital ring */}
          <div
            className="absolute rounded-full border border-border/40"
            style={{ width: radius * 2, height: radius * 2 }}
          />

          {/* ═══ NODES ═══ */}
          {items.map((item, index) => {
            const pos = calculatePosition(index, items.length)
            const isExpanded = expandedId === item.id
            const Icon = item.icon

            return (
              <div
                key={item.id}
                className="absolute transition-all duration-300 cursor-pointer"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  zIndex: isExpanded ? 200 : 20,
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleItem(item.id)
                }}
              >
                {/* Halo glow */}
                <div
                  className={cn(
                    'absolute rounded-full -inset-3 transition-opacity pointer-events-none',
                    isExpanded ? 'opacity-100' : 'opacity-40',
                  )}
                  style={{
                    background:
                      'radial-gradient(circle, hsl(var(--primary) / 0.25) 0%, transparent 70%)',
                  }}
                />

                {/* Icon button */}
                <div
                  className={cn(
                    'relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300',
                    isExpanded
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30 scale-125'
                      : 'bg-card text-foreground border-border hover:border-primary hover:scale-110 hover:shadow-md hover:shadow-primary/20',
                  )}
                >
                  <Icon size={18} strokeWidth={1.75} />

                  {/* Badge */}
                  {item.badge && !isExpanded && (
                    <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Label */}
                <div
                  className={cn(
                    'absolute top-14 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-semibold tracking-wider transition-all duration-300',
                    isExpanded ? 'text-foreground scale-110' : 'text-muted-foreground',
                  )}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <Card className="absolute top-24 left-1/2 -translate-x-1/2 w-72 bg-popover/95 backdrop-blur-lg border-primary/30 shadow-xl shadow-primary/10 overflow-visible animate-in fade-in zoom-in-95 duration-200">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3 bg-primary/50" />

                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] tracking-wider">
                          {t('moduleLabel')}
                        </Badge>
                      </div>
                      <CardTitle className="text-base mt-1">{item.title}</CardTitle>
                    </CardHeader>

                    <CardContent className="text-xs text-muted-foreground space-y-3 pb-4">
                      <p className="leading-relaxed">{item.description}</p>

                      {item.stats && item.stats.length > 0 && (
                        <div className="flex gap-4 pt-3 border-t border-border/50">
                          {item.stats.map((s, i) => (
                            <div key={i}>
                              <div className="text-lg font-bold text-foreground font-mono leading-none">
                                {s.value}
                              </div>
                              <div className="text-[10px] uppercase tracking-wider mt-1">
                                {s.label}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation()
                          onNavigate?.(item.path)
                        }}
                      >
                        {t('openModule')}
                        <ArrowRight size={14} className="ml-1" />
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}