import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { OnboardingWizard } from '@/features/alerts/components/onboarding-wizard';
import { useShouldShowOnboarding } from '@/features/alerts/hooks/use-should-show-onboarding';

export function AppLayout() {
  const { shouldShow } = useShouldShowOnboarding();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {shouldShow && <OnboardingWizard />}
    </div>
  );
}