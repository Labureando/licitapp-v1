import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, MapPin, Building2 } from 'lucide-react';
import type { LicitacionCard as LicitacionCardType } from '../types';
import {
  daysUntil,
  deadlineLabel,
  formatDate,
  formatLocation,
  formatMoneyCompact,
  getEstadoConfig,
  prettyEnum,
} from '../utils';
import { cn } from '@/lib/utils';
interface LicitacionCardProps {
  licitacion: LicitacionCardType;
  index?: number;
}

export function LicitacionCard({ licitacion, index = 0 }: LicitacionCardProps) {
  const { t } = useTranslation('search');

  // Traduce un enum value con fallback a prettyEnum si la clave no existe
  const tEnum = (namespace: string, key: string | null | undefined) =>
    key ? t(`${namespace}.${key}`, { defaultValue: prettyEnum(key) }) : '';

  const estado = getEstadoConfig(licitacion.estado);
  const estadoLabel = tEnum('estado', licitacion.estado);
  const deadline = daysUntil(licitacion.fechaPresentacion);
  const location = formatLocation(
    licitacion.municipio,
    licitacion.provincia,
    licitacion.ccaa,
  );
  const money = formatMoneyCompact(licitacion.presupuestoBase);

  const isClosed = ['RESUELTA', 'CERRADA', 'ANULADA', 'DESIERTA'].includes(
    licitacion.estado,
  );
  const isOpen = licitacion.estado === 'ABIERTA';

  // 4 niveles de urgencia del deadline
  type DeadlineLevel = 'critical' | 'warning' | 'info' | 'relaxed';

  const deadlineLevel: DeadlineLevel | null =
    !isOpen || deadline.days === null
      ? null
      : deadline.days <= 5
      ? 'critical'
      : deadline.days <= 14
      ? 'warning'
      : deadline.days <= 30
      ? 'info'
      : 'relaxed';

  const deadlineStyles: Record<
    DeadlineLevel,
    { badge: string; dot: string; glow?: string }
  > = {
    critical: {
      badge:
        'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
      dot: 'bg-red-500',
      glow: '0 0 6px currentColor',
    },
    warning: {
      badge:
        'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500',
      glow: '0 0 4px currentColor',
    },
    info: {
      badge:
        'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      dot: 'bg-blue-500',
    },
    relaxed: {
      badge:
        'bg-muted text-muted-foreground border-border',
      dot: 'bg-muted-foreground/50',
    },
  };

  return (
    <Link
      to={`/licitaciones/${licitacion.id}`}
      className={cn(
        'group relative flex items-center gap-5 overflow-hidden rounded-lg border border-border bg-card',
        'px-5 py-4 pr-4',
        'transition-all duration-200',
        'hover:border-primary/40 hover:bg-accent/20',
        'animate-in fade-in-50 slide-in-from-bottom-1 duration-300',
        isClosed && 'opacity-75 hover:opacity-100',
      )}
      style={{ animationDelay: `${Math.min(index, 10) * 20}ms` }}
    >
      {/* Barra de color vertical a la izquierda */}
      <div
        className={cn(
          'absolute left-0 top-0 h-full w-[3px] transition-all',
          estado.bar,
          'group-hover:w-[4px]',
        )}
      />

      {/* ═══ Columna principal ═══ */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {/* Línea 1: Estado + meta */}
        <div className="flex items-center gap-2 text-[11px]">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold uppercase tracking-wider',
              estado.badge,
            )}
          >
            <span className="relative flex h-1.5 w-1.5">
              {estado.pulse && (
                <span
                  className={cn(
                    'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
                    estado.dot,
                  )}
                />
              )}
              <span
                className={cn(
                  'relative inline-flex h-1.5 w-1.5 rounded-full',
                  estado.dot,
                )}
              />
            </span>
            {estadoLabel}
          </span>

           {licitacion.tipoContrato && (
            <span className="font-medium uppercase tracking-wider text-muted-foreground">
              {tEnum('tipoContrato', licitacion.tipoContrato)}
            </span>
          )}

          {licitacion.procedimiento && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="text-muted-foreground/70">
                {tEnum('procedimiento', licitacion.procedimiento)}
              </span>
            </>
          )}

           {licitacion.tramitacion === 'URGENTE' && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400">
              {t('card.urgent')}
            </span>
          )}
        </div>

        {/* Línea 2: Título */}
        <h3
          className={cn(
            'line-clamp-2 text-[15px] font-semibold leading-snug text-foreground',
            'transition-colors group-hover:text-primary',
          )}
        >
          {licitacion.title}
        </h3>

        {/* Línea 3: Meta */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {licitacion.organo?.nombre && (
            <span className="inline-flex min-w-0 max-w-[320px] items-center gap-1">
              <Building2 size={11} className="shrink-0 opacity-50" />
              <span className="truncate">{licitacion.organo.nombre}</span>
            </span>
          )}
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={11} className="shrink-0 opacity-50" />
              <span>{location}</span>
            </span>
          )}
          {licitacion.fechaPublicacion && (
            <span className="opacity-60">
              {formatDate(licitacion.fechaPublicacion)}
            </span>
          )}
        </div>
      </div>

      {/* ═══ Columna derecha: pill de plazo + importe ═══ */}
      <div className="flex shrink-0 flex-col items-end gap-2 pl-3">
        {/* Pill de plazo — mismo estilo que badge de estado pero con color propio */}
        {isOpen && deadline.days !== null && deadlineLevel && (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5',
              'text-[10px] font-semibold uppercase tracking-wider tabular-nums',
              deadlineStyles[deadlineLevel].badge,
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                deadlineStyles[deadlineLevel].dot,
              )}
              style={
                deadlineStyles[deadlineLevel].glow
                  ? { boxShadow: deadlineStyles[deadlineLevel].glow }
                  : undefined
              }
            />
            {deadlineLabel(deadline.days, t)}
          </span>
        )}

        {/* Importe */}
        {money.num !== '—' ? (
          <div className="flex items-baseline gap-0.5 font-mono tabular-nums">
            <span className="text-2xl font-bold leading-none text-foreground">
              {money.num}
            </span>
            <span className="text-sm font-medium leading-none text-muted-foreground">
              {money.unit}
            </span>
          </div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground/50">
            {t('card.noAmount')}
          </span>
        )}
      </div>

      {/* ═══ Flecha ═══ */}
      <ArrowUpRight
        size={14}
        className={cn(
          'shrink-0 text-muted-foreground/30 transition-all duration-200',
          'group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary',
        )}
      />
    </Link>
  );
}