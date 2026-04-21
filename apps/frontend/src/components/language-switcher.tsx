import { Menu } from '@base-ui/react/menu';
import { Globe, Check, AlertCircle } from 'lucide-react';
import { useLanguage } from '@/i18n/use-language';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  /** Variante visual: 'icon' solo icono, 'full' con texto del idioma */
  variant?: 'icon' | 'full';
}

export function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const { current, change, available, currentMeta } = useLanguage();

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'inline-flex items-center gap-2 rounded-md text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          variant === 'icon'
            ? 'h-8 w-8 justify-center'
            : 'h-9 px-3'
        )}
        aria-label="Cambiar idioma"
      >
        {variant === 'icon' ? (
          <Globe size={16} />
        ) : (
          <>
            <span aria-hidden>{currentMeta.flag}</span>
            <span>{currentMeta.name}</span>
          </>
        )}
      </Menu.Trigger>

      <Menu.Portal>
        <Menu.Positioner sideOffset={8} align="end">
          <Menu.Popup
            className={cn(
              'min-w-[180px] rounded-md border border-border bg-popover',
              'text-popover-foreground shadow-md p-1 text-sm'
            )}
          >
            {available.map((lang) => (
              <Menu.Item
                key={lang.code}
                onClick={() => change(lang.code)}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <span aria-hidden className="text-base">
                  {lang.flag}
                </span>
                <span className="flex-1">{lang.name}</span>
                {lang.needsReview && (
                  <AlertCircle
                    size={12}
                    className="text-amber-500 shrink-0"
                    aria-label="Traducción pendiente de revisión nativa"
                  />
                )}
                {lang.code === current && (
                  <Check size={14} className="text-primary shrink-0" />
                )}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}