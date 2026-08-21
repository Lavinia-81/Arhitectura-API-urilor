import { prisma } from '../utils/prisma.js'

type GetAuthorsQuery = {
  search?: string
  century?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/**
 * Obține lista de autori cu filtrare, paginare și sortare.
 */
export async function getAuthors(query: GetAuthorsQuery) {
  const { search, century, page, limit, sortBy, sortOrder } = query

  // Construim obiectul "where" dinamic
  const where: any = {}

  // -------------------------------------------------------------
  // 1. Filtrare după nume (search)
  // -------------------------------------------------------------
  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  // -------------------------------------------------------------
  // 2. Filtrare după secol (ex: secolul 19 → 1800–1899)
  // -------------------------------------------------------------
  if (century) {
    const start = (century - 1) * 100
    const end = century * 100
    where.birthYear = { gte: start, lt: end }
  }

  // -------------------------------------------------------------
  // 3. Sortare dinamică
  // -------------------------------------------------------------
  const orderBy = sortBy ? { [sortBy]: sortOrder ?? 'asc' } : undefined

  // -------------------------------------------------------------
  // 4. Paginare
  // -------------------------------------------------------------
  const skip = page && limit ? (page - 1) * limit : undefined
  const take = limit ?? undefined

  // -------------------------------------------------------------
  // 5. Query principal
  // -------------------------------------------------------------
  const authors = await prisma.author.findMany({
    where,
    orderBy,
    skip,
    take,
  })

  // Număr total de autori care respectă filtrarea
  const count = await prisma.author.count({ where })

  return { data: authors, count, page, limit }
}

/**
 * Obține un autor după ID și include cele mai populare 5 poezii.
 */
export async function getAuthorById(id: number) {
  return prisma.author.findUnique({
    where: { id },
    include: {
      poems: {
        select: { id: true, title: true, slug: true, year: true, popularity: true },
        orderBy: { popularity: 'desc' },
        take: 5,
      },
    },
  })
}

/**
 * Obține un autor după slug și include cele mai populare 5 poezii.
 */
export async function getAuthorBySlug(slug: string) {
  return prisma.author.findUnique({
    where: { slug },
    include: {
      poems: {
        select: { id: true, title: true, slug: true, year: true, popularity: true },
        orderBy: { popularity: 'desc' },
        take: 5,
      },
    },
  })
}

/**
 * Obține poeziile unui autor cu paginare și opțional fullText.
 */
export async function getAuthorPoems(
  authorId: number,
  options: { page?: number; limit?: number; includeFullText?: boolean }
) {
  const { page = 1, limit = 10, includeFullText = false } = options

  const skip = (page - 1) * limit

  return prisma.poem.findMany({
    where: { authorId },
    select: {
      id: true,
      title: true,
      slug: true,
      year: true,
      popularity: true,
      fullText: includeFullText, // doar dacă includeFullText = true
    },
    orderBy: { year: 'asc' },
    skip,
    take: limit,
  })
}

/**
 * Obține cele mai populare poezii ale unui autor.
 */
export async function getAuthorPopularPoems(authorId: number, limit = 5) {
  return prisma.poem.findMany({
    where: { authorId },
    select: {
      id: true,
      title: true,
      slug: true,
      year: true,
      popularity: true,
    },
    orderBy: { popularity: 'desc' },
    take: limit,
  })
}
