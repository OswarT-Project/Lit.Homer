import { defineContentConfig, defineCollection, z } from '@nuxt/content'

const origin = z.enum(['ai', 'human']).default('ai')
const medium = z.string().optional()

export default defineContentConfig({
  collections: {
    landing: defineCollection({
      type: 'data',
      source: 'index.yml',
      schema: z.object({
        title: z.string(),
        subtitle: z.string(),
        tagline: z.string(),
        intro: z.string(),
        club: z.string(),
      }),
    }),
    pages: defineCollection({
      type: 'page',
      source: '*.md',
    }),
    categories: defineCollection({
      type: 'data',
      source: 'categories/*.yml',
      schema: z.object({
        name: z.string(),
        description: z.string(),
        order: z.number(),
      }),
    }),
    media: defineCollection({
      type: 'data',
      source: 'media/*.yml',
      schema: z.object({
        name: z.string(),
        art: z.string(),
        num: z.string().optional(),
        order: z.number(),
      }),
    }),
    entries: defineCollection({
      type: 'page',
      source: 'entries/*.md',
      schema: z.object({
        category: z.string(),
        relation: z.enum(['引用', '化用', '同源']).optional(),
        origin,
        series: z.string().optional(),
        game: z.object({
          title: z.string(),
          year: z.string().optional(),
          studio: z.string().optional(),
          medium,
        }),
        work: z.object({
          title: z.string(),
          author: z.string().optional(),
          year: z.string().optional(),
          medium,
        }),
        tags: z.array(z.string()).default([]),
        updated: z.date(),
        quote: z
          .object({
            text: z.string(),
            original: z.string().optional(),
            lang: z.string().optional(),
            source: z.string().optional(),
            note: z.string().optional(),
          })
          .optional(),
        notes: z.array(z.object({ label: z.string(), text: z.string() })).default([]),
        related: z.array(z.string()).default([]),
      }),
    }),
    topics: defineCollection({
      type: 'page',
      source: 'topics/*.md',
      schema: z.object({
        origin,
        status: z.enum(['征集', '整理中', '已完成']),
        tags: z.array(z.string()).default([]),
        updated: z.date(),
        entries: z.array(z.string()).default([]),
        leads: z.array(z.string()).default([]),
      }),
    }),
    series: defineCollection({
      type: 'page',
      source: 'series/*.md',
      schema: z.object({
        short: z.string(),
        eyebrow: z.string().default('专题'),
        roster: z
          .array(
            z.object({
              name: z.string(),
              work: z.string(),
              author: z.string(),
              medium,
              note: z.string().optional(),
              entry: z.string().optional(),
            }),
          )
          .default([]),
      }),
    }),
  },
})
