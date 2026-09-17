/**
 * Content Collections Configuration (Astro 5 Content Layer)
 * ===========================================================
 * Single source of truth for alle Content-Schemas.
 *
 * Astro laedt genau EINE Config-Datei fuer Content Collections (content.config.ts hat Vorrang
 * vor dem alten content/config.ts, es gibt kein Zusammenfuehren beider Dateien) - deshalb sind
 * hier bewusst ALLE fuenf Collections zusammengefasst:
 *
 * - warum-ramstein, mitmachen, seiten: git-basierte Markdown-Collections (glob-Loader,
 *   unveraendert gegenüber vorher, nur auf die Content-Layer-API umgestellt)
 * - beitraege, termine: Payload-CMS-gesteuert (payloadLoader, Build-Zeit-Fetch gegen die
 *   Redaktionsoberflaeche bzw. eine committete Fixture, siehe src/lib/payload-loader.ts und
 *   cms/ - ersetzt die fruehere analysen/aktionen-Markdown-Collection, siehe docs/ARCHITEKTUR.md)
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { payloadLoader } from './lib/payload-loader';

// Base schema shared by the git-based Markdown collections
const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(160, 'Description must be 160 characters or less'),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

// "Warum Ramstein" - Core arguments collection
const warumRamstein = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/warum-ramstein' }),
  schema: baseSchema.extend({
    category: z.enum(['drohnenkrieg', 'umwelt', 'voelkerrecht', 'deutschland']),
    order: z.number().default(0), // For manual sorting
    sources: z
      .array(
        z.object({
          label: z.string(),
          url: z.string().url(),
        })
      )
      .optional(),
  }),
});

// "Mitmachen" - Engagement pages
const mitmachen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/mitmachen' }),
  schema: baseSchema.extend({
    ctaType: z.enum(['spenden', 'mitgliedschaft', 'ehrenamt', 'petition']),
    contactEmail: z.string().email().optional(),
    order: z.number().default(0),
  }),
});

// "Seiten" - Static pages
const seiten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seiten' }),
  schema: baseSchema.extend({
    pageWidth: z.enum(['default', 'wide', 'narrow']).default('default'),
    showInNav: z.boolean().default(false),
  }),
});

const imageSchema = z.object({ src: z.string(), alt: z.string() }).nullable().optional();

// "Beiträge" (Nachrichten/Analysen) - Payload-CMS-gesteuert, ersetzt die frühere Collection "analysen"
const beitraege = defineCollection({
  loader: payloadLoader({ collection: 'beitraege' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    kategorie: z.enum(['nachricht', 'analyse']),
    author: z.string().nullable().optional(),
    tags: z.array(z.string()).default([]),
    sources: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
    relatedSlugs: z.array(z.string()).default([]),
    terminSlugs: z.array(z.string()).default([]),
    image: imageSchema,
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }),
});

// "Termine" (Veranstaltungen) - Payload-CMS-gesteuert, ersetzt die frühere Collection "aktionen"
const termine = defineCollection({
  loader: payloadLoader({ collection: 'termine' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    eventType: z.enum(['friedenswoche', 'demonstration', 'konferenz', 'workshop', 'sonstiges']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.object({
      name: z.string(),
      address: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
      city: z
        .string()
        .nullish()
        .transform((v) => v ?? undefined),
    }),
    registrationUrl: z.string().nullable().optional(),
    eventStatus: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
    beitragSlugs: z.array(z.string()).default([]),
    image: imageSchema,
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
  }),
});

export const collections = {
  'warum-ramstein': warumRamstein,
  mitmachen,
  seiten,
  beitraege,
  termine,
};
