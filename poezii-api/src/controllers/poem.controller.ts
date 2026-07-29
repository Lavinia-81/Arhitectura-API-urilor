// src/controllers/poem.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as poemService from '../services/poem.service.js'
import {
  GetPoemsQuerySchema,
  GetPoemParamsSchema,
  GetPoemBySlugParamsSchema,
  CreatePoemBodySchema,
  UpdatePoemBodySchema,
} from '../schemas/poem.schema.js'
import { logger } from '../utils/logger.js'


// ============================================
// 1. GET /v1/poems - Lista poeziilor (cu filtrare, paginare, sortare)
// ============================================

/**
 * Obține lista de poezii.
 * 
 * Query parameters:
 * - search: caută în titlu sau text
 * - authorSlug: filtrează după autor
 * - type: filtrează după genul poetic
 * - yearMin, yearMax: filtrează după an
 * - page, limit: paginare
 * - sortBy, sortOrder: sortare
 * - includeFullText: include textul integral (doar PRO)
 * 
 * Authentication: required (x-api-key header)
 */
export async function getPoemsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Validare query parameters cu Zod
  const query = GetPoemsQuerySchema.parse(request.query)
  
  // Verificăm dacă utilizatorul are acces PRO pentru text integral
  const userPlan = request.user?.plan || 'FREE'
  const includeFullText = query.includeFullText && userPlan === 'PRO'
  
  // Dacă utilizatorul FREE cere text integral, îl ignorăm (fără eroare)
  if (query.includeFullText && userPlan !== 'PRO') {
    logger.debug({ userPlan }, 'Utilizator FREE a cerut text integral - ignorat')
  }
  
  // Apelează serviciul
  const result = await poemService.getPoems(query, includeFullText)
  
  // Returnăm răspunsul
  return reply.status(200).send(result)
}

// ============================================
// 2. GET /v1/poems/:id - Detaliile unei poezii (după ID numeric)
// ============================================

/**
 * Obține detaliile complete ale unei poezii după ID.
 * 
 * Path parameters:
 * - id: ID-ul numeric al poeziei
 * 
 * Query parameters:
 * - includeFullText: include textul integral (doar PRO)
 * 
 * Authentication: required (x-api-key header)
 */
