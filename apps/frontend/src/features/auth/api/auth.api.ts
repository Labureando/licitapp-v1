import { apiPost, apiGet } from '@/lib/api-client';
import type {
  AuthUser,
  LoginResponse,
  CompleteSignupResponse,
  RefreshResponse,
  SignupResponse,
  LogoutResponse,
} from '../types';
import type {
  LoginFormData,
  RegisterFormData,
  CompleteSignupFormData,
} from '../schemas/auth.schemas';

/**
 * API del módulo auth.
 *
 * IMPORTANTE: El backend NO envuelve respuestas en {success, data}.
 * Los tipos son directos. Tampoco necesitamos .unwrap() ni nada parecido.
 *
 * Nota sobre snake_case: el backend usa refresh_token y access_token
 * (snake_case) en requests y responses. Los tipos lo reflejan.
 */
export const authApi = {
  /**
   * POST /auth/login
   * Rate limit: 5 req/15min + brute force bloquea IP tras 5 fallos.
   */
  async login(data: LoginFormData): Promise<LoginResponse> {
    return apiPost<LoginResponse, LoginFormData>('/auth/login', data);
  },

  /**
   * POST /auth/signup (step 1)
   * Envía email con token de verificación (24h validez).
   */
  async signup(data: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    timezone?: string;
  }): Promise<SignupResponse> {
    return apiPost<SignupResponse>('/auth/signup', data);
  },

  /**
   * POST /auth/complete-signup/:token (step 2)
   * Establece password y activa cuenta. Devuelve tokens (auto-login).
   */
  async completeSignup(
    token: string,
    data: CompleteSignupFormData
  ): Promise<CompleteSignupResponse> {
    return apiPost<CompleteSignupResponse, CompleteSignupFormData>(
      `/auth/complete-signup/${token}`,
      data
    );
  },

  /**
   * POST /auth/refresh
   * Rota el refresh_token: devuelve ambos tokens nuevos.
   */
  async refresh(refreshToken: string): Promise<RefreshResponse> {
    return apiPost<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  /**
   * POST /auth/logout
   * Invalida el refresh_token. Requiere estar autenticado.
   */
  async logout(refreshToken: string): Promise<LogoutResponse> {
    return apiPost<LogoutResponse>('/auth/logout', {
      refresh_token: refreshToken,
    });
  },

  /**
   * GET /auth/me
   * Devuelve usuario extendido (con phone, userPlan, etc.).
   */
  async me(): Promise<AuthUser> {
    return apiGet<AuthUser>('/auth/me');
  },

  /**
   * GET /auth/google
   * Inicia flujo OAuth. Redirige al usuario, no se usa fetch.
   */
  getGoogleOAuthUrl(): string {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    return `${baseUrl}/auth/google`;
  },
};