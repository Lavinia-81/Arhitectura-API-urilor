// src/routes/v1/apiKey.ts

import { FastifyInstance } from "fastify"
import { createApiKeyController } from "../../controllers/apiKey.controller.js"

export async function apiKeyRoutes(fastify: FastifyInstance) {
  fastify.post("/api-keys", createApiKeyController)
}