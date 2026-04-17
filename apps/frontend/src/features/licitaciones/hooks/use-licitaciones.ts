import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { licitacionesApi } from '../api/licitaciones.api'
import type { SearchParams } from '../types'

export function useLicitaciones(params: SearchParams) {
  return useQuery({
    queryKey: ['licitaciones', params],
    queryFn: () => licitacionesApi.search(params),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  })
}

export function useLicitacion(id: string | undefined) {
  return useQuery({
    queryKey: ['licitacion', id],
    queryFn: () => licitacionesApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ['licitaciones-filters'],
    queryFn: () => licitacionesApi.getFilters(),
    staleTime: 10 * 60 * 1000,
  })
}