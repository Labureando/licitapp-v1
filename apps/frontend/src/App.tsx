import { Routes, Route, Navigate } from 'react-router-dom';

import { AppLayout } from '@/components/layout/app-layout';
import { NotFoundPage } from '@/components/layout/not-found-page';
import { ComingSoon } from '@/components/layout/coming-soon';

import { HomePage } from '@/features/home/pages/home-page';
import { BuscarPage } from '@/features/licitaciones/pages/buscar-page';
import { LicitacionPage } from '@/features/licitaciones/pages/licitacion-page';

// ─── Auth ───
import { LoginPage } from '@/features/auth/pages/login-page';
import { RegisterPage } from '@/features/auth/pages/register-page';
import { CompleteSignupPage } from '@/features/auth/pages/complete-signup-page';
import { AuthCallbackPage } from '@/features/auth/pages/auth-callback-page';
import { ResetPasswordPage } from '@/features/auth/pages/reset-password-page';
import { ResetPasswordConfirmPage } from '@/features/auth/pages/reset-password-confirm-page';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { GuestRoute } from '@/features/auth/components/guest-route';
import { AlertasPage } from '@/features/alerts/pages/alertas-page';
// ─── Landing ───
import { LandingPage } from '@/features/landing/pages/landing-page';

// ─── Ajustes ───
import {
  AjustesPage,
  AjustesIndexRedirect,
} from '@/features/users/pages/ajustes-page';
import { AjustesPerfilTab } from '@/features/users/pages/ajustes-perfil-tab';
import { AjustesSeguridadTab } from '@/features/users/pages/ajustes-seguridad-tab';
import { AjustesNotificacionesTab } from '@/features/users/pages/ajustes-notificaciones-tab';
import { AjustesOrganizacionTab } from '@/features/users/pages/ajustes-organizacion-tab';
import { AjustesPreferenciasTab } from '@/features/users/pages/ajustes-preferencias-tab';

function App() {
  return (
    <Routes>
      {/* ═══ Landing pública ═══ */}
      <Route path="/" element={<LandingPage />} />

      {/* ═══ Rutas solo para invitados (redirige a /app si ya hay sesión) ═══ */}
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/complete-signup/:token" element={<CompleteSignupPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/reset-password/confirm"
          element={<ResetPasswordConfirmPage />}
        />
      </Route>

      {/* ═══ Callback OAuth (accesible siempre) ═══ */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* ═══ Rutas protegidas (requieren sesión) ═══ */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* El home orbital se mueve a /app */}
          <Route path="/app" element={<HomePage />} />

          {/* Redirect para compatibilidad con Sprint A1 */}
          <Route path="/dashboard" element={<Navigate to="/app" replace />} />

          <Route path="/buscar" element={<BuscarPage />} />
          <Route path="/alertas" element={<AlertasPage />} />
          <Route path="/guardadas" element={<ComingSoon name="Guardadas" />} />
          <Route path="/analytics" element={<ComingSoon name="Analytics" />} />
          <Route path="/calendario" element={<ComingSoon name="Calendario" />} />

          <Route path="/licitaciones/:id" element={<LicitacionPage />} />

          {/* Ajustes con tabs anidados */}
          <Route path="/ajustes" element={<AjustesPage />}>
            <Route index element={<AjustesIndexRedirect />} />
            <Route path="perfil" element={<AjustesPerfilTab />} />
            <Route path="seguridad" element={<AjustesSeguridadTab />} />
            <Route path="notificaciones" element={<AjustesNotificacionesTab />} />
            <Route path="organizacion" element={<AjustesOrganizacionTab />} />
            <Route path="preferencias" element={<AjustesPreferenciasTab />} />
          </Route>
        </Route>
      </Route>

      {/* ═══ Legales (páginas estáticas, accesibles siempre) ═══ */}
      <Route path="/legal/terms" element={<ComingSoon name="Términos" />} />
      <Route path="/legal/privacy" element={<ComingSoon name="Privacidad" />} />
      <Route path="/legal/cookies" element={<ComingSoon name="Cookies" />} />

      {/* ═══ 404 ═══ */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;