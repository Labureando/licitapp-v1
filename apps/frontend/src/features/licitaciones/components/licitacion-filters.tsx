import { useMemo, useState } from 'react';
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
 
const LABEL_MAP: Record<string, string> = {
  estado: 'Estado',
  tipoContrato: 'Tipo',
  procedimiento: 'Procedimiento',
  tramitacion: 'Tramitación',
  ccaa: 'CCAA',
  provincia: 'Provincia',
  organoId: 'Órgano',
};
 
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
          groupLabel: LABEL_MAP[group],
          value,
          label: prettify(value),
        });
      });
    });
 
    if (filters.organoId) {
      badges.push({
        group: 'organoId',
        groupLabel: LABEL_MAP.organoId,
        value: filters.organoId,
        label: selectedOrgano?.nombre ?? 'Órgano',
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
        label: prettify(e.value),
        count: e.count,
      })),
    [options?.estados],
  );
  const tipoOpts = useMemo(
    () =>
      (options?.tipos ?? []).map((e) => ({
        value: e.value,
        label: prettify(e.value),
        count: e.count,
      })),
    [options?.tipos],
  );
  const procedimientoOpts = useMemo(
    () =>
      (options?.procedimientos ?? []).map((e) => ({
        value: e.value,
        label: prettify(e.value),
        count: e.count,
      })),
    [options?.procedimientos],
  );
  const tramitacionOpts = useMemo(
    () =>
      (options?.tramitaciones ?? []).map((e) => ({
        value: e.value,
        label: prettify(e.value),
        count: e.count,
      })),
    [options?.tramitaciones],
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
          label="Estado"
          options={estadoOpts}
          selected={filters.estado ?? []}
          onChange={setGroup('estado')}
        />
        <MultiSelectPopover
          label="Tipo"
          options={tipoOpts}
          selected={filters.tipoContrato ?? []}
          onChange={setGroup('tipoContrato')}
        />
        <MultiSelectPopover
          label="Procedimiento"
          options={procedimientoOpts}
          selected={filters.procedimiento ?? []}
          onChange={setGroup('procedimiento')}
        />
        <MultiSelectPopover
          label="Tramitación"
          options={tramitacionOpts}
          selected={filters.tramitacion ?? []}
          onChange={setGroup('tramitacion')}
        />
        <MultiSelectPopover
          label="CCAA"
          options={ccaaOpts}
          selected={filters.ccaa ?? []}
          onChange={setGroup('ccaa')}
        />
        {provinciaOpts.length > 0 && (
          <MultiSelectPopover
            label="Provincia"
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
 