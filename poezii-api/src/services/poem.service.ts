// src/services/poem.service.ts

import * as poemRepository from '../repositories/poem.repository.js'
import { cacheGet, cacheSet, cacheDelete } from '../utils/redis.js'
import { logger } from '../utils/logger.js'
import type { GetPoemsQuery } from '../schemas/poem.schema.js'
import type { PoemType } from '@prisma/client'

function mapPoemResponse(poem: any, includeFullText: boolean) {
  const { fullText, ...rest } = poem
  return includeFullText ? { ...rest, fullText: fullText } : { ...rest, fullText: undefined }
}

// ============================================
// 1. Listarea poeziilor (cu caching inteligent)
// ============================================

/**
 * Obține o listă de poezii cu filtrare, paginare și sortare.
 * Folosește cache pentru a reduce încărcarea bazei de date.
 * Cheia de cache include toți parametrii query-ului.
 */
export async function getPoems(query: GetPoemsQuery, includeFullText: boolean = false) {
  const startTime = Date.now()
  
  // Construim o cheie unică de cache bazată pe toți parametrii
  const cacheKey = `poems:list:${JSON.stringify(query)}:fullText:${includeFullText}`
  
  try {
    // Încercăm să citim din cache
    const cached = await cacheGet<{
      data: any[]
      pagination: any
      fromCache: boolean
    }>(cacheKey)
    
    if (cached) {
      logger.debug({ cacheKey, duration: Date.now() - startTime }, 'Poeme returnate din cache')
      return { ...cached, fromCache: true }
    }
    
    // Nu este în cache – interogăm repository-ul
    const { data, pagination } = await poemRepository.findMany(query)
    
    // Dacă utilizatorul NU are acces PRO, eliminăm textul integral din răspuns
    const processedData = data.map(poem => mapPoemResponse(poem, includeFullText))
    
    // Adăugăm link-uri HATEOAS pentru fiecare poezie
    const dataWithLinks = processedData.map(poem => ({
      ...poem,
      _links: {
        self: { href: `/v1/poems/${poem.id}` },
        selfSlug: { href: `/v1/poems/slug/${poem.slug}` },
        author: { href: `/v1/authors/${poem.author.id}` },
        authorSlug: { href: `/v1/authors/slug/${poem.author.slug}` },
      }
    }))
    
    // Construim răspunsul final
    const response = {
      data: dataWithLinks,
      pagination,
      _links: {
        self: { href: `/v1/poems?page=${query.page}&limit=${query.limit}` },
        ...(pagination.page < pagination.totalPages && {
          next: { href: `/v1/poems?page=${pagination.page + 1}&limit=${query.limit}` }
        }),
        ...(pagination.page > 1 && {
          prev: { href: `/v1/poems?page=${pagination.page - 1}&limit=${query.limit}` }
        }),
      }
    }
    
    // Stocăm în cache pentru 5 minute (300 de secunde)
    // Poeziile nu se schimbă foarte des, cache-ul este sigur
    await cacheSet(cacheKey, response, 300)
    
    logger.info({ 
      cacheKey, 
      count: data.length, 
      total: pagination.total,
      duration: Date.now() - startTime 
    }, 'Poeme returnate din baza de date și stocate în cache')
    
    return { ...response, fromCache: false }
  } catch (error) {
    logger.error({ error, query }, 'Eroare la obținerea listei de poeme')
    throw new Error('Nu am putut obține lista de poezii. Încercați din nou mai târziu.')
  }
}

// ============================================
// 2. Obținerea unei poezii după ID (cu caching)
// ============================================

/**
 * Obține o poezie după ID.
 * Cache-ul este invalidat la actualizarea sau ștergerea poeziei.
 */
export async function getPoemById(id: number, includeFullText: boolean = false) {
  const startTime = Date.now()
  const cacheKey = `poems:id:${id}:fullText:${includeFullText}`
  
  try {
    // Încercăm să citim din cache
    const cached = await cacheGet<any>(cacheKey)
    if (cached) {
      logger.debug({ cacheKey, id, duration: Date.now() - startTime }, 'Poem returnat din cache')
      return cached
    }
    
    // Interogăm repository-ul
    const poem = await poemRepository.findById(id)
    
    if (!poem) {
      return null
    }
    
    // Dacă utilizatorul NU are acces PRO, eliminăm textul integral
    const processedPoem = mapPoemResponse(poem, includeFullText)
    
    // Adăugăm link-uri HATEOAS
    const response = {
      ...processedPoem,
      _links: {
        self: { href: `/v1/poems/${poem.id}` },
        selfSlug: { href: `/v1/poems/slug/${poem.slug}` },
        author: { href: `/v1/authors/${poem.author.id}` },
        authorSlug: { href: `/v1/authors/slug/${poem.author.slug}` },
        collection: { href: '/v1/poems' },
      }
    }
    
    // Stocăm în cache pentru 1 oră (3600 de secunde)
    // Poeziile individuale se schimbă rar
    await cacheSet(cacheKey, response, 3600)
    
    // Incrementăm popularitatea (dar nu așteptăm rezultatul – operație async)
    poemRepository.incrementPopularity(id).catch(err => {
      logger.warn({ error: err, id }, 'Nu am putut incrementa popularitatea')
    })
    
    logger.info({ id, duration: Date.now() - startTime }, 'Poem returnat din baza de date')
    return response
  } catch (error) {
    logger.error({ error, id }, 'Eroare la obținerea poemului după ID')
    throw new Error('Nu am putut găsi poezia. Încercați din nou mai târziu.')
  }
}

// ============================================
// 3. Obținerea unei poezii după slug (versiune URL-prietenoasă)
// ============================================

