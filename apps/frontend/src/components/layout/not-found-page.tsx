import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
      <div className="text-center max-w-md">
        <div className="mb-8 text-8xl font-black font-mono text-gradient-primary tracking-tighter">
          404
        </div>
        <h1 className="text-2xl font-bold mb-2">Página no encontrada</h1>
        <p className="text-sm text-muted-foreground mb-8">
          La ruta que buscas no existe o ha sido movida.
        </p>
        <Button render={<Link to="/" />}>
  <ArrowLeft size={16} className="mr-2" />
  Volver al inicio
</Button>
      </div>
    </div>
  )
}