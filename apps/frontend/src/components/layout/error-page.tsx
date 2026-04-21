import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';

interface ErrorPageProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorPage({ title, message, onRetry }: ErrorPageProps) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 text-destructive mb-4">
          <AlertCircle size={24} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {title || t('errors.generic')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {message || t('errors.tryAgain')}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="h-10 px-4 rounded-md border border-input text-sm hover:bg-accent flex items-center gap-2"
            >
              <RefreshCw size={14} />
              {t('actions.retry')}
            </button>
          )}
          <Link
            to="/"
            className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <Home size={14} />
            {t('navigation.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}