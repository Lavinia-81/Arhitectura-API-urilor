// src/middlewares/auth.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma.js'       // acces la baza de date
import { logger } from '../utils/logger.js'       // logger pentru audit și debugging
import crypto from 'crypto'                       // folosit pentru hashing API key

// ============================================
// 1. Funcție pentru hash-uirea cheii API
// ============================================

// Transformă cheia API reală într-un hash SHA-256.
// În baza de date salvăm DOAR hash-ul, nu cheia reală.
function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex')
}

// ============================================
// 2. Middleware-ul principal de autentificare
// ============================================

export async function authMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const url = request.url

  // ============================================
  // ENDPOINTURI PUBLICE (fără autentificare)
  // ============================================

  const publicEndpoints = [
    '/v1/health',     // endpoint de health-check
    '/v1/ping',       // ping simplu
    '/v1/docs',       // documentație API
    '/v1/swagger',    // swagger UI
    '/v1/redoc',      // redoc UI
    '/v1/api-keys',   // generare chei API (trebuie să fie public)
  ]

  // Dacă URL-ul începe cu un endpoint public → nu cerem API key
  if (publicEndpoints.some((p) => url.startsWith(p))) {
    return
  }

  // ============================================
  // Autentificare pe bază de API key
  // ============================================

  // Cheia API trebuie trimisă în header-ul "x-api-key"
  const apiKey = request.headers['x-api-key'] as string | undefined

  if (!apiKey) {
    logger.warn({ ip: request.ip, path: request.url }, 'Cerere fără cheie API')

    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Lipsește cheia API. Adăugați header-ul "x-api-key".',
    })
  }

  // Hash-uim cheia API pentru a o compara cu hash-ul din DB
  const keyHash = hashApiKey(apiKey)

  try {
    // Căutăm cheia API în baza de date
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
    })

    // Dacă nu există → cheia este invalidă
    if (!apiKeyRecord) {
      logger.warn(
        { prefix: apiKey.substring(0, 8), ip: request.ip },
        'Cheie API invalidă'
      )

      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Cheia API este invalidă.',
      })
    }

    // Verificăm dacă cheia API este expirată
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      logger.warn(
        { keyId: apiKeyRecord.id, expiresAt: apiKeyRecord.expiresAt },
        'Cheie API expirată'
      )

      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Această cheie API a expirat.',
      })
    }

    // Actualizăm lastUsed (nu blocăm request-ul dacă update-ul eșuează)
    prisma.apiKey
      .update({
        where: { id: apiKeyRecord.id },
        data: { lastUsed: new Date() },
      })
      .catch((err) => {
        logger.warn(
          { error: err, keyId: apiKeyRecord.id },
          'Nu am putut actualiza lastUsed'
        )
      })

    // Atașăm informațiile utilizatorului la request
    // → vor fi folosite de alte middleware-uri (ex: antiFraud)
    request.user = {
      id: apiKeyRecord.id,
      plan: apiKeyRecord.plan,
      keyPrefix: apiKeyRecord.prefix,
    }

    logger.debug(
      {
        keyId: apiKeyRecord.id,
        plan: apiKeyRecord.plan,
        path: request.url,
      },
      'Autentificare reușită'
    )

    return
  } catch (error) {
    // Dacă apare o eroare internă
    logger.error(
      { error, apiKeyPrefix: apiKey?.substring(0, 8) },
      'Eroare la autentificare'
    )

    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'A apărut o eroare la verificarea cheii API.',
    })
  }
}

// ============================================
// 3. Middleware pentru plan PRO
// ============================================

// Verifică dacă utilizatorul are plan PRO
export async function verifyProPlan(req: FastifyRequest, reply: FastifyReply) {
  if (!req.user || req.user.plan !== 'PRO') {
    return reply.status(403).send({
      statusCode: 403,
      error: 'Forbidden',
      message: 'Acest endpoint este disponibil doar pentru planul PRO.',
    })
  }
}

// ============================================
// 4. Tip pentru request.user
// ============================================

// Extindem tipul FastifyRequest pentru a include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      plan: 'FREE' | 'PRO' | 'ENTERPRISE'
      keyPrefix: string
    }
  }
}
