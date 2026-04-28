import { useEffect, useRef, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Check, ChevronDown, Search, X, Building2, Loader2 } from 'lucide-react';
import { organosApi, type OrganoSearchResult } from '../api/organos.api';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface OrganoPickerPopoverProps {
  selectedIds: string[];
  selectedOrganos?: OrganoSearchResult[];
  onChange: (ids: string[], organos: OrganoSearchResult[]) => void;
  ccaaContext?: string[];
  provinciaContext?: string[];
  className?: string;
}

export function OrganoPickerPopover({
  selectedIds,
  selectedOrganos = [],
  onChange,
  ccaaContext,
  provinciaContext,
  className,
}: OrganoPickerPopoverProps) {
  const { t } = useTranslation('search');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [buffer, setBuffer] = useState<string[]>(selectedIds);
  const [bufferOrganos, setBufferOrganos] =
    useState<OrganoSearchResult[]>(selectedOrganos);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setBuffer(selectedIds);
    setBufferOrganos(selectedOrganos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isFetching } = useQuery({
    queryKey: [
      'organos-search',
      debouncedQuery,
      ccaaContext,
      provinciaContext,
    ],
    queryFn: () =>
      organosApi.search({
        q: debouncedQuery || undefined,
        ccaa: ccaaContext,
        provincia: provinciaContext,
        limit: 30,
      }),
    enabled: open,
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        cancelAndClose();
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedIds]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') cancelAndClose();
      if (e.key === 'Enter') apply();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, buffer]);

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  function cancelAndClose() {
    setOpen(false);
    setBuffer(selectedIds);
    setBufferOrganos(selectedOrganos);
    setQuery('');
  }

  function toggle(org: OrganoSearchResult) {
    setBuffer((prev) =>
      prev.includes(org.id)
        ? prev.filter((id) => id !== org.id)
        : [...prev, org.id],
    );
    setBufferOrganos((prev) =>
      prev.some((o) => o.id === org.id)
        ? prev.filter((o) => o.id !== org.id)
        : [...prev, org],
    );
  }

  function apply() {
    onChange(buffer, bufferOrganos);
    setOpen(false);
    setQuery('');
  }

  function clear() {
    setBuffer([]);
    setBufferOrganos([]);
  }

  const hasChanges =
    buffer.length !== selectedIds.length ||
    buffer.some((v) => !selectedIds.includes(v));

  const selectedSet = new Set(buffer);
  const seenIds = new Set<string>();
  const merged: OrganoSearchResult[] = [];

  bufferOrganos.forEach((o) => {
    if (!seenIds.has(o.id)) {
      merged.push(o);
      seenIds.add(o.id);
    }
  });
  results.forEach((o) => {
    if (!seenIds.has(o.id)) {
      merged.push(o);
      seenIds.add(o.id);
    }
  });

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm',
          'transition-colors hover:border-ring/50',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
          selectedIds.length > 0 && 'border-primary/40 bg-primary/5',
        )}
      >
        <Building2 size={14} className="text-muted-foreground" />
        <span className="text-foreground">{t('filters.organoPicker.label')}</span>
        {selectedIds.length > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
            {selectedIds.length}
          </span>
        ) : (
             <span className="text-muted-foreground">{t('filters.organoPicker.allPlaceholder')}</span>
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
            'absolute right-0 top-[calc(100%+4px)] z-50 w-[360px]',
            'rounded-lg border border-border bg-popover shadow-lg',
            'animate-in fade-in-0 zoom-in-95 duration-100',
          )}
        >
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('filters.organoPicker.searchPlaceholder')}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {isFetching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>

          {(ccaaContext?.length || provinciaContext?.length) && (
            <div className="border-b border-border bg-muted/30 px-3 py-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t('filters.organoPicker.filteringIn')}{' '}
                <span className="font-semibold text-foreground">
                  {[...(provinciaContext ?? []), ...(ccaaContext ?? [])].join(', ')}
                </span>
              </p>
            </div>
          )}

          <div className="max-h-[340px] overflow-y-auto py-1">
            {merged.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
               {debouncedQuery
                  ? t('filters.organoPicker.noMatch')
                  : t('filters.organoPicker.typeToSearch')}
              </div>
            ) : (
              merged.map((org) => {
                const checked = selectedSet.has(org.id);
                const location = [org.provincia, org.ccaa]
                  .filter(Boolean)
                  .join(' · ');
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => toggle(org)}
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2 text-left text-sm',
                      'transition-colors hover:bg-accent/50',
                    )}
                  >
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                        checked
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-input',
                      )}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground">
                        {org.nombre}
                      </span>
                      {location && (
                        <span className="truncate text-[11px] text-muted-foreground">
                          {location}
                        </span>
                      )}
                    </span>
                    {/* Solo muestra el count si hay datos reales */}
                    {org.totalLicitaciones > 0 && (
                      <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                        {org.totalLicitaciones.toLocaleString('es-ES')}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

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
              {t('filters.clearButton')}
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
               {t('filters.applyButton')} {buffer.length > 0 && `(${buffer.length})`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}