/**
 * Obține o poezie după slug.
 * Folosește același mecanism de cache ca și getPoemById.
 */
export async function getPoemBySlug(slug: string, includeFullText: boolean = false) {
  const cacheKey = `poems:slug:${slug}:fullText:${includeFullText}`
  
  try {
    // Încercăm să citim din cache
    const cached = await cacheGet<any>(cacheKey)
    if (cached) {
      return cached
    }
    
    const poem = await poemRepository.findBySlug(slug)
    
    if (!poem) {
      return null
    }
    
    const processedPoem = mapPoemResponse(poem, includeFullText)
    
    const response = {
      ...processedPoem,
      _links: {
        self: { href: `/v1/poems/slug/${poem.slug}` },
        selfId: { href: `/v1/poems/${poem.id}` },
        author: { href: `/v1/authors/${poem.author.id}` },
        authorSlug: { href: `/v1/authors/slug/${poem.author.slug}` },
        collection: { href: '/v1/poems' },
      }
    }
    
    await cacheSet(cacheKey, response, 3600)
    
    // Incrementăm popularitatea
    poemRepository.incrementPopularity(poem.id).catch(err => {
      logger.warn({ error: err, id: poem.id }, 'Nu am putut incrementa popularitatea')
    })
    
    return response
  } catch (error) {
    logger.error({ error, slug }, 'Eroare la obținerea poemului după slug')
    throw new Error('Nu am putut găsi poezia. Încercați din nou mai târziu.')
  }
}

// ============================================
// 4. Crearea unei poezii noi (admin)
// ============================================

/**
 * Creează o poezie nouă.
 * După creare, invalidează cache-ul pentru listă.
 */
export async function createPoem(data: {
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
    const poem = await poemRepository.create({
      title: data.title,
      slug: data.slug,
      type: data.type,
      year: data.year,
      summary: data.summary,
      keywords: data.keywords,
      fullText: data.fullText,
      authorId: data.authorId,
    })
    
    // Invalidează cache-ul pentru liste (poeziile s-au schimbat)
    await invalidatePoemsListCache()
    
    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie creată cu succes')
    return poem
  } catch (error) {
    logger.error({ error, data }, 'Eroare la crearea poeziei')
    throw error
  }
}

// ============================================
// 5. Actualizarea unei poezii (admin)
// ============================================

/**
 * Actualizează o poezie existentă.
 * După actualizare, invalidează cache-ul pentru acea poezie și pentru liste.
 */
export async function updatePoem(
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
    const poem = await poemRepository.update(id, {
      title: data.title,
      slug: data.slug,
      type: data.type,
      year: data.year,
      summary: data.summary,
      keywords: data.keywords,
      fullText: data.fullText,
      authorId: data.authorId,
    })
    
    // Invalidează cache-ul pentru această poezie (toate variațiile)
    await invalidatePoemCache(id, poem.slug)
    
    // Invalidează cache-ul pentru liste
    await invalidatePoemsListCache()
    
    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie actualizată cu succes')
    return poem
  } catch (error) {
    logger.error({ error, id, data }, 'Eroare la actualizarea poeziei')
    throw error
  }
}

// ============================================
// 6. Ștergerea unei poezii (admin)
// ============================================

/**
 * Șterge o poezie.
 * După ștergere, invalidează cache-ul.
 */
export async function deletePoem(id: number) {
  try {
    const poem = await poemRepository.remove(id)
    
    // Invalidează cache-ul
    await invalidatePoemCache(id, poem.slug)
    await invalidatePoemsListCache()
    
    logger.info({ poemId: poem.id, title: poem.title }, 'Poezie ștearsă cu succes')
    return poem
  } catch (error) {
    logger.error({ error, id }, 'Eroare la ștergerea poeziei')
    throw error
  }
}

// ============================================
// 7. Cele mai populare poezii (cu caching separat)
// ============================================

/**
 * Obține cele mai populare poezii.
 * Cache-ul este mai scurt (5 minute) pentru că popularitatea se schimbă des.
 */
export async function getMostPopularPoems(limit: number = 10, includeFullText: boolean = false) {
  const cacheKey = `poems:popular:${limit}:fullText:${includeFullText}`
  
  try {
    const cached = await cacheGet<any[]>(cacheKey)
    if (cached) {
      return cached
    }
    
    const poems = await poemRepository.findMostPopular(limit)
    
    const processedPoems = poems.map(poem => mapPoemResponse(poem, includeFullText))
    
    await cacheSet(cacheKey, processedPoems, 300) // 5 minute
    
    return processedPoems
  } catch (error) {
    logger.error({ error, limit }, 'Eroare la obținerea poeziilor populare')
    throw new Error('Nu am putut obține poeziile populare')
  }
}

// ============================================
// 8. Funcții utilitare pentru invalidarea cache-ului
// ============================================

/**
 * Invalidează cache-ul pentru o anumită poezie (toate variațiile).
 */
async function invalidatePoemCache(id: number, slug: string) {
  const patterns = [
    `poems:id:${id}:fullText:true`,
    `poems:id:${id}:fullText:false`,
    `poems:slug:${slug}:fullText:true`,
    `poems:slug:${slug}:fullText:false`,
  ]
  
  for (const pattern of patterns) {
    await cacheDelete(pattern)
  }
  
  logger.debug({ id, slug }, 'Cache invalidat pentru poezie')
}

/**
 * Invalidează cache-ul pentru listele de poezii (pattern glob).
 */
async function invalidatePoemsListCache() {
  await cacheDelete('poems:list:*')
  logger.debug('Cache invalidat pentru listele de poezii')
}


export async function getPoemText(id: number) {
  const poem = await poemRepository.getPoemTextById(id)
  return poem?.fullText ?? null
}
