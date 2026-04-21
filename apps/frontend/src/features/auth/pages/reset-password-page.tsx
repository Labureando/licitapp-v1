import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';
import { Mail, ArrowLeft } from 'lucide-react';

import { AuthLayout } from '../components/auth-layout';
import { usersApi } from '@/features/users/api/users.api';
import {
  requestResetSchema,
  type RequestResetFormData,
} from '@/features/users/schemas/users.schemas';
import { cn } from '@/lib/utils';

export function ResetPasswordPage() {
  const { t } = useTranslation('auth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetFormData>({
    resolver: zodResolver(requestResetSchema),
  });

  const onSubmit = async (data: RequestResetFormData) => {
    setIsSubmitting(true);
    try {
      await usersApi.requestPasswordReset(data);
      setEmailSentTo(data.email);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          // Por seguridad, no revelamos si el email existe o no
          setEmailSentTo(data.email);
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

  if (emailSentTo) {
    return (
      <AuthLayout
        title={t('resetPassword.emailSent.title')}
        subtitle={t('resetPassword.emailSent.subtitle', { email: emailSentTo })}
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
            {t('resetPassword.emailSent.body')}
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <ArrowLeft size={14} />
              {t('resetPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('resetPassword.requestTitle')}
      subtitle={t('resetPassword.requestSubtitle')}
      footer={
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={14} />
          {t('resetPassword.backToLogin')}
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            {t('resetPassword.emailLabel')}
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
            ? t('resetPassword.submittingButton')
            : t('resetPassword.submitButton')}
        </button>
      </form>
    </AuthLayout>
  );
}