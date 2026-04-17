/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { XMLParser } from 'fast-xml-parser';
import {
  getGeoFromCode,
  normalizeCCAA,
  normalizeProvincia,
  getCCAAFromProvincia,
  inferProvinciaFromText,
} from './geography.map';

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
        [
          'entry',
          'link',
          'cac:AdditionalDocumentReference',
          'cac:TenderResult',
          'cbc:ItemClassificationCode',
        ].includes(tag),
    });
  }

  parseAtomFeed(xmlContent: string): {
    entries: ParsedLicitacion[];
    nextUrl: string | null;
  } {
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
        this.logger.warn(`Error parseando entry: ${(e as Error).message}`);
      }
    }

    let nextUrl: string | null = null;
    const links = Array.isArray(feed.link)
      ? feed.link
      : [feed.link].filter(Boolean);
    for (const link of links) {
      if (link?.['@_rel'] === 'next') {
        nextUrl = link['@_href'];
        break;
      }
    }

    return { entries, nextUrl };
  }

  private parseEntry(entry: any): ParsedLicitacion | null {
    const externalId = this.text(entry.id) || '';
    if (!externalId) return null;

    const title = this.text(entry.title) || 'Sin título';
    const updated = this.text(entry.updated) || new Date().toISOString();
    const cf = this.getLocal(entry, 'ContractFolderStatus');

    const base = {
      externalId,
      source: 'PLACE',
      title,
      description: this.text(entry.summary) || null,
      updated,
    };

    if (!cf) {
      return {
        ...base,
        cpvCodes: [],
        presupuestoBase: null,
        presupuestoConIva: null,
        tipoContrato: null,
        procedimiento: null,
        estado: 'DESCONOCIDO',
        tramitacion: null,
        ccaa: null,
        provincia: null,
        municipio: null,
        fechaPublicacion: this.date(updated),
        fechaPresentacion: null,
        fechaAdjudicacion: null,
        adjudicatarioNombre: null,
        adjudicatarioNif: null,
        importeAdjudicacion: null,
        porcentajeBaja: null,
        numLicitadores: null,
        tieneLotes: false,
        documentos: [],
        organoExternalId: null,
        organoNombre: null,
        organoTipo: null,
      } as ParsedLicitacion;
    }

    // Extraer datos geográficos (combina 3 fuentes en cascada)
    const geo = this.extractGeo(cf);
    const organoName = this.extractOrganoName(cf);

    // Último fallback: si sigue sin provincia, infiere desde municipio o nombre del órgano
    let provincia = geo.provincia;
    let ccaa = geo.ccaa;
    if (!provincia && geo.municipio) {
      provincia = inferProvinciaFromText(geo.municipio);
      if (provincia && !ccaa) ccaa = getCCAAFromProvincia(provincia);
    }
    if (!provincia && organoName) {
      provincia = inferProvinciaFromText(organoName);
      if (provincia && !ccaa) ccaa = getCCAAFromProvincia(provincia);
    }

    return {
      ...base,
      cpvCodes: this.cpvs(cf),
      presupuestoBase: this.money(cf, 'TaxExclusiveAmount'),
      presupuestoConIva: this.money(cf, 'TotalAmount'),
      tipoContrato: this.mapTipo(this.extractProjectTypeCode(cf)),
      procedimiento: this.mapProc(this.extractProcedureCode(cf)),
      estado: this.mapEstado(this.extractStatusCode(cf)),
      tramitacion: this.mapTram(this.extractUrgencyCode(cf)),
      ccaa,
      provincia,
      municipio: geo.municipio,
      fechaPublicacion: this.date(updated),
      fechaPresentacion: this.deadline(cf),
      fechaAdjudicacion: this.awardDate(cf),
      adjudicatarioNombre: this.winnerName(cf),
      adjudicatarioNif: this.winnerNif(cf),
      importeAdjudicacion: this.awardAmount(cf),
      porcentajeBaja: this.baja(cf),
      numLicitadores: this.tenderCount(cf),
      tieneLotes: !!this.getLocal(
        this.getLocal(cf, 'ProcurementProject'),
        'ProcurementProjectLot',
      ),
      documentos: this.docs(cf),
      organoExternalId: this.extractOrganoId(cf),
      organoNombre: organoName,
      organoTipo: this.extractOrganoType(cf),
    } as ParsedLicitacion;
  }

  // ═══════════════════════════════════════════
  // EXTRACTORES
  // ═══════════════════════════════════════════

  /**
   * Extrae geolocalización desde RealizedLocation.
   * Estructura CODICE real:
   *   ProcurementProject:
   *     RealizedLocation:
   *       CountrySubentity: "Granada"         (provincia en texto)
   *       CountrySubentityCode: "ES614"       (NUTS3)
   *       Address:
   *         CityName: "Albolote (Granada)"    (municipio)
   */
  private extractGeo(cf: any): {
    provincia: string | null;
    ccaa: string | null;
    municipio: string | null;
  } {
    const project = this.getLocal(cf, 'ProcurementProject');
    const location = this.getLocal(project, 'RealizedLocation');
    if (!location) return { provincia: null, ccaa: null, municipio: null };

    // 1) Código NUTS3/NUTS2 (más fiable)
    const nuts = this.text(this.getLocal(location, 'CountrySubentityCode'));
    const fromCode = getGeoFromCode(nuts);

    // 2) Nombre de provincia en texto (fallback)
    const subentityText = this.text(this.getLocal(location, 'CountrySubentity'));
    const provFromText = normalizeProvincia(subentityText);

    // 3) Municipio
    const address = this.getLocal(location, 'Address');
    const municipio = this.text(this.getLocal(address, 'CityName'));

    const provincia = fromCode.provincia ?? provFromText ?? null;
    const ccaa =
      fromCode.ccaa ??
      (provincia ? getCCAAFromProvincia(provincia) : null) ??
      normalizeCCAA(subentityText);

    return { provincia, ccaa, municipio };
  }

  private extractOrganoId(cf: any): string | null {
    const lcp = this.getLocal(cf, 'LocatedContractingParty');
    return this.text(this.getLocal(lcp, 'BuyerProfileURIID'));
  }

  private extractOrganoName(cf: any): string | null {
    const lcp = this.getLocal(cf, 'LocatedContractingParty');
    const party = this.getLocal(lcp, 'Party');
    const partyName = this.getLocal(party, 'PartyName');
    return this.text(this.getLocal(partyName, 'Name'));
  }

  private extractOrganoType(cf: any): string | null {
    const lcp = this.getLocal(cf, 'LocatedContractingParty');
    // ContractingPartyTypeCode está a nivel de LocatedContractingParty, no de Party
    return (
      this.text(this.getLocal(lcp, 'ContractingPartyTypeCode')) ??
      this.text(this.getLocal(this.getLocal(lcp, 'Party'), 'PartyTypeCode'))
    );
  }

  private extractStatusCode(cf: any): string | null {
    return this.text(this.getLocal(cf, 'ContractFolderStatusCode'));
  }

  private extractProjectTypeCode(cf: any): string | null {
    const project = this.getLocal(cf, 'ProcurementProject');
    return this.text(this.getLocal(project, 'TypeCode'));
  }

  private extractProcedureCode(cf: any): string | null {
    const tp = this.getLocal(cf, 'TenderingProcess');
    return this.text(this.getLocal(tp, 'ProcedureCode'));
  }

  private extractUrgencyCode(cf: any): string | null {
    const tp = this.getLocal(cf, 'TenderingProcess');
    return this.text(this.getLocal(tp, 'UrgencyCode'));
  }

  private cpvs(cf: any): string[] {
    try {
      const proj = this.getLocal(cf, 'ProcurementProject');
      const cls = this.getLocal(proj, 'RequiredCommodityClassification');
      if (!cls) return [];
      const items = Array.isArray(cls) ? cls : [cls];
      return items
        .map((i) => this.text(this.getLocal(i, 'ItemClassificationCode')))
        .filter(Boolean) as string[];
    } catch {
      return [];
    }
  }

  private money(cf: any, field: string): string | null {
    try {
      const project = this.getLocal(cf, 'ProcurementProject');
      const budget = this.getLocal(project, 'BudgetAmount');
      const val = this.text(this.getLocal(budget, field));
      return val ? String(Math.round(parseFloat(val) * 100)) : null;
    } catch {
      return null;
    }
  }

  private deadline(cf: any): Date | null {
    try {
      const tp = this.getLocal(cf, 'TenderingProcess');
      const period = this.getLocal(tp, 'TenderSubmissionDeadlinePeriod');
      const d = this.text(this.getLocal(period, 'EndDate'));
      const t = this.text(this.getLocal(period, 'EndTime'));
      return d ? this.date(t ? `${d}T${t}` : d) : null;
    } catch {
      return null;
    }
  }

  private awardDate(cf: any): Date | null {
    try {
      return this.date(this.text(this.getLocal(this.result(cf), 'AwardDate')));
    } catch {
      return null;
    }
  }

  private winnerName(cf: any): string | null {
    try {
      const party = this.getLocal(this.result(cf), 'WinningParty');
      const partyName = this.getLocal(party, 'PartyName');
      return this.text(this.getLocal(partyName, 'Name'));
    } catch {
      return null;
    }
  }

  private winnerNif(cf: any): string | null {
    try {
      const party = this.getLocal(this.result(cf), 'WinningParty');
      const id = this.getLocal(party, 'PartyIdentification');
      return this.text(this.getLocal(id, 'ID'));
    } catch {
      return null;
    }
  }

  private awardAmount(cf: any): string | null {
    try {
      const atp = this.getLocal(this.result(cf), 'AwardedTenderedProject');
      const total = this.getLocal(atp, 'LegalMonetaryTotal');
      const val = this.text(this.getLocal(total, 'TaxExclusiveAmount'));
      return val ? String(Math.round(parseFloat(val) * 100)) : null;
    } catch {
      return null;
    }
  }

  private tenderCount(cf: any): number | null {
    try {
      const val = this.text(
        this.getLocal(this.result(cf), 'ReceivedTenderQuantity'),
      );
      return val ? parseInt(val, 10) : null;
    } catch {
      return null;
    }
  }

  private baja(cf: any): number | null {
    const p = this.money(cf, 'TaxExclusiveAmount');
    const a = this.awardAmount(cf);
    if (p && a) {
      const pn = parseFloat(p),
        an = parseFloat(a);
      if (pn > 0) return Math.round(((pn - an) / pn) * 10000) / 100;
    }
    return null;
  }

  private docs(cf: any): any[] {
    try {
      const refs = this.getLocal(cf, 'AdditionalDocumentReference');
      if (!refs) return [];
      const items = Array.isArray(refs) ? refs : [refs];
      return items
        .map((doc) => {
          const attach = this.getLocal(doc, 'Attachment');
          const ext = this.getLocal(attach, 'ExternalReference');
          const uri = this.text(this.getLocal(ext, 'URI'));
          if (!uri) return null;
          return {
            nombre: this.text(this.getLocal(ext, 'FileName')) || 'Documento',
            url: uri,
            tipo: this.text(this.getLocal(doc, 'DocumentTypeCode')) || 'OTRO',
          };
        })
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  // ═══════════════════════════════════════════
  // MAPPINGS
  // ═══════════════════════════════════════════

  private mapEstado(c: string | null): string {
    const m: Record<string, string> = {
      PEN: 'ABIERTA',
      PUB: 'ABIERTA',
      EV: 'CERRADA',
      ADJ: 'ADJUDICADA',
      RES: 'RESUELTA',
      FOR: 'RESUELTA',
      DES: 'DESIERTA',
      ANU: 'ANULADA',
      ANUL: 'ANULADA',
      PRE: 'ANUNCIO_PREVIO',
    };
    return m[c || ''] || c || 'DESCONOCIDO';
  }

  private mapTipo(c: string | null): string | null {
    const m: Record<string, string> = {
      '1': 'SUMINISTROS',
      '2': 'SERVICIOS',
      '3': 'OBRAS',
      '4': 'ADMINISTRATIVO_ESPECIAL',
      '5': 'CONCESION_OBRAS',
      '6': 'CONCESION_SERVICIOS',
      '7': 'PRIVADO',
      '8': 'PATRIMONIAL',
      '9': 'OTROS',
      '10': 'MIXTO',
      '21': 'CONCESION_SERVICIOS',
      '31': 'CONCESION_OBRAS',
      '40': 'MIXTO',
    };
    return m[c || ''] || c || null;
  }

  private mapProc(c: string | null): string | null {
    const m: Record<string, string> = {
      '1': 'ABIERTO',
      '2': 'RESTRINGIDO',
      '3': 'NEGOCIADO_SIN_PUBLICIDAD',
      '4': 'NEGOCIADO_CON_PUBLICIDAD',
      '5': 'DIALOGO_COMPETITIVO',
      '6': 'SIMPLIFICADO',
      '7': 'SIMPLIFICADO_ABREVIADO',
      '8': 'CONCURSO_PROYECTOS',
      '9': 'OTROS',
      '10': 'SISTEMA_DINAMICO',
      '12': 'ASOCIACION_INNOVACION',
      '13': 'NORMAS_INTERNAS',
      '100': 'BASADO_ACUERDO_MARCO',
      '999': 'NO_DEFINIDO',
    };
    return m[c || ''] || c || null;
  }

  private mapTram(c: string | null): string | null {
    const m: Record<string, string> = {
      '1': 'ORDINARIA',
      '2': 'URGENTE',
      '3': 'EMERGENCIA',
    };
    return m[c || ''] || null;
  }

  // ═══════════════════════════════════════════
  // UTILS — NAVEGACIÓN DEL OBJETO XML
  // ═══════════════════════════════════════════

  private result(cf: any): any {
    const r = this.getLocal(cf, 'TenderResult');
    return Array.isArray(r) ? r[0] : r;
  }

  /**
   * Busca UNA key de un objeto por su "local name" (nombre sin prefijo de namespace).
   * Ejemplo: getLocal(obj, 'Party') matchea 'cac:Party' pero NO 'ContractingPartyTypeCode'.
   *
   * Reglas de matching (en orden):
   *   1. Match exacto: 'Party' === 'Party'
   *   2. Match con namespace: 'cac:Party' → local name es 'Party' → match
   *   3. No matchea si el local name es distinto (ej. 'ContractingPartyTypeCode')
   */
  private getLocal(obj: any, localName: string): any {
    if (!obj || typeof obj !== 'object') return null;
    for (const k of Object.keys(obj)) {
      if (this.localNameOf(k) === localName) return obj[k];
    }
    return null;
  }

  /**
   * Extrae el nombre local de una key con posible namespace.
   *   'cac:Party'                     → 'Party'
   *   'cbc-place-ext:BuyerProfileURIID' → 'BuyerProfileURIID'
   *   'Party'                         → 'Party'
   */
  private localNameOf(key: string): string {
    const idx = key.lastIndexOf(':');
    return idx >= 0 ? key.slice(idx + 1) : key;
  }

  private text(node: any): string | null {
    if (!node) return null;
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (typeof node === 'object' && node['#text'] !== undefined) {
      return String(node['#text']);
    }
    return null;
  }

  private date(s: string | null): Date | null {
    if (!s) return null;
    try {
      const d = new Date(s);
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
}