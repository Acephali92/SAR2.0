import type { Field, FieldHook } from 'payload';
import { slugify } from '../lib/slugify';

const autoSlug: FieldHook = ({ value, data, originalDoc }) => {
  if (value) return slugify(value);
  const fallback = data?.title ?? originalDoc?.title;
  return fallback ? slugify(fallback) : value;
};

/** Wird aus dem Titel generiert, ist aber von Redaktion/Admin editierbar (URL-Kontinuitaet beim Umbenennen). */
export const slugField: Field = {
  name: 'slug',
  type: 'text',
  required: true,
  unique: true,
  index: true,
  admin: { position: 'sidebar' },
  hooks: {
    beforeValidate: [autoSlug],
  },
};
