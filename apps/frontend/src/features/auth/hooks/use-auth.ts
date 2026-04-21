import { useAuthStore } from '@/stores/auth-store';

/**
 * Hook principal de auth.
 * Usa selectores individuales para evitar re-renders innecesarios.
 *
 * Ejemplo:
 *   const { user, isAuthenticated, logout } = useAuth();
 */
export function useAuth() {
  // Selectores individuales — cada componente solo re-renderiza con lo que usa
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.accessToken);
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clear = useAuthStore((s) => s.clear);

  const isAuthenticated = !!user && !!accessToken;
  const isLoading = status === 'loading' || status === 'idle';

  return {
    user,
    status,
    accessToken,
    refreshToken,
    isAuthenticated,
    isLoading,
    clear,
  };
}

/**
 * Hook solo para el usuario (más ligero).
 */
export function useUser() {
  return useAuthStore((s) => s.user);
}