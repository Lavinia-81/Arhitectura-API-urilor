// src/utils/metrics.ts
import client from 'prom-client'
import type { FastifyRequest, FastifyReply } from 'fastify'

// Registry-ul Prometheus — containerul în care sunt înregistrate toate metricile
const register = new client.Registry()

// Colectează metricile default ale Node.js:
// - CPU usage
// - memory usage
// - event loop lag
// - heap size
// - process metrics
client.collectDefaultMetrics({ register })

// -------------------------------------------------------------
// Histogram — măsoară durata requesturilor HTTP
// -------------------------------------------------------------
export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_ms',          // numele metricii
  help: 'HTTP request duration in milliseconds',
  labelNames: ['method', 'route', 'status_code'], // dimensiuni pentru analiză
  buckets: [10, 25, 50, 100, 200, 400, 800, 1600, 3000], // intervale de timp
})

// Înregistrăm histograma în registry
register.registerMetric(httpRequestDuration)


// -------------------------------------------------------------
// Counter — numărul total de requesturi HTTP
// -------------------------------------------------------------
export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

// Înregistrăm counter-ul
register.registerMetric(httpRequestsTotal)


// -------------------------------------------------------------
// Endpointul /metrics — expune toate metricile Prometheus
// -------------------------------------------------------------
export async function metricsEndpoint(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Setăm content-type-ul corect pentru Prometheus
  reply.header('Content-Type', register.contentType)

  // Returnăm toate metricile în format text
  return register.metrics()
}
