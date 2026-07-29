// middlewares/traceContext.ts
const { trace } = require('@opentelemetry/api') as { trace: any }
import { FastifyRequest, FastifyReply } from 'fastify'

export function addTraceContext(request: FastifyRequest, reply: FastifyReply) {
  const currentSpan = trace?.getActiveSpan?.()
  const traceId = currentSpan?.spanContext?.().traceId

  if (traceId) {
    request.log = request.log.child({ trace_id: traceId })
    reply.header('X-Trace-ID', traceId)
  }
}