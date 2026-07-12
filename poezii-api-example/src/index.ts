// src/index.ts
import './tracing.js' // Inițializare tracing (OpenTelemetry)
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import * as crypto from 'node:crypto'
import { metricsEndpoint, httpRequestsTotal, httpRequestDuration } from './utils/metrics.js'

import { logger, loggerConfig } from './utils/logger.js'
import { prisma } from './utils/prisma.js'
import redis from './utils/redis.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string
      plan: 'FREE' | 'PRO' | 'ENTERPRISE'
      keyPrefix: string
    }
  }
}

// Middleware-uri
import { requestIdMiddleware } from './middlewares/requestId.js'
import { authorRoutes } from './routes/v1/authors.js'
import { rateLimiterMiddleware } from './middlewares/rateLimiter.js'
import { setupErrorHandler } from './middlewares/errorHandler.js'

import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'

// Rute
import { v1Routes } from './routes/v1/index.js'
import { adminAuthorRoutes } from './routes/v1/admin.authors.js'
import usageRoutes from './routes/usage.js'

// ============================================
// 1. Inițializarea serverului
// ============================================

const app = Fastify({
  logger: loggerConfig,
  trustProxy: true,
  requestIdHeader: 'x-request-id',
  requestIdLogLabel: 'reqId',
})

// ============================================
// 2. Middleware-uri globale (ordinea contează!)
// ============================================

// 2.1 Request ID (cel mai devreme posibil)
app.addHook('onRequest', requestIdMiddleware)


// 2.2 CORS și Helmet
const initializeApp = async () => {
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
    credentials: true,
  })

  await app.register(helmet, {
    contentSecurityPolicy: false,
  })
}

// ============================================
// 4. Configurarea OpenAPI (Swagger)
// ============================================
  await app.register(swagger as any, {
    openapi: {
      info: {
        title: 'Poezii API',
        description: `
API cultural dedicat literaturii române - poezii, autori, texte integrale.

## Autentificare
Pentru a accesa API-ul, includeți header-ul \`x-api-key\` cu o cheie validă.

## Planuri
- **FREE**: 100 de cereri pe minut, fără acces la textul integral al poeziilor
- **PRO**: 1000 de cereri pe minut, acces complet la toate resursele, inclusiv texte integrale
- **ENTERPRISE**: 10000 de cereri pe minut, suport dedicat și SLA 

## Rate Limiting
- FREE: 100 requests / minute
- PRO: 1000 requests / minute
- ENTERPRISE: 10000 requests / minute

## Coduri de răspuns comune
- \`200 OK\` – cerere procesată cu succes
- \`201 Created\` – resursă creată cu succes
- \`204 No Content\` – resursă ștearsă cu succes
- \`400 Bad Request\` – date de intrare invalide
- \`401 Unauthorized\` – cheie API lipsă sau invalidă
- \`403 Forbidden\` – acces interzis (plan insuficient)
- \`404 Not Found\` – resursă negăsită
- \`429 Too Many Requests\` – limită de cereri depășită
- \`500 Internal Server Error\` – eroare internă
      `,
        version: '1.0.0',
        contact: {
          name: 'Echipa Poezii API',
          email: 'support@poezii-api.ro',
        },
        license: {
          name: 'MIT',
        },
      },
      servers: [
        {
          url: 'http://localhost:3000/v1',
          description: 'Server de dezvoltare',
        },
        {
          // url: 'https://api.poezii.ro/v1',
          description: 'Server de producție',
        },
      ],
        components: {
        securitySchemes: {
          apiKey: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
            description: 'Cheia API obținută de la administrator',
          },
        },
      },
      security: [
        {
          apiKey: [],
        },
      ],
     
      tags: [
        { name: 'Health', description: 'Endpoint-uri pentru verificarea stării API-ului' },
        { name: 'Poems', description: 'Operații cu poezii' },
        { name: 'Authors', description: 'Operații cu autori' },
        { name: 'Admin', description: 'Operații administrative (necesită plan PRO)' },
      ],
    },
    hideUntagged: false,
    exposeRoute: true,
  })

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
      displayOperationId: true,
      defaultModelsExpandDepth: 1,
      defaultModelExpandDepth: 1,
    },
    staticCSP: false,
    transformStaticCSP: (header) => header,
  })

  await app.register(usageRoutes, { prefix: '/v1' })
  await app.register(v1Routes, { prefix: '/v1' })


