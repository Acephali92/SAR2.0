/**
 * M10: Export aller veroeffentlichten Beitraege/Termine als Markdown (+Frontmatter) und JSON.
 * Gibt dem Projekt dieselbe Portabilitaets-Absicherung, die die uebrigen Astro-Collections durch
 * ihr Markdown-Format ohnehin schon haben - falls Payload je abgeloest wird, bleiben die Inhalte
 * in einem einfachen, werkzeugunabhaengigen Format erhalten.
 *
 * Ausfuehren: npm run export  (schreibt nach cms/exports/, gitignored)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getPayload } from 'payload';
import TurndownService from 'turndown';
import config from '../src/payload.config.ts';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const EXPORT_DIR = path.join(dirname, '../exports');
const turndown = new TurndownService();

function writeFrontmatterMarkdown(filePath, frontmatter, bodyMarkdown) {
  const yaml = Object.entries(frontmatter)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join('\n');
  fs.writeFileSync(filePath, `---\n${yaml}\n---\n\n${bodyMarkdown}\n`);
}

async function exportCollection(payload, collection, mapFrontmatter) {
  const outDir = path.join(EXPORT_DIR, collection);
  fs.mkdirSync(outDir, { recursive: true });

  const { docs } = await payload.find({
    collection,
    // Dieselbe Definition von "oeffentlich" wie src/access/readPublishedOrSession.ts - freigabeStatus
    // allein wuerde auch Dokumente exportieren, die in Payload nie veroeffentlicht wurden.
    where: {
      and: [{ freigabeStatus: { equals: 'veroeffentlicht' } }, { _status: { equals: 'published' } }],
    },
    depth: 1,
    // Aus verknuepften Nutzern (createdBy, author) nur den Namen - sonst landen E-Mail-Adressen,
    // Session-IDs und ggf. entschluesselte API-Keys der Redaktion im Export.
    populate: { users: { name: true } },
    limit: 1000,
  });

  fs.writeFileSync(path.join(outDir, 'all.json'), JSON.stringify(docs, null, 2));

  for (const doc of docs) {
    const bodyMarkdown = turndown.turndown(doc.renderedHtml ?? '');
    writeFrontmatterMarkdown(path.join(outDir, `${doc.slug}.md`), mapFrontmatter(doc), bodyMarkdown);
  }

  console.log(`${collection}: ${docs.length} Dokumente exportiert nach ${outDir}`);
}

async function main() {
  const payload = await getPayload({ config });

  await exportCollection(payload, 'beitraege', (doc) => ({
    title: doc.title,
    description: doc.description,
    kategorie: doc.kategorie,
    tags: (doc.tags ?? []).map((t) => t.tag),
    publishedAt: doc.publishedAt,
    updatedAt: doc.updatedAt,
  }));

  await exportCollection(payload, 'termine', (doc) => ({
    title: doc.title,
    description: doc.description,
    eventType: doc.eventType,
    startDate: doc.startDate,
    endDate: doc.endDate,
    location: doc.location,
    eventStatus: doc.eventStatus,
    publishedAt: doc.publishedAt,
  }));

  process.exit(0);
}

// Top-Level-await ist noetig: "payload run" importiert dieses Skript und ruft direkt danach
// process.exit(0) auf - ohne await wuerde der Export abgebrochen, bevor er etwas schreibt.
await main();
