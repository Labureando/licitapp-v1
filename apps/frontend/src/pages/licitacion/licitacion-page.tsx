import { useParams, Link } from 'react-router-dom';
import { useLicitacion } from '../../hooks/use-licitaciones';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, ExternalLink, FileText, Building2, MapPin } from 'lucide-react';

function formatMoney(centimos: number | null): string {
  if (!centimos) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(centimos / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function LicitacionPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lic, isLoading, error } = useLicitacion(id);

  if (isLoading) return <div className="p-8 text-gray-500">Cargando licitación...</div>;
  if (error || !lic) return <div className="p-8 text-red-500">Licitación no encontrada</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back + Title */}
      <div>
        <Link to="/buscar" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3">
          <ArrowLeft size={16} /> Volver al buscador
        </Link>
        <div className="flex items-start gap-3">
          <Badge variant="secondary" className="shrink-0 mt-1">{lic.estado}</Badge>
          <h1 className="text-xl font-bold text-gray-900">{lic.title}</h1>
        </div>
      </div>

      {/* Datos principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Datos económicos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Presupuesto base</span><span className="font-medium">{formatMoney(lic.presupuestoBase)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Presupuesto con IVA</span><span>{formatMoney(lic.presupuestoConIva)}</span></div>
            {lic.importeAdjudicacion && <div className="flex justify-between"><span className="text-gray-500">Importe adjudicación</span><span className="font-medium text-green-700">{formatMoney(lic.importeAdjudicacion)}</span></div>}
            {lic.porcentajeBaja != null && <div className="flex justify-between"><span className="text-gray-500">Baja</span><span>{lic.porcentajeBaja}%</span></div>}
            {lic.numLicitadores != null && <div className="flex justify-between"><span className="text-gray-500">Licitadores</span><span>{lic.numLicitadores}</span></div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Fechas y plazos</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Publicación</span><span>{formatDate(lic.fechaPublicacion)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fecha presentación</span><span className="font-medium">{formatDate(lic.fechaPresentacion)}</span></div>
            {lic.fechaAdjudicacion && <div className="flex justify-between"><span className="text-gray-500">Adjudicación</span><span>{formatDate(lic.fechaAdjudicacion)}</span></div>}
            {lic.fechaFormalizacion && <div className="flex justify-between"><span className="text-gray-500">Formalización</span><span>{formatDate(lic.fechaFormalizacion)}</span></div>}
          </CardContent>
        </Card>
      </div>

      {/* Clasificación */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Clasificación</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div><span className="text-gray-500">Tipo contrato:</span> {lic.tipoContrato || '—'}</div>
            <div><span className="text-gray-500">Procedimiento:</span> {lic.procedimiento || '—'}</div>
            <div><span className="text-gray-500">Tramitación:</span> {lic.tramitacion || '—'}</div>
            <div><span className="text-gray-500">Fuente:</span> {lic.source}</div>
          </div>
          {lic.cpvCodes?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="text-gray-500 text-xs">CPV:</span>
              {lic.cpvCodes.map((cpv: string) => (
                <Badge key={cpv} variant="outline" className="text-xs">{cpv}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Órgano de contratación */}
      {lic.organo && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Órgano de contratación</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-gray-400" />
              <span className="font-medium">{lic.organo.nombre}</span>
            </div>
            {lic.organo.tipo && <div className="text-gray-500 ml-6">Tipo: {lic.organo.tipo}</div>}
            {lic.ccaa && <div className="flex items-center gap-2 text-gray-500"><MapPin size={14} /> {lic.ccaa}{lic.provincia ? ` · ${lic.provincia}` : ''}{lic.municipio ? ` · ${lic.municipio}` : ''}</div>}
          </CardContent>
        </Card>
      )}

      {/* Adjudicatario */}
      {lic.adjudicatarioNombre && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Adjudicatario</CardTitle></CardHeader>
          <CardContent className="text-sm space-y-1">
            <div className="font-medium">{lic.adjudicatarioNombre}</div>
            {lic.adjudicatarioNif && <div className="text-gray-500">NIF: {lic.adjudicatarioNif}</div>}
          </CardContent>
        </Card>
      )}

      {/* Descripción */}
      {lic.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Descripción</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{lic.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Documentos */}
      {lic.documentos?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Documentos ({lic.documentos.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lic.documentos.map((doc: any, i: number) => (
                <a
                  key={i}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 text-sm text-blue-600 hover:text-blue-800"
                >
                  <FileText size={16} />
                  <span className="flex-1">{doc.nombre}</span>
                  <Badge variant="outline" className="text-xs">{doc.tipo}</Badge>
                  <ExternalLink size={14} />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen IA (placeholder para Sprint 5) */}
      <Card className="border-dashed opacity-50">
        <CardHeader><CardTitle className="text-sm">Resumen IA — Sprint 5</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-400">El resumen IA de esta licitación estará disponible próximamente.</p>
        </CardContent>
      </Card>
    </div>
  );
}