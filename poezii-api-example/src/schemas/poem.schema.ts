// src/schemas/poem.schema.ts

import { z } from 'zod'

// ============================================
// 1. Scheme pentru parametrii de query (căutare, filtrare, paginare)
// ============================================

/**
 * Schema pentru query-ul de listare a poeziilor.
 * Folosită la GET /v1/poems
 */
export const GetPoemsQuerySchema = z.object({
  search: z.string().optional(),
  authorSlug: z.string().optional(),
  type: z.enum(['EPIC', 'LYRIC', 'DRAMATIC', 'EPISTOLARY']).optional(),
  yearMin: z.coerce.number().int().min(0).max(new Date().getFullYear()).optional(),
  yearMax: z.coerce.number().int().min(0).max(new Date().getFullYear()).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['title', 'year', 'popularity', 'createdAt']).default('popularity'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeFullText: z.coerce.boolean().default(false),
})

// Tipul TypeScript inferat automat din schemă
export type GetPoemsQuery = z.infer<typeof GetPoemsQuerySchema>


// ============================================
// 2. Schema pentru parametrul de rută (ID-ul poeziei)
// ============================================

/**
 * Schema pentru parametrul de rută la GET /v1/poems/:id
 */
export const GetPoemParamsSchema = z.object({
  id: z.coerce.number().int().positive().describe('ID-ul numeric al poeziei'),
})

export type GetPoemParams = z.infer<typeof GetPoemParamsSchema>


// ============================================
// 3. Schema pentru slug (versiunea URL-prietenoasă)
// ============================================

/**
 * Schema pentru parametrul de rută la GET /v1/poems/slug/:slug
 */
export const GetPoemBySlugParamsSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/)
    .describe('Slug-ul poeziei (ex: "luceafarul", "lacul")'),
})

export type GetPoemBySlugParams = z.infer<typeof GetPoemBySlugParamsSchema>


// ============================================
// 4. Scheme pentru crearea și actualizarea poeziilor (admin)
// ============================================

/**
 * Schema pentru crearea unei poezii noi.
 * Folosită la POST /v1/admin/poems
 */
export const CreatePoemBodySchema = z.object({
  title: z.string().min(1).max(200).describe('Titlul poeziei'),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/).describe('Slug-ul unic al poeziei'),
  type: z.enum(['EPIC', 'LYRIC', 'DRAMATIC', 'EPISTOLARY']),
  year: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  summary: z.string().optional(),
  keywords: z.string().optional(),
  fullText: z.string().optional(),
  authorId: z.number().int().positive().describe('ID-ul autorului'),
})

export type CreatePoemBody = z.infer<typeof CreatePoemBodySchema>

/**
 * Schema pentru actualizarea unei poezii.
 * Folosită la PUT /v1/admin/poems/:id
 */
export const UpdatePoemBodySchema = CreatePoemBodySchema.partial()

export type UpdatePoemBody = z.infer<typeof UpdatePoemBodySchema>


// ============================================
// 5. Schema pentru răspuns (ce returnăm clientului)
// ============================================

/**
 * Schema pentru răspunsul cu o poezie (nu include textul integral dacă nu este PRO)
 */
export const PoemResponseSchema = z.object({
  id: z.number(),
  title: z.string(),
  slug: z.string(),
  type: z.string().nullable(),
  year: z.number().nullable(),
  summary: z.string().nullable(),
  keywords: z.string().nullable(),
  fullText: z.string().nullable().optional(), // optional, pentru că poate fi omis în planul FREE
  popularity: z.number(),
  author: z.object({
    id: z.number(),
    name: z.string(),
    slug: z.string(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type PoemResponse = z.infer<typeof PoemResponseSchema>