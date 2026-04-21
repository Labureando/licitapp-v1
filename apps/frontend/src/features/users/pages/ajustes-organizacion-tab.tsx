import { useTranslation } from 'react-i18next';
import { Building2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';

export function AjustesOrganizacionTab() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('common:status.loading')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('organization.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('organization.subtitle')}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t('organization.planLabel')}
          </label>
          <div className="text-sm font-medium">{user.userPlan || 'FREE'}</div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">
            {t('organization.roleLabel')}
          </label>
          <div className="text-sm font-medium">{user.role}</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
          <Building2 size={20} className="text-primary" />
        </div>
        <h3 className="text-sm font-medium mb-1">
          {t('organization.comingSoonTitle')}
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mx-auto">
          {t('organization.comingSoonBody')}
        </p>
      </div>
    </div>
  );
}