import { prisma } from '../utils/prisma.js'

type GetAuthorsQuery = {
  search?: string
  century?: number
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function getAuthors(query: GetAuthorsQuery) {
  const { search, century, page, limit, sortBy, sortOrder } = query

  const where: any = {}

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  if (century) {
    const start = (century - 1) * 100
    const end = century * 100
    where.birthYear = { gte: start, lt: end }
  }

  const orderBy = sortBy ? { [sortBy]: sortOrder ?? 'asc' } : undefined
  const skip = page && limit ? (page - 1) * limit : undefined
  const take = limit ?? undefined

  const authors = await prisma.author.findMany({
    where,
    orderBy,
    skip,
    take,
  })

  const count = await prisma.author.count({ where })

  return { data: authors, count, page, limit }
}

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
