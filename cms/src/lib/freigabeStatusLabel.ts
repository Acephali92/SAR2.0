/**
 * Deutsche Bezeichnungen fuer freigabeStatus (siehe fields/statusField.ts).
 * Gemeinsam genutzt von VorschauView.tsx und uebersichtDaten.ts, damit beide Stellen bei einer
 * Aenderung (neuer Status, andere Beschriftung) synchron bleiben statt zweimal gepflegt zu werden.
 */
export const FREIGABE_STATUS_LABEL: Record<string, string> = {
  entwurf: 'Entwurf',
  veroeffentlicht: 'Veröffentlicht',
  zur_freigabe: 'Zur Freigabe',
};
