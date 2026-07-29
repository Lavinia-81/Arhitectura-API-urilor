import { z } from 'zod'

export const GetAuthorsQuerySchema = z.object({
  search: z.string().optional(),
  century: z.coerce.number().int().min(1).max(21).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(['name', 'birthYear', 'deathYear']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export const GetAuthorParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})

export const GetAuthorBySlugParamsSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/),
})

export const CreateAuthorBodySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/),
  birthYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  deathYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  birthPlace: z.string().optional(),
  bio: z.string().optional(),
  portrait: z.string().url().optional(),
})

export const UpdateAuthorBodySchema = CreateAuthorBodySchema.partial()