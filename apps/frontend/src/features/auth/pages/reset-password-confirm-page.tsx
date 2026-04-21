import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Check, X } from 'lucide-react';

import { AuthLayout } from '../components/auth-layout';
import { PasswordInput } from '../components/password-input';
import { passwordRequirements } from '../schemas/auth.schemas';
import { usersApi } from '@/features/users/api/users.api';
import {
  confirmResetSchema,
  type ConfirmResetFormData,
} from '@/features/users/schemas/users.schemas';
import { cn } from '@/lib/utils';

export function ResetPasswordConfirmPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast.error(t('resetPassword.errors.invalidLink'));
      navigate('/reset-password', { replace: true });
    }
  }, [token, navigate, t]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ConfirmResetFormData>({
    resolver: zodResolver(confirmResetSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('newPassword') || '';

  const onSubmit = async (data: ConfirmResetFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await usersApi.confirmPasswordReset({
        token,
        newPassword: data.newPassword,
      });
      toast.success(t('resetPassword.success'));
      navigate('/login', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          toast.error(t('resetPassword.errors.tokenExpired'));
        } else if (error.response?.status === 409) {
          toast.error(t('resetPassword.errors.tokenUsed'));
        } else if (error.response?.status === 429) {
          toast.error(t('resetPassword.errors.rateLimit'));
        } else {
          toast.error(t('resetPassword.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t('resetPassword.confirmTitle')}
      subtitle={t('resetPassword.confirmSubtitle')}
      footer={
        <Link
          to="/login"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {t('resetPassword.cancelLink')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium mb-1.5"
          >
            {t('resetPassword.newPasswordLabel')}
          </label>
          <PasswordInput
            id="newPassword"
            autoComplete="new-password"
            autoFocus
            {...register('newPassword')}
            error={!!errors.newPassword}
          />
        </div>

        {/* Checklist visual */}
        <ul className="space-y-1.5 bg-muted/50 rounded-md p-3">
          {passwordRequirements.map((req) => {
            const passes = req.test(passwordValue);
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
                {t(`passwordRequirements.${req.id}`)}
              </li>
            );
          })}
        </ul>

        <div>
          <label
            htmlFor="newPasswordConfirm"
            className="block text-sm font-medium mb-1.5"
          >
            {t('resetPassword.newPasswordConfirmLabel')}
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
            'w-full h-10 rounded-md bg-primary text-primary-foreground',
            'font-medium text-sm hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {isSubmitting
            ? t('resetPassword.confirmSubmittingButton')
            : t('resetPassword.confirmSubmitButton')}
        </button>
      </form>
    </AuthLayout>
  );
}