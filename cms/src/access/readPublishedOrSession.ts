import type { Access, Where } from 'payload';

/**
 * Oeffentlich lesbar ist nur, was BEIDE Status-Felder freigeben:
 *  - freigabeStatus (redaktioneller Workflow, inkl. zeitgesteuerter Veroeffentlichung)
 *  - _status (Payloads Draft-Mechanismus)
 *
 * Nur freigabeStatus reicht nicht: ein veroeffentlichtes Dokument behaelt freigabeStatus
 * "veroeffentlicht", auch wenn danach ein unveroeffentlichter Entwurf gespeichert wird. Mit
 * ?draft=true (REST) bzw. draft: true (GraphQL) liefert Payload dann die neueste Version -
 * also den Entwurf -, solange _status nicht mitgeprueft wird.
 */
export const nurVeroeffentlicht: Where = {
  and: [{ freigabeStatus: { equals: 'veroeffentlicht' } }, { _status: { equals: 'published' } }],
};

/**
 * Payload setzt req.user._strategy zur Laufzeit ('api-key' bzw. 'local-jwt', siehe
 * payload/dist/auth/strategies/), das Feld fehlt aber im generierten User-Typ.
 */
export function istApiKeyZugriff(user: unknown): boolean {
  return (user as { _strategy?: unknown } | null | undefined)?._strategy === 'api-key';
}

/**
 * Angemeldete Menschen (Session-Login der Admin-UI) sehen alles; die Rollenlogik greift dort ueber
 * update/delete. Anonyme Anfragen UND API-Key-Anfragen (Build-Nutzer des Astro-Loaders) sehen nur
 * Veroeffentlichtes - der Build darf nie Entwuerfe in die statische Seite ziehen.
 */
export const readPublishedOrSession: Access = ({ req }) => {
  if (req.user && !istApiKeyZugriff(req.user)) return true;
  return nurVeroeffentlicht;
};
