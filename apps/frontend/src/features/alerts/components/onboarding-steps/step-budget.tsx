import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StepBudgetProps {
  defaultMin?: string;
  defaultMax?: string;
  onBack: () => void;
  onNext: (data: { importeMin?: string; importeMax?: string }) => void;
}

export function StepBudget({
  defaultMin,
  defaultMax,
  onBack,
  onNext,
}: StepBudgetProps) {
  const { t } = useTranslation('alerts');
  const [min, setMin] = useState(defaultMin || '');
  const [max, setMax] = useState(defaultMax || '');

  const handleNext = () => {
    onNext({
      importeMin: min || undefined,
      importeMax: max || undefined,
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t('onboarding.step3.title')}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('onboarding.step3.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('onboarding.step3.minLabel')}
          </label>
          <input
            type="number"
            value={min}
            onChange={(e) => setMin(e.target.value)}
            placeholder={t('onboarding.step3.minPlaceholder')}
            min="0"
            className={cn(
              'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            {t('onboarding.step3.maxLabel')}
          </label>
          <input
            type="number"
            value={max}
            onChange={(e) => setMax(e.target.value)}
            placeholder={t('onboarding.step3.maxPlaceholder')}
            min="0"
            className={cn(
              'w-full h-10 px-3 rounded-md border border-input bg-background text-sm',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          />
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-9 px-4 rounded-md border border-input text-sm hover:bg-accent"
        >
          {t('common:actions.back')}
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90"
        >
          {t('onboarding.step3.next')}
        </button>
      </div>
    </div>
  );
}