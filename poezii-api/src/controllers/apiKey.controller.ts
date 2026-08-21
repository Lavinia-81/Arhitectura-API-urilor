// src/controllers/apiKey.controller.ts

import crypto from "crypto"                       // Folosit pentru generarea cheilor API și hashing
import type { Plan } from "@prisma/client"        // Tipul planului (FREE, PRO, ENTERPRISE)
import { prisma } from "../utils/prisma.js"       // Instanța Prisma pentru acces DB
import { logger } from "../utils/logger.js"       // Logger-ul aplicației
import { FastifyRequest, FastifyReply } from "fastify" // Tipuri Fastify pentru request/response

// Controller pentru generarea unei chei API
export async function createApiKeyController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // Extrage planul din body; dacă nu este trimis, folosește FREE
    const body = request.body as { plan?: Plan } | undefined
    const plan: Plan = body?.plan ?? "FREE"

    // 1. Generăm cheia API reală (random 32 bytes → hex)
    const apiKey = crypto.randomBytes(32).toString("hex")

    // 2. Hash SHA-256 al cheii API
    //    În DB salvăm doar hash-ul, nu cheia reală (pentru securitate)
    const keyHash = crypto.createHash("sha256").update(apiKey).digest("hex")

    // 3. Salvăm cheia în baza de date
    //    prefix = primele 8 caractere din cheia reală (pentru identificare rapidă)
    //    plan = planul utilizatorului
    const record = await prisma.apiKey.create({
      data: {
        keyHash,               // hash-ul cheii API
        prefix: apiKey.slice(0, 8), // prefix pentru afișare/identificare
        plan,                  // planul utilizatorului
      },
    })

    logger.info(`Cheie API creată pentru planul ${plan}`)

    // 4. Returnăm cheia API reală către client
    //    NU salvăm cheia reală în DB, doar hash-ul
    return reply.send({
      success: true,
      apiKey,     // cheia reală (clientul trebuie să o păstreze)
      plan,       // planul asociat
      id: record.id, // ID-ul înregistrării din DB
    })
  } catch (error) {
    // Dacă apare o eroare, o logăm și trimitem răspuns 500
    logger.error(error)
    return reply.status(500).send({
      error: "Eroare la generarea cheii API",
    })
  }
}
