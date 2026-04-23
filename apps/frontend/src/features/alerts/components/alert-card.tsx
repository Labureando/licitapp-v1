import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Power, PowerOff, Pencil, Trash2, MapPin, Euro } from 'lucide-react';
import { alertsApi } from '../api/alerts.api';
import type { Alert } from '../types';
import { cn } from '@/lib/utils';
import { DeleteAlertDialog } from './delete-alert-dialog';
import { useState } from 'react';

interface AlertCardProps {
  alert: Alert;
  onEdit: (id: string) => void;
}

export function AlertCard({ alert, onEdit }: AlertCardProps) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const toggleMutation = useMutation({
    mutationFn: () =>
      alertsApi.update(alert.id, { isActive: !alert.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.updated'));
    },
    onError: () => toast.error(t('form.errors.updateFailed')),
  });

  const criteriaChips: string[] = [];
  if (alert.ccaas?.length) {
    criteriaChips.push(`${alert.ccaas.length} CCAA`);
  }
  if (alert.tiposContrato?.length) {
    criteriaChips.push(alert.tiposContrato.slice(0, 2).join(', '));
  }
  if (alert.importeMin || alert.importeMax) {
    criteriaChips.push(
      `${alert.importeMin ? `≥${alert.importeMin}€` : ''}${
        alert.importeMax ? ` ≤${alert.importeMax}€` : ''
      }`.trim()
    );
  }
  if (alert.palabrasClave) {
    criteriaChips.push(`"${alert.palabrasClave.slice(0, 20)}..."`);
  }

  return (
    <>
      <div
        className={cn(
          'bg-card border rounded-lg p-5 transition-all',
          alert.isActive
            ? 'border-border hover:border-primary/40'
            : 'border-border/50 opacity-60 hover:opacity-80'
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold truncate">{alert.name}</h3>
              {!alert.isActive && (
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {t('card.paused')}
                </span>
              )}
            </div>
            {alert.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {alert.description}
              </p>
            )}
          </div>
        </div>

        {/* Chips de criterios */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {criteriaChips.map((chip, i) => (
            <span
              key={i}
              className="text-[11px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {chip}
            </span>
          ))}
          {criteriaChips.length === 0 && (
            <span className="text-[11px] text-muted-foreground">
              {t('common:status.none')}
            </span>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => toggleMutation.mutate()}
            disabled={toggleMutation.isPending}
            className="h-8 px-2.5 rounded-md hover:bg-accent text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
            aria-label={alert.isActive ? t('card.pauseButton') : t('card.activateButton')}
          >
            {alert.isActive ? <PowerOff size={12} /> : <Power size={12} />}
            {alert.isActive ? t('card.pauseButton') : t('card.activateButton')}
          </button>
          <button
            type="button"
            onClick={() => onEdit(alert.id)}
            className="h-8 px-2.5 rounded-md hover:bg-accent text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
          >
            <Pencil size={12} />
            {t('card.editButton')}
          </button>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="h-8 px-2.5 rounded-md hover:bg-destructive/10 text-xs text-muted-foreground hover:text-destructive flex items-center gap-1.5 ml-auto"
            aria-label={t('card.deleteButton')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      <DeleteAlertDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        alert={alert}
      />
    </>
  );
}