app.addHook('preHandler', async (request, reply) => {
  const publicRoutes = [
    '/health',
    '/ping',
    '/v1/api-keys',
    '/api-keys'
  ]

  const path = request.raw.url?.split('?')[0] || ''

  if (publicRoutes.includes(path)) {
    return
  }

  // AUTENTIFICARE
  const apiKey = request.headers['x-api-key']
  if (!apiKey) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Lipsește cheia API. Adăugați header-ul "x-api-key".'
    })
  }

  // Hash + verificare în DB
  if (Array.isArray(apiKey)) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Header-ul "x-api-key" trebuie să fie un string.'
    })
  }

  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  const apiKeyRecord = await prisma.apiKey.findUnique({ where: { keyHash } })

  if (!apiKeyRecord) {
    return reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Cheia API este invalidă.'
    })
  }

  request.user = {
    id: apiKeyRecord.id,
    plan: apiKeyRecord.plan,
    keyPrefix: apiKeyRecord.prefix,
  }
})

app.addHook('preHandler', rateLimiterMiddleware)
setupErrorHandler(app)

// Endpoint public simplu (pentru testare rapidă)
app.get('/ping', async () => {
  return { pong: true, timestamp: new Date().toISOString() }
})



// ============================================
// 5. Pornirea serverului
// ============================================

const start = async () => {
  const port = parseInt(process.env.PORT || '3000', 10)
  const host = process.env.HOST || '0.0.0.0'

  try {
    await app.listen({ port, host })
    
    logger.info({
      port,
      host,
      env: process.env.NODE_ENV,
      pid: process.pid,
    }, `Poezii API rulează la http://${host}:${port}`)
    
    // Afișăm rutele disponibile (doar în development)
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Rute disponibile:')
      logger.debug(`  GET  /v1/health                 - verificare stare sistem`)
      logger.debug(`  GET  /v1/poems                 - listă poezii`)
      logger.debug(`  GET  /v1/poems/popular         - poezii populare`)
      logger.debug(`  GET  /v1/poems/:id             - detaliu poezie (ID)`)
      logger.debug(`  GET  /v1/poems/slug/:slug      - detaliu poezie (slug)`)
      logger.debug(`  GET  /v1/authors               - listă poeți`)
      logger.debug(`  GET  /v1/authors/:id           - detaliu poet (ID)`)
      logger.debug(`  GET  /v1/authors/slug/:slug    - detaliu poet (slug)`)
      logger.debug(`  GET  /v1/authors/:id/poems     - poeziile unui poet`)
      logger.debug(`  POST /v1/admin/authors          - creează poet (PRO)`)
      logger.debug(`  PUT  /v1/admin/authors/:id      - actualizează poet (PRO)`)
      logger.debug(`  DELETE /v1/admin/authors/:id    - șterge poet (PRO)`)
    }
  } catch (error) {
    logger.error({ error }, 'Nu am putut porni serverul')
    process.exit(1)
  }
}



app.addHook('onResponse', async (request, reply) => {
  const route = request.routeOptions?.url || request.url
  const duration = reply.elapsedTime || 0 // Fastify oferă elapsedTime
  
  httpRequestsTotal.inc({
    method: request.method,
    route,
    status_code: reply.statusCode,
  })
  
  httpRequestDuration.observe({
    method: request.method,
    route,
    status_code: reply.statusCode,
  }, duration)
})

app.get('/metrics', metricsEndpoint)

// ============================================
// 6. Închidere elegantă (graceful shutdown)
// ============================================

process.on('SIGTERM', async () => {
  logger.info('SIGTERM primit. Închidem conexiunile...')
  await app.close()
  await prisma.$disconnect()
  await redis.quit()
  logger.info('Conexiunile au fost închise. La revedere!')
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT primit. Închidem conexiunile...')
  await app.close()
  await prisma.$disconnect()
  await redis.quit()
  logger.info('Conexiunile au fost închise. La revedere!')
  process.exit(0)
})


// Pornim serverul
await initializeApp()
start()