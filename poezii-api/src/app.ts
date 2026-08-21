// src/app.ts

import Fastify from 'fastify'
import { authMiddleware } from './middlewares/auth.js'
import { rateLimiterMiddleware } from './middlewares/rateLimiterMiddleware.js'

const app = Fastify()

// -------------------------------------------------------------
// Ordinea contează!
// -------------------------------------------------------------
// Fastify execută hook-urile în ordinea în care sunt înregistrate.
// Asta înseamnă că fiecare request trece printr-un "pipeline" fix:
//
// 1. Autentificare (authMiddleware)
//    - Verifică cheia API
//    - Atașează user-ul la request (request.user)
//    - Dacă cheia e invalidă → request respins
//
// 2. Rate limiting (rateLimiterMiddleware)
//    - Folosește request.user.id pentru a aplica limitele
//    - Dacă limita e depășită → request respins
//
// 3. Controller (rutele)
//    - Se execută DOAR dacă primele două hook-uri au trecut
//
// Dacă ai inversa ordinea, rate limiting-ul nu ar avea acces la user,
// iar autentificarea ar fi aplicată prea târziu.
// -------------------------------------------------------------

app.addHook('preHandler', authMiddleware)          // 1. Autentificare
app.addHook('preHandler', rateLimiterMiddleware)   // 2. Rate limiting
// 3. Controller (rutele)
