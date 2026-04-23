import { useQuery } from '@tanstack/react-query';
import { useOnboardingStore } from '../stores/onboarding-store';
import { alertsApi } from '../api/alerts.api';
import { useAuth } from '@/features/auth/hooks/use-auth';

export function useShouldShowOnboarding() {
  const { isAuthenticated } = useAuth();
  const { completed, skipped } = useOnboardingStore();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => alertsApi.list(),
    enabled: isAuthenticated && !completed && !skipped,
  });

  return {
    shouldShow:
      isAuthenticated && !completed && !skipped && !isLoading && alerts?.length === 0,
    isLoading,
  };
}