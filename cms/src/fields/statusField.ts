import type { Field } from 'payload';
import { canTransitionStatus } from '../access/canTransitionStatus';

/**
 * Redaktioneller Status (M5: Entwurf -> Freigabe -> Veroeffentlichung).
 * Bewusst getrennt von Payloads nativem drafts/versions-Mechanismus (siehe Beitraege.ts/Termine.ts):
 * versions.drafts sichert Revisionen, dieses Feld bildet den 3-stufigen Freigabeprozess ab.
 */
export const statusField: Field = {
  name: 'status',
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
