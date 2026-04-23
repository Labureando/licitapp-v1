import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useQuery } from '@tanstack/react-query';
import { Plus, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { alertsApi } from '../api/alerts.api';
import { AlertCard } from '../components/alert-card';
import { AlertFormDialog } from '../components/alert-form-dialog';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'active' | 'inactive';

export function AlertasPage() {
  const { t } = useTranslation('alerts');
  const [filter, setFilter] = useState<FilterTab>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
  });

  const filtered = alerts.filter((a) => {
    if (filter === 'active') return a.isActive;
    if (filter === 'inactive') return !a.isActive;
    return true;
  });

  const handleCreate = () => {
    setEditingId(null);
    setDialogOpen(true);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setDialogOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{t('page.title')} · LicitaApp</title>
      </Helmet>

      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t('page.title')}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {t('page.subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreate}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Plus size={14} />
            {t('page.createButton')}
          </button>
        </header>

        {/* Filtros */}
        {alerts.length > 0 && (
          <div className="flex items-center gap-1 mb-6 border-b border-border">
            {(['all', 'active', 'inactive'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={cn(
                  'h-9 px-3 text-sm border-b-2 -mb-px transition-colors',
                  filter === tab
                    ? 'border-primary text-foreground font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                {t(`page.filters.${tab}`)}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && alerts.length === 0 && (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Bell size={24} className="text-primary" />
            </div>
            <h2 className="text-lg font-semibold">{t('page.empty.title')}</h2>
            <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
              {t('page.empty.subtitle')}
            </p>
            <button
              type="button"
              onClick={handleCreate}
              className="mt-6 h-10 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
            >
              {t('page.empty.cta')}
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-card border border-border rounded-lg p-5 animate-pulse"
              >
                <div className="h-5 w-3/4 bg-muted rounded mb-3" />
                <div className="h-3 w-1/2 bg-muted rounded mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-muted rounded" />
                  <div className="h-6 w-20 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Lista */}
        {!isLoading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onEdit={handleEdit} />
            ))}
          </div>
        )}
      </div>

      {/* Dialog crear/editar */}
      <AlertFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingId={editingId}
      />
    </>
  );
}