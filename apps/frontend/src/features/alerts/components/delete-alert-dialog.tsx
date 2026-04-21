import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { AlertDialog } from '@base-ui/react/alert-dialog';
import { alertsApi } from '../api/alerts.api';
import type { Alert } from '../types';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alert: Alert;
}

export function DeleteAlertDialog({ open, onOpenChange, alert }: Props) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () => alertsApi.delete(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.deleted'));
      onOpenChange(false);
    },
    onError: () => toast.error(t('form.errors.deleteFailed')),
  });

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
        <AlertDialog.Popup
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-md bg-card border border-border rounded-lg p-6 shadow-xl'
          )}
        >
          <AlertDialog.Title className="text-lg font-semibold">
            {t('delete.title')}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-sm text-muted-foreground mt-2">
            {t('delete.message', { name: alert.name })}
          </AlertDialog.Description>

          <div className="flex justify-end gap-2 mt-6">
            <AlertDialog.Close className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent">
              {t('delete.cancel')}
            </AlertDialog.Close>
            <button
              type="button"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className={cn(
                'h-9 px-4 rounded-md bg-destructive text-destructive-foreground',
                'text-sm font-medium hover:bg-destructive/90',
                'disabled:opacity-50'
              )}
            >
              {deleteMutation.isPending
                ? t('common:status.deleting')
                : t('delete.confirm')}
            </button>
          </div>
        </AlertDialog.Popup>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}