import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Check, X } from 'lucide-react';

import { AuthLayout } from '../components/auth-layout';
import { PasswordInput } from '../components/password-input';
import { authApi } from '../api/auth.api';
import {
  completeSignupSchema,
  type CompleteSignupFormData,
  passwordRequirements,
} from '../schemas/auth.schemas';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function CompleteSignupPage() {
  const { t } = useTranslation('auth');
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CompleteSignupFormData>({
    resolver: zodResolver(completeSignupSchema),
    mode: 'onChange',
  });

  const passwordValue = watch('password') || '';

  const onSubmit = async (data: CompleteSignupFormData) => {
    if (!token) {
      toast.error(t('resetPassword.errors.invalidLink'));
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await authApi.completeSignup(token, data);

      useAuthStore.getState().setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      useAuthStore.getState().setUser(response.user);
      useAuthStore.getState().setStatus('authenticated');

      toast.success(t('completeSignup.success'));
      navigate('/app', { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(t('completeSignup.errors.invalidToken'));
        } else if (error.response?.status === 429) {
          toast.error(t('completeSignup.errors.rateLimit'));
        } else {
          toast.error(t('completeSignup.errors.generic'));
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
      title={t('completeSignup.title')}
      subtitle={t('completeSignup.subtitle')}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium mb-1.5"
          >
            {t('completeSignup.passwordLabel')}
          </label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            autoFocus
            {...register('password')}
            error={!!errors.password}
          />
        </div>

        {/* Checklist visual de requisitos */}
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
            htmlFor="passwordConfirm"
            className="block text-sm font-medium mb-1.5"
          >
            {t('completeSignup.passwordConfirmLabel')}
          </label>
          <PasswordInput
            id="passwordConfirm"
            autoComplete="new-password"
            {...register('passwordConfirm')}
            error={!!errors.passwordConfirm}
          />
          {errors.passwordConfirm && (
            <p className="mt-1 text-xs text-destructive">
              {errors.passwordConfirm.message}
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
            ? t('completeSignup.submittingButton')
            : t('completeSignup.submitButton')}
        </button>
      </form>
    </AuthLayout>
  );
}