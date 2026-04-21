import { z } from 'zod';
import i18n from '@/i18n/config';

const t = i18n.t.bind(i18n);

// ═══════════════════════════════════════════════════════════
//   Actualizar perfil (en Ajustes → Perfil)
// ═══════════════════════════════════════════════════════════

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().max(20).optional().or(z.literal('')),
  timezone: z.string().optional().or(z.literal('')),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

// ═══════════════════════════════════════════════════════════
//   Cambiar password (en Ajustes → Seguridad)
// ═══════════════════════════════════════════════════════════

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1),
    newPassword: z
      .string()
      .min(8)
      .regex(passwordRegex),
    newPasswordConfirm: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: t('auth:register.validation.emailInvalid'), // Reusamos una clave genérica
    path: ['newPasswordConfirm'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser distinta de la actual',
    path: ['newPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ═══════════════════════════════════════════════════════════
//   Reset password
// ═══════════════════════════════════════════════════════════

export const requestResetSchema = z.object({
  email: z.string().min(1).email(),
});

export type RequestResetFormData = z.infer<typeof requestResetSchema>;

export const confirmResetSchema = z
  .object({
    newPassword: z.string().min(8).regex(passwordRegex),
    newPasswordConfirm: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirm, {
    message: 'Las contraseñas no coinciden',
    path: ['newPasswordConfirm'],
  });

export type ConfirmResetFormData = z.infer<typeof confirmResetSchema>;