import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@base-ui/react/dialog';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { alertsApi } from '../api/alerts.api';
import { cn } from '@/lib/utils';
import type { CreateAlertPayload } from '../types';

const schema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(500).optional(),
    email: z.string().email().optional().or(z.literal('')),
    palabrasClave: z.string().optional(),
    ccaas: z.array(z.string()).optional(),
    tiposContrato: z.array(z.string()).optional(),
    importeMin: z.string().optional().or(z.literal('')),
    importeMax: z.string().optional().or(z.literal('')),
    isActive: z.boolean(),
  })
  .refine(
    (data) => {
      const hasAny =
        data.palabrasClave ||
        data.ccaas?.length ||
        data.tiposContrato?.length ||
        data.importeMin ||
        data.importeMax;
      return !!hasAny;
    },
    { message: 'atLeastOneCriterion', path: ['palabrasClave'] }
  );

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
}

export function AlertFormDialog({ open, onOpenChange, editingId }: Props) {
  const { t } = useTranslation('alerts');
  const queryClient = useQueryClient();
  const isEdit = !!editingId;

  const { data: editingAlert } = useQuery({
    queryKey: ['alerts', editingId],
    queryFn: () => alertsApi.get(editingId!),
    enabled: isEdit,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (editingAlert) {
      reset({
        name: editingAlert.name,
        description: editingAlert.description || '',
        email: editingAlert.email || '',
        palabrasClave: editingAlert.palabrasClave || '',
        ccaas: editingAlert.ccaas || [],
        tiposContrato: editingAlert.tiposContrato || [],
        importeMin: editingAlert.importeMin || '',
        importeMax: editingAlert.importeMax || '',
        isActive: editingAlert.isActive,
      });
    } else if (!isEdit) {
      reset({
        name: '',
        description: '',
        email: '',
        palabrasClave: '',
        ccaas: [],
        tiposContrato: [],
        importeMin: '',
        importeMax: '',
        isActive: true,
      });
    }
  }, [editingAlert, isEdit, reset]);

  const createMutation = useMutation({
    mutationFn: (payload: CreateAlertPayload) => alertsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.created'));
      onOpenChange(false);
    },
    onError: () => toast.error(t('form.errors.createFailed')),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<CreateAlertPayload>) =>
      alertsApi.update(editingId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(t('form.success.updated'));
      onOpenChange(false);
    },
    onError: () => toast.error(t('form.errors.updateFailed')),
  });

  const onSubmit = (data: FormData) => {
    const payload: CreateAlertPayload = {
      name: data.name,
      description: data.description || undefined,
      email: data.email || undefined,
      palabrasClave: data.palabrasClave || undefined,
      ccaas: data.ccaas?.length ? data.ccaas : undefined,
      tiposContrato: data.tiposContrato?.length ? data.tiposContrato : undefined,
      importeMin: data.importeMin || undefined,
      importeMax: data.importeMax || undefined,
      isActive: data.isActive,
    };
    if (isEdit) updateMutation.mutate(payload);
    else createMutation.mutate(payload);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Popup
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
            'bg-card border border-border rounded-xl p-6 shadow-xl'
          )}
        >
          <div className="flex items-start justify-between mb-6">
            <Dialog.Title className="text-lg font-semibold">
              {isEdit ? t('form.editTitle') : t('form.createTitle')}
            </Dialog.Title>
            <Dialog.Close className="p-1 rounded hover:bg-accent">
              <X size={16} />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('form.nameLabel')}
              </label>
              <input
                {...register('name')}
                placeholder={t('form.namePlaceholder')}
                className={cn(
                  'w-full h-10 px-3 rounded-md border bg-background text-sm',
                  errors.name ? 'border-destructive' : 'border-input'
                )}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-destructive">
                  {t('form.validation.nameRequired')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('form.keywordsLabel')}
              </label>
              <input
                {...register('palabrasClave')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {t('form.cpvHelp')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('form.importeMinLabel')}
                </label>
                <input
                  type="number"
                  {...register('importeMin')}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {t('form.importeMaxLabel')}
                </label>
                <input
                  type="number"
                  {...register('importeMax')}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                {t('form.emailLabel')}
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder={t('form.emailHelp')}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('isActive')}
                className="h-4 w-4 accent-primary"
              />
              <div>
                <div className="text-sm font-medium">{t('form.isActiveLabel')}</div>
                <div className="text-xs text-muted-foreground">
                  {t('form.isActiveHelp')}
                </div>
              </div>
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
                className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent"
              >
                {t('form.cancelButton')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                className={cn(
                  'h-9 px-4 rounded-md bg-primary text-primary-foreground',
                  'font-medium text-sm hover:bg-primary/90',
                  'disabled:opacity-50'
                )}
              >
                {isSubmitting
                  ? t('form.submitting')
                  : isEdit
                  ? t('form.submitEdit')
                  : t('form.submitCreate')}
              </button>
            </div>
          </form>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}