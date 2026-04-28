/**
 * Types de autenticación.
 * Ajustados al backend real (sin envelope {success, data}).
 */

// Roles del sistema (del enum Role del backend)
export type UserRole = 'PUBLIC_USER' | 'ADMIN' | 'SUPER_ADMIN';

// Planes (del enum Plan del backend, solo expuesto en /me)
export type UserPlan = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

/**
 * Usuario básico devuelto en login/signup.
 * No incluye userPlan (eso viene solo en /auth/me).
 */
export interface AuthUserBase {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

/**
 * Usuario extendido devuelto en /auth/me.
 * Incluye campos adicionales (phone, userPlan, updatedAt).
 */
export interface AuthUser extends AuthUserBase {
  phone?: string;
  userPlan?: UserPlan;
  updatedAt?: string;
  timezone?: string;
}

/**
 * Respuesta de POST /auth/login.
 * Devuelta directamente SIN envoltura {success, data}.
 */
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: AuthUserBase;
}

/**
 * Respuesta de POST /auth/complete-signup/:token.
 * Idéntica estructura a LoginResponse.
 */
export type CompleteSignupResponse = LoginResponse;

/**
 * Respuesta de POST /auth/refresh.
 */
export interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

/**
 * Respuesta de POST /auth/signup (step 1).
 */
export interface SignupResponse {
  message: string; // "Se ha enviado un email a X con las instrucciones..."
}

/**
 * Respuesta de POST /auth/logout.
 */
export interface LogoutResponse {
  message: string;
}

/**
 * Estado de hidratación de auth al arrancar la app.
 */
export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

// ─── Actualizar perfil (PATCH /users/:userId) ───
export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phone?: string;
  timezone?: string;
}

// ─── Cambiar password (PATCH /users/password/change) ───
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  newPasswordConfirm: string;   
}

// ─── Reset password ───
export interface RequestPasswordResetPayload {
  email: string;
}

export interface ConfirmPasswordResetPayload {
  token: string;
  newPassword: string;
}

// ─── Genérico: respuesta con solo mensaje ───
export interface MessageResponse {
  message: string;
}