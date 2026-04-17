import { Link } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Calendar, MapPin, Euro, Building2, Clock } from 'lucide-react';
import type { LicitacionCard as LicitacionCardType } from '../api/licitaciones';

const ESTADO_COLORS: Record<string, string> = {
  ABIERTA: 'bg-green-100 text-green-800',
  ADJUDICADA: 'bg-blue-100 text-blue-800',
  CERRADA: 'bg-yellow-100 text-yellow-800',
  RESUELTA: 'bg-purple-100 text-purple-800',
  DESIERTA: 'bg-gray-100 text-gray-800',
  ANULADA: 'bg-red-100 text-red-800',
  ANUNCIO_PREVIO: 'bg-indigo-100 text-indigo-800',
  DESCONOCIDO: 'bg-gray-100 text-gray-500',
};

function formatMoney(centimos: number | null): string {
  if (!centimos) return '—';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(centimos / 100);
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysUntil(iso: string | null): string | null {
  if (!iso) return null;
  const diff = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  return `${diff} días`;
}

export function LicitacionCard({ licitacion: l }: { licitacion: LicitacionCardType }) {
  const deadline = daysUntil(l.fechaPresentacion);

  return (
    <Link to={`/licitaciones/${l.id}`}>
      <Card className="hover:ring-2 hover:ring-blue-200 transition-all cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Estado + Tipo */}
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[l.estado] || ESTADO_COLORS.DESCONOCIDO}`}>
                  {l.estado}
                </span>
                {l.tipoContrato && (
                  <span className="text-xs text-gray-500">{l.tipoContrato}</span>
                )}
                {deadline && (
                  <span className="inline-flex items-center gap-1 text-xs text-orange-600 font-medium">
                    <Clock size={12} /> {deadline}
                  </span>
                )}
              </div>

              {/* Título */}
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                {l.title}
              </h3>

              {/* Metadatos */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {l.organo && (
                  <span className="flex items-center gap-1">
                    <Building2 size={12} />
                    <span className="truncate max-w-[200px]">{l.organo.nombre}</span>
                  </span>
                )}
                {l.ccaa && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {l.ccaa}
                  </span>
                )}
                {l.fechaPublicacion && (
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(l.fechaPublicacion)}
                  </span>
                )}
              </div>
            </div>

            {/* Presupuesto */}
            <div className="text-right shrink-0">
              <div className="text-sm font-semibold text-gray-900">
                {formatMoney(l.presupuestoBase)}
              </div>
              <div className="text-xs text-gray-400">sin IVA</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}