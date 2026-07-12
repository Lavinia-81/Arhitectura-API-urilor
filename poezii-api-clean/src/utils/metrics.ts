import client from 'prom-client'
import type { FastifyRequest, FastifyReply } from 'fastify'

const register = new client.Registry()

client.collectDefaultMetrics({ register })

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [10, 25, 50, 100, 200, 400, 800, 1600, 3000],
})
register.registerMetric(httpRequestDuration)

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})
register.registerMetric(httpRequestsTotal)

export async function metricsEndpoint(
  request: FastifyRequest,
  reply: FastifyReply
) {
  reply.header('Content-Type', register.contentType)
  return register.metrics()
}
