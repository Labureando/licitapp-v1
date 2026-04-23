import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation, Trans } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail } from 'lucide-react';

import { AuthLayout } from '../components/auth-layout';
import { GoogleButton } from '../components/google-button';
import { authApi } from '../api/auth.api';
import { registerSchema, type RegisterFormData } from '../schemas/auth.schemas';
import { cn } from '@/lib/utils';

export function RegisterPage() {
  const { t } = useTranslation('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { acceptTerms: false },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      await authApi.signup({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        timezone,
      });

      setEmailSentTo(data.email);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          toast.error(t('register.errors.emailTaken'));
        } else if (error.response?.status === 429) {
          toast.error(t('register.errors.rateLimit'));
        } else {
          toast.error(t('register.errors.generic'));
        }
      } else {
        toast.error(t('common:errors.network', ''));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignup = () => {
    window.location.href = authApi.getGoogleOAuthUrl();
  };

  if (emailSentTo) {
    return (
      <AuthLayout
        title={t('register.emailSent.title')}
        subtitle={t('register.emailSent.subtitle', { email: emailSentTo })}
      >
        <div className="space-y-4 text-center">
          <div
            className="inline-flex items-center justify-center w-14 h-14 rounded-full"
            style={{
              backgroundColor: 'oklch(from var(--primary) l c h / 0.12)',
            }}
          >
            <Mail size={24} className="text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('register.emailSent.body')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('register.emailSent.notFound')}{' '}
            <button
              onClick={() => setEmailSentTo(null)}
              className="text-primary hover:underline"
            >
              {t('register.emailSent.useAnotherEmail')}
            </button>
            .
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('register.title')}
      subtitle={t('register.subtitle')}
      footer={
        <span className="text-muted-foreground">
          {t('register.hasAccount')}{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">
            {t('register.login')}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-1.5"
            >
              {t('register.firstNameLabel')}
            </label>
            <input
              id="firstName"
              autoComplete="given-name"
              autoFocus
              {...register('firstName')}
              className={cn(
                'w-full h-10 px-3 rounded-md border bg-background text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                errors.firstName ? 'border-destructive' : 'border-input'
              )}
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.firstName.message}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium mb-1.5"
            >
              {t('register.lastNameLabel')}
            </label>
            <input
              id="lastName"
              autoComplete="family-name"
              {...register('lastName')}
              className={cn(
                'w-full h-10 px-3 rounded-md border bg-background text-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                errors.lastName ? 'border-destructive' : 'border-input'
              )}
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-destructive">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t('register.emailLabel')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={cn(
              'w-full h-10 px-3 rounded-md border bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              errors.email ? 'border-destructive' : 'border-input'
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            {t('register.phoneLabel')}{' '}
            <span className="text-muted-foreground">
              {t('register.phoneOptional')}
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            autoComplete="tel"
            placeholder="+34 612 345 678"
            {...register('phone')}
            className={cn(
              'w-full h-10 px-3 rounded-md border bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'border-input'
            )}
          />
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            {...register('acceptTerms')}
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
          />
          <span className="text-xs text-muted-foreground leading-relaxed">
            <Trans
              i18nKey="auth:register.acceptTerms"
              components={{
                termsLink: (
                  <Link
                    to="/legal/terms"
                    target="_blank"
                    className="text-foreground hover:underline"
                  />
                ),
                privacyLink: (
                  <Link
                    to="/legal/privacy"
                    target="_blank"
                    className="text-foreground hover:underline"
                  />
                ),
              }}
            />
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-xs text-destructive">
            {errors.acceptTerms.message}
          </p>
        )}

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
            ? t('register.submittingButton')
            : t('register.submitButton')}
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

      <GoogleButton
        onClick={handleGoogleSignup}
        label={t('register.googleButton')}
      />
    </AuthLayout>
  );
}