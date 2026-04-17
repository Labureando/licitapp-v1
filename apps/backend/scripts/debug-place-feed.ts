/**
 * Debug del feed de PLACE.
 *
 * Uso:
 *   npx ts-node apps/backend/scripts/debug-place-feed.ts
 *
 * Qué hace:
 *   1. Descarga la primera página del feed ATOM de PLACE.
 *   2. Parsea el XML con la misma config que CodiceParser.
 *   3. Vuelca el primer entry completo a `debug-entry.json`.
 *   4. Intenta localizar los paths de: organo, ccaa, provincia.
 *
 * Objetivo: descubrir los paths reales del XML para arreglar el parser.
 */

import { XMLParser } from 'fast-xml-parser';
import axios from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';

const FEED_URL =
  'https://contrataciondelestado.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

const OUTPUT_DIR = path.resolve(__dirname, '../debug-output');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function main() {
  console.log(`[DEBUG] Descargando ${FEED_URL}...`);

  const response = await axios.get<string>(FEED_URL, {
    headers: { Accept: 'application/atom+xml' },
    responseType: 'text',
    timeout: 30000,
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  });

  const xmlRaw = response.data;
  console.log(`[DEBUG] XML bruto: ${(xmlRaw.length / 1024).toFixed(1)} KB`);

  // Guarda el XML bruto para inspección manual
  fs.writeFileSync(path.join(OUTPUT_DIR, 'raw-feed.xml'), xmlRaw);

  const xml = new XMLParser({
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

  const parsed = xml.parse(xmlRaw);
  const feed = parsed.feed;
  if (!feed) {
    console.error('[ERROR] No se encontró <feed> en la raíz.');
    return;
  }

  const entries = feed.entry || [];
  console.log(`[DEBUG] Entries en la página: ${entries.length}`);

  if (entries.length === 0) {
    console.error('[ERROR] No hay entries. Feed vacío o estructura rara.');
    return;
  }

  // Toma el primer entry y lo vuelca entero
  const first = entries[0];
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'first-entry.json'),
    JSON.stringify(first, null, 2),
  );
  console.log(`[DEBUG] Primer entry volcado → debug-output/first-entry.json`);

  // Vuelca también los top-level keys para ver namespaces
  console.log('\n[DEBUG] Top-level keys del primer entry:');
  console.log(Object.keys(first));

  // Busca el ContractFolderStatus
  const cfKey = Object.keys(first).find((k) =>
    k.includes('ContractFolderStatus'),
  );
  console.log(`\n[DEBUG] ContractFolderStatus key: "${cfKey}"`);

  if (!cfKey) {
    console.error('[ERROR] No se encontró ContractFolderStatus.');
    return;
  }

  const cf = first[cfKey];
  console.log('[DEBUG] Keys dentro de ContractFolderStatus:');
  console.log(Object.keys(cf));

  // Intenta localizar LocatedContractingParty
  const lcpKey = Object.keys(cf).find((k) =>
    k.includes('LocatedContractingParty'),
  );
  console.log(`\n[DEBUG] LocatedContractingParty key: "${lcpKey}"`);

  if (lcpKey) {
    const lcp = cf[lcpKey];
    console.log('[DEBUG] Keys dentro de LocatedContractingParty:');
    console.log(Object.keys(lcp));

    // Busca BuyerProfileURIID
    const bpKey = Object.keys(lcp).find((k) => k.includes('BuyerProfile'));
    console.log(`[DEBUG] BuyerProfile* key: "${bpKey}"`);
    if (bpKey) {
      console.log(`[DEBUG] Valor:`, JSON.stringify(lcp[bpKey]));
    }

    // Busca Party
    const partyKey = Object.keys(lcp).find(
      (k) => k === 'cac:Party' || k.endsWith(':Party') || k === 'Party',
    );
    console.log(`[DEBUG] Party key: "${partyKey}"`);
    if (partyKey) {
      const party = lcp[partyKey];
      console.log('[DEBUG] Keys dentro de Party:');
      console.log(Object.keys(party));

      const pnKey = Object.keys(party).find((k) => k.includes('PartyName'));
      if (pnKey) {
        console.log(
          `[DEBUG] PartyName → Name:`,
          JSON.stringify(party[pnKey]),
        );
      }
    }
  }

  // Busca RealizedLocation / Address
  const ppKey = Object.keys(cf).find((k) => k.includes('ProcurementProject'));
  if (ppKey) {
    const pp = cf[ppKey];
    console.log('\n[DEBUG] Keys dentro de ProcurementProject:');
    console.log(Object.keys(pp));

    const rlKey = Object.keys(pp).find((k) => k.includes('RealizedLocation'));
    console.log(`[DEBUG] RealizedLocation key: "${rlKey}"`);
    if (rlKey) {
      const rl = pp[rlKey];
      console.log('[DEBUG] RealizedLocation content:');
      console.log(JSON.stringify(rl, null, 2).slice(0, 2000));
    }
  }

  console.log(`\n[OK] Revisa: ${path.join(OUTPUT_DIR, 'first-entry.json')}`);
  console.log(`[OK] Y:       ${path.join(OUTPUT_DIR, 'raw-feed.xml')}`);
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});