import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

import { useLicitaciones, useFilterOptions } from '../hooks/use-licitaciones';
import { LicitacionCard } from '../components/licitacion-card';
import { LicitacionCardSkeletonList } from '../components/licitacion-card-skeleton';
import { LicitacionFilters } from '../components/licitacion-filters';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { SearchParams, LicitacionCard as LicitacionCardType } from '../types';

// ═══════════════════════════════════════════════
// Helpers URL ↔ SearchParams
// ═══════════════════════════════════════════════

function parseUrlToParams(searchParams: URLSearchParams): SearchParams {
  const getStr = (k: string) => searchParams.get(k) || undefined;
  const getArr = (k: string) => {
    const v = searchParams.get(k);
    if (!v) return undefined;
    const list = v.split(',').filter(Boolean);
    return list.length > 0 ? list : undefined;
  };

  return {
    q: getStr('q'),
    estado: getArr('estado'),
    tipoContrato: getArr('tipoContrato'),
    procedimiento: getArr('procedimiento'),
    tramitacion: getArr('tramitacion'),
    ccaa: getArr('ccaa'),
    provincia: getArr('provincia'),
    organoId: getStr('organoId'), // ← ESTO FALTABA
    page: Number(searchParams.get('page') || 1),
    pageSize: 20,
    sortBy: (getStr('sortBy') as SearchParams['sortBy']) || 'fecha',
  };
}

function paramsToUrl(params: SearchParams): URLSearchParams {
  const url = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      if (v.length > 0) url.set(k, v.join(','));
    } else {
      url.set(k, String(v));
    }
  });
  return url;
}

// ═══════════════════════════════════════════════
// Página
// ═══════════════════════════════════════════════

export function BuscarPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => parseUrlToParams(searchParams), [searchParams]);

  const [searchText, setSearchText] = useState(params.q || '');
  const [focused, setFocused] = useState(false);

  const { data, isLoading } = useLicitaciones(params);
  const { data: filterOptions } = useFilterOptions();

  const commit = (next: SearchParams, resetPage = true) => {
    const final = { ...next, page: resetPage ? 1 : next.page };
    setSearchParams(paramsToUrl(final));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    commit({ ...params, q: searchText || undefined });
  };

  const goToPage = (newPage: number) => {
    commit({ ...params, page: newPage }, false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Buscador</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="font-mono font-bold text-gradient-primary">
              {data?.total?.toLocaleString('es-ES') || '—'}
            </span>{' '}
            licitaciones públicas indexadas
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-400"
            style={{ boxShadow: '0 0 6px currentColor' }}
          />
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            Scraping activo
          </span>
        </div>
      </div>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch}>
        <div
          className={cn(
            'relative flex items-center gap-3 rounded-2xl border pl-5 pr-2 transition-all duration-200',
            focused
              ? 'border-primary/40 bg-primary/[0.02]'
              : 'border-border bg-card',
          )}
          style={
            focused
              ? {
                  boxShadow:
                    '0 0 0 4px oklch(from var(--primary) l c h / 0.06), 0 8px 32px oklch(from var(--primary) l c h / 0.08)',
                }
              : undefined
          }
        >
          <Search
            size={18}
            className={cn(
              'shrink-0 transition-colors',
              focused ? 'text-primary' : 'text-muted-foreground/50',
            )}
          />
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Buscar por palabra clave, CPV, órgano de contratación..."
            className="flex-1 bg-transparent py-4 text-sm text-foreground outline-none placeholder:text-muted-foreground/40"
          />
          <kbd className="hidden items-center rounded border border-border bg-muted px-2 py-1 font-mono text-[10px] text-muted-foreground sm:inline-flex">
            ⌘K
          </kbd>
          <Button type="submit" size="sm" className="h-8">
            <Zap size={14} />
            Buscar
          </Button>
        </div>
      </form>

      {/* FILTERS */}
      <LicitacionFilters
        filters={params}
        options={filterOptions}
        onChange={(next) => commit(next)}
      />

      {/* RESULTS */}
      <div>
        {isLoading ? (
          <LicitacionCardSkeletonList count={6} />
        ) : data && data.data.length > 0 ? (
          <>
            <div className="space-y-2.5">
              {data.data.map((lic: LicitacionCardType, i: number) => (
                <LicitacionCard key={lic.id} licitacion={lic} index={i} />
              ))}
            </div>

            {data.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 border-t border-border pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(params.page ?? 1) <= 1}
                  onClick={() => goToPage((params.page ?? 1) - 1)}
                >
                  <ChevronLeft size={14} />
                  Anterior
                </Button>
                <span className="px-3 text-sm text-muted-foreground">
                  Página{' '}
                  <span className="font-mono font-bold text-foreground">
                    {data.page}
                  </span>{' '}
                  de{' '}
                  <span className="font-mono font-bold text-foreground">
                    {data.totalPages}
                  </span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!data.hasMore}
                  onClick={() => goToPage((params.page ?? 1) + 1)}
                >
                  Siguiente
                  <ChevronRight size={14} />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <Search size={22} className="text-muted-foreground/40" />
            </div>
            <h3 className="mb-1 text-base font-semibold">Sin resultados</h3>
            <p className="text-sm text-muted-foreground">
              Prueba con otros términos o ajusta los filtros
            </p>
          </div>
        )}
      </div>
    </div>
  );
}