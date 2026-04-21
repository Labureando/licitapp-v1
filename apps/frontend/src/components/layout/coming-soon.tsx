import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Construction } from 'lucide-react';

interface ComingSoonProps {
  name: string;
}

export function ComingSoon({ name }: ComingSoonProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <Helmet>
        <title>
          {name} · {t('app.name')}
        </title>
      </Helmet>

      <div className="min-h-[60vh] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <Construction size={24} className="text-primary" />
          </div>
          <h1 className="text-xl font-semibold">{name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('errors.comingSoonBody')}
          </p>
        </div>
      </div>
    </>
  );
}