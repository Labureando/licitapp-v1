import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, ExternalLink } from 'lucide-react';
import { alertsApi } from '@/features/alerts/api/alerts.api';
import { cn } from '@/lib/utils';

export function AjustesNotificacionesTab() {
  const { t } = useTranslation(['settings', 'alerts']);
  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  });

  const activeCount = alerts.filter((a) => a.isActive).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('settings:notifications.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('settings:notifications.subtitle')}
        </p>
      </div>

      {/* Preferencias generales — futuras, por ahora stub */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-4">
          {t('settings:notifications.generalTitle')}
        </h3>
        <p className="text-xs text-muted-foreground">
          Próximamente: email por defecto, horario de silencio, frecuencia global.
        </p>
      </div>

      {/* Lista de alertas */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium">
              {t('settings:notifications.alertsListTitle')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('settings:notifications.alertsListSubtitle')}
            </p>
          </div>
          <Link
            to="/alertas"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {t('alerts:page.title')}
            <ExternalLink size={11} />
          </Link>
        </div>

        {isLoading && (
          <div className="text-sm text-muted-foreground">
            {t('common:status.loading')}
          </div>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-8">
            <Bell size={24} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              {t('settings:notifications.alertsListEmpty')}{' '}
              <Link to="/alertas" className="text-primary hover:underline">
                {t('alerts:page.createButton')}
              </Link>
            </p>
          </div>
        )}

        {!isLoading && alerts.length > 0 && (
          <ul className="divide-y divide-border">
            {alerts.map((alert) => (
              <li
                key={alert.id}
                className="py-3 flex items-center justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {alert.name}
                    </span>
                    {!alert.isActive && (
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {t('alerts:card.paused')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {alert.email || t('common:status.none')}
                  </p>
                </div>
                <Link
                  to="/alertas"
                  className="text-xs text-primary hover:underline shrink-0 ml-4"
                >
                  {t('settings:notifications.manageAlert')}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}