import { FastifyInstance } from 'fastify'
import { createClient } from 'redis'
import { PLAN_LIMITS } from '../config/rateLimits.js'

const redisClient = createClient({
  url: process.env.REDIS_URL
})

async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect()
  }

  return redisClient
}

export default async function usageRoutes(app: FastifyInstance) {
  app.get('/v1/usage', async (request, reply) => {
    const apiKeyId = request.user?.id
    const plan = request.user?.plan || 'FREE'

    if (!apiKeyId) {
      return reply.status(401).send({
        error: 'Missing API key'
      })
    }

    type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'
    const limits = PLAN_LIMITS[plan as Plan]

    const key = `rate_limit:${apiKeyId}`

    const constRedis = await getRedisClient()
    const current = Number(await constRedis.get(key)) || 0
    const ttl = await constRedis.ttl(key)

    const remaining = Math.max(0, limits.rpm - current)
    const blocked = current > limits.rpm

    return reply.send({
      plan,
      limit: limits.rpm,
      used: current,
      remaining,
      resetIn: ttl,
      blocked
    })
  })
}
