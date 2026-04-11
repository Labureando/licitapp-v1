import { Routes, Route } from 'react-router-dom'
import { AppLayout } from './components/layout/app-layout'

function App() {
  return (
    <Routes>
      {/* Rutas sin layout (auth) */}
      <Route path="/login" element={<div className="p-8">Login</div>} />
      <Route path="/register" element={<div className="p-8">Register</div>} />

      {/* Rutas con layout (app) */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<div>Home — redirigir a /dashboard</div>} />
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/buscar" element={<div>Buscador</div>} />
        <Route path="/alertas" element={<div>Alertas</div>} />
        <Route path="/guardadas" element={<div>Guardadas</div>} />
        <Route path="/settings" element={<div>Settings</div>} />
      </Route>

      <Route path="*" element={<div className="p-8">404 Not Found</div>} />
    </Routes>
  )
}

export default App