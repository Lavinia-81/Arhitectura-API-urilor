import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma.js'
import { verifyProPlan } from '../../middlewares/auth.js'
import { CreateAuthorBodySchema, UpdateAuthorBodySchema } from '../../schemas/author.schema.js'

export async function adminAuthorRoutes(app: FastifyInstance) {

  app.post('/', { preHandler: verifyProPlan }, async (req, reply) => {
    const data = CreateAuthorBodySchema.parse(req.body)
    const author = await prisma.author.create({ data })
    return reply.code(201).send(author)
  })

  app.put('/:id', { preHandler: verifyProPlan }, async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = UpdateAuthorBodySchema.parse(req.body)
    const author = await prisma.author.update({ where: { id: parseInt(id) }, data })
    return reply.send(author)
  })

  app.delete('/:id', { preHandler: verifyProPlan }, async (req, reply) => {
    const { id } = req.params as { id: string }
    await prisma.author.delete({ where: { id: parseInt(id) } })
    return reply.code(204).send()
  })
}
