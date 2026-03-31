import { z } from 'zod';

export const createAlertSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio').max(100),
  cpvCodes: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  excludeKeywords: z.array(z.string()).default([]),
  ccaa: z.array(z.string()).default([]),
  importeMin: z.number().min(0).optional(),
  importeMax: z.number().min(0).optional(),
  tiposContrato: z.array(z.string()).default([]),
  includeSubvenciones: z.boolean().default(false),
});

export const searchLicitacionesSchema = z.object({
  q: z.string().optional(),
  cpv: z.array(z.string()).optional(),
  ccaa: z.string().optional(),
  importeMin: z.number().optional(),
  importeMax: z.number().optional(),
  estado: z.string().optional(),
  tipoContrato: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevancia', 'fecha', 'importe', 'deadline']).default('fecha'),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  avatarUrl: z.string().url().optional(),
});

export const updateOrgSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  nif: z.string().regex(/^[A-Z]\d{7}[A-Z0-9]$/, 'NIF/CIF inválido').optional(),
  sector: z.string().optional(),
  ccaa: z.string().optional(),
  cpvPreferences: z.array(z.string()).optional(),
});

export type CreateAlertInput = z.infer<typeof createAlertSchema>;
export type SearchLicitacionesInput = z.infer<typeof searchLicitacionesSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;