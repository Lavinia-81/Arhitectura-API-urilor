// src/app.ts

import Fastify from 'fastify'
import { authMiddleware } from './middlewares/auth.js'
import { rateLimiterMiddleware } from './middlewares/rateLimiterMiddleware.js'

const app = Fastify()

// Ordinea contează!
app.addHook('preHandler', authMiddleware)      // 1. Autentificare
app.addHook('preHandler', rateLimiterMiddleware) // 2. Rate limiting
// 3. Controller (rutele)