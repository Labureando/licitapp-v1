import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  const { t } = useTranslation('common');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-6 px-4 sm:px-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 hover:opacity-80 transition-opacity"
        >
          <div
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center"
            style={{
              boxShadow: '0 0 16px oklch(from var(--primary) l c h / 0.35)',
            }}
          >
            <span className="font-black text-base text-primary-foreground leading-none">
              L
            </span>
          </div>
          <span className="font-bold tracking-tight">{t('app.name')}</span>
        </Link>
      </header>

      {/* Contenido principal */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-6 sm:p-8 shadow-sm">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 px-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {t('app.name')} · {t('app.tagline')}
      </footer>
    </div>
  );
}