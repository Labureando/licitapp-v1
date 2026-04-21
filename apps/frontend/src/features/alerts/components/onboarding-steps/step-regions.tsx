import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// Lista estática de CCAAs. En producción se podría sacar de `/licitaciones/filters`
const CCAAS = [
  'Andalucía',
  'Aragón',
  'Canarias',
  'Cantabria',
  'Castilla y León',
  'Castilla-La Mancha',
  'Cataluña',
  'Ciudad Autónoma de Ceuta',
  'Ciudad Autónoma de Melilla',
  'Comunidad Foral de Navarra',
  'Comunidad de Madrid',
  'Comunitat Valenciana',
  'Extremadura',
  'Galicia',
  'Illes Balears',
  'La Rioja',
  'País Vasco',
  'Principado de Asturias',
  'Región de Murcia',
];

interface StepRegionsProps {
  defaultValue: string[];
  onBack: () => void;
  onNext: (data: { ccaas: string[] }) => void;
}

export function StepRegions({ defaultValue, onBack, onNext }: StepRegionsProps) {
  const { t } = useTranslation('alerts');
  const [selected, setSelected] = useState<Set<string>>(new Set(defaultValue));

  const toggle = (ccaa: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ccaa)) next.delete(ccaa);
      else next.add(ccaa);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(CCAAS));
  const deselectAll = () => setSelected(new Set());

  const canContinue = selected.size > 0;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-base font-semibold">{t('onboarding.step2.title')}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('onboarding.step2.subtitle')}
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs">
        <button
          type="button"
          onClick={selectAll}
          className="text-primary hover:underline"
        >
          {t('onboarding.step2.selectAll')}
        </button>
        <span className="text-muted-foreground">·</span>
        <button
          type="button"
          onClick={deselectAll}
          className="text-muted-foreground hover:text-foreground"
        >
          {t('onboarding.step2.deselectAll')}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
        {CCAAS.map((ccaa) => (
          <label
            key={ccaa}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md border text-sm cursor-pointer transition-colors',
              selected.has(ccaa)
                ? 'border-primary bg-primary/10'
                : 'border-input hover:bg-accent'
            )}
          >
            <input
              type="checkbox"
              checked={selected.has(ccaa)}
              onChange={() => toggle(ccaa)}
              className="h-4 w-4 accent-primary"
            />
            <span className="flex-1 truncate">{ccaa}</span>
          </label>
        ))}
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
          onClick={() => onNext({ ccaas: Array.from(selected) })}
          disabled={!canContinue}
          className={cn(
            'h-9 px-4 rounded-md bg-primary text-primary-foreground',
            'font-medium text-sm hover:bg-primary/90',
            'disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          )}
        >
          {t('onboarding.step2.next')}
        </button>
      </div>
    </div>
  );
}