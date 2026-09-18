import type { PayloadRequest } from 'payload';

/**
 * Ziel des "Vorschau"-Knopfs in der Edit-Ansicht (collection.admin.preview).
 * Zeigt immer auf die interne, angemeldete Admin-Route - nie auf stoppramstein.de,
 * das statisch bleibt und Entwuerfe nicht kennt.
 */
export function vorschauUrl(collection: 'beitraege' | 'termine') {
  return (doc: Record<string, unknown>, { req }: { req: PayloadRequest }): null | string => {
    if (doc?.id === undefined || doc?.id === null) return null;
    return `${req.payload.config.routes.admin}/vorschau/${collection}/${String(doc.id)}`;
  };
}
