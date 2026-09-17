/**
 * Einmalige Migration der drei bestehenden Markdown-Inhalte (Astro-Collections `analysen`,
 * `aktionen`) nach Payload. Ausfuehren gegen eine LAUFENDE Payload+Postgres-Instanz:
 *
 *   npm run seed
 *
 * Danach: Ergebnis in der Payload-Admin-UI pruefen (3 Dokumente, korrekte Slugs/Felder),
 * erst dann `analysen`/`aktionen` aus src/content/config.ts entfernen und die alten
 * Markdown-Ordner loeschen (siehe docs/ARCHITEKTUR.md, Abschnitt Content-Migration).
 *
 * Idempotent: ueberspringt Dokumente, deren slug bereits existiert.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { getPayload } from 'payload';
import config from '../src/payload.config';
import { markdownToLexical } from '../src/lib/markdownToLexical';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(dirname, '../..');

async function upsertBeitrag(payload: Awaited<ReturnType<typeof getPayload>>, filePath: string) {
  const slug = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const existing = await payload.find({ collection: 'beitraege', where: { slug: { equals: slug } } });
  if (existing.docs.length > 0) {
    console.log(`Beitrag "${slug}" existiert bereits - übersprungen.`);
    return;
  }

  await payload.create({
    collection: 'beitraege',
    data: {
      title: data.title,
      slug,
      description: data.description,
      kategorie: 'analyse',
      body: markdownToLexical(content),
      tags: (data.tags ?? []).map((tag: string) => ({ tag })),
      status: 'veroeffentlicht',
      publishedAt: new Date(data.publishedAt).toISOString(),
    },
  });
  console.log(`Beitrag "${slug}" importiert.`);
}

async function upsertTermin(payload: Awaited<ReturnType<typeof getPayload>>, filePath: string) {
  const slug = path.basename(filePath, '.md');
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);

  const existing = await payload.find({ collection: 'termine', where: { slug: { equals: slug } } });
  if (existing.docs.length > 0) {
    console.log(`Termin "${slug}" existiert bereits - übersprungen.`);
    return;
  }

  await payload.create({
    collection: 'termine',
    data: {
      title: data.title,
      slug,
      description: data.description,
      body: markdownToLexical(content),
      eventType: data.eventType,
      startDate: new Date(data.startDate).toISOString(),
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      location: data.location,
      registrationUrl: data.registrationUrl,
      eventStatus: data.status ?? 'upcoming',
      status: 'veroeffentlicht',
      publishedAt: new Date(data.publishedAt).toISOString(),
    },
  });
  console.log(`Termin "${slug}" importiert.`);
}

async function main() {
  const payload = await getPayload({ config });

  const analysenDir = path.join(REPO_ROOT, 'src/content/analysen');
  const aktionenDir = path.join(REPO_ROOT, 'src/content/aktionen');

  for (const file of fs.readdirSync(analysenDir).filter((f) => f.endsWith('.md'))) {
    await upsertBeitrag(payload, path.join(analysenDir, file));
  }
  for (const file of fs.readdirSync(aktionenDir).filter((f) => f.endsWith('.md'))) {
    await upsertTermin(payload, path.join(aktionenDir, file));
  }

  console.log('Migration abgeschlossen.');
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
