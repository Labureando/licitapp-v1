import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface StepSectorProps {
  defaultValue: string;
  onNext: (data: { sector: string }) => void;
}

export function StepSector({ defaultValue, onNext }: StepSectorProps) {
  const { t } = useTranslation('alerts');
  const [sector, setSector] = useState(defaultValue);
  const canContinue = sector.trim().length >= 3;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t('onboarding.step1.title')}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('onboarding.step1.subtitle')}
        </p>
      </div>

      <textarea
        value={sector}
        onChange={(e) => setSector(e.target.value)}
        placeholder={t('onboarding.step1.placeholder')}
        rows={3}
        autoFocus
        className={cn(
          'w-full px-3 py-2 rounded-md border border-input bg-background text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'resize-none'
        )}
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onNext({ sector: sector.trim() })}
          disabled={!canContinue}
          className={cn(
            'h-9 px-4 rounded-md bg-primary text-primary-foreground',
            'font-medium text-sm hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {t('onboarding.step1.next')}
        </button>
      </div>
    </div>
  );
}