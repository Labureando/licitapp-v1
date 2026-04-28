import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MultiSelectPopover } from './multi-select-popover';
import { FilterBadges, type ActiveFilter } from './filter-badges';
import { OrganoPickerPopover } from './organo-picker-popover';
import type { OrganoSearchResult } from '../api/organos.api';
import type { SearchParams, FilterOptions } from '../types';
import { cn } from '@/lib/utils';
 
interface LicitacionFiltersProps {
  filters: SearchParams;
  options: FilterOptions | undefined;
  onChange: (filters: SearchParams) => void;
  className?: string;
}
 

 
function prettify(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
 
export function LicitacionFilters({
  filters,
  options,
  onChange,
  className,
}: LicitacionFiltersProps) {
  const { t } = useTranslation('search');

  // Mapa local: group → label traducido (antes era LABEL_MAP estático)
  const labelMap: Record<string, string> = {
    estado: t('filters.groups.estado'),
    tipoContrato: t('filters.groups.tipoContrato'),
    procedimiento: t('filters.groups.procedimiento'),
    tramitacion: t('filters.groups.tramitacion'),
    ccaa: t('filters.groups.ccaa'),
    provincia: t('filters.groups.provincia'),
    organoId: t('filters.groups.organo'),
  };

  // Traduce un enum value con fallback a prettify si la clave no existe
  const tEnum = (namespace: string, key: string) =>
    t(`${namespace}.${key}`, { defaultValue: prettify(key) });

  const popoverPlaceholders = {
    placeholder: t('filters.allPlaceholder'),
    searchPlaceholder: t('filters.searchPlaceholder'),
  };

  // Guardamos la metadata del órgano seleccionado (para badges/trigger)
  const [selectedOrgano, setSelectedOrgano] =
    useState<OrganoSearchResult | null>(null);
 
  const setGroup = (key: keyof SearchParams) => (values: string[]) => {
    onChange({ ...filters, [key]: values.length > 0 ? values : undefined });
  };
 
  // Backend acepta organoId como UNA sola UUID
  const organoIds = filters.organoId ? [filters.organoId] : [];
 
  function setOrganos(ids: string[], organos: OrganoSearchResult[]) {
    // Selección única: tomamos solo el último
    const id = ids.length > 0 ? ids[ids.length - 1] : undefined;
    const org = organos.find((o) => o.id === id) ?? null;
    setSelectedOrgano(org);
    onChange({ ...filters, organoId: id });
  }
 
  const activeBadges = useMemo<ActiveFilter[]>(() => {
    const badges: ActiveFilter[] = [];
    (
      ['estado', 'tipoContrato', 'procedimiento', 'tramitacion', 'ccaa', 'provincia'] as const
    ).forEach((group) => {
      const values = filters[group];
      if (!values || !Array.isArray(values)) return;
      values.forEach((value) => {
         badges.push({
          group,
          groupLabel: labelMap[group],
          value,
          label: tEnum(group, value),
        });
      });
    });
 
     if (filters.organoId) {
      badges.push({
        group: 'organoId',
        groupLabel: labelMap.organoId,
        value: filters.organoId,
        label: selectedOrgano?.nombre ?? labelMap.organoId,
      });
    }
 
    return badges;
  }, [filters, selectedOrgano]);
 
  function removeBadge(group: string, value: string) {
    if (group === 'organoId') {
      setSelectedOrgano(null);
      onChange({ ...filters, organoId: undefined });
      return;
    }
    const current = filters[group as keyof SearchParams];
    if (!Array.isArray(current)) return;
    const next = current.filter((v) => v !== value);
    onChange({ ...filters, [group]: next.length > 0 ? next : undefined });
  }
 
  function clearAll() {
    setSelectedOrgano(null);
    onChange({
      ...filters,
      estado: undefined,
      tipoContrato: undefined,
      procedimiento: undefined,
      tramitacion: undefined,
      ccaa: undefined,
      provincia: undefined,
      organoId: undefined,
    });
  }
 
  const estadoOpts = useMemo(
    () =>
      (options?.estados ?? []).map((e) => ({
        value: e.value,
        label: tEnum('estado', e.value),
        count: e.count,
      })),
    [options?.estados, t],
  );
  const tipoOpts = useMemo(
    () =>
      (options?.tipos ?? []).map((e) => ({
        value: e.value,
        label: tEnum('tipoContrato', e.value),
        count: e.count,
      })),
    [options?.tipos, t],
  );
  const procedimientoOpts = useMemo(
    () =>
      (options?.procedimientos ?? []).map((e) => ({
        value: e.value,
        label: tEnum('procedimiento', e.value),
        count: e.count,
      })),
    [options?.procedimientos, t],
  );
 const tramitacionOpts = useMemo(
    () =>
      (options?.tramitaciones ?? []).map((e) => ({
        value: e.value,
        label: tEnum('tramitacion', e.value),
        count: e.count,
      })),
    [options?.tramitaciones, t],
  );
  const ccaaOpts = useMemo(
    () =>
      (options?.ccaas ?? []).map((e) => ({
        value: e.value,
        label: e.value,
        count: e.count,
      })),
    [options?.ccaas],
  );
  const provinciaOpts = useMemo(
    () =>
      (options?.provincias ?? []).map((e) => ({
        value: e.value,
        label: e.value,
        count: e.count,
      })),
    [options?.provincias],
  );
 
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
       <MultiSelectPopover
          label={labelMap.estado}
          {...popoverPlaceholders}
          options={estadoOpts}
          selected={filters.estado ?? []}
          onChange={setGroup('estado')}
        />
        <MultiSelectPopover
          label={labelMap.tipoContrato}
          {...popoverPlaceholders}
          options={tipoOpts}
          selected={filters.tipoContrato ?? []}
          onChange={setGroup('tipoContrato')}
        />
        <MultiSelectPopover
          label={labelMap.procedimiento}
          {...popoverPlaceholders}
          options={procedimientoOpts}
          selected={filters.procedimiento ?? []}
          onChange={setGroup('procedimiento')}
        />
        <MultiSelectPopover
          label={labelMap.tramitacion}
          {...popoverPlaceholders}
          options={tramitacionOpts}
          selected={filters.tramitacion ?? []}
          onChange={setGroup('tramitacion')}
        />
        <MultiSelectPopover
          label={labelMap.ccaa}
          {...popoverPlaceholders}
          options={ccaaOpts}
          selected={filters.ccaa ?? []}
          onChange={setGroup('ccaa')}
        />
        {provinciaOpts.length > 0 && (
          <MultiSelectPopover
            label={labelMap.provincia}
            {...popoverPlaceholders}
            options={provinciaOpts}
            selected={filters.provincia ?? []}
            onChange={setGroup('provincia')}
          />
        )}
        <OrganoPickerPopover
          selectedIds={organoIds}
          selectedOrganos={selectedOrgano ? [selectedOrgano] : []}
          onChange={setOrganos}
          ccaaContext={filters.ccaa}
          provinciaContext={filters.provincia}
        />
      </div>
 
      <FilterBadges
        filters={activeBadges}
        onRemove={removeBadge}
        onClearAll={clearAll}
      />
    </div>
  );
}
 