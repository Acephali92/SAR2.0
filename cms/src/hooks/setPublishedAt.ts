import type { CollectionBeforeChangeHook } from 'payload';

/** Stempelt publishedAt beim ersten Uebergang nach "veroeffentlicht"; spaetere Bearbeitungen aendern es nicht. */
export const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const wasPublished = originalDoc?.freigabeStatus === 'veroeffentlicht';
  const isNowPublished = data.freigabeStatus === 'veroeffentlicht';

  if (isNowPublished && !wasPublished && !data.publishedAt) {
    data.publishedAt = new Date().toISOString();
  }

  return data;
};
