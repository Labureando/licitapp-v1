import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../../schemas/onboarding.schemas';

interface StepFinalizeProps {
  defaultData: Partial<OnboardingData>;
  isSubmitting: boolean;
  onBack: () => void;
  onFinalize: (data: {
    name: string;
    palabrasClave?: string;
    frequency: 'instant' | 'daily' | 'weekly';
  }) => void;
}

export function StepFinalize({
  defaultData,
  isSubmitting,
  onBack,
  onFinalize,
}: StepFinalizeProps) {
  const { t } = useTranslation('alerts');
  const [name, setName] = useState(defaultData.name || '');
  const [palabrasClave, setPalabrasClave] = useState(defaultData.palabrasClave || '');
  const [frequency, setFrequency] = useState<'instant' | 'daily' | 'weekly'>(
    defaultData.frequency || 'daily'
  );

  const canContinue = name.trim().length > 0;

  const handleSubmit = () => {
    onFinalize({
      name: name.trim(),
      palabrasClave: palabrasClave.trim() || undefined,
      frequency,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t('onboarding.step4.title')}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('onboarding.step4.subtitle')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t('onboarding.step4.nameLabel')}
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('onboarding.step4.namePlaceholder')}
          autoFocus
          className={cn(
            'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1.5">
          {t('onboarding.step4.keywordsLabel')}
        </label>
        <input
          type="text"
          value={palabrasClave}
          onChange={(e) => setPalabrasClave(e.target.value)}
          placeholder="ej: mantenimiento, rehabilitación"
          className={cn(
            'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
          )}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {t('onboarding.step4.keywordsHelp')}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          {t('onboarding.step4.frequencyLabel')}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(['instant', 'daily', 'weekly'] as const).map((freq) => (
            <button
              key={freq}
              type="button"
              onClick={() => setFrequency(freq)}
              className={cn(
                'px-3 py-2 rounded-md border text-sm font-medium transition-colors',
                frequency === freq
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-input hover:bg-accent'
              )}
            >
              {t(`frequency.${freq}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent disabled:opacity-50"
        >
          {t('common:actions.back')}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canContinue || isSubmitting}
          className={cn(
            'h-9 px-4 rounded-md bg-primary text-primary-foreground',
            'font-medium text-sm hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {isSubmitting
            ? t('onboarding.step4.creating')
            : t('onboarding.step4.create')}
        </button>
      </div>
    </div>
  );
}