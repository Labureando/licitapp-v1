import { Helmet } from 'react-helmet-async';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Lock, Bell, Building2, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AjustesPage() {
  const { t } = useTranslation('settings');

  const TABS = [
    { path: 'perfil', labelKey: 'tabs.profile', icon: User },
    { path: 'seguridad', labelKey: 'tabs.security', icon: Lock },
    { path: 'notificaciones', labelKey: 'tabs.notifications', icon: Bell },
    { path: 'organizacion', labelKey: 'tabs.organization', icon: Building2 },
    { path: 'preferencias', labelKey: 'tabs.preferences', icon: Settings2 },
  ] as const;

  return (
    <>
      <Helmet>
        <title>{t('page.title')} · LicitaApp</title>
      </Helmet>
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
        <header className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            {t('page.title')}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t('page.subtitle')}
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar de tabs */}
          <nav className="lg:w-48 shrink-0">
            <ul className="space-y-1">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <li key={tab.path}>
                    <NavLink
                      to={tab.path}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                          isActive
                            ? 'bg-accent text-accent-foreground font-medium'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
                        )
                      }
                    >
                      <Icon size={14} />
                      {t(tab.labelKey)}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Contenido del tab activo */}
          <div className="flex-1 min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Redirect por defecto: /ajustes → /ajustes/perfil
 */
export function AjustesIndexRedirect() {
  return <Navigate to="perfil" replace />;
}