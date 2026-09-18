import type { Loader, LoaderContext } from 'astro/loaders';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

/**
 * Astro Content-Layer-Loader fuer die Payload-CMS-gesteuerten Collections (Beitraege, Termine).
 *
 * Zwei Modi, je nachdem ob PAYLOAD_URL gesetzt ist:
 *  - GESETZT (Produktions-/Staging-Build, immer der Fall wenn der Rebuild-Webhook baut): fetcht
 *    live von der Payload-REST-API, nur veroeffentlichte Dokumente. Nichterreichbarkeit laesst
 *    den Build laut fehlschlagen (kein stiller leerer Collection-Stand).
 *  - NICHT GESETZT (lokales `npm run dev`/`npm run build` ohne laufendes cms/, sowie CI): liest
 *    eine committete Fixture-Datei unter src/content/_fixtures/. So bleibt `npm run verify` auch
 *    ohne Docker/Postgres lauffaehig. Die Fixtures sind aus den drei migrierten Bestandsartikeln
 *    erzeugt (siehe cms/scripts/seed-import.ts) und werden bei Bedarf manuell aktualisiert.
 *
 * In beiden Faellen laeuft der Fetch ausschliesslich zur Build-Zeit - die ausgelieferte Website
 * braucht Payload nie zur Laufzeit (M7: funktioniert auch bei CMS-Ausfall).
 */

interface PayloadLoaderOptions {
  collection: 'beitraege' | 'termine';
}

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const MEDIA_OUT_DIR = path.join(REPO_ROOT, 'public/media/cms');

function toPlainDate(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// Die Datei-Bytes unter /api/media/file/... liegen hinter derselben read-Regel wie die Media-Collection
// (anonym gesperrt) - daher derselbe API-Key-Header wie in fetchLive.
async function downloadMedia(url: string, payloadBaseUrl: string, apiToken: string): Promise<string> {
  const absoluteUrl = url.startsWith('http') ? url : `${payloadBaseUrl}${url}`;
  const hash = crypto.createHash('sha1').update(absoluteUrl).digest('hex').slice(0, 12);
  const ext = path.extname(new URL(absoluteUrl).pathname) || '.webp';
  const filename = `${hash}${ext}`;
  const outPath = path.join(MEDIA_OUT_DIR, filename);

  if (!fs.existsSync(outPath)) {
    fs.mkdirSync(MEDIA_OUT_DIR, { recursive: true });
    const res = await fetch(absoluteUrl, { headers: { Authorization: `users API-Key ${apiToken}` } });
    if (!res.ok) throw new Error(`Medien-Download fehlgeschlagen (${res.status}): ${absoluteUrl}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(outPath, buffer);
  }

  return `/media/cms/${filename}`;
}

async function resolveImage(
  imageGroup: { image?: { url?: string; alt?: string; sizes?: Record<string, { url?: string }> } } | undefined,
  payloadBaseUrl: string,
  apiToken: string
): Promise<{ src: string; alt: string } | undefined> {
  if (!imageGroup?.image?.url) return undefined;
  const cardUrl = imageGroup.image.sizes?.card?.url ?? imageGroup.image.url;
  const src = await downloadMedia(cardUrl, payloadBaseUrl, apiToken);
  return { src, alt: imageGroup.image.alt ?? '' };
}

function loadFixture(collection: string): unknown[] {
  const fixturePath = path.join(REPO_ROOT, 'src/content/_fixtures', `${collection}.json`);
  if (!fs.existsSync(fixturePath)) return [];
  return JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
}

async function fetchLive(collection: string, payloadUrl: string, apiToken: string): Promise<unknown[]> {
  const now = new Date().toISOString();
  const query = new URLSearchParams({
    'where[freigabeStatus][equals]': 'veroeffentlicht',
    'where[publishedAt][less_than_equal]': now,
    depth: '2',
    limit: '1000',
  });
  const res = await fetch(`${payloadUrl}/api/${collection}?${query.toString()}`, {
    headers: { Authorization: `users API-Key ${apiToken}` },
  });
  if (!res.ok) {
    throw new Error(
      `Payload-API nicht erreichbar (${res.status} ${res.statusText}) für Collection "${collection}". ` +
        'Build abgebrochen, um keine Seite ohne aktuelle Beiträge/Termine zu veröffentlichen.'
    );
  }
  const json = (await res.json()) as { docs: unknown[] };
  return json.docs;
}

function slugsOf(rel: unknown): string[] {
  if (!Array.isArray(rel)) return [];
  return rel
    .map((entry) => (typeof entry === 'object' && entry && 'slug' in entry ? (entry as { slug: string }).slug : undefined))
    .filter((slug): slug is string => Boolean(slug));
}

export function payloadLoader({ collection }: PayloadLoaderOptions): Loader {
  return {
    name: `payload-${collection}`,
    load: async ({ store, logger, parseData }: LoaderContext) => {
      const payloadUrl = process.env.PAYLOAD_URL;
      const apiToken = process.env.PAYLOAD_API_TOKEN;

      let rawDocs: any[];
      if (payloadUrl) {
        if (!apiToken) {
          throw new Error('PAYLOAD_URL ist gesetzt, aber PAYLOAD_API_TOKEN fehlt.');
        }
        logger.info(`Lade "${collection}" von ${payloadUrl} ...`);
        rawDocs = (await fetchLive(collection, payloadUrl, apiToken)) as any[];
      } else {
        logger.warn(
          `PAYLOAD_URL nicht gesetzt - lade "${collection}" aus der committeten Fixture (src/content/_fixtures/${collection}.json).`
        );
        rawDocs = loadFixture(collection) as any[];
      }

      store.clear();

      for (const doc of rawDocs) {
        const image = await resolveImage(doc.image, payloadUrl ?? '', apiToken ?? '');

        const baseData: Record<string, unknown> = {
          title: doc.title,
          description: doc.description,
          publishedAt: toPlainDate(doc.publishedAt),
          updatedAt: toPlainDate(doc.updatedAt),
          image,
        };

        const data =
          collection === 'beitraege'
            ? {
                ...baseData,
                kategorie: doc.kategorie,
                author: typeof doc.author === 'object' ? doc.author?.name : undefined,
                tags: (doc.tags ?? []).map((t: { tag: string }) => t.tag),
                sources: doc.sources ?? [],
                relatedSlugs: slugsOf(doc.relatedSlugs),
                terminSlugs: slugsOf(doc.verknuepfterTermin),
              }
            : {
                ...baseData,
                eventType: doc.eventType,
                startDate: toPlainDate(doc.startDate),
                endDate: toPlainDate(doc.endDate),
                location: doc.location,
                registrationUrl: doc.registrationUrl,
                eventStatus: doc.eventStatus,
                beitragSlugs: slugsOf(doc.verknuepfteBeitraege?.docs ?? doc.verknuepfteBeitraege),
              };

        const parsed = await parseData({ id: doc.slug, data });
        store.set({ id: doc.slug, data: parsed, rendered: { html: doc.renderedHtml ?? '' } });
      }

      logger.info(`"${collection}": ${rawDocs.length} Dokument(e) geladen.`);
    },
  };
}
