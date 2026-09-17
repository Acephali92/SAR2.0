import type { Field } from 'payload';
import { canTransitionStatus } from '../access/canTransitionStatus';

/**
 * Redaktioneller Status (M5: Entwurf -> Freigabe -> Veroeffentlichung).
 * Bewusst getrennt von Payloads nativem drafts/versions-Mechanismus (siehe Beitraege.ts/Termine.ts):
 * versions.drafts sichert Revisionen, dieses Feld bildet den 3-stufigen Freigabeprozess ab.
 *
 * WICHTIG: heisst bewusst "freigabeStatus", NICHT "status" - Payload legt fuer den internen
 * drafts/versions-Mechanismus selbst eine Spalte "_status" an und generiert daraus in Postgres
 * einen Enum-Typ nach dem Muster enum_<collection>_status. Ein eigenes Feld exakt "status" zu
 * nennen kollidiert mit genau diesem generierten Enum-Namen (enum_beitraege_status etc.) und
 * fuehrt zu einem kaputten DB-Schema (CREATE TABLE schlaegt fehl: "invalid input value for enum").
 */
export const statusField: Field = {
  name: 'freigabeStatus',
  type: 'select',
  required: true,
  defaultValue: 'entwurf',
  label: 'Status',
  options: [
    { label: 'Entwurf', value: 'entwurf' },
    { label: 'Zur Freigabe', value: 'zur_freigabe' },
    { label: 'Veröffentlicht', value: 'veroeffentlicht' },
  ],
  access: {
    update: canTransitionStatus,
  },
  admin: {
    position: 'sidebar',
    description: 'Entwurf -> Zur Freigabe -> Veröffentlicht. Nur Redaktion/Admin dürfen freigeben.',
  },
};

export const createdByField: Field = {
  name: 'createdBy',
  type: 'relationship',
  relationTo: 'users',
  admin: { position: 'sidebar', readOnly: true },
  access: {
    update: () => false,
  },
};

export const publishAtField: Field = {
  name: 'publishAt',
  type: 'date',
  label: 'Geplante Veröffentlichung',
  admin: {
    position: 'sidebar',
    description:
      'Optional: Zeitpunkt für die automatische Veröffentlichung (nur wirksam, wenn Status "Zur Freigabe" ist). Wird alle paar Minuten geprüft.',
    date: { pickerAppearance: 'dayAndTime' },
  },
};

export const publishedAtField: Field = {
  name: 'publishedAt',
  type: 'date',
  label: 'Veröffentlicht am',
  admin: {
    position: 'sidebar',
    readOnly: true,
    description: 'Wird automatisch beim ersten Wechsel zu "Veröffentlicht" gesetzt.',
  },
};
