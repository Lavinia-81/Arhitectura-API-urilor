import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma.js'
import { verifyProPlan } from '../../middlewares/auth.js'
import { CreateAuthorBodySchema, UpdateAuthorBodySchema } from '../../schemas/author.schema.js'

// Rute administrative pentru gestionarea autorilor
export async function adminAuthorRoutes(app: FastifyInstance) {

  // -------------------------------------------------------------
  // 1. Creare autor (doar pentru utilizatori cu plan PRO)
  // -------------------------------------------------------------
  app.post('/', { preHandler: verifyProPlan }, async (req, reply) => {
    // Validăm corpul requestului cu schema Zod
    const data = CreateAuthorBodySchema.parse(req.body)

    // Creăm autorul în baza de date
    const author = await prisma.author.create({ data })

    // Returnăm autorul creat
    return reply.code(201).send(author)
  })

  // -------------------------------------------------------------
  // 2. Actualizare autor (doar pentru PRO)
  // -------------------------------------------------------------
  app.put('/:id', { preHandler: verifyProPlan }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Validăm datele trimise
    const data = UpdateAuthorBodySchema.parse(req.body)

    // Actualizăm autorul în DB
    const author = await prisma.author.update({
      where: { id: parseInt(id) },
      data,
    })

    return reply.send(author)
  })

  // -------------------------------------------------------------
  // 3. Ștergere autor (doar pentru PRO)
  // -------------------------------------------------------------
  app.delete('/:id', { preHandler: verifyProPlan }, async (req, reply) => {
    const { id } = req.params as { id: string }

    // Ștergem autorul
    await prisma.author.delete({ where: { id: parseInt(id) } })

    // 204 = No Content
    return reply.code(204).send()
  })
}
