import type { Access, Where } from 'payload';

/**
 * Wer die Versionsgeschichte von Beitraege/Termine lesen darf: Redaktion/Admin alles,
 * Autor nur eigene Dokumente, ohne Login gar nichts.
 *
 * Ohne diese Funktion greift Payloads Fallback in executeAccess: ist access.readVersions
 * nicht gesetzt, darf JEDER eingeloggte Nutzer die Versionen ALLER Dokumente lesen -
 * einschliesslich des API-Key-Nutzers, mit dem der Astro-Build zugreift.
 *
 * Die Where-Bedingung laeuft gegen die Versions-Collection, nicht gegen die Dokument-Collection:
 * dort liegen die Dokumentfelder unterhalb von "version.*" (siehe buildVersionCollectionFields
 * in payload/dist/versions). Deshalb "version.createdBy" und nicht "createdBy".
 */
export const canReadVersions: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === 'redaktion' || req.user.role === 'admin') return true;

  const where: Where = { 'version.createdBy': { equals: req.user.id } };
  return where;
};
