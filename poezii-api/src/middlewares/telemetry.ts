// middlewares/telemetry.ts

import { FastifyInstance } from 'fastify'

// Middleware de telemetrie — măsoară durata fiecărui request
export function telemetryMiddleware(app: FastifyInstance) {

  // -------------------------------------------------------------
  // Hook-ul "onRequest" — se execută imediat când request-ul intră
  // -------------------------------------------------------------
  app.addHook('onRequest', async (request) => {
    // Salvăm timestamp-ul de start pe obiectul request
    // (folosim "as any" pentru că FastifyRequest nu are acest câmp)
    ;(request as any).startTime = Date.now()
  })
  
  // -------------------------------------------------------------
  // Hook-ul "onResponse" — se execută când răspunsul este trimis
  // -------------------------------------------------------------
  app.addHook('onResponse', async (request, reply) => {
    // Calculăm durata totală a request-ului
    const duration = Date.now() - ((request as any).startTime || Date.now())
    
    // Logăm informații utile pentru monitorizare și debugging
    request.log.info({
      event: 'request_done',                     // tipul evenimentului
      method: request.method,                    // GET / POST / PUT etc.
      path: request.routeOptions?.url || request.url, // ruta reală (inclusiv rute dinamice)
      status: reply.statusCode,                  // codul de răspuns
      duration_ms: duration,                     // durata în milisecunde
      user_id: (request as any).user?.id,        // ID-ul utilizatorului (dacă e autentificat)
      plan: (request as any).user?.plan,         // planul utilizatorului (FREE / PRO / ENTERPRISE)
      ip_hash: (request as any).ipHash,          // hash-ul IP-ului pentru GDPR (nu IP-ul real)
    })
  })
}
