// src/repositories/poem.repository.ts

import { Prisma, PoemType } from '@prisma/client'
import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import type { GetPoemsQuery } from '../schemas/poem.schema.js'

// Tipul complet al unei poezii cu autor
export type PoemWithAuthor = Prisma.PoemGetPayload<{
  include: { author: true }
}>

// ============================================
// 1. Listarea poeziilor cu filtrare, paginare și sortare
// ============================================

export async function findMany(query: GetPoemsQuery) {
  const {
    search,
    authorSlug,
    type,
    yearMin,
    yearMax,
    page,
    limit,
    sortBy,
    sortOrder,
  } = query

  const where: Prisma.PoemWhereInput = {}

  // Căutare în titlu și conținut
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { fullText: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Filtrare după autor
  if (authorSlug) {
    where.author = { slug: authorSlug }
  }

  // Filtrare după tip (enum)
  if (type && Object.values(PoemType).includes(type as PoemType)) {
    where.type = type as PoemType
  }

  const yearFilter: Prisma.IntFilter = {}

  // Filtrare după an minim
  if (yearMin !== undefined) {
    yearFilter.gte = yearMin
  }

  // Filtrare după an maxim
  if (yearMax !== undefined) {
    yearFilter.lte = yearMax
  }

  if (Object.keys(yearFilter).length > 0) {
    where.year = yearFilter
  }

  const orderBy: Prisma.PoemOrderByWithRelationInput = {
    [sortBy]: sortOrder,
  }

  const skip = (page - 1) * limit

  try {
    const poems = await prisma.poem.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    const total = await prisma.poem.count({ where })

    return {
      data: poems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  } catch (error) {
    logger.error({ error, query }, 'Eroare la listarea poeziilor')
    throw new Error('Nu am putut obține lista de poezii')
  }
}

// ============================================
// 2. Obținerea unei poezii după ID
// ============================================

export async function findById(id: number): Promise<PoemWithAuthor | null> {
  try {
    return await prisma.poem.findUnique({
      where: { id },
      include: {
        author: true,
      },
    })
  } catch (error) {
    logger.error({ error, id }, 'Eroare la căutarea poeziei după ID')
    throw new Error('Nu am putut găsi poezia')
  }
}

// ============================================
// 3. Obținerea unei poezii după slug
// ============================================

export async function findBySlug(slug: string): Promise<PoemWithAuthor | null> {
  try {
    return await prisma.poem.findUnique({
      where: { slug },
      include: {
        author: true,
      },
    })
  } catch (error) {
    logger.error({ error, slug }, 'Eroare la căutarea poeziei după slug')
    throw new Error('Nu am putut găsi poezia')
  }
}

// ============================================
// 4. Crearea unei poezii noi
// ============================================

export async function create(data: {
  title: string
  slug: string
  type?: PoemType | null
  year?: number | null
  summary?: string | null
  keywords?: string | null
  fullText?: string | null
  authorId: number
}) {
  try {
    const existing = await prisma.poem.findUnique({
      where: { slug: data.slug },
    })

    if (existing) {
      throw new Error(`O poezie cu slug-ul "${data.slug}" există deja`)
    }

    const author = await prisma.author.findUnique({
      where: { id: data.authorId },
    })

    if (!author) {
      throw new Error(`Autorul cu ID-ul ${data.authorId} nu există`)
    }

    const poem = await prisma.poem.create({
      data: {
        title: data.title,
        slug: data.slug,
        type: data.type ?? PoemType.LYRIC,
        year: data.year,
        summary: data.summary,
        keywords: data.keywords,
        fullText: data.fullText,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie creată cu succes')
    return poem
  } catch (error) {
    logger.error({ error, data }, 'Eroare la crearea poeziei')
    throw error
  }
}

// ============================================
// 5. Actualizarea unei poezii
// ============================================

export async function update(
  id: number,
  data: {
    title?: string
    slug?: string
    type?: PoemType | null
    year?: number | null
    summary?: string | null
    keywords?: string | null
    fullText?: string | null
    authorId?: number
  }
) {
  try {
    const existing = await prisma.poem.findUnique({ where: { id } })
    if (!existing) {
      throw new Error(`Poemul cu ID-ul ${id} nu există`)
    }

    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.poem.findUnique({
        where: { slug: data.slug },
      })
      if (slugExists) {
        throw new Error(`Slug-ul "${data.slug}" este deja folosit`)
      }
    }

    if (data.authorId && data.authorId !== existing.authorId) {
      const author = await prisma.author.findUnique({
        where: { id: data.authorId },
      })
      if (!author) {
        throw new Error(`Autorul cu ID-ul ${data.authorId} nu există`)
      }
    }

    const poem = await prisma.poem.update({
      where: { id },
      data: {
        title: data.title,
        slug: data.slug,
        type: data.type ?? existing.type,
        year: data.year,
        summary: data.summary,
        keywords: data.keywords,
        fullText: data.fullText,
        authorId: data.authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie actualizată cu succes')
    return poem
  } catch (error) {
    logger.error({ error, id, data }, 'Eroare la actualizarea poeziei')
    throw error
  }
}

// ============================================
// 6. Ștergerea unei poezii
// ============================================

export async function remove(id: number) {
  try {
    const existing = await prisma.poem.findUnique({ where: { id } })
    if (!existing) {
      throw new Error(`Poemul cu ID-ul ${id} nu există`)
    }

    const poem = await prisma.poem.delete({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie ștearsă cu succes')
    return poem
  } catch (error) {
    logger.error({ error, id }, 'Eroare la ștergerea poeziei')
    throw error
  }
}

// ============================================
// 7. Incrementarea popularității
// ============================================

export async function incrementPopularity(id: number) {
  try {
    const poem = await prisma.poem.update({
      where: { id },
      data: {
        popularity: { increment: 1 },
      },
      select: {
        id: true,
        title: true,
        popularity: true,
      },
    })

    logger.debug(
      { poemId: poem.id, popularity: poem.popularity },
      'Popularitate incrementată'
    )
    return poem
  } catch (error) {
    logger.error({ error, id }, 'Eroare la incrementarea popularității')
    throw new Error('Nu am putut actualiza popularitatea')
  }
}

// ============================================
// 8. Cele mai populare poezii
// ============================================

export async function findMostPopular(limit: number = 10) {
  try {
    return await prisma.poem.findMany({
      orderBy: { popularity: 'desc' },
      take: limit,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })
  } catch (error) {
    logger.error({ error, limit }, 'Eroare la obținerea poeziilor populare')
    throw new Error('Nu am putut obține poeziile populare')
  }
}


export async function fulltextSearch(text: string) {
  return prisma.poem.findMany({
    where: {
      fullText: {
        contains: text,
        mode: 'insensitive'
      }
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          slug: true
        }
      }
    }
  })
}



export async function getPoemTextById(id: number) {
  return prisma.poem.findUnique({
    where: { id },
    select: {
      fullText: true
    }
  })
}

export async function getPoemTextBySlug(slug: string) {
  return prisma.poem.findUnique({
    where: { slug },
    select: {
      fullText: true
    }
  })
}
