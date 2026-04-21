import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import type { Alert, CreateAlertPayload, UpdateAlertPayload } from '../types';

export const alertsApi = {
  /** GET /alerts — lista de alertas del usuario */
  async list(): Promise<Alert[]> {
    return apiGet<Alert[]>('/alerts');
  },

  /** GET /alerts/:id — detalle */
  async get(id: string): Promise<Alert> {
    return apiGet<Alert>(`/alerts/${id}`);
  },

  /** POST /alerts */
  async create(payload: CreateAlertPayload): Promise<Alert> {
    return apiPost<Alert, CreateAlertPayload>('/alerts', payload);
  },

  /** PATCH /alerts/:id */
  async update(id: string, payload: UpdateAlertPayload): Promise<Alert> {
    return apiPatch<Alert, UpdateAlertPayload>(`/alerts/${id}`, payload);
  },

  /** DELETE /alerts/:id */
  async delete(id: string): Promise<void> {
    return apiDelete(`/alerts/${id}`);
  },
};