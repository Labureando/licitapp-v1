import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import axios from 'axios';

import { useAuthStore } from '@/stores/auth-store';
import { usersApi } from '../api/users.api';
import {
  updateProfileSchema,
  type UpdateProfileFormData,
} from '../schemas/users.schemas';
import { cn } from '@/lib/utils';

const COMMON_TIMEZONES = [
  'Europe/Madrid',
  'Europe/Lisbon',
  'Europe/Paris',
  'Europe/London',
  'America/Mexico_City',
  'America/Buenos_Aires',
  'America/Santiago',
  'America/Bogota',
  'America/Lima',
  'UTC',
];

export function AjustesPerfilTab() {
  const { t } = useTranslation('settings');
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) {
    return (
      <div className="text-sm text-muted-foreground">
        {t('common:status.loading')}
      </div>
    );
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      timezone:
        user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const onSubmit = async (data: UpdateProfileFormData) => {
    setIsSubmitting(true);
    try {
      const updated = await usersApi.updateUser(user.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone || undefined,
        timezone: data.timezone || undefined,
      });
      setUser({ ...user, ...updated });
      toast.success(t('profile.success'));
      reset(data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          toast.error(t('profile.errors.forbidden'));
        } else if (error.response?.status === 429) {
          toast.error(t('profile.errors.rateLimit'));
        } else {
          toast.error(t('profile.errors.generic'));
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
        <h2 className="text-lg font-semibold">{t('profile.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('profile.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium mb-1.5"
            >
              {t('profile.firstName')}
            </label>
            <input
              id="firstName"
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
              {t('profile.lastName')}
            </label>
            <input
              id="lastName"
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
          <label className="block text-sm font-medium mb-1.5">
            {t('profile.email')}
          </label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full h-10 px-3 rounded-md border border-input bg-muted text-sm text-muted-foreground cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t('profile.emailHelp')}
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            {t('profile.phone')}{' '}
            <span className="text-muted-foreground">
              {t('profile.phoneOptional')}
            </span>
          </label>
          <input
            id="phone"
            type="tel"
            placeholder={t('profile.phonePlaceholder')}
            {...register('phone')}
            className={cn(
              'w-full h-10 px-3 rounded-md border bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              errors.phone ? 'border-destructive' : 'border-input'
            )}
          />
        </div>

        <div>
          <label
            htmlFor="timezone"
            className="block text-sm font-medium mb-1.5"
          >
            {t('profile.timezone')}
          </label>
          <select
            id="timezone"
            {...register('timezone')}
            className={cn(
              'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-muted-foreground">
            {t('profile.timezoneHelp')}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={!isDirty || isSubmitting}
            className={cn(
              'h-9 px-4 rounded-md bg-primary text-primary-foreground',
              'font-medium text-sm hover:bg-primary/90',
              'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            )}
          >
            {isSubmitting
              ? t('profile.savingButton')
              : t('profile.saveButton')}
          </button>
          {isDirty && (
            <button
              type="button"
              onClick={() => reset()}
              className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent"
            >
              {t('profile.discardButton')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}