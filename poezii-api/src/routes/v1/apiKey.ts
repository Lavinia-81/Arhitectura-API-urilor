// src/routes/v1/apiKey.ts

import { FastifyInstance } from "fastify"
import { createApiKeyController } from "../../controllers/apiKey.controller.js"

// Definește rutele pentru gestionarea cheilor API (versiunea v1)
export async function apiKeyRoutes(fastify: FastifyInstance) {

  // -------------------------------------------------------------
  // POST /v1/api-keys
  // Endpoint public — generează o cheie API nouă
  // -------------------------------------------------------------
  // Nu are preHandler de autentificare, deoarece utilizatorii trebuie
  // să poată crea o cheie API fără să aibă deja una.
  fastify.post("/api-keys", createApiKeyController)
}
