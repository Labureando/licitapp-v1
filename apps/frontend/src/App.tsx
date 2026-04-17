import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/app-layout'
import { NotFoundPage } from '@/components/layout/not-found-page'
import { ComingSoon } from '@/components/layout/coming-soon'

import { HomePage } from '@/features/home/pages/home-page'
import { BuscarPage } from '@/features/licitaciones/pages/buscar-page'
import { LicitacionPage } from '@/features/licitaciones/pages/licitacion-page'

function App() {
  return (
    <Routes>
      {/* ═══ Rutas sin layout (pantalla completa) ═══ */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<div className="p-8">Login</div>} />
      <Route path="/register" element={<div className="p-8">Register</div>} />

      {/* ═══ Rutas con layout (sidebar + main) ═══ */}
      <Route element={<AppLayout />}>
        <Route path="/dashboard" element={<ComingSoon name="Dashboard" />} />
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/alertas" element={<ComingSoon name="Alertas" />} />
        <Route path="/guardadas" element={<ComingSoon name="Guardadas" />} />
        <Route path="/analytics" element={<ComingSoon name="Analytics" />} />
        <Route path="/calendario" element={<ComingSoon name="Calendario" />} />
        <Route path="/ajustes" element={<ComingSoon name="Ajustes" />} />
        <Route path="/licitaciones/:id" element={<LicitacionPage />} />
      </Route>

      {/* ═══ 404 ═══ */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App