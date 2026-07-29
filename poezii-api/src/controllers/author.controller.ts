/// src/controllers/author.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify'
import * as authorService from '../services/author.service.js'
import { fulltextSearch } from '../repositories/poem.repository.js'
import {
  GetAuthorsQuerySchema,
  GetAuthorParamsSchema,
  GetAuthorBySlugParamsSchema,
} from '../schemas/author.schema.js'


export async function getAuthorsHandler(req: FastifyRequest, reply: FastifyReply) {
  const query = GetAuthorsQuerySchema.parse(req.query)
  const result = await authorService.getAuthors(query)
  return reply.send(result)
}

export async function getAuthorByIdHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = GetAuthorParamsSchema.parse(req.params)
  const author = await authorService.getAuthorById(id)

  if (!author) {
    return reply.status(404).send({ error: 'Not Found', message: `Autorul cu ID ${id} nu există.` })
  }

  return reply.send(author)
}

export async function getAuthorBySlugHandler(req: FastifyRequest, reply: FastifyReply) {
  const { slug } = GetAuthorBySlugParamsSchema.parse(req.params)
  const author = await authorService.getAuthorBySlug(slug)

  if (!author) {
    return reply.status(404).send({ error: 'Not Found', message: `Autorul cu slug ${slug} nu există.` })
  }

  return reply.send(author)
}

export async function getAuthorPoemsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: number }
  const { page = 1, limit = 10, includeFullText = false } = req.query as {
    page?: number
    limit?: number
    includeFullText?: boolean
  }

  const author = await authorService.getAuthorById(id)
  if (!author) {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Autorul cu ID ${id} nu există.`,
    })
  }

  const poems = await (authorService as any).getAuthorPoems(id, {
    page,
    limit,
    includeFullText,
  })

  return reply.send(poems)
}

export async function getAuthorPopularPoemsHandler(req: FastifyRequest, reply: FastifyReply) {
  const { id } = req.params as { id: number }
  const { limit = 5 } = req.query as { limit?: number }

  const author = await authorService.getAuthorById(id)
  if (!author) {
    return reply.status(404).send({
      error: 'Not Found',
      message: `Autorul cu ID ${id} nu există.`,
    })
  }

  const poems = await (authorService as any).getAuthorPopularPoems(id, limit)
  return reply.send(poems)
}



export async function fulltextSearchHandler(
  req: FastifyRequest<{ Querystring: { text?: string } }>,
  reply: FastifyReply
) {
  const { text } = req.query

  if (!text || text.trim().length === 0) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Parametrul "text" este obligatoriu'
    })
  }

  const results = await fulltextSearch(text)

  return reply.send({
    data: results,
    count: results.length
  })
}
