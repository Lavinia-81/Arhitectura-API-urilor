// src/routes/v1/index.ts

import { FastifyInstance } from 'fastify'
import { poemRoutes } from './poems.js'
import { authorRoutes } from './authors.js'
import { healthRoutes } from './health.js'
import { apiKeyRoutes } from './apiKey.js'
/**
 * Înregistrează toate rutele versiunii 1 (v1) ale API-ului.
 * 
 * Toate rutele vor fi prefixate automat cu /v1.
 * 
 * Exemplu:
 * - GET /v1/poems
 * - GET /v1/poems/42
 * - GET /v1/authors
 * - GET /v1/health
 */
export async function v1Routes(app: FastifyInstance) {
  // Toate rutele din aceste fișiere vor fi montate sub prefixul /v1
  await poemRoutes(app)      // rutele pentru poezii
  await authorRoutes(app)    // rutele pentru poeți
  await healthRoutes(app)    // ruta de sănătate
  await apiKeyRoutes(app)     // rutele pentru chei API
}