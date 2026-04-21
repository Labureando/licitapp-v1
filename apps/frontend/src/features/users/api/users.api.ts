import { apiPatch, apiPost, apiGet } from '@/lib/api-client';
import type {
  AuthUser,
  UpdateUserPayload,
  ChangePasswordPayload,
  RequestPasswordResetPayload,
  ConfirmPasswordResetPayload,
  MessageResponse,
} from '@/features/auth/types';

/**
 * API de users y gestión de password.
 *
 * IMPORTANTE sobre el envelope:
 * El backend envuelve las respuestas en {success, data}, pero el interceptor
 * global en api-client.ts (Sprint A1) las desenvuelve automáticamente.
 * Por tanto aquí trabajamos con payloads planos.
 *
 * IMPORTANTE sobre ownership:
 * Los endpoints PATCH /users/:userId y DELETE /users/:userId tienen
 * SecureOwnershipEndpoint. El userId del param DEBE coincidir con el sub
 * del JWT. Siempre pasamos `useAuthStore.getState().user.id`.
 */
export const usersApi = {
  /**
   * GET /users/:userId
   * Devuelve usuario por ID. Ownership requerido.
   */
  async getUser(userId: string): Promise<AuthUser> {
    return apiGet<AuthUser>(`/users/${userId}`);
  },

  /**
   * PATCH /users/:userId
   * Actualiza nombre, apellidos, teléfono, timezone. Ownership requerido.
   */
  async updateUser(
    userId: string,
    payload: UpdateUserPayload
  ): Promise<AuthUser> {
    return apiPatch<AuthUser, UpdateUserPayload>(
      `/users/${userId}`,
      payload
    );
  },

  /**
   * PATCH /users/password/change
   * Cambia password del usuario autenticado. Requiere oldPassword válida.
   */
  async changePassword(
    payload: ChangePasswordPayload
  ): Promise<MessageResponse> {
    return apiPatch<MessageResponse, ChangePasswordPayload>(
      '/users/password/change',
      payload
    );
  },

  /**
   * POST /users/password/request
   * Envía email con token de reset (validez 1h según backend).
   * NO requiere autenticación.
   */
  async requestPasswordReset(
    payload: RequestPasswordResetPayload
  ): Promise<MessageResponse> {
    return apiPost<MessageResponse, RequestPasswordResetPayload>(
      '/users/password/request',
      payload
    );
  },

  /**
   * POST /users/password/confirm
   * Completa reset con token. ¡TOKEN VA EN EL BODY, NO EN URL!
   * NO requiere autenticación.
   */
async confirmPasswordReset(
  payload: ConfirmPasswordResetPayload
): Promise<MessageResponse> {
  const { token, ...body } = payload;
  return apiPost<MessageResponse, { newPassword: string }>(
    `/users/password/confirm/${token}`,
    body
  );
},
}