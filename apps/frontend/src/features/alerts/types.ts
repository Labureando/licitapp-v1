export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface Alert {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  email?: string | null;
  estados?: string[] | null;
  tiposContrato?: string[] | null;
  procedimientos?: string[] | null;
  tramitaciones?: string[] | null;
  ccaas?: string[] | null;
  provincias?: string[] | null;
  cpvCodes?: string[] | null;
  importeMin?: string | null;
  importeMax?: string | null;
  palabrasClave?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAlertPayload {
  name: string;
  description?: string;
  email?: string;
  estados?: string[];
  tiposContrato?: string[];
  procedimientos?: string[];
  tramitaciones?: string[];
  ccaas?: string[];
  provincias?: string[];
  cpvCodes?: string[];
  importeMin?: string;
  importeMax?: string;
  palabrasClave?: string;
  isActive?: boolean;
}

export type UpdateAlertPayload = Partial<CreateAlertPayload>;