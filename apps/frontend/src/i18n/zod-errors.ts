import { z } from 'zod';
import i18n from './config';

/**
 * Mapa global de errores de Zod → traducciones.
 *
 * Se aplica a TODAS las validaciones del proyecto que no especifiquen
 * mensaje custom. Los mensajes custom en schemas (ej: `.min(2, 'Mínimo 2')`)
 * SÍ se respetan y no pasan por este map.
 *
 * Uso: llamar `setupZodErrors()` en main.tsx al arrancar la app.
 */
export function setupZodErrors() {
  z.setErrorMap((issue, ctx) => {
    const t = i18n.t.bind(i18n);

    switch (issue.code) {
      case z.ZodIssueCode.invalid_type:
        if (issue.received === 'undefined' || issue.received === 'null') {
          return { message: t('common:validation.required') };
        }
        break;

      case z.ZodIssueCode.too_small:
        if (issue.type === 'string') {
          if (issue.minimum === 1) {
            return { message: t('common:validation.required') };
          }
          return {
            message: t('common:validation.tooShort', { min: issue.minimum }),
          };
        }
        break;

      case z.ZodIssueCode.too_big:
        if (issue.type === 'string') {
          return {
            message: t('common:validation.tooLong', { max: issue.maximum }),
          };
        }
        break;

      case z.ZodIssueCode.invalid_string:
        if (issue.validation === 'email') {
          return { message: t('common:validation.invalidEmail') };
        }
        break;
    }
    return { message: ctx.defaultError };
  });
}