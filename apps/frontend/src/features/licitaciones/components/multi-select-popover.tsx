import { useEffect, useRef, useState, useMemo } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MultiSelectOption {
  value: string;
  label: string;
  count?: number;
}

interface MultiSelectPopoverProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  searchThreshold?: number;
  className?: string;
}

export function MultiSelectPopover({
  label,
  options,
  selected,
  onChange,
  placeholder = 'Todos',
  searchPlaceholder = 'Buscar...',
  searchThreshold = 8,
  className,
}: MultiSelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [buffer, setBuffer] = useState<string[]>(selected);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync buffer si cambia `selected` desde fuera (ej: limpiar todo)
  useEffect(() => {
    setBuffer(selected);
  }, [selected]);

  // Click fuera cierra sin aplicar
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setBuffer(selected);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open, selected]);

  // Escape cierra, Enter aplica
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        setBuffer(selected);
        setQuery('');
      }
      if (e.key === 'Enter') {
        apply();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, buffer]);

  // Autofocus del search al abrir
  useEffect(() => {
    if (open && options.length > searchThreshold) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, options.length, searchThreshold]);

  const showSearch = options.length > searchThreshold;

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase().trim();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(value: string) {
    setBuffer((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  }

  function apply() {
    onChange(buffer);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    setBuffer([]);
  }

  const hasChanges =
    buffer.length !== selected.length ||
    buffer.some((v) => !selected.includes(v));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'hover:border-ring/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          selected.length > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <span className="text-foreground">{label}</span>
        {selected.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
            {selected.length}
          </span>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Popover */}
      {open && (
        <div
          className={cn(
            'absolute left-0 top-[calc(100%+4px)] z-50 w-[280px]',
            'rounded-lg border border-border bg-popover shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-100',
          )}
        >
          {/* Search */}
          {showSearch && (
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Lista */}
          <div className="max-h-[320px] overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                Sin resultados
              </div>
            ) : (
              filtered.map((opt) => {
                const checked = buffer.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm',
                      'hover:bg-accent/50 transition-colors',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex-1 truncate text-foreground">
                      {opt.label}
                    </span>
                    {opt.count !== undefined && (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {opt.count.toLocaleString('es-ES')}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border px-2 py-2">
            <button
              type="button"
              onClick={clear}
              disabled={buffer.length === 0}
              className={cn(
                'rounded-md px-2 py-1 text-xs',
                buffer.length === 0
                  ? 'text-muted-foreground/50'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={!hasChanges}
              className={cn(
                'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                hasChanges
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              Aplicar {buffer.length > 0 && `(${buffer.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}