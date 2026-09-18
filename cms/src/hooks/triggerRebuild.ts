import type { CollectionAfterChangeHook, CollectionBeforeChangeHook, CollectionSlug, PayloadRequest } from 'payload';

/**
 * M9: Loest einen Astro-Rebuild aus, sobald sich die OEFFENTLICHE Fassung eines Beitrags/Termins
 * aendert - erste Veroeffentlichung, veroeffentlichte Korrektur, Zurueckziehen, Wiederherstellen,
 * zeitgesteuerte Veroeffentlichung. Nie bei Entwurf-Speichern oder Autosave.
 *
 * Grundlage ist die Hauptzeile des Dokuments in der Datenbank, nicht doc/previousDoc: Payload
 * schreibt sie nur bei Nicht-Entwurfs-Speicherungen (und setzt dabei immer updatedAt neu), bei
 * Entwurf/Autosave entsteht nur eine neue Version. previousDoc ist dagegen die neueste Version
 * einschliesslich Entwuerfen und taugt zur Unterscheidung nicht.
 *
 * Rebuild, wenn die Hauptzeile sich geaendert hat UND das Dokument vorher oder nachher oeffentlich
 * sichtbar war (dieselbe Definition wie access/readPublishedOrSession.ts).
 *
 * Fire-and-forget: ein fehlgeschlagener Webhook-Aufruf blockiert nie das Speichern in Payload.
 */

type Hauptzeile = { _status?: unknown; freigabeStatus?: unknown; updatedAt?: unknown } | null;

const istOeffentlich = (zeile: Hauptzeile): boolean =>
  zeile?.freigabeStatus === 'veroeffentlicht' && zeile?._status === 'published';

// Mit req gelesen, damit die noch nicht committete Aenderung derselben Transaktion sichtbar ist.
async function leseHauptzeile(req: PayloadRequest, collection: string, id: number | string): Promise<Hauptzeile> {
  const slug = collection as CollectionSlug;
  return (await req.payload.db.findOne({ collection: slug, req, where: { id: { equals: id } } })) as Hauptzeile;
}

const kontextSchluessel = (collection: string, id: unknown) => `rebuild-vorher:${collection}:${String(id)}`;

/** beforeChange: merkt sich den Stand der Hauptzeile vor der Aenderung. */
export const merkeOeffentlichenStand: CollectionBeforeChangeHook = async ({ collection, context, data, operation, originalDoc, req }) => {
  if (operation === 'update' && originalDoc?.id !== undefined) {
    context[kontextSchluessel(collection.slug, originalDoc.id)] = await leseHauptzeile(req, collection.slug, originalDoc.id);
  }
  return data;
};

export const triggerRebuild: CollectionAfterChangeHook = async ({ collection, context, doc, operation, req }) => {
  const schluessel = kontextSchluessel(collection.slug, doc.id);
  const nachher = await leseHauptzeile(req, collection.slug, doc.id);

  let ausloesen: boolean;
  if (operation === 'create') {
    ausloesen = istOeffentlich(nachher);
  } else if (schluessel in context) {
    const vorher = context[schluessel] as Hauptzeile;
    const hauptzeileGeaendert = String(vorher?.updatedAt) !== String(nachher?.updatedAt);
    ausloesen = hauptzeileGeaendert && (istOeffentlich(vorher) || istOeffentlich(nachher));
  } else {
    // Vorher-Stand unbekannt (sollte nicht vorkommen): lieber einmal zu viel bauen als eine
    // oeffentliche Aenderung zu verschlucken.
    ausloesen = istOeffentlich(nachher);
  }

  if (!ausloesen) return doc;

  const webhookUrl = process.env.REBUILD_WEBHOOK_URL;
  const secret = process.env.REBUILD_WEBHOOK_SECRET;

  if (!webhookUrl || !secret) {
    req.payload.logger.warn('REBUILD_WEBHOOK_URL/REBUILD_WEBHOOK_SECRET nicht gesetzt - Rebuild nicht ausgelöst.');
    return doc;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-webhook-secret': secret },
      body: JSON.stringify({ reason: `${collection.slug}:${doc.id}:${String(nachher?.freigabeStatus)}/${String(nachher?._status)}` }),
    });
  } catch (err) {
    req.payload.logger.error(`Rebuild-Webhook fehlgeschlagen: ${(err as Error).message}`);
  }

  return doc;
};
