import type { TaskConfig } from 'payload';

/**
 * M5 (zeitgesteuerte Veroeffentlichung): laeuft per Payload Jobs Queue alle ~5 Minuten (siehe
 * payload.config.ts jobs.autoRun), sucht in beiden Collections Dokumente mit status=zur_freigabe
 * und einem publishAt in der Vergangenheit, und setzt sie auf veroeffentlicht. Das loest ueber den
 * afterChange-Hook (triggerRebuild) automatisch den Rebuild-Webhook aus (M9).
 *
 * Wichtig: nur Dokumente, die bereits von der Redaktion freigegeben wurden (zur_freigabe), werden
 * automatisch veroeffentlicht - ein Entwurf kann nicht allein durch Zeitablauf live gehen.
 */
async function runForCollection(payload: any, collection: 'beitraege' | 'termine') {
  const now = new Date().toISOString();
  const due = await payload.find({
    collection,
    where: {
      and: [{ status: { equals: 'zur_freigabe' } }, { publishAt: { less_than_equal: now } }],
    },
    limit: 100,
  });

  for (const doc of due.docs) {
    await payload.update({
      collection,
      id: doc.id,
      data: { status: 'veroeffentlicht' },
    });
  }

  return due.docs.length;
}

export const schedulePublishTask: TaskConfig<'schedulePublish'> = {
  slug: 'schedulePublish',
  retries: 2,
  handler: async ({ req }) => {
    const beitraegeCount = await runForCollection(req.payload, 'beitraege');
    const termineCount = await runForCollection(req.payload, 'termine');
    req.payload.logger.info(
      `schedulePublish: ${beitraegeCount} Beiträge, ${termineCount} Termine veröffentlicht.`
    );
    return { output: {} };
  },
};
