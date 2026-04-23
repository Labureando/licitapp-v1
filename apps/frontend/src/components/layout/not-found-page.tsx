import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold tracking-tight text-primary mb-2">
          404
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          {t('errors.notFound')}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
           {t('errors.notFoundBody')}
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={() => window.history.back()}
            className="h-10 px-4 rounded-md border border-input text-sm hover:bg-accent flex items-center gap-2"
          >
            <ArrowLeft size={14} />
            {t('actions.back')}
          </button>
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