// src/middlewares/rateLimiter.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import redis from '../utils/redis.js'           // Redis folosit pentru contorizarea cererilor
import { logger } from '../utils/logger.js'     // Logger pentru audit și debugging
import { PLAN_LIMITS } from '../config/rateLimits.js' // Limite diferite în funcție de plan



// ============================================
// Middleware-ul de rate limiting
// ============================================

/**
 * Middleware de rate limiting pentru Poezii API.
 * 
 * Folosește Redis pentru a număra cererile per cheie API.
 * Limitele sunt diferite în funcție de plan (FREE, PRO, ENTERPRISE).
 */
export async function rateLimiterMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Endpointuri publice care nu necesită rate limiting
  const publicPaths = ['/health', '/ping', '/v1/api-keys', '/api-keys']

  // Dacă ruta este publică → nu aplicăm rate limiting
  if (
    publicPaths.includes(request.url) ||
    publicPaths.includes(request.routeOptions?.url ?? "")
  ) {
    return
  }

  // Cheia API a utilizatorului (setată de auth middleware)
  const apiKeyId = request.user?.id
  const plan = request.user?.plan || 'FREE'

  // Dacă nu există user → ceva e greșit în auth middleware
  if (!apiKeyId) {
    logger.warn({ path: request.url }, 'Cerere fără cheie API în rate limiter')
    return
  }

  // Tipurile de planuri acceptate
  type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'

  // Obținem limitele planului (rpm = requests per minute)
  const limits = PLAN_LIMITS[plan as Plan]

  // Cheia Redis pentru contorizarea cererilor
  const key = `rate_limit:${apiKeyId}`

  try {
    // Incrementăm contorul de cereri pentru această cheie API
    const current = await redis.incr(key)

    // Dacă este prima cerere → setăm expirarea la 60 secunde
    if (current === 1) {
      await redis.expire(key, 60)
    }

    // TTL = câte secunde au mai rămas din fereastra de 60 secunde
    const ttl = await redis.ttl(key)

    const windowSeconds = 60

    // Dacă depășește limita planului → blocăm cererea
    if (current > limits.rpm) {
      logger.warn({ apiKeyId, plan, current, limit: limits.rpm, ttl }, 'Rate limit depășit')

      // Setăm headere utile pentru client
      reply
        .header('Retry-After', ttl)                 // câte secunde să aștepte
        .header('X-RateLimit-Limit', limits.rpm)    // limita totală
        .header('X-RateLimit-Remaining', 0)         // câte cereri mai sunt permise
        .header('X-RateLimit-Reset', ttl)           // când se resetează fereastra
        .header('X-RateLimit-Plan', plan)           // planul utilizatorului

      // Răspuns 429 Too Many Requests
      return reply.code(429).send({
        statusCode: 429,
        error: 'Too Many Requests',
        message: `Ați depășit limita de ${limits.rpm} cereri la fiecare ${windowSeconds} secunde.`,
        retryAfter: ttl,
        plan,
        limit: limits.rpm,
        remaining: 0,
      })
    }

    // Dacă nu a depășit limita → setăm headerele informative
    reply.header('X-RateLimit-Limit', limits.rpm)
    reply.header('X-RateLimit-Remaining', Math.max(0, limits.rpm - current))
    reply.header('X-RateLimit-Reset', ttl)
    reply.header('X-RateLimit-Plan', plan)

    return
  } catch (error) {
    // Dacă apare o eroare internă în Redis
    logger.error({ error, apiKeyId }, 'Eroare la rate limiting')
    return
  }
}
