import axios from 'axios';
import type {
  AxiosError,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

/**
 * Instancia de Axios para todas las llamadas al backend.
 *
 * Interceptores aplicados (en orden de ejecución real tras registro):
 * 1. Request: añade Bearer token desde el Zustand store
 * 2. Response (éxito): desenvuelve envelope {success, data} — con excepciones
 * 3. Response (error): maneja 401 → refresh automático con mutex
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Alias retrocompatible para código que importa { api } del placeholder anterior
export const api = apiClient;

// ─────────────────────────────────────
//   Rutas que NO deben ser unwrappeadas
// ─────────────────────────────────────
// El backend tiene inconsistencia en el formato de respuesta:
// - /auth/* → {success, data: {...payload}}                    ← unwrap OK
// - /licitaciones → {success, data: {data: [...], pagination}} ← doble envoltura
//
// Para las rutas de licitaciones el código legacy del compañero ya lee
// response.data.data, así que si desenvolvemos una vez rompemos su código.
// Hasta que unifiquemos el envelope en backend, las excluimos aquí.

const SKIP_UNWRAP_PATHS = ['/licitaciones'];

// ─────────────────────────────────────
//   Request interceptor: Bearer token
// ─────────────────────────────────────

apiClient.interceptors.request.use(
  async (config) => {
    // Import dinámico para evitar dependencia circular con el store
    const { useAuthStore } = await import('@/stores/auth-store');
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────
//   Response interceptor: 401 + refresh
// ─────────────────────────────────────

// Mutex: evita que múltiples peticiones en paralelo disparen varios refresh
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

/**
 * Rutas donde NO debemos redirigir automáticamente a /login
 * (están pensadas para ser accesibles sin sesión).
 */
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/complete-signup',
  '/reset-password',
  '/auth/callback',
  '/',
];

function handleAuthFailure() {
  // Limpia el store
  import('@/stores/auth-store').then(({ useAuthStore }) => {
    useAuthStore.getState().clear();
  });

  // Redirige solo si NO estamos ya en una ruta pública
  const currentPath = window.location.pathname;
  const isOnPublicPath = PUBLIC_PATHS.some((p) =>
    p === '/' ? currentPath === '/' : currentPath.startsWith(p)
  );
  if (!isOnPublicPath) {
    const redirectTo = encodeURIComponent(currentPath + window.location.search);
    window.location.href = `/login?redirect=${redirectTo}`;
  }
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig;

    // Si no es 401 o ya hemos reintentado, propagamos el error
    if (
      !error.response ||
      error.response.status !== 401 ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    // Evitamos loop infinito en el propio endpoint de refresh
    if (originalRequest.url?.includes('/auth/refresh')) {
      handleAuthFailure();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // Si ya hay un refresh en curso, esperamos a que termine
    if (isRefreshing && refreshPromise) {
      try {
        const newToken = await refreshPromise;
        if (newToken && originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return apiClient(originalRequest);
        }
      } catch {
        return Promise.reject(error);
      }
    }

    // Iniciamos nuevo refresh
    isRefreshing = true;
    refreshPromise = (async () => {
      try {
        const { useAuthStore } = await import('@/stores/auth-store');
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          handleAuthFailure();
          return null;
        }

        // Llamamos al endpoint de refresh con axios "pelado" (no apiClient)
        // para que NO pase por este mismo interceptor. Aplicamos manualmente
        // el desenvolvimiento del envelope {success, data}.
        const rawResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: refreshToken }
        );

        // El backend devuelve {success, data: {access_token, refresh_token}, ...}
        const data = rawResponse.data?.data ?? rawResponse.data;

        if (!data?.access_token || !data?.refresh_token) {
          handleAuthFailure();
          return null;
        }

        // Guardamos los nuevos tokens en el store
        useAuthStore.getState().setTokens({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
        });

        return data.access_token;
      } catch {
        handleAuthFailure();
        return null;
      } finally {
        isRefreshing = false;
        refreshPromise = null;
      }
    })();

    try {
      const newToken = await refreshPromise;
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }
    } catch {
      // Ya manejado arriba
    }
    return Promise.reject(error);
  }
);

// ─────────────────────────────────────
//   Response interceptor: unwrap envelope
// ─────────────────────────────────────
// El backend envuelve la mayoría de respuestas en {success, data, timestamp, path}.
// Este interceptor extrae el data para que el resto del código frontend
// trabaje con la respuesta "plana".
//
// Excluye rutas en SKIP_UNWRAP_PATHS porque ya tienen un doble envelope
// que el código legacy espera sin desenvolver (ej: /licitaciones con paginación).

apiClient.interceptors.response.use((response) => {
  const url = response.config.url || '';

  // Skip para rutas que el código legacy maneja manualmente
  const shouldSkip = SKIP_UNWRAP_PATHS.some((p) => url.includes(p));
  if (shouldSkip) return response;

  if (
    response.data &&
    typeof response.data === 'object' &&
    'success' in response.data &&
    'data' in response.data &&
    response.data.data !== undefined &&
    response.data.data !== null
  ) {
    response.data = response.data.data;
  }
  return response;
});

// ─────────────────────────────────────
//   Helpers tipados
// ─────────────────────────────────────

export async function apiGet<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function apiPost<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, body, config);
  return response.data;
}

export async function apiPatch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.patch<T>(url, body, config);
  return response.data;
}

export async function apiDelete<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.delete<T>(url, config);
  return response.data;
}