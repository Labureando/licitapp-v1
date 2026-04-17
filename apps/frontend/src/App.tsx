import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/app-layout'
import { BuscarPage } from './pages/buscar/buscar-page'
import { LicitacionPage } from './pages/licitacion/licitacion-page';
import { HomePage } from './pages/buscar/home-page';

function App() {
  return (
    <Routes>
      {/* Rutas sin layout (auth) */}
      <Route path="/login" element={<div className="p-8">Login</div>} />
      <Route path="/register" element={<div className="p-8">Register</div>} />

      {/* Rutas con layout (app) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/buscar" element={<BuscarPage />} />
        <Route path="/alertas" element={<div>Alertas</div>} />
        <Route path="/guardadas" element={<div>Guardadas</div>} />
        <Route path="/settings" element={<div>Settings</div>} />
        <Route path="/licitaciones/:id" element={<LicitacionPage />} />
      </Route>

      <Route path="*" element={<div className="p-8">404 Not Found</div>} />
    </Routes>
  )
}

export default App