import type { CollectionAfterReadHook } from 'payload';
import { lexicalToHtml } from '../lib/lexicalToHtml';

/**
 * Legt ein virtuelles renderedHtml-Feld auf die API-Antwort, damit der Astro-Content-Layer-Loader
 * nur einen fertigen HTML-String konsumiert und die Payload-Rich-Text-Abhaengigkeit vollstaendig
 * in cms/ bleibt (kein @payloadcms/richtext-lexical im Astro-Root-package.json).
 */
export const addRenderedHtml: CollectionAfterReadHook = async ({ doc }) => {
  doc.renderedHtml = await lexicalToHtml(doc.body);
  return doc;
};
