import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@base-ui/react/dialog';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useOnboardingStore } from '../stores/onboarding-store';
import { alertsApi } from '../api/alerts.api';
import { cn } from '@/lib/utils';
import type { OnboardingData } from '../schemas/onboarding.schemas';
import { StepSector } from './onboarding-steps/step-sector';
import { StepRegions } from './onboarding-steps/step-regions';
import { StepBudget } from './onboarding-steps/step-budget';
import { StepFinalize } from './onboarding-steps/step-finalize';

const TOTAL_STEPS = 4;

export function OnboardingWizard() {
  const { t } = useTranslation('alerts');
  const [open, setOpen] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<Partial<OnboardingData>>({
    frequency: 'daily',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { markCompleted, markSkipped } = useOnboardingStore();

  const handleNext = (stepData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...stepData }));
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => setCurrentStep((s) => Math.max(1, s - 1));

  const handleSkip = () => {
    markSkipped();
    setOpen(false);
  };

  const handleFinalize = async (finalData: Partial<OnboardingData>) => {
    const fullData = { ...data, ...finalData } as OnboardingData;
    setIsSubmitting(true);
    try {
      await alertsApi.create({
        name: fullData.name,
        description: fullData.sector,
        ccaas: fullData.ccaas,
        importeMin: fullData.importeMin || undefined,
        importeMax: fullData.importeMax || undefined,
        palabrasClave: fullData.palabrasClave || undefined,
        isActive: true,
      });
      markCompleted();
      toast.success(t('onboarding.success.title'));
      setOpen(false);
    } catch (error) {
      toast.error(t('form.errors.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Popup
          className={cn(
            'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl',
            'p-6'
          )}
        >
          {/* Header con progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Dialog.Title className="text-lg font-semibold">
                  {t('onboarding.title')}
                </Dialog.Title>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {t('onboarding.subtitle')}
                </p>
              </div>
              <button
                onClick={handleSkip}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                <X size={14} />
                {t('onboarding.skip')}
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => {
                const step = i + 1;
                const isCompleted = step < currentStep;
                const isCurrent = step === currentStep;
                return (
                  <div
                    key={step}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      isCompleted
                        ? 'bg-primary'
                        : isCurrent
                        ? 'bg-primary/60'
                        : 'bg-muted'
                    )}
                  />
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {t('common:pagination.page', {
                current: currentStep,
                total: TOTAL_STEPS,
              })}
            </p>
          </div>

          {/* Steps */}
          {currentStep === 1 && (
            <StepSector
              defaultValue={data.sector || ''}
              onNext={(val) => handleNext(val)}
            />
          )}
          {currentStep === 2 && (
            <StepRegions
              defaultValue={data.ccaas || []}
              onBack={handleBack}
              onNext={(val) => handleNext(val)}
            />
          )}
          {currentStep === 3 && (
            <StepBudget
              defaultMin={data.importeMin}
              defaultMax={data.importeMax}
              onBack={handleBack}
              onNext={(val) => handleNext(val)}
            />
          )}
          {currentStep === 4 && (
            <StepFinalize
              defaultData={data}
              isSubmitting={isSubmitting}
              onBack={handleBack}
              onFinalize={handleFinalize}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}