// src/routes/v1/health.ts

import { FastifyInstance } from 'fastify'
import { prisma } from '../../utils/prisma.js'
import redis from '../../utils/redis.js'
import { logger } from '../../utils/logger.js'

/**
 * Înregistrează endpoint-ul de sănătate în aplicația Fastify.
 * 
 * Acest endpoint NU necesită autentificare (este public).
 * Este folosit de servicii de monitorizare (UptimeRobot, BetterStack, etc.)
 * și de orchestratori (Docker, Kubernetes) pentru a verifica dacă API-ul este viu.
 * 
 * Rute disponibile:
 * - GET /v1/health - Verifică starea serverului, bazei de date și Redis
 */
export async function healthRoutes(app: FastifyInstance) {
  
  // GET /v1/health - Verificarea stării sistemului
  app.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Verificarea stării API-ului',
      description: 'Endpoint public pentru monitorizare. Verifică disponibilitatea serverului, bazei de date și Redis.',
      response: {
        200: {
          description: 'Toate serviciile funcționează normal',
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'down'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['up', 'down'] },
                redis: { type: 'string', enum: ['up', 'down'] },
              },
            },
            responseTimeMs: { type: 'number' },
          },
        },
        503: {
          type: 'object',
          description: 'Unul sau mai multe servicii sunt indisponibile',
          properties: {
            status: { type: 'string', enum: ['degraded', 'down'] },
            timestamp: { type: 'string', format: 'date-time' },
            uptime: { type: 'number' },
            version: { type: 'string' },
            environment: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['up', 'down'] },
                redis: { type: 'string', enum: ['up', 'down'] },
              },
            },
            responseTimeMs: { type: 'number' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const startTime = Date.now()
    
    const health = {
      status: 'ok' as 'ok' | 'degraded' | 'down',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'unknown' as 'up' | 'down',
        redis: 'unknown' as 'up' | 'down',
      },
      responseTimeMs: 0,
    }
    
    // Verificăm baza de date
    try {
      await prisma.$queryRaw`SELECT 1`
      health.services.database = 'up'
    } catch (error) {
      health.services.database = 'down'
      health.status = 'degraded'
      logger.error({ error }, 'Health check: baza de date nu răspunde')
    }
    
    // Verificăm Redis
    try {
      await redis.ping()
      health.services.redis = 'up'
    } catch (error) {
      health.services.redis = 'down'
      health.status = 'degraded'
      logger.error({ error }, 'Health check: Redis nu răspunde')
    }
    
    if (health.services.database === 'down' && health.services.redis === 'down') {
      health.status = 'down'
    }
    
    health.responseTimeMs = Date.now() - startTime
    const statusCode = health.status === 'ok' ? 200 : 503
    
    return reply.status(statusCode).send(health)
  })
}