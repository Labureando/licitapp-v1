import { Outlet } from 'react-router-dom'
import { Sidebar } from './sidebar'

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />

      <main className="relative flex-1 overflow-auto">
        {/* Ambient glow sutil en modo oscuro — invisible en claro */}
        <div
          className="pointer-events-none fixed top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]"
          aria-hidden
        />
        <div
          className="pointer-events-none fixed bottom-0 left-1/3 w-[400px] h-[400px] rounded-full bg-primary/[0.02] blur-[100px]"
          aria-hidden
        />

        <div className="relative z-10 px-8 py-8 max-w-[1400px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}