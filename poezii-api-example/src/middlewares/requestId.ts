// src/middlewares/requestId.ts

import { FastifyRequest, FastifyReply } from 'fastify'
import { randomUUID } from 'crypto'

// ============================================
// 1. Middleware pentru generarea Request ID
// ============================================

/**
 * Middleware care generează un ID unic pentru fiecare cerere.
 * 
 * Dacă clientul trimite un header `x-request-id`, îl folosim pe acela.
 * Dacă nu, generăm unul nou (UUID v4).
 * 
 * ID-ul este adăugat în loguri și returnat în antetul răspunsului.
 */
export async function requestIdMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Verificăm dacă clientul a trimis un request ID
  let requestId = request.headers['x-request-id'] as string | undefined
  
  // Dacă nu, generăm unul nou
  if (!requestId) {
    requestId = randomUUID()
  }
  
  // Atașăm ID-ul la request pentru a fi folosit în loguri
  request.id = requestId
  
  // Adăugăm ID-ul în antetul răspunsului (clientul poate face debugging)
  reply.header('x-request-id', requestId)
  
  // Logger-ul Pino va include automat acest ID în toate logurile
  // (pentru că am configurat requestIdLogLabel în Fastify)
  
  return
}