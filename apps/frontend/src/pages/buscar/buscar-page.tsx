import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLicitaciones, useFilterOptions } from '../../hooks/use-licitaciones';
import { LicitacionCard } from '../../components/licitation-card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

export function BuscarPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Leer filtros de la URL
  const params = {
    q: searchParams.get('q') || undefined,
    estado: searchParams.get('estado') || undefined,
    tipoContrato: searchParams.get('tipoContrato') || undefined,
    ccaa: searchParams.get('ccaa') || undefined,
    importeMin: searchParams.get('importeMin') ? Number(searchParams.get('importeMin')) : undefined,
    importeMax: searchParams.get('importeMax') ? Number(searchParams.get('importeMax')) : undefined,
    soloConPlazo: searchParams.get('soloConPlazo') === 'true',
    page: Number(searchParams.get('page') || 1),
    pageSize: 20,
    sortBy: (searchParams.get('sortBy') as any) || 'fecha',
  };

  const { data, isLoading, error } = useLicitaciones(params);
  const { data: filters } = useFilterOptions();

  const [searchText, setSearchText] = useState(params.q || '');

  const updateFilter = (key: string, value: string | undefined) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset page on filter change
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilter('q', searchText || undefined);
  };

  return (
    <div className="space-y-4">
      {/* Header + Search */}
      <div>
        <h1 className="text-2xl font-bold mb-4">Buscador de licitaciones</h1>
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Buscar licitaciones..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </form>
      </div>

      {/* Filtros rápidos (horizontal) */}
      <div className="flex flex-wrap gap-2">
        {/* Estado */}
        <Select value={params.estado || ''} onValueChange={(v) => updateFilter('estado', v || undefined)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Estado" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {filters?.estados?.map((e: any) => (
              <SelectItem key={e.estado} value={e.estado}>{e.estado} ({e.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Tipo contrato */}
        <Select value={params.tipoContrato || ''} onValueChange={(v) => updateFilter('tipoContrato', v || undefined)}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            {filters?.tipos?.map((t: any) => (
              <SelectItem key={t.tipo} value={t.tipo}>{t.tipo} ({t.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* CCAA */}
        <Select value={params.ccaa || ''} onValueChange={(v) => updateFilter('ccaa', v || undefined)}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Comunidad" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas</SelectItem>
            {filters?.ccaas?.map((c: any) => (
              <SelectItem key={c.ccaa} value={c.ccaa}>{c.ccaa} ({c.count})</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Ordenación */}
        <Select value={params.sortBy} onValueChange={(v) => updateFilter('sortBy', v)}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Ordenar" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fecha">Más recientes</SelectItem>
            <SelectItem value="relevancia">Relevancia</SelectItem>
            <SelectItem value="importe">Mayor importe</SelectItem>
            <SelectItem value="deadline">Próximo cierre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      <div>
        {isLoading && <p className="text-gray-500">Buscando...</p>}
        {error && <p className="text-red-500">Error al buscar licitaciones</p>}
        {data && (
          <>
            <p className="text-sm text-gray-500 mb-3">
              {data.total.toLocaleString('es-ES')} licitaciones encontradas
            </p>
            <div className="space-y-3">
              {data.data.map((lic) => (
                <LicitacionCard key={lic.id} licitacion={lic} />
              ))}
            </div>

            {/* Paginación */}
            {data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline" size="sm"
                  disabled={params.page <= 1}
                  onClick={() => updateFilter('page', String(params.page - 1))}
                >
                  <ChevronLeft size={16} /> Anterior
                </Button>
                <span className="text-sm text-gray-600">
                  Página {data.page} de {data.totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={!data.hasMore}
                  onClick={() => updateFilter('page', String(params.page + 1))}
                >
                  Siguiente <ChevronRight size={16} />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}