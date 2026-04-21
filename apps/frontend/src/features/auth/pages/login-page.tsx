import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

import { AuthLayout } from '../components/auth-layout';
import { PasswordInput } from '../components/password-input';
import { GoogleButton } from '../components/google-button';
import { authApi } from '../api/auth.api';
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

export function LoginPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    try {
      const response = await authApi.login(data);

      useAuthStore.getState().setTokens({
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      });
      useAuthStore.getState().setUser(response.user);
      useAuthStore.getState().setStatus('authenticated');

      toast.success(t('login.success'));
      const redirectTo = searchParams.get('redirect') || '/app';
      navigate(redirectTo, { replace: true });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          toast.error(t('login.errors.invalidCredentials'));
        } else if (error.response?.status === 429) {
          toast.error(t('login.errors.rateLimit'));
        } else {
          toast.error(t('login.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = authApi.getGoogleOAuthUrl();
  };

  return (
    <AuthLayout
      title={t('login.title')}
      subtitle={t('login.subtitle')}
      footer={
        <span className="text-muted-foreground">
          {t('login.noAccount')}{' '}
          <Link
            to="/register"
            className="text-primary font-medium hover:underline"
          >
            {t('login.createAccount')}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t('login.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            {...register('email')}
            className={cn(
              'w-full h-10 px-3 rounded-md border bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              errors.email
                ? 'border-destructive focus-visible:ring-destructive'
                : 'border-input'
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium">
              {t('login.passwordLabel')}
            </label>
            <Link
              to="/reset-password"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              {t('login.forgotPassword')}
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            {...register('password')}
            error={!!errors.password}
          />
          {errors.password && (
            <p className="mt-1 text-xs text-destructive">
              {errors.password.message}
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
          {isSubmitting ? t('login.submittingButton') : t('login.submitButton')}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">
            {t('login.orDivider')}
          </span>
        </div>
      </div>

      <GoogleButton onClick={handleGoogleLogin} />
    </AuthLayout>
  );
}