import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/use-language';
import { useTheme } from '@/providers/theme-provider';
import { cn } from '@/lib/utils';

export function AjustesPreferenciasTab() {
  const { t } = useTranslation('settings');
  const { current: currentLang, change: changeLang, available } = useLanguage();
  const { theme, setTheme } = useTheme();

  const handleLanguageChange = (code: string) => {
    changeLang(code as Parameters<typeof changeLang>[0]);
    toast.success(t('preferences.success'));
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    toast.success(t('preferences.success'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{t('preferences.title')}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {t('preferences.subtitle')}
        </p>
      </div>

      {/* Idioma */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-1">
          {t('preferences.language')}
        </h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t('preferences.languageHelp')}
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {available.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => handleLanguageChange(lang.code)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors text-left',
                currentLang === lang.code
                  ? 'border-primary bg-primary/5'
                  : 'border-input hover:bg-accent'
              )}
            >
              <span aria-hidden className="text-base">
                {lang.flag}
              </span>
              <span className="flex-1 truncate">{lang.name}</span>
              {lang.needsReview && (
                <AlertCircle
                  size={12}
                  className="text-amber-500 shrink-0"
                  aria-label={t('common:language.needsReview')}
                />
              )}
              {currentLang === lang.code && (
                <Check size={14} className="text-primary shrink-0" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tema */}
      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-sm font-medium mb-1">{t('preferences.theme')}</h3>
        <p className="text-xs text-muted-foreground mb-4">
          {t('preferences.themeHelp')}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {(['light', 'dark', 'system'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleThemeChange(mode)}
              className={cn(
                'px-3 py-2 rounded-md border text-sm transition-colors',
                theme === mode
                  ? 'border-primary bg-primary/5 font-medium'
                  : 'border-input hover:bg-accent'
              )}
            >
              {t(`common:theme.${mode}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}