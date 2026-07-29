// src/controllers/apiKey.controller.ts
import crypto from "crypto"
import type { Plan } from "@prisma/client"
import { prisma } from "../utils/prisma.js"
import { logger } from "../utils/logger.js"
import { FastifyRequest, FastifyReply } from "fastify"

export async function createApiKeyController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { plan = "FREE" } = request.body as { plan?: Plan }

    // 1. Generăm cheia API reală
    const apiKey = crypto.randomBytes(32).toString("hex")

    // 2. Hash SHA-256
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

    // 3. Salvăm în DB (fără isActive, pentru că nu există în schema ta)
    const record = await prisma.apiKey.create({
      data: {
        keyHash,
        prefix: apiKey.slice(0, 8),
        plan,
      },
    })

    logger.info(`Cheie API creată pentru planul ${plan}`)

    // 4. Returnăm cheia reală (NU hash-ul)
    return reply.send({
      success: true,
      apiKey,
      plan,
      id: record.id,
    })
  } catch (error) {
    logger.error(error)
    return reply.status(500).send({
      error: "Eroare la generarea cheii API",
    })
  }
}
