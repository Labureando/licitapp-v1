import { z } from 'zod';
import i18n from '@/i18n/config';

/**
 * Los mensajes de validación genéricos (required, min, max, email) se
 * resuelven automáticamente vía el error map global configurado en
 * `i18n/zod-errors.ts`. Aquí solo especificamos mensajes CUSTOM para
 * casos específicos (regex de password, acceptTerms).
 *
 * Usamos `i18n.t` directamente porque los schemas se crean fuera de
 * componentes React.
 */

const t = i18n.t.bind(i18n);

/**
 * Schema de login.
 */
export const loginSchema = z.object({
  email: z.string().min(1).email(),
  password: z.string().min(8),
});

export type LoginFormData = z.infer<typeof loginSchema>;

/**
 * Schema de registro (step 1).
 */
export const registerSchema = z.object({
  email: z.string().min(1).email(),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().max(20).optional().or(z.literal('')),
  acceptTerms: z.literal(true, {
    errorMap: () => ({
      message: t('auth:register.validation.acceptTermsRequired'),
    }),
  }),
});

export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Schema para completar signup (step 2).
 * Regex coincide con el backend.
 */
const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const completeSignupSchema = z
  .object({
    password: z
      .string()
      .min(8)
      .regex(passwordRegex, () => t('auth:completeSignup.errors.invalidToken')),
    passwordConfirm: z.string().min(1),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: 'passwordMismatch',
    path: ['passwordConfirm'],
  });

export type CompleteSignupFormData = z.infer<typeof completeSignupSchema>;

/**
 * Helpers para UI del checklist de requisitos de password.
 * Los ids se usan en t('auth:passwordRequirements.<id>').
 */
export const passwordRequirements = [
  {
    id: 'length',
    test: (v: string) => v.length >= 8,
  },
  {
    id: 'lowercase',
    test: (v: string) => /[a-z]/.test(v),
  },
  {
    id: 'uppercase',
    test: (v: string) => /[A-Z]/.test(v),
  },
  {
    id: 'number',
    test: (v: string) => /\d/.test(v),
  },
  {
    id: 'special',
    test: (v: string) => /[@$!%*?&]/.test(v),
  },
] as const;