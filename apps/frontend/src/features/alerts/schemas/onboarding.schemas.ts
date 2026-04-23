import { z } from 'zod';

export const onboardingStep1Schema = z.object({
  sector: z.string().min(3, 'Describe brevemente tu sector'),
});

export const onboardingStep2Schema = z.object({
  ccaas: z.array(z.string()).min(1, 'Selecciona al menos una comunidad'),
});

export const onboardingStep3Schema = z.object({
  importeMin: z.string().optional().or(z.literal('')),
  importeMax: z.string().optional().or(z.literal('')),
});

export const onboardingStep4Schema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(255),
  palabrasClave: z.string().optional().or(z.literal('')),
  frequency: z.enum(['instant', 'daily', 'weekly']),
});

export type OnboardingData = z.infer<typeof onboardingStep1Schema> &
  z.infer<typeof onboardingStep2Schema> &
  z.infer<typeof onboardingStep3Schema> &
  z.infer<typeof onboardingStep4Schema>;