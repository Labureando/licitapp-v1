import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Check, X } from 'lucide-react';

import { PasswordInput } from '@/features/auth/components/password-input';
import { passwordRequirements } from '@/features/auth/schemas/auth.schemas';
import { usersApi } from '../api/users.api';
import {
  changePasswordSchema,
  type ChangePasswordFormData,
} from '../schemas/users.schemas';
import { cn } from '@/lib/utils';

export function AjustesSeguridadTab() {
  const { t } = useTranslation(['settings', 'auth']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  const newPasswordValue = watch('newPassword') || '';

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);
    try {
      await usersApi.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
        newPasswordConfirm: data.newPasswordConfirm,
      });
      toast.success(t('settings:security.success'));
      reset();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error(t('settings:security.errors.wrongOldPassword'));
        } else if (error.response?.status === 429) {
          toast.error(t('settings:security.errors.rateLimit'));
        } else {
          toast.error(t('settings:security.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">
          {t('settings:security.title')}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('settings:security.subtitle')}
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-4">
          {t('settings:security.changePasswordTitle')}
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label
              htmlFor="oldPassword"
              className="block text-sm font-medium mb-1.5"
            >
              {t('settings:security.oldPassword')}
            </label>
            <PasswordInput
              id="oldPassword"
              autoComplete="current-password"
              {...register('oldPassword')}
              error={!!errors.oldPassword}
            />
            {errors.oldPassword && (
              <p className="mt-1 text-xs text-destructive">
                {errors.oldPassword.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1.5"
            >
              {t('settings:security.newPassword')}
            </label>
            <PasswordInput
              id="newPassword"
              autoComplete="new-password"
              {...register('newPassword')}
              error={!!errors.newPassword}
            />
          </div>

          {/* Checklist visual solo si ha empezado a escribir */}
          {newPasswordValue.length > 0 && (
            <ul className="space-y-1.5 bg-muted/50 rounded-md p-3">
              {passwordRequirements.map((req) => {
                const passes = req.test(newPasswordValue);
                return (
                  <li
                    key={req.id}
                    className={cn(
                      'flex items-center gap-2 text-xs',
                      passes ? 'text-foreground' : 'text-muted-foreground'
                    )}
                  >
                    {passes ? (
                      <Check
                        size={12}
                        className="text-primary shrink-0"
                        strokeWidth={3}
                      />
                    ) : (
                      <X size={12} className="shrink-0" />
                    )}
                    {t(`auth:passwordRequirements.${req.id}`)}
                  </li>
                );
              })}
            </ul>
          )}

          <div>
            <label
              htmlFor="newPasswordConfirm"
              className="block text-sm font-medium mb-1.5"
            >
              {t('settings:security.newPasswordConfirm')}
            </label>
            <PasswordInput
              id="newPasswordConfirm"
              autoComplete="new-password"
              {...register('newPasswordConfirm')}
              error={!!errors.newPasswordConfirm}
            />
            {errors.newPasswordConfirm && (
              <p className="mt-1 text-xs text-destructive">
                {errors.newPasswordConfirm.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'h-9 px-4 rounded-md bg-primary text-primary-foreground',
              'font-medium text-sm hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {isSubmitting
              ? t('settings:security.submittingButton')
              : t('settings:security.submitButton')}
          </button>
        </form>
      </div>
    </div>
  );
}