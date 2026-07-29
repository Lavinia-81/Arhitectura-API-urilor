// src/middlewares/auth.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma.js'
import { logger } from '../utils/logger.js'
import crypto from 'crypto'

// ============================================
// 1. Funcție pentru hash-uirea cheii API
// ============================================

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
    '/v1/health',
    '/v1/ping',
    '/v1/docs',
    '/v1/swagger',
    '/v1/redoc',
    '/v1/api-keys',       // generare chei API
  ]

  // Dacă URL-ul începe cu oricare dintre rutele publice → skip auth
  if (publicEndpoints.some((p) => url.startsWith(p))) {
    return
  }

  // ============================================
  // Autentificare pe bază de API key
  // ============================================

  const apiKey = request.headers['x-api-key'] as string | undefined

  if (!apiKey) {
    logger.warn({ ip: request.ip, path: request.url }, 'Cerere fără cheie API')

    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Lipsește cheia API. Adăugați header-ul "x-api-key".',
    })
  }

  const keyHash = hashApiKey(apiKey)

  try {
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
    })

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

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      plan: 'FREE' | 'PRO' | 'ENTERPRISE'
      keyPrefix: string
    }
  }
}
