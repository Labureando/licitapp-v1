import { Sparkles } from 'lucide-react'

interface ComingSoonProps {
  name: string
  description?: string
}

export function ComingSoon({ name, description }: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div
        className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5"
        style={{ boxShadow: '0 0 24px oklch(from var(--primary) l c h / 0.15)' }}
      >
        <Sparkles size={22} className="text-primary" strokeWidth={1.75} />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">{name}</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        {description ?? `El módulo de ${name.toLowerCase()} está en desarrollo. Muy pronto disponible.`}
      </p>
      <span className="mt-6 px-3 py-1 rounded-md bg-primary/5 border border-primary/15 text-[11px] font-semibold tracking-widest text-primary uppercase">
        Próximamente
      </span>
    </div>
  )
}