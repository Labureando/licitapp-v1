import React from 'react';
import { Menu } from '@base-ui/react/menu';
import { Check, Globe } from 'lucide-react';
import { useLanguage } from '@/i18n/use-language';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  /** Variante visual: 'icon' solo icono, 'full' con texto del idioma */
  variant?: 'icon' | 'full';
}

// ═══════════════════════════════════════════════════════════
//   Banderas SVG inline
//   Las emoji-flags no se renderizan bien en Windows por defecto.
//   SVGs garantizan consistencia entre plataformas.
// ═══════════════════════════════════════════════════════════

function FlagES() {
  return (
    <svg viewBox="0 0 640 480" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <path fill="#AA151B" d="M0 0h640v480H0z" />
      <path fill="#F1BF00" d="M0 120h640v240H0z" />
    </svg>
  );
}

function FlagCA() {
  return (
    <svg viewBox="0 0 810 540" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <path fill="#FCDD09" d="M0 0h810v540H0z" />
      <path
        stroke="#DA121A"
        strokeWidth="60"
        d="M0 90h810M0 210h810M0 330h810M0 450h810"
      />
    </svg>
  );
}

function FlagGL() {
  return (
    <svg viewBox="0 0 600 400" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <path fill="#fff" d="M0 0h600v400H0z" />
      <path fill="#0073CE" d="M0 200l600-200v67L120 200l480 133v67z" />
    </svg>
  );
}

function FlagEU() {
  // Ikurriña (bandera vasca)
  return (
    <svg viewBox="0 0 28 20" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <path fill="#D52B1E" d="M0 0h28v20H0z" />
      <path
        fill="#fff"
        d="M0 0l28 20M28 0L0 20"
        stroke="#fff"
        strokeWidth="3"
      />
      <path
        stroke="#009B48"
        strokeWidth="3"
        d="M14 0v20M0 10h28"
      />
    </svg>
  );
}

function FlagEN() {
  // Usamos Union Jack (GB) — standard para "English"
  return (
    <svg viewBox="0 0 60 30" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <clipPath id="uk-a">
        <path d="M0 0v30h60V0z" />
      </clipPath>
      <clipPath id="uk-b">
        <path d="M30 15h30v15zM30 15h30V0zM30 15H0V0zM30 15H0v15z" />
      </clipPath>
      <g clipPath="url(#uk-a)">
        <path fill="#012169" d="M0 0v30h60V0z" />
        <path
          stroke="#fff"
          strokeWidth="6"
          d="M0 0l60 30m0-30L0 30"
        />
        <path
          stroke="#C8102E"
          strokeWidth="4"
          d="M0 0l60 30m0-30L0 30"
          clipPath="url(#uk-b)"
        />
        <path stroke="#fff" strokeWidth="10" d="M30 0v30M0 15h60" />
        <path stroke="#C8102E" strokeWidth="6" d="M30 0v30M0 15h60" />
      </g>
    </svg>
  );
}

function FlagPT() {
  return (
    <svg viewBox="0 0 600 400" className="w-5 h-[14px] rounded-sm shrink-0" aria-hidden>
      <path fill="#006600" d="M0 0h600v400H0z" />
      <path fill="#FF0000" d="M240 0h360v400H240z" />
      <circle cx="240" cy="200" r="60" fill="#FFE000" stroke="#fff" strokeWidth="3" />
    </svg>
  );
}

const FLAGS: Record<string, () => React.ReactElement> = {
  es: FlagES,
  ca: FlagCA,
  gl: FlagGL,
  eu: FlagEU,
  en: FlagEN,
  pt: FlagPT,
};

export function Flag({ code }: { code: string }) {
  const Component = FLAGS[code];
  if (!Component) return null;
  return <Component />;
}

// ═══════════════════════════════════════════════════════════
//   LanguageSwitcher
// ═══════════════════════════════════════════════════════════

export function LanguageSwitcher({ variant = 'icon' }: LanguageSwitcherProps) {
  const { current, change, available, currentMeta } = useLanguage();

  return (
    <Menu.Root>
      <Menu.Trigger
        className={cn(
          'inline-flex items-center gap-2 rounded-md text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          variant === 'icon' ? 'h-8 w-8 justify-center' : 'h-9 px-3'
        )}
        aria-label="Cambiar idioma"
      >
        {variant === 'icon' ? (
          <Globe size={16} />
        ) : (
          <>
            <Flag code={currentMeta.code} />
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
                  'flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer',
                  'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <Flag code={lang.code} />
                <span className="flex-1">{lang.name}</span>
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