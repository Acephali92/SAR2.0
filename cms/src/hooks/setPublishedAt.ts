import type { CollectionBeforeChangeHook } from 'payload';

/** Stempelt publishedAt beim ersten Uebergang nach "veroeffentlicht"; spaetere Bearbeitungen aendern es nicht. */
export const setPublishedAt: CollectionBeforeChangeHook = ({ data, originalDoc }) => {
  const wasPublished = originalDoc?.status === 'veroeffentlicht';
  const isNowPublished = data.status === 'veroeffentlicht';

  if (isNowPublished && !wasPublished && !data.publishedAt) {
    data.publishedAt = new Date().toISOString();
  }

  return data;
};
