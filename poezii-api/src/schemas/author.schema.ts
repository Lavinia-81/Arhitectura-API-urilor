import { z } from 'zod'

/**
 * Schema pentru query parameters la GET /authors
 * Permite filtrare, paginare și sortare.
 */
export const GetAuthorsQuerySchema = z.object({
  // Căutare full-text în nume / bio
  search: z.string().optional(),

  // Filtrare după secol (1–21)
  century: z.coerce.number().int().min(1).max(21).optional(),

  // Paginare — pagina trebuie să fie > 0
  page: z.coerce.number().int().positive().default(1),

  // Limit — max 100 rezultate per pagină
  limit: z.coerce.number().int().positive().max(100).default(10),

  // Sortare după câmpuri permise
  sortBy: z.enum(['name', 'birthYear', 'deathYear']).default('name'),

  // Ordinea sortării
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})


/**
 * Schema pentru parametrii rutei GET /authors/:id
 * ID numeric, pozitiv.
 */
export const GetAuthorParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
})


/**
 * Schema pentru parametrii rutei GET /authors/slug/:slug
 * Slug valid: doar litere mici, cifre și cratimă.
 */
export const GetAuthorBySlugParamsSchema = z.object({
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/),
})


/**
 * Schema pentru corpul requestului la crearea unui autor.
 * Conține toate câmpurile necesare pentru un autor.
 */
export const CreateAuthorBodySchema = z.object({
  // Numele autorului
  name: z.string().min(1).max(100),

  // Slug SEO-friendly
  slug: z.string().min(1).max(100).regex(/^[a-z0-9\-]+$/),

  // Anul nașterii — între 0 și anul curent
  birthYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),

  // Anul morții — între 0 și anul curent
  deathYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),

  // Locul nașterii
  birthPlace: z.string().optional(),

  // Biografie
  bio: z.string().optional(),

  // URL către portret
  portrait: z.string().url().optional(),
})


/**
 * Schema pentru update — toate câmpurile devin opționale.
 * Folosește partial() pentru a permite update parțial.
 */
export const UpdateAuthorBodySchema = CreateAuthorBodySchema.partial()
