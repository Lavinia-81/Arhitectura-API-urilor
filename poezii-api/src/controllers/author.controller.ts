/// src/controllers/author.controller.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import * as authorService from '../services/author.service.js'        // Servicii pentru autori (logica de business)
import { fulltextSearch } from '../repositories/poem.repository.js'   // Căutare full-text în poezii
import {
  GetAuthorsQuerySchema,
  GetAuthorParamsSchema,
  GetAuthorBySlugParamsSchema,
} from '../schemas/author.schema.js'                                  // Validare input cu Zod


// Handler pentru listarea autorilor (cu filtrare/paginare)
export async function getAuthorsHandler(req: FastifyRequest, reply: FastifyReply) {
  // Validăm query-ul primit
  const query = GetAuthorsQuerySchema.parse(req.query)

  // Obținem autorii din service
  const result = await authorService.getAuthors(query)

  // Trimitem răspunsul
  return reply.send(result)
}


// Handler pentru obținerea unui autor după ID numeric
export async function getAuthorByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  // Validăm parametrii (ID)
  const { id } = GetAuthorParamsSchema.parse(req.params)

  // Căutăm autorul
  const author = await authorService.getAuthorById(id)

  // Dacă nu există, returnăm 404
  if (!author) {
    return reply.status(404).send({ error: 'Not Found', message: `Autorul cu ID ${id} nu există.` })
  }

  // Returnăm autorul
  return reply.send(author)
}


// Handler pentru obținerea unui autor după slug (ex: "mihai-eminescu")
export async function getAuthorBySlugHandler(req: FastifyRequest, reply: FastifyReply) {
  // Validăm parametrii
  const { slug } = GetAuthorBySlugParamsSchema.parse(req.params)

  // Căutăm autorul
  const author = await authorService.getAuthorBySlug(slug)

  // Dacă nu există, returnăm 404
  if (!author) {
    return reply.status(404).send({ error: 'Not Found', message: `Autorul cu slug ${slug} nu există.` })
  }

  // Returnăm autorul
  return reply.send(author)
}


// Handler pentru obținerea poeziilor unui autor (cu paginare)
export async function getAuthorPoemsHandler(req: FastifyRequest, reply: FastifyReply) {
  // Extragem ID-ul autorului
  const { id } = req.params as { id: number }

  // Extragem parametrii de paginare
  const { page = 1, limit = 10, includeFullText = false } = req.query as {
    page?: number
    limit?: number
    includeFullText?: boolean
  }

  // Verificăm dacă autorul există
  const author = await authorService.getAuthorById(id)
  if (!author) {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Autorul cu ID ${id} nu există.`,
    })
  }

  // Obținem poeziile autorului
  const poems = await (authorService as any).getAuthorPoems(id, {
    page,
    limit,
    includeFullText,
  })

  return reply.send(poems)
}


// Handler pentru obținerea celor mai populare poezii ale unui autor
export async function getAuthorPopularPoemsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: number }
  const { limit = 5 } = req.query as { limit?: number }

  // Verificăm dacă autorul există
  const author = await authorService.getAuthorById(id)
  if (!author) {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Autorul cu ID ${id} nu există.`,
    })
  }

  // Obținem poeziile populare
  const poems = await (authorService as any).getAuthorPopularPoems(id, limit)
  return reply.send(poems)
}


// Handler pentru căutare full-text în poezii
export async function fulltextSearchHandler(
  req: FastifyRequest<{ Querystring: { text?: string } }>,
  reply: FastifyReply
) {
  const { text } = req.query

  // Validare: textul este obligatoriu
  if (!text || text.trim().length === 0) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Parametrul "text" este obligatoriu'
    })
  }

  // Căutare full-text în baza de date
  const results = await fulltextSearch(text)

  // Returnăm rezultatele + numărul lor
  return reply.send({
    data: results,
    count: results.length
  })
}
