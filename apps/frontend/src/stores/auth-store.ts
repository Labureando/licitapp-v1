import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import type { AuthUser, AuthStatus } from '@/features/auth/types';

interface AuthState {
  // Estado
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  status: AuthStatus;

  // Acciones síncronas
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: { accessToken: string; refreshToken: string }) => void;
  setStatus: (status: AuthStatus) => void;
  clear: () => void;

  // Acciones async
  hydrate: () => Promise<void>;

  // Helpers derivados
  isAuthenticated: () => boolean;
  isTokenExpiringSoon: () => boolean;
}

interface JwtPayload {
  exp: number;
  sub: string;
  email?: string;
  role?: string;
}

const TOKEN_EXPIRY_BUFFER_SECONDS = 60; // considerar expirado 60s antes

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: 'idle',

      setUser: (user) => set({ user }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      setStatus: (status) => set({ status }),

      clear: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: 'unauthenticated',
        }),

      /**
       * Se ejecuta al arrancar la app (desde AuthHydrator en main.tsx).
       *
       * Flujo:
       * 1. Si no hay tokens → status = 'unauthenticated'
       * 2. Si hay tokens → llamar a /auth/me para confirmar sesión
       * 3. Si falla (401) → el interceptor dispara refresh automáticamente
       * 4. Si refresh falla → clear() y 'unauthenticated'
       */
      hydrate: async () => {
        const { accessToken, refreshToken } = get();
        if (!accessToken || !refreshToken) {
          set({ status: 'unauthenticated' });
          return;
        }

        set({ status: 'loading' });

        try {
          const { authApi } = await import('@/features/auth/api/auth.api');
          const user = await authApi.me();
          set({ user, status: 'authenticated' });
        } catch {
          // El interceptor ya habrá intentado refresh. Si seguimos aquí, falló.
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            status: 'unauthenticated',
          });
        }
      },

      isAuthenticated: () => {
        const { accessToken, user } = get();
        return !!accessToken && !!user;
      },

      isTokenExpiringSoon: () => {
        const { accessToken } = get();
        if (!accessToken) return true;
        try {
          const { exp } = jwtDecode<JwtPayload>(accessToken);
          const now = Math.floor(Date.now() / 1000);
          return exp - now < TOKEN_EXPIRY_BUFFER_SECONDS;
        } catch {
          return true;
        }
      },
    }),
    {
      name: 'licitapp-auth',
      storage: createJSONStorage(() => localStorage),
      // Solo persistimos tokens y user, NO el status
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);