export async function getPoemByIdHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Validare parametri de rută
  const { id } = GetPoemParamsSchema.parse(request.params)
  
  // Query parameter pentru text integral
  const query = request.query as { includeFullText?: string }
  const userPlan = request.user?.plan || 'FREE'
  const includeFullText = query.includeFullText === 'true' && userPlan === 'PRO'
  
  // Apelează serviciul
  const poem = await poemService.getPoemById(id, includeFullText)
  
  if (!poem) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Poemul cu ID-ul ${id} nu a fost găsit.`,
    })
  }
  
  return reply.status(200).send(poem)
}

// ============================================
// 3. GET /v1/poems/slug/:slug - Detaliile unei poezii (după slug)
// ============================================

/**
 * Obține detaliile complete ale unei poezii după slug.
 * 
 * Path parameters:
 * - slug: slug-ul poeziei (ex: "luceafarul", "lacul")
 * 
 * Query parameters:
 * - includeFullText: include textul integral (doar PRO)
 * 
 * Authentication: required (x-api-key header)
 */
export async function getPoemBySlugHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Validare parametri de rută
  const { slug } = GetPoemBySlugParamsSchema.parse(request.params)
  
  // Query parameter pentru text integral
  const query = request.query as { includeFullText?: string }
  const userPlan = request.user?.plan || 'FREE'
  const includeFullText = query.includeFullText === 'true' && userPlan === 'PRO'
  
  // Apelează serviciul
  const poem = await poemService.getPoemBySlug(slug, includeFullText)
  
  if (!poem) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: `Poemul cu slug-ul "${slug}" nu a fost găsit.`,
    })
  }
  
  return reply.status(200).send(poem)
}

// ============================================
// 4. GET /v1/poems/popular - Cele mai populare poezii
// ============================================

/**
 * Obține cele mai populare poezii (pentru pagina principală).
 * 
 * Query parameters:
 * - limit: numărul de poezii (implicit 10, maxim 50)
 * - includeFullText: include textul integral (doar PRO)
 * 
 * Authentication: required (x-api-key header)
 */
export async function getPopularPoemsHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const query = request.query as { limit?: string; includeFullText?: string }
  const limit = Math.min(parseInt(query.limit || '10'), 50)
  const userPlan = request.user?.plan || 'FREE'
  const includeFullText = query.includeFullText === 'true' && userPlan === 'PRO'
  
  const poems = await poemService.getMostPopularPoems(limit, includeFullText)
  
  return reply.status(200).send({
    data: poems,
    count: poems.length,
    _links: {
      self: { href: '/v1/poems/popular' },
      collection: { href: '/v1/poems' },
    },
  })
}

// ============================================
// 5. POST /v1/admin/poems - Crearea unei poezii noi (admin only)
// ============================================

/**
 * Creează o poezie nouă.
 * 
 * Body:
 * - title: titlul poeziei (obligatoriu)
 * - slug: slug-ul unic (obligatoriu)
 * - type: genul poetic (opțional)
 * - year: anul publicării (opțional)
 * - summary: rezumat (opțional)
 * - keywords: cuvinte cheie (opțional)
 * - fullText: text integral (opțional)
 * - authorId: ID-ul autorului (obligatoriu)
 * 
 * Authentication: required (x-api-key header) + admin only
 */
export async function createPoemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificare rol admin (doar utilizatorii PRO pot crea, momentan)
  const userPlan = request.user?.plan || 'FREE'
  if (userPlan !== 'PRO') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Doar utilizatorii cu plan PRO pot crea poezii.',
    })
  }
  
  // Validare body
  const body = CreatePoemBodySchema.parse(request.body)
  
  // Apelează serviciul
  const poem = await poemService.createPoem(body as Parameters<typeof poemService.createPoem>[0])
  
  return reply.status(201).send({
    ...poem,
    _links: {
      self: { href: `/v1/poems/${poem.id}` },
      selfSlug: { href: `/v1/poems/slug/${poem.slug}` },
    },
  })
}

// ============================================
// 6. PUT /v1/admin/poems/:id - Actualizarea unei poezii (admin only)
// ============================================

/**
 * Actualizează o poezie existentă.
 * 
 * Path parameters:
 * - id: ID-ul poeziei de actualizat
 * 
 * Body: aceleași câmpuri ca la creare, toate opționale
 * 
 * Authentication: required (x-api-key header) + admin only
 */
export async function updatePoemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificare rol admin
  const userPlan = request.user?.plan || 'FREE'
  if (userPlan !== 'PRO') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Doar utilizatorii cu plan PRO pot actualiza poezii.',
    })
  }
  
  // Validare parametri și body
  const { id } = GetPoemParamsSchema.parse(request.params)
  const body = UpdatePoemBodySchema.parse(request.body)
  
  // Apelează serviciul
  const poem = await poemService.updatePoem(id, body as Parameters<typeof poemService.updatePoem>[1])
  
  return reply.status(200).send({
    ...poem,
    _links: {
      self: { href: `/v1/poems/${poem.id}` },
      selfSlug: { href: `/v1/poems/slug/${poem.slug}` },
    },
  })
}

// ============================================
// 7. DELETE /v1/admin/poems/:id - Ștergerea unei poezii (admin only)
// ============================================

/**
 * Șterge o poezie existentă.
 * 
 * Path parameters:
 * - id: ID-ul poeziei de șters
 * 
 * Authentication: required (x-api-key header) + admin only
 */
export async function deletePoemHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificare rol admin
  const userPlan = request.user?.plan || 'FREE'
  if (userPlan !== 'PRO') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Doar utilizatorii cu plan PRO pot șterge poezii.',
    })
  }
  
  // Validare parametri
  const { id } = GetPoemParamsSchema.parse(request.params)
  
  // Apelează serviciul
  await poemService.deletePoem(id)
  
  return reply.status(204).send() // No Content
}


export async function getPoemTextHandler(
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const id = Number(req.params.id)

  if (isNaN(id)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'ID invalid'
    })
  }

  const poemText = await poemService.getPoemText(id)

  if (!poemText) {
    return reply.status(404).send({
      statusCode: 404,
      error: 'Not Found',
      message: 'Poezia nu a fost găsită'
    })
  }

  return reply.send({
    id,
    fullText: poemText
  })
}
