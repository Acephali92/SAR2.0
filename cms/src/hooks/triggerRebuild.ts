import type { CollectionAfterChangeHook } from 'payload';

/**
 * M9: Loest einen Astro-Rebuild aus, sobald ein Beitrag/Termin ver- oder entveroeffentlicht wird.
 * Feuert bewusst NICHT bei jedem Entwurf-Autosave - nur bei einer tatsaechlichen Aenderung des
 * oeffentlich sichtbaren Zustands. Fire-and-forget: ein fehlgeschlagener Webhook-Aufruf blockiert
 * nie das Speichern in Payload; Fehler landen im Payload-Log.
 */
export const triggerRebuild: CollectionAfterChangeHook = async ({ doc, previousDoc, operation, req }) => {
  const becamePublished =
    doc.freigabeStatus === 'veroeffentlicht' &&
    (operation === 'create' || previousDoc?.freigabeStatus !== 'veroeffentlicht');
  const wasUnpublished =
    previousDoc?.freigabeStatus === 'veroeffentlicht' && doc.freigabeStatus !== 'veroeffentlicht';

  if (!becamePublished && !wasUnpublished) {
    return doc;
  }

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
      body: JSON.stringify({ reason: `${doc.id}:${doc.freigabeStatus}` }),
    });
  } catch (err) {
    req.payload.logger.error(`Rebuild-Webhook fehlgeschlagen: ${(err as Error).message}`);
  }

  return doc;
};
