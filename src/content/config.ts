/**
 * Content Collections Configuration
 * ==================================
 * Single source of truth for all content schemas
 *
 * Collections:
 * - warum-ramstein: Core arguments (drone warfare, environment, law, Germany)
 * - analysen: Geopolitical analysis articles
 * - aktionen: Events (current and archived)
 * - mitmachen: Engagement pages (donate, membership, volunteer)
 * - seiten: Static pages (impressum, kontakt, etc.)
 */

import { defineCollection, z } from 'astro:content';

// Base schema shared by all content types
const baseSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().max(160, 'Description must be 160 characters or less'),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  draft: z.boolean().default(false),
});

// "Warum Ramstein" - Core arguments collection
const warumRamstein = defineCollection({
  type: 'content',
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

// "Analysen" - Geopolitical analysis articles
const analysen = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    relatedSlugs: z.array(z.string()).optional(), // Related article slugs
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

// "Aktionen" - Events collection
const aktionen = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    eventType: z.enum(['friedenswoche', 'demonstration', 'konferenz', 'workshop', 'sonstiges']),
    startDate: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.object({
      name: z.string(),
      address: z.string().optional(),
      city: z.string().optional(),
    }),
    registrationUrl: z.string().url().optional(),
    status: z.enum(['upcoming', 'ongoing', 'completed', 'cancelled']).default('upcoming'),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
  }),
});

// "Mitmachen" - Engagement pages
const mitmachen = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    ctaType: z.enum(['spenden', 'mitgliedschaft', 'ehrenamt', 'petition']),
    contactEmail: z.string().email().optional(),
    order: z.number().default(0),
  }),
});

// "Seiten" - Static pages
const seiten = defineCollection({
  type: 'content',
  schema: baseSchema.extend({
    pageWidth: z.enum(['default', 'wide', 'narrow']).default('default'),
    showInNav: z.boolean().default(false),
  }),
});

export const collections = {
  'warum-ramstein': warumRamstein,
  analysen,
  aktionen,
  mitmachen,
  seiten,
};
