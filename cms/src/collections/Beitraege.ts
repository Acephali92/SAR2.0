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
 * Beitraege (Nachrichten/Analysen) - ersetzt die bisherige Astro-Collection `analysen`.
 * M6: verknuepfterTermin ist die schreibbare Seite der Beitrag<->Termin-Verknuepfung; die
 * Ruecksicht auf Termine.verknuepfteBeitraege ist ein reines "join"-Feld (siehe Termine.ts),
 * damit die Verknuepfung nur an einer Stelle gepflegt werden muss.
 */
export const Beitraege: CollectionConfig = {
  slug: 'beitraege',
  labels: { singular: 'Beitrag', plural: 'Beiträge' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'kategorie', 'freigabeStatus', 'publishedAt'],
  },
  versions: {
    drafts: { autosave: { interval: 2000 } },
    maxPerDoc: 50,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true; // eingeloggte Nutzer sehen alles in der Admin-UI (Rollenlogik greift ueber update/delete)
      return { freigabeStatus: { equals: 'veroeffentlicht' } }; // API-Lesezugriff des Astro-Loaders: nur Veroeffentlichtes
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
    {
      name: 'kategorie',
      type: 'select',
      required: true,
      label: 'Kategorie',
      options: [
        { label: 'Nachricht', value: 'nachricht' },
        { label: 'Analyse', value: 'analyse' },
      ],
    },
    { name: 'body', type: 'richText', required: true, editor: editorConfig, label: 'Inhalt' },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      label: 'Autor (Anzeige)',
      admin: { description: 'Optional - wenn leer, wird kein Autor angezeigt.' },
    },
    {
      name: 'tags',
      type: 'array',
      label: 'Themen/Tags',
      fields: [{ name: 'tag', type: 'text', required: true }],
    },
    {
      name: 'sources',
      type: 'array',
      label: 'Quellen',
      admin: { description: 'Belege für alle Fakten und Zahlen im Beitrag (siehe Redaktionsregeln).' },
      fields: [
        { name: 'label', type: 'text', required: true, label: 'Bezeichnung' },
        { name: 'url', type: 'text', required: true, label: 'URL' },
      ],
    },
    {
      name: 'relatedSlugs',
      type: 'relationship',
      relationTo: 'beitraege',
      hasMany: true,
      label: 'Verwandte Beiträge ("weiterlesen")',
    },
    {
      name: 'verknuepfterTermin',
      type: 'relationship',
      relationTo: 'termine',
      hasMany: true,
      label: 'Verknüpfter Termin',
      admin: { description: 'Termin(e), auf die sich dieser Beitrag bezieht.' },
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
