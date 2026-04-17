import { cn } from '@/lib/utils';

export function LicitacionCardSkeleton() {
  return (
    <div
      className={cn(
        'relative flex items-center gap-5 overflow-hidden rounded-lg border border-border bg-card',
        'px-5 py-4 pr-4',
      )}
    >
      {/* Barra izquierda */}
      <div className="absolute left-0 top-0 h-full w-[3px] bg-muted" />

      {/* Columna principal */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-12 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted/40" />
        </div>

        <div className="space-y-1.5">
          <div className="h-4 w-[85%] animate-pulse rounded bg-muted" />
          <div className="h-4 w-[55%] animate-pulse rounded bg-muted" />
        </div>

        <div className="flex gap-3">
          <div className="h-3 w-40 animate-pulse rounded bg-muted/60" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted/40" />
        </div>
      </div>

      {/* Columna derecha */}
      <div className="flex shrink-0 flex-col items-end gap-1 pl-3">
        <div className="h-6 w-16 animate-pulse rounded bg-muted" />
        <div className="h-3 w-12 animate-pulse rounded bg-muted/50" />
      </div>

      <div className="h-3.5 w-3.5 shrink-0 animate-pulse rounded bg-muted/40" />
    </div>
  );
}

export function LicitacionCardSkeletonList({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <LicitacionCardSkeleton key={i} />
      ))}
    </div>
  );
}