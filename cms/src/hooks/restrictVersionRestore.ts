import { APIError } from 'payload';
import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Begrenzt das Wiederherstellen alter Versionen fuer die Rolle Autor.
 *
 * Hintergrund: Payload kennt kein eigenes Zugriffsrecht fuers Wiederherstellen. Die Operation
 * restoreVersion prueft ausschliesslich collection.access.update (payload/dist/collections/
 * operations/restoreVersion.js) - wer ein Dokument bearbeiten darf, darf damit auch jeden
 * beliebigen alten Stand darueber schreiben. Fremde Dokumente sind dadurch bereits abgedeckt
 * (ownDraftOrRedaktion liefert eine Where-Bedingung, der Restore laeuft dann in "Forbidden"),
 * ein eigenes VEROEFFENTLICHTES Dokument aber nicht. Genau das faengt dieser Hook ab.
 *
 * Erkennungsmerkmal: restoreVersion setzt vor den beforeChange-Hooks req.context.isRestoringVersion.
 * Bei jedem normalen Speichern (inkl. Autosave) ist das Flag nicht gesetzt - dieser Hook ist dort
 * also wirkungslos.
 */
export const restrictVersionRestore: CollectionBeforeChangeHook = ({ context, data, originalDoc, req }) => {
  if (!context.isRestoringVersion) return data;

  const role = req.user?.role;
  if (role === 'redaktion' || role === 'admin') return data;

  if (originalDoc?.freigabeStatus === 'veroeffentlicht') {
    throw new APIError(
      'Dieses Dokument ist veröffentlicht. Eine veröffentlichte Fassung darf nur die Redaktion auf eine ältere Version zurücksetzen.',
      403
    );
  }

  if (data?.freigabeStatus === 'veroeffentlicht') {
    throw new APIError(
      'Diese Version stammt aus dem veröffentlichten Stand. Mit der Rolle Autor lassen sich nur Entwurfsstände wiederherstellen — bitte die Redaktion ansprechen.',
      403
    );
  }

  return data;
};
