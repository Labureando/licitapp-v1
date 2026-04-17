import { api } from '@/lib/api-client';

export interface OrganoSearchResult {
  id: string;
  nombre: string;
  tipo: string | null;
  ccaa: string | null;
  provincia: string | null;
  totalLicitaciones: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
}

export interface SearchOrganosParams {
  q?: string;
  ccaa?: string[];
  provincia?: string[];
  limit?: number;
}

function toParams(p: SearchOrganosParams): Record<string, string> {
  const out: Record<string, string> = {};
  if (p.q) out.q = p.q;
  if (p.ccaa?.length) out.ccaa = p.ccaa.join(',');
  if (p.provincia?.length) out.provincia = p.provincia.join(',');
  if (p.limit) out.limit = String(p.limit);
  return out;
}

export const organosApi = {
  search: (params: SearchOrganosParams) =>
    api
      .get<ApiEnvelope<OrganoSearchResult[]>>('/organos/search', {
        params: toParams(params),
      })
      .then((r) => r.data.data),
};