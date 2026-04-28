import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
    ArrowLeft,
    ExternalLink,
    FileText,
    Building2,
    MapPin,
    Calendar,
    Euro,
    Sparkles,
    Users,
    TrendingDown,
} from 'lucide-react'
import type { LicitacionDocumento } from '../types';

import { useLicitacion } from '../hooks/use-licitaciones'
import {
    formatMoney,
    formatMoneyCompact,
    formatDateTime,
    daysUntil,
    deadlineLabel,
    getEstadoStyle,
    prettyEnum,
} from '../utils'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// ═══ Sub-component: info row ═══
function InfoRow({
    label,
    value,
    emphasis = false,
    mono = false,
}: {
    label: string
    value: React.ReactNode
    emphasis?: boolean
    mono?: boolean
}) {
    return (
        <div className="flex items-start justify-between gap-4 py-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span
                className={cn(
                    'text-sm text-right',
                    emphasis && 'font-semibold',
                    mono && 'font-mono'
                )}
            >
                {value}
            </span>
        </div>
    )
}

export function LicitacionPage() {
    const { t } = useTranslation('search')
    const { id } = useParams<{ id: string }>()
    const { data: lic, isLoading, error } = useLicitacion(id)

    // Traduce un enum value con fallback a prettyEnum si la clave no existe
    const tEnum = (namespace: string, key: string | null | undefined) =>
        key ? t(`${namespace}.${key}`, { defaultValue: prettyEnum(key) }) : ''

    // ═══ Loading ═══
    if (isLoading) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-8 w-3/4" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-48" />
                    <Skeleton className="h-48" />
                </div>
            </div>
        )
    }

    // ═══ Error ═══
    if (error || !lic) {
        return (
            <div className="max-w-xl mx-auto text-center py-16">
                <h2 className="text-xl font-bold mb-2">{t('detail.notFoundTitle')}</h2>
                <p className="text-sm text-muted-foreground mb-6">
                    {t('detail.notFoundBody')}
                </p>
                <Button render={<Link to="/buscar" />}>
                    <ArrowLeft size={14} />
                    {t('detail.backToSearch')}
                </Button>
            </div>
        )
    }

    const estado = getEstadoStyle(lic.estado)
    const deadline = daysUntil(lic.fechaPresentacion)
    const money = formatMoneyCompact(lic.presupuestoBase)

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            {/* ═══ Breadcrumb ═══ */}
            <Link
                to="/buscar"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={14} />
                 {t('detail.backToSearch')}
            </Link>

            {/* ═══ HERO — Estado + Título + Presupuesto ═══ */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-start justify-between gap-8">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <span
                                className={cn(
                                    'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border',
                                    'text-[11px] font-bold tracking-wider',
                                    estado.classes
                                )}
                            >
                                <span
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full bg-current',
                                        estado.pulse && 'animate-pulse'
                                    )}
                                    style={
                                        estado.pulse ? { boxShadow: '0 0 6px currentColor' } : undefined
                                    }
                                />
                                 {tEnum('estado', lic.estado)}
                            </span>
                            {lic.tipoContrato && (
                                <Badge variant="outline" className="text-[11px]">
                                    {tEnum('tipoContrato', lic.tipoContrato)}
                                </Badge>
                            )}
                            {lic.procedimiento && (
                                <Badge variant="outline" className="text-[11px]">
                                    {tEnum('procedimiento', lic.procedimiento)}
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-2xl font-bold tracking-tight leading-snug mb-3">
                            {lic.title}
                        </h1>

                        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                            {lic.organo && (
                                <span className="flex items-center gap-1.5">
                                    <Building2 size={13} />
                                    {lic.organo.nombre}
                                </span>
                            )}
                            {lic.ccaa && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin size={13} />
                                    {lic.ccaa}
                                    {lic.provincia && ` · ${lic.provincia}`}
                                </span>
                            )}
                            {lic.fechaPublicacion && (
                                <span className="flex items-center gap-1.5">
                                    <Calendar size={13} />
                                    {formatDateTime(lic.fechaPublicacion)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Presupuesto destacado */}
                    <div className="text-right shrink-0">
                        <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase mb-1">
                           {t('detail.budgetLabel')}
                        </div>
                        <div className="flex items-baseline justify-end gap-1">
                            <span className="text-4xl font-extrabold font-mono tracking-tight text-gradient-primary leading-none">
                                {money.num}
                            </span>
                            <span className="text-lg font-semibold text-muted-foreground">
                                {money.unit}
                            </span>
                        </div>
                        {deadline && (
                            <div
                                className={cn(
                                    'inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-md border text-[11px] font-bold',
                                    deadline.urgent
                                        ? 'text-destructive bg-destructive/10 border-destructive/20'
                                        : 'text-muted-foreground bg-muted border-border'
                                )}
                            >
                                <span
                                    className={cn(
                                        'w-1.5 h-1.5 rounded-full bg-current',
                                        deadline.urgent && 'animate-pulse'
                                    )}
                                />
                                 {deadlineLabel(deadline.days, t)} {t('detail.deadlineSuffix')}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ GRID de cards ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Datos económicos */}
                <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                            <Euro size={14} className="text-primary" />
                            {t('detail.economicTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <InfoRow label={t('detail.budgetBaseNoIva')} value={formatMoney(lic.presupuestoBase)} mono emphasis />
                        <InfoRow label={t('detail.budgetWithIva')} value={formatMoney(lic.presupuestoConIva)} mono />
                        {lic.importeAdjudicacion && (
                            <InfoRow
                                label={t('detail.awardAmount')}
                                value={
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {formatMoney(lic.importeAdjudicacion)}
                                    </span>
                                }
                                mono
                            />
                        )}
                        {lic.porcentajeBaja != null && (
                            <InfoRow
                                label={t('detail.discount')}
                                value={
                                    <span className="inline-flex items-center gap-1">
                                        <TrendingDown size={12} className="text-emerald-500" />
                                        {lic.porcentajeBaja}%
                                    </span>
                                }
                            />
                        )}
                        {lic.numLicitadores != null && (
                            <InfoRow
                                label={t('detail.numBidders')}
                                value={
                                    <span className="inline-flex items-center gap-1">
                                        <Users size={12} />
                                        {lic.numLicitadores}
                                    </span>
                                }
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Fechas */}
                <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                            <Calendar size={14} className="text-primary" />
                            {t('detail.datesTitle')}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <InfoRow label={t('detail.publication')} value={formatDateTime(lic.fechaPublicacion)} />
                        <InfoRow label={t('detail.presentationDeadline')} value={formatDateTime(lic.fechaPresentacion)} emphasis />
                        {lic.fechaAdjudicacion && (
                            <InfoRow label={t('detail.awardDate')} value={formatDateTime(lic.fechaAdjudicacion)} />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* ═══ Clasificación (CPV) ═══ */}
            {lic.cpvCodes && lic.cpvCodes.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t('detail.cpvTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                            {lic.cpvCodes.map((cpv : string) => (
                                <Badge key={cpv} variant="outline" className="font-mono text-[11px]">
                                    {cpv}
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══ Adjudicatario ═══ */}
            {lic.adjudicatarioNombre && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t('detail.awardeeTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1">
                        <div className="font-semibold">{lic.adjudicatarioNombre}</div>
                        {lic.adjudicatarioNif && (
                            <div className="text-xs text-muted-foreground font-mono">
                                {t('detail.nifLabel')} {lic.adjudicatarioNif}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ═══ Descripción ═══ */}
            {lic.description && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">{t('detail.descriptionTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {lic.description}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* ═══ Documentos ═══ */}
            {lic.documentos && lic.documentos.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <FileText size={14} className="text-primary" />
                            {t('detail.documentsTitle')}
                            <Badge variant="outline" className="ml-1">
                                {lic.documentos.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-1">
                            {lic.documentos.map((doc: LicitacionDocumento, i: number) => (
                                <a
                                    key={i}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-3 p-2 -mx-2 rounded-lg hover:bg-muted transition-colors"
                                >
                                    <FileText size={14} className="text-muted-foreground" />
                                    <span className="flex-1 text-sm truncate group-hover:text-primary transition-colors">
                                        {doc.nombre}
                                    </span>
                                    <Badge variant="outline" className="text-[10px]">
                                        {doc.tipo}
                                    </Badge>
                                    <ExternalLink size={12} className="text-muted-foreground" />
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ═══ Resumen IA (placeholder) ═══ */}
            <Card className="border-dashed">
                <CardHeader>
                   <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                        <Sparkles size={14} />
                        {t('detail.aiSummaryTitle')}
                        <Badge variant="outline" className="ml-1 text-[10px]">
                            {t('detail.aiSummaryBadge')}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        {t('detail.aiSummaryBody')}
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}