import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';

export interface ParsedLicitacion {
  externalId: string;
  source: string;
  title: string;
  description: string | null;
  cpvCodes: string[];
  presupuestoBase: string | null;
  presupuestoConIva: string | null;
  tipoContrato: string | null;
  procedimiento: string | null;
  estado: string;
  tramitacion: string | null;
  ccaa: string | null;
  provincia: string | null;
  municipio: string | null;
  fechaPublicacion: Date | null;
  fechaPresentacion: Date | null;
  fechaAdjudicacion: Date | null;
  adjudicatarioNombre: string | null;
  adjudicatarioNif: string | null;
  importeAdjudicacion: string | null;
  porcentajeBaja: number | null;
  numLicitadores: number | null;
  tieneLotes: boolean;
  documentos: any[];
  organoExternalId: string | null;
  organoNombre: string | null;
  organoTipo: string | null;
  updated: string;
}

@Injectable()
export class CodiceParser {
  private readonly logger = new Logger(CodiceParser.name);
  private readonly xml: XMLParser;

  constructor() {
    this.xml = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      isArray: (tag) =>
        ['entry', 'link', 'cac:AdditionalDocumentReference',
         'cac:TenderResult', 'cbc:ItemClassificationCode'].includes(tag),
    });
  }

  parseAtomFeed(xmlContent: string): { entries: ParsedLicitacion[]; nextUrl: string | null } {
    const parsed = this.xml.parse(xmlContent);
    const feed = parsed.feed;
    if (!feed) return { entries: [], nextUrl: null };

    const rawEntries = feed.entry || [];
    const entries: ParsedLicitacion[] = [];

    for (const entry of rawEntries) {
      try {
        const lic = this.parseEntry(entry);
        if (lic) entries.push(lic);
      } catch (e) {
        this.logger.warn(`Error parseando entry: ${e.message}`);
      }
    }

    // Paginación
    let nextUrl: string | null = null;
    const links = Array.isArray(feed.link) ? feed.link : [feed.link].filter(Boolean);
    for (const link of links) {
      if (link?.['@_rel'] === 'next') { nextUrl = link['@_href']; break; }
    }

    return { entries, nextUrl };
  }

  private parseEntry(entry: any): ParsedLicitacion | null {
    const externalId = this.text(entry.id) || '';
    if (!externalId) return null;

    const title = this.text(entry.title) || 'Sin título';
    const updated = this.text(entry.updated) || new Date().toISOString();
    const cf = this.findCF(entry);

    const base = { externalId, source: 'PLACE', title, description: this.text(entry.summary) || null, updated };

    if (!cf) {
      return {
        ...base, cpvCodes: [], presupuestoBase: null, presupuestoConIva: null,
        tipoContrato: null, procedimiento: null, estado: 'DESCONOCIDO', tramitacion: null,
        ccaa: null, provincia: null, municipio: null,
        fechaPublicacion: this.date(updated), fechaPresentacion: null, fechaAdjudicacion: null,
        adjudicatarioNombre: null, adjudicatarioNif: null, importeAdjudicacion: null,
        porcentajeBaja: null, numLicitadores: null, tieneLotes: false, documentos: [],
        organoExternalId: null, organoNombre: null, organoTipo: null,
      } as ParsedLicitacion;
    }

    return {
      ...base,
      cpvCodes: this.cpvs(cf),
      presupuestoBase: this.money(cf, 'TaxExclusiveAmount'),
      presupuestoConIva: this.money(cf, 'TotalAmount'),
      tipoContrato: this.mapTipo(this.code(cf, 'TypeCode')),
      procedimiento: this.mapProc(this.nestedCode(cf, 'TenderingProcess', 'ProcedureCode')),
      estado: this.mapEstado(this.code(cf, 'ContractFolderStatusCode')),
      tramitacion: this.mapTram(this.nestedCode(cf, 'TenderingProcess', 'UrgencyCode')),
      ccaa: this.location(cf, 'CountrySubentity'),
      provincia: this.location(cf, 'CountrySubentityCode'),
      municipio: this.location(cf, 'CityName'),
      fechaPublicacion: this.date(updated),
      fechaPresentacion: this.deadline(cf),
      fechaAdjudicacion: this.awardDate(cf),
      adjudicatarioNombre: this.winnerName(cf),
      adjudicatarioNif: this.winnerNif(cf),
      importeAdjudicacion: this.awardAmount(cf),
      porcentajeBaja: this.baja(cf),
      numLicitadores: this.tenderCount(cf),
      tieneLotes: !!this.find(this.find(cf, 'ProcurementProject'), 'ProcurementProjectLot'),
      documentos: this.docs(cf),
      organoExternalId: this.organoId(cf),
      organoNombre: this.organoName(cf),
      organoTipo: this.organoType(cf),
    } as ParsedLicitacion;
  }

  // ═══ EXTRACTORES ═══

  private cpvs(cf: any): string[] {
    try {
      const proj = this.find(cf, 'ProcurementProject');
      const cls = this.find(proj, 'RequiredCommodityClassification');
      if (!cls) return [];
      const items = Array.isArray(cls) ? cls : [cls];
      return items.map(i => this.text(this.find(i, 'ItemClassificationCode'))).filter(Boolean) as string[];
    } catch { return []; }
  }

  private money(cf: any, field: string): string | null {
    try {
      const budget = this.find(this.find(cf, 'ProcurementProject'), 'BudgetAmount');
      const val = this.text(this.find(budget, field));
      return val ? String(Math.round(parseFloat(val) * 100)) : null;
    } catch { return null; }
  }

  private code(cf: any, frag: string): string | null {
    try { return this.text(this.find(cf, frag)) || null; } catch { return null; }
  }

  private nestedCode(cf: any, parent: string, child: string): string | null {
    try { return this.text(this.find(this.find(cf, parent), child)) || null; } catch { return null; }
  }

  private location(cf: any, field: string): string | null {
    try {
      const addr = this.find(this.find(this.find(cf, 'ProcurementProject'), 'RealizedLocation'), 'Address');
      return this.text(this.find(addr, field)) || null;
    } catch { return null; }
  }

  private deadline(cf: any): Date | null {
    try {
      const period = this.find(this.find(cf, 'TenderingProcess'), 'TenderSubmissionDeadlinePeriod');
      const d = this.text(this.find(period, 'EndDate'));
      const t = this.text(this.find(period, 'EndTime'));
      return d ? this.date(t ? `${d}T${t}` : d) : null;
    } catch { return null; }
  }

  private awardDate(cf: any): Date | null {
    try { return this.date(this.text(this.find(this.result(cf), 'AwardDate'))); } catch { return null; }
  }

  private winnerName(cf: any): string | null {
    try {
      const party = this.find(this.result(cf), 'WinningParty');
      return this.text(this.find(this.find(party, 'PartyName'), 'Name')) || null;
    } catch { return null; }
  }

  private winnerNif(cf: any): string | null {
    try {
      const party = this.find(this.result(cf), 'WinningParty');
      return this.text(this.find(this.find(party, 'PartyIdentification'), 'ID')) || null;
    } catch { return null; }
  }

  private awardAmount(cf: any): string | null {
    try {
      const monetary = this.find(this.find(this.result(cf), 'AwardedTenderedProject'), 'LegalMonetaryTotal');
      const val = this.text(this.find(monetary, 'TaxExclusiveAmount'));
      return val ? String(Math.round(parseFloat(val) * 100)) : null;
    } catch { return null; }
  }

  private tenderCount(cf: any): number | null {
    try {
      const val = this.text(this.find(this.result(cf), 'ReceivedTenderQuantity'));
      return val ? parseInt(val, 10) : null;
    } catch { return null; }
  }

  private baja(cf: any): number | null {
    const p = this.money(cf, 'TaxExclusiveAmount');
    const a = this.awardAmount(cf);
    if (p && a) {
      const pn = parseFloat(p), an = parseFloat(a);
      if (pn > 0) return Math.round(((pn - an) / pn) * 10000) / 100;
    }
    return null;
  }

  private docs(cf: any): any[] {
    try {
      const refs = this.find(cf, 'AdditionalDocumentReference');
      if (!refs) return [];
      const items = Array.isArray(refs) ? refs : [refs];
      return items.map(doc => {
        const ext = this.find(this.find(doc, 'Attachment'), 'ExternalReference');
        const uri = this.text(this.find(ext, 'URI'));
        if (!uri) return null;
        return {
          nombre: this.text(this.find(ext, 'FileName')) || 'Documento',
          url: uri,
          tipo: this.text(this.find(doc, 'DocumentTypeCode')) || 'OTRO',
        };
      }).filter(Boolean);
    } catch { return []; }
  }

  private organoId(cf: any): string | null {
    try { return this.text(this.find(this.find(cf, 'LocatedContractingParty'), 'BuyerProfileURIID')) || null; } catch { return null; }
  }

  private organoName(cf: any): string | null {
    try {
      const cp = this.find(this.find(cf, 'LocatedContractingParty'), 'Party');
      return this.text(this.find(this.find(cp, 'PartyName'), 'Name')) || null;
    } catch { return null; }
  }

  private organoType(cf: any): string | null {
    try {
      const cp = this.find(this.find(cf, 'LocatedContractingParty'), 'Party');
      return this.text(this.find(cp, 'PartyTypeCode')) || null;
    } catch { return null; }
  }

  // ═══ MAPPINGS ═══

  private mapEstado(c: string | null): string {
    const m: Record<string, string> = {
      PEN: 'ABIERTA', EV: 'CERRADA', ADJ: 'ADJUDICADA', RES: 'RESUELTA',
      FOR: 'RESUELTA', DES: 'DESIERTA', ANU: 'ANULADA', PRE: 'ANUNCIO_PREVIO',
    };
    return m[c || ''] || c || 'DESCONOCIDO';
  }

  private mapTipo(c: string | null): string | null {
    const m: Record<string, string> = {
      '1': 'SERVICIOS', '2': 'SUMINISTROS', '3': 'OBRAS',
      '21': 'CONCESION_SERVICIOS', '31': 'CONCESION_OBRAS', '40': 'MIXTO',
    };
    return m[c || ''] || c || null;
  }

  private mapProc(c: string | null): string | null {
    const m: Record<string, string> = {
      '1': 'ABIERTO', '2': 'RESTRINGIDO', '3': 'NEGOCIADO_SIN_PUBLICIDAD',
      '4': 'NEGOCIADO_CON_PUBLICIDAD', '5': 'DIALOGO_COMPETITIVO',
      '6': 'SIMPLIFICADO', '100': 'BASADO_ACUERDO_MARCO',
    };
    return m[c || ''] || c || null;
  }

  private mapTram(c: string | null): string | null {
    const m: Record<string, string> = { '1': 'ORDINARIA', '2': 'URGENTE', '3': 'EMERGENCIA' };
    return m[c || ''] || null;
  }

  // ═══ UTILS ═══

  private result(cf: any): any {
    const r = this.find(cf, 'TenderResult');
    return Array.isArray(r) ? r[0] : r;
  }

  private findCF(entry: any): any {
    for (const k of Object.keys(entry)) { if (k.includes('ContractFolderStatus')) return entry[k]; }
    return null;
  }

  private text(node: any): string | null {
    if (!node) return null;
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (node['#text'] !== undefined) return String(node['#text']);
    return null;
  }

  private find(obj: any, frag: string): any {
    if (!obj || typeof obj !== 'object') return null;
    for (const k of Object.keys(obj)) { if (k.includes(frag)) return obj[k]; }
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === 'object' && !k.startsWith('@_')) {
        const f = this.find(obj[k], frag);
        if (f) return f;
      }
    }
    return null;
  }

  private date(s: string | null): Date | null {
    if (!s) return null;
    try { const d = new Date(s); return isNaN(d.getTime()) ? null : d; } catch { return null; }
  }
}