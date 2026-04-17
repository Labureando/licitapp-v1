import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterBadgesProps {
  filters: ActiveFilter[];
  onRemove: (group: string, value: string) => void;
  onClearAll: () => void;
  className?: string;
}

export interface ActiveFilter {
  group: string;        // 'estado' | 'tipo' | 'ccaa' | ...
  groupLabel: string;   // 'Estado' | 'Tipo' | 'CCAA' | ...
  value: string;        // 'ABIERTA'
  label: string;        // 'Abierta' (texto visible)
}

export function FilterBadges({
  filters,
  onRemove,
  onClearAll,
  className,
}: FilterBadgesProps) {
  if (filters.length === 0) return null;

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2',
        'animate-in fade-in-0 slide-in-from-top-1 duration-200',
        className,
      )}
    >
      {filters.map((f) => (
        <span
          key={`${f.group}-${f.value}`}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10',
            'px-2.5 py-0.5 text-xs text-foreground',
          )}
        >
          <span className="text-muted-foreground">{f.groupLabel}:</span>
          <span className="font-medium">{f.label}</span>
          <button
            type="button"
            onClick={() => onRemove(f.group, f.value)}
            className={cn(
              'ml-0.5 rounded-full p-0.5 text-muted-foreground',
              'hover:bg-primary/20 hover:text-foreground transition-colors',
            )}
            aria-label={`Quitar filtro ${f.groupLabel}: ${f.label}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className={cn(
            'ml-1 text-xs text-muted-foreground',
            'hover:text-foreground transition-colors underline-offset-2 hover:underline',
          )}
        >
          Limpiar todo
        </button>
      )}
    </div>
  );
}