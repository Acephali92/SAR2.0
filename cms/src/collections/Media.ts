import type { CollectionConfig } from 'payload';
import { isLoggedIn } from '../access/isLoggedIn';
import { isRedaktionOrAdmin } from '../access/isRedaktionOrAdmin';

/** M4: Bild-/PDF-Upload mit automatischer Verkleinerung und Pflicht-Alt-Text. */
export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: process.env.UPLOAD_DIR ?? 'uploads',
    mimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, fit: 'inside' },
      { name: 'card', width: 800, fit: 'inside' },
      { name: 'og', width: 1200, height: 630, fit: 'cover' },
    ],
    adminThumbnail: 'thumbnail',
    formatOptions: { format: 'webp', options: { quality: 80 } },
  },
  access: {
    // Kein anonymer Zugriff - weder auf die JSON-Liste noch auf die Datei-Bytes unter
    // /api/media/file/... (Payload prueft dort dieselbe read-Regel). Die oeffentliche Seite braucht
    // das nicht: payload-loader.ts laedt Bilder zur Build-Zeit mit dem API-Key und liefert sie
    // selbst gehostet aus (CSP img-src 'self'). Ohne diese Sperre war die komplette Mediathek
    // einschliesslich nur in Entwuerfen verwendeter Bilder anonym abrufbar.
    read: isLoggedIn,
    create: isLoggedIn,
    update: isRedaktionOrAdmin,
    delete: isRedaktionOrAdmin,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alternativtext (Pflichtfeld für Barrierefreiheit)',
      admin: {
        description: 'Beschreibt das Bild für Screenreader. Bei PDFs: kurze Inhaltsangabe.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'Bildunterschrift (optional)',
    },
  ],
};
