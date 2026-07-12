// src/middlewares/rateLimiter.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import redis from '../utils/redis.js'
import { logger } from '../utils/logger.js'
import { PLAN_LIMITS } from '../config/rateLimits.js'



// ============================================
// Middleware-ul de rate limiting
// ============================================

/**
 * Middleware de rate limiting pentru Poezii API.
 * 
 * Folosește Redis pentru a număra cererile per cheie API.
 * Limitele sunt diferite în funcție de plan (FREE vs PRO).
 */
export async function rateLimiterMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const publicPaths = ['/health', '/ping', '/v1/api-keys', '/api-keys']

  if (
    publicPaths.includes(request.url) ||
    publicPaths.includes(request.routeOptions?.url ?? "")
  ) {
    return
  }

  const apiKeyId = request.user?.id
  const plan = request.user?.plan || 'FREE'

  if (!apiKeyId) {
    logger.warn({ path: request.url }, 'Cerere fără cheie API în rate limiter')
    return
  }

  type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'
  const limits = PLAN_LIMITS[plan as Plan]
  const key = `rate_limit:${apiKeyId}`

  try {
    const current = await redis.incr(key)

    if (current === 1) {
      await redis.expire(key, 60)
    }

    const ttl = await redis.ttl(key)

    const windowSeconds = 60

    if (current > limits.rpm) {
      logger.warn({ apiKeyId, plan, current, limit: limits.rpm, ttl }, 'Rate limit depășit')

      reply
        .header('Retry-After', ttl)
        .header('X-RateLimit-Limit', limits.rpm)
        .header('X-RateLimit-Remaining', 0)
        .header('X-RateLimit-Reset', ttl)
        .header('X-RateLimit-Plan', plan)

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

    reply.header('X-RateLimit-Limit', limits.rpm)
    reply.header('X-RateLimit-Remaining', Math.max(0, limits.rpm - current))
    reply.header('X-RateLimit-Reset', ttl)
    reply.header('X-RateLimit-Plan', plan)

    return
  } catch (error) {
    logger.error({ error, apiKeyId }, 'Eroare la rate limiting')
    return
  }
}

