import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface OnboardingState {
  /** Si el usuario ha completado o saltado el onboarding */
  completed: boolean;
  /** Si el usuario ha saltado explícitamente */
  skipped: boolean;

  markCompleted: () => void;
  markSkipped: () => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      completed: false,
      skipped: false,
      markCompleted: () => set({ completed: true, skipped: false }),
      markSkipped: () => set({ skipped: true, completed: false }),
      reset: () => set({ completed: false, skipped: false }),
    }),
    {
      name: 'licitapp-onboarding',
      storage: createJSONStorage(() => localStorage),
    }
  )
);