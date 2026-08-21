import { FastifyInstance } from 'fastify'
import { createClient } from 'redis'
import { PLAN_LIMITS } from '../config/rateLimits.js'

// Inițializăm clientul Redis (lazy connection)
const redisClient = createClient({
  url: process.env.REDIS_URL
})

// Funcție care se asigură că Redis este conectat înainte de utilizare
async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }
  return redisClient
}

// Rute pentru afișarea consumului curent al utilizatorului
export default async function usageRoutes(app: FastifyInstance) {

  // -------------------------------------------------------------
  // GET /v1/usage
  // Returnează informații despre consumul curent al cheii API:
  // - câte requesturi au fost făcute în fereastra curentă
  // - câte requesturi mai sunt permise
  // - când se resetează fereastra
  // -------------------------------------------------------------
  app.get('/usage', async (request, reply) => {
    const apiKeyId = request.user?.id
    const plan = request.user?.plan || 'FREE'

    // Dacă nu există user → lipsă API key
    if (!apiKeyId) {
      return reply.status(401).send({
        error: 'Missing API key'
      })
    }

    // Tipurile de planuri acceptate
    type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'

    // Obținem limitele planului (rpm = requests per minute)
    const limits = PLAN_LIMITS[plan as Plan]

    // Cheia Redis folosită de rate limiter
    const key = `rate_limit:${apiKeyId}`

    // Obținem clientul Redis
    const constRedis = await getRedisClient()

    // Numărul curent de requesturi în fereastra de 60 secunde
    const current = Number(await constRedis.get(key)) || 0

    // TTL = câte secunde au mai rămas din fereastra curentă
    const ttl = await constRedis.ttl(key)

    // Calculăm câte requesturi mai sunt permise
    const remaining = Math.max(0, limits.rpm - current)

    // Flag dacă limita a fost depășită
    const blocked = current > limits.rpm

    // Returnăm informațiile către client
    return reply.send({
      plan,        // planul utilizatorului
      limit: limits.rpm, // limita per minut
      used: current,      // câte requesturi au fost făcute
      remaining,          // câte mai sunt permise
      resetIn: ttl,       // când se resetează fereastra
      blocked             // dacă este blocat sau nu
    })
  })
}
