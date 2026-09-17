import type { CollectionConfig } from 'payload';
import { editorConfig } from '../lib/editorConfig';
import { slugField } from '../fields/slugField';
import { statusField, createdByField, publishAtField, publishedAtField } from '../fields/statusField';
import { setCreatedBy } from '../hooks/setCreatedBy';
import { setPublishedAt } from '../hooks/setPublishedAt';
import { triggerRebuild } from '../hooks/triggerRebuild';
import { addRenderedHtml } from '../hooks/addRenderedHtml';
import { ownDraftOrRedaktion, ownDraftOnlyDelete } from '../access/ownDraftOrRedaktion';

/**
 * Termine (Veranstaltungen) - ersetzt die bisherige Astro-Collection `aktionen`.
 * eventStatus (Veranstaltungslebenszyklus: demnaechst/laeuft/beendet/abgesagt) ist bewusst NICHT
 * `freigabeStatus` genannt, um Verwechslung mit dem redaktionellen Freigabeprozess zu vermeiden -
 * und statusField.ts' Feld heisst wiederum bewusst NICHT "status", weil das mit Payloads intern
 * generiertem Postgres-Enum fuer die eigene "_status"-Spalte (Drafts/Versions) kollidiert.
 * verknuepfteBeitraege ist ein reines "join"-Feld - Spiegel von Beitraege.verknuepfterTermin,
 * hier nicht direkt editierbar (Pflege passiert im Beitrag).
 */
export const Termine: CollectionConfig = {
  slug: 'termine',
  labels: { singular: 'Termin', plural: 'Termine' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'eventStatus', 'freigabeStatus'],
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
    maxPerDoc: 50,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true;
      return { freigabeStatus: { equals: 'veroeffentlicht' } };
    },
    create: ({ req }) => !!req.user,
    update: ownDraftOrRedaktion,
    delete: ownDraftOnlyDelete,
  },
  hooks: {
    beforeChange: [setCreatedBy, setPublishedAt],
    afterChange: [triggerRebuild],
    afterRead: [addRenderedHtml],
  },
  fields: [
    { name: 'title', type: 'text', required: true, label: 'Titel' },
    slugField,
    {
      name: 'description',
      type: 'textarea',
      required: true,
      maxLength: 160,
      label: 'Beschreibung (max. 160 Zeichen, für Meta-Description)',
    },
    { name: 'body', type: 'richText', required: true, editor: editorConfig, label: 'Inhalt' },
    {
      name: 'eventType',
      type: 'select',
      required: true,
      label: 'Art der Veranstaltung',
      options: [
        { label: 'Friedenswoche', value: 'friedenswoche' },
        { label: 'Demonstration', value: 'demonstration' },
        { label: 'Konferenz', value: 'konferenz' },
        { label: 'Workshop', value: 'workshop' },
        { label: 'Sonstiges', value: 'sonstiges' },
      ],
    },
    { name: 'startDate', type: 'date', required: true, label: 'Beginn' },
    { name: 'endDate', type: 'date', label: 'Ende (optional)' },
    {
      name: 'location',
      type: 'group',
      label: 'Ort',
      fields: [
        { name: 'name', type: 'text', required: true, label: 'Name des Orts' },
        { name: 'address', type: 'text', label: 'Adresse' },
        { name: 'city', type: 'text', label: 'Stadt' },
      ],
    },
    { name: 'registrationUrl', type: 'text', label: 'Anmeldelink' },
    {
      name: 'eventStatus',
      type: 'select',
      required: true,
      defaultValue: 'upcoming',
      label: 'Veranstaltungsstatus',
      options: [
        { label: 'Demnächst', value: 'upcoming' },
        { label: 'Läuft gerade', value: 'ongoing' },
        { label: 'Abgeschlossen', value: 'completed' },
        { label: 'Abgesagt', value: 'cancelled' },
      ],
    },
    {
      name: 'verknuepfteBeitraege',
      type: 'join',
      collection: 'beitraege',
      on: 'verknuepfterTermin',
      label: 'Zugehörige Beiträge',
    },
    {
      name: 'image',
      type: 'group',
      label: 'Titelbild',
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', label: 'Bild' }],
    },
    statusField,
    publishAtField,
    publishedAtField,
    createdByField,
  ],
};
