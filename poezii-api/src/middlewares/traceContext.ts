// middlewares/traceContext.ts

// Importăm API-ul OpenTelemetry pentru a accesa span-ul activ
const { trace } = require('@opentelemetry/api') as { trace: any }

import { FastifyRequest, FastifyReply } from 'fastify'

// Middleware care atașează ID-ul de trace la loguri și la răspuns
export function addTraceContext(request: FastifyRequest, reply: FastifyReply) {
  // Obține span-ul activ din contextul OpenTelemetry
  const currentSpan = trace?.getActiveSpan?.()

  // Extrage traceId-ul din span (dacă există)
  const traceId = currentSpan?.spanContext?.().traceId

  // Dacă există un traceId → îl atașăm la loguri și la header-ul răspunsului
  if (traceId) {
    // Extindem logger-ul requestului cu trace_id
    // Astfel, toate logurile generate în acest request vor include trace_id
    request.log = request.log.child({ trace_id: traceId })

    // Trimitem traceId-ul și către client, pentru debugging/tracing distribuit
    reply.header('X-Trace-ID', traceId)
  }
}
