// middlewares/telemetry.ts
import { FastifyInstance } from 'fastify'

export function telemetryMiddleware(app: FastifyInstance) {
  app.addHook('onRequest', async (request) => {
    ;(request as any).startTime = Date.now()
  })
  
  app.addHook('onResponse', async (request, reply) => {
    const duration = Date.now() - ((request as any).startTime || Date.now())
    
    request.log.info({
      event: 'request_done',
      method: request.method,
      path: request.routeOptions?.url || request.url,
      status: reply.statusCode,
      duration_ms: duration,
      user_id: (request as any).user?.id,
      plan: (request as any).user?.plan,
      ip_hash: (request as any).ipHash, // pentru GDPR
    })
  })
}