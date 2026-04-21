import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '../api/auth.api';

export function AuthCallbackPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');
    const errorMessage = searchParams.get('message');

    if (errorMessage) {
      toast.error(decodeURIComponent(errorMessage));
      navigate('/login', { replace: true });
      return;
    }

    if (!accessToken || !refreshToken) {
      toast.error(t('authCallback.errors.failed'));
      navigate('/login', { replace: true });
      return;
    }

    (async () => {
      try {
        useAuthStore.getState().setTokens({ accessToken, refreshToken });
        const user = await authApi.me();
        useAuthStore.getState().setUser(user);
        useAuthStore.getState().setStatus('authenticated');

        toast.success(t('authCallback.success', { name: user.firstName }));
        navigate('/app', { replace: true });
      } catch {
        useAuthStore.getState().clear();
        toast.error(t('authCallback.errors.noUser'));
        navigate('/login', { replace: true });
      }
    })();
  }, [searchParams, navigate, t]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          {t('authCallback.loading')}
        </p>
      </div>
    </div>
  );
}