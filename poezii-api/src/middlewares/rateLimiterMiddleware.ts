// src/middlewares/rateLimiterMiddleware.ts

import Redis from 'ioredis'
import { FastifyRequest, FastifyReply } from 'fastify'
import { PLAN_LIMITS, getEffectiveLimits } from '../config/rateLimits.js'

type Plan = keyof typeof PLAN_LIMITS

// Normalizare pentru constructorul Redis (în unele setup-uri vine ca default export)
const RedisConstructor: any = (Redis as any).default || Redis
const redis = new RedisConstructor(process.env.REDIS_URL!)


// -------------------------------------------------------------
// SCRIPT LUA — implementare Token Bucket în Redis
// -------------------------------------------------------------
// - KEYS[1] = cheia bucket-ului
// - ARGV[1] = timestamp curent
// - ARGV[2] = burst (capacitate maximă)
// - ARGV[3] = refillRate (câte token-uri se regenerează pe secundă)
//
// Scriptul gestionează:
//   - refill automat al token-urilor
//   - expirarea cheilor
//   - consumul unui token per request
//   - calculul timpului până la reset
//
const tokenBucketScript = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local burst = tonumber(ARGV[2])
  local refillRate = tonumber(ARGV[3])
  local tokensKey = key .. ':tokens'
  local lastRefillKey = key .. ':last_refill'

  local tokens = tonumber(redis.call('GET', tokensKey))
  local lastRefill = tonumber(redis.call('GET', lastRefillKey))

  -- Inițializare bucket dacă nu există
  if not tokens then
    tokens = burst
    lastRefill = now
  elseif not lastRefill then
    lastRefill = now
  else
    -- Refill automat în funcție de timpul trecut
    local elapsed = math.max(0, now - lastRefill)
    tokens = math.min(burst, tokens + (elapsed * refillRate))
    lastRefill = now
  end

  -- Dacă există token → consumăm unul
  if tokens >= 1 then
    tokens = tokens - 1
    redis.call('SET', tokensKey, tokens, 'EX', 60)
    redis.call('SET', lastRefillKey, lastRefill, 'EX', 60)
    return { tokens, 60 }
  end

  -- Dacă nu există token → calculăm timpul până la reset
  local resetSeconds = math.ceil((1 - tokens) / refillRate)
  redis.call('SET', tokensKey, tokens, 'EX', 60)
  redis.call('SET', lastRefillKey, lastRefill, 'EX', 60)
  return { 0, resetSeconds }
`

// Timestamp în secunde
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}


// -------------------------------------------------------------
// Funcția principală de verificare a limitelor
// -------------------------------------------------------------
async function checkRateLimit(
  keyPrefix: string,
  identifier: string,
  endpoint: string,
  plan: Plan,
  ip: string
) {
  const limits = getEffectiveLimits(plan, endpoint)
  const now = nowSeconds()
  
  // -------------------------------------------------------------
  // 1. Token Bucket — limită per minut
  // -------------------------------------------------------------
  const bucketKey = `rl:bucket:${keyPrefix}:${identifier}:${endpoint}`
  const refillRate = limits.rpm / 60  // câte token-uri se regenerează pe secundă

  const [tokensRemaining, resetSeconds] = await redis.eval(
    tokenBucketScript, 1, bucketKey, now, limits.burst, refillRate
  )
  
  if (tokensRemaining <= 0) {
    return { allowed: false, type: 'per_minute', resetSeconds, limit: limits.rpm }
  }
  
  // -------------------------------------------------------------
  // 2. Daily quota — limită pe zi
  // -------------------------------------------------------------
  const dailyKey = `rl:daily:${keyPrefix}:${identifier}:${new Date().toISOString().slice(0, 10)}`
  const dailyUsed = await redis.incr(dailyKey)

  if (dailyUsed === 1) {
    // Setăm expirarea la miezul nopții
    const secondsUntilMidnight = (24 * 3600) - (now % (24 * 3600))
    await redis.expire(dailyKey, secondsUntilMidnight)
  }
  
  if (dailyUsed > limits.daily) {
    const reset = (24 * 3600) - (now % (24 * 3600))
    return { allowed: false, type: 'daily_quota', reset, limit: limits.daily }
  }
  
  // -------------------------------------------------------------
  // 3. Monthly quota — limită pe lună
  // -------------------------------------------------------------
  const monthlyKey = `rl:monthly:${keyPrefix}:${identifier}:${new Date().toISOString().slice(0, 7)}`
  const monthlyUsed = await redis.incr(monthlyKey)

  if (monthlyUsed === 1) {
    // Expirare la finalul lunii
    const daysInMonth = new Date().getDate()
    const secondsUntilMonthEnd = (daysInMonth * 86400) - (now % 86400)
    await redis.expire(monthlyKey, secondsUntilMonthEnd)
  }
  
  if (monthlyUsed > limits.monthly) {
    const reset = (30 * 86400) - (now % 86400)
    return { allowed: false, type: 'monthly_quota', reset, limit: limits.monthly }
  }
  
  // -------------------------------------------------------------
  // 4. Limită per IP — protecție suplimentară împotriva abuzului
  // -------------------------------------------------------------
  const ipKey = `rl:ip:${ip}`
  const ipCount = await redis.incr(ipKey)

  if (ipCount === 1) {
    await redis.expire(ipKey, 60)
  }
  
  if (ipCount > 100) { // max 100 req/min per IP
    return { allowed: false, type: 'ip_limit', reset: 60 - (now % 60), limit: 100 }
  }
  
  // Dacă toate verificările sunt OK → acces permis
  return { 
    allowed: true, 
    remaining: tokensRemaining,
    resetSeconds,
    dailyRemaining: Math.max(0, limits.daily - dailyUsed),
    monthlyRemaining: Math.max(0, limits.monthly - monthlyUsed),
  }
}


// -------------------------------------------------------------
// Middleware-ul Fastify
// -------------------------------------------------------------
export async function rateLimiterMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Endpoint-uri publice — limitare light
  const publicPaths = ['/health', '/ping', '/metrics']
  if (publicPaths.includes(request.url)) {
    const ip = request.ip
    const ipKey = `rl:ip:public:${ip}`
    const ipCount = await redis.incr(ipKey)
    if (ipCount === 1) await redis.expire(ipKey, 60)
    
    if (ipCount > 30) {
      return reply.status(429).send({
        error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Slow down.' }
      })
    }
    return
  }
  
  // Autentificare obligatorie
  const user = request.user as { id: string; plan: Plan } | undefined
  if (!user) {
    return reply.status(401).send({
      error: { code: 'UNAUTHORIZED', message: 'Missing or invalid API key' }
    })
  }
  
  // Determinăm endpoint-ul real (pentru rute dinamice)
  const endpoint = request.routerPath || request.url

  // Verificăm limitele
  const result = await checkRateLimit('apikey', user.id, endpoint, user.plan, request.ip)
  const planLimits = PLAN_LIMITS[user.plan]

  // Setăm headere informative
  reply.header('RateLimit-Policy', `${planLimits.rpm};w=60`)
  reply.header('RateLimit-Remaining', result.remaining || 0)
  reply.header('RateLimit-Reset', result.resetSeconds || 60)
  reply.header('X-RateLimit-Plan', user.plan)
  reply.header('X-RateLimit-Daily-Remaining', result.dailyRemaining || 0)
  
  // Dacă nu este permis → trimitem eroare 429
  if (!result.allowed) {
    let message = ''
    switch (result.type) {
      case 'per_minute':
        message = `Too many requests for plan ${user.plan}. Limit: ${result.limit} requests per minute.`
        break
      case 'daily_quota':
        message = `Daily quota exceeded for plan ${user.plan}. Limit: ${result.limit} requests per day.`
        break
      case 'monthly_quota':
        message = `Monthly quota exceeded for plan ${user.plan}. Limit: ${result.limit} requests per month.`
        break
      case 'ip_limit':
        message = `Too many requests from this IP address. Limit: 100 requests per minute.`
        break
    }
    
    return reply.status(429).send({
      error: {
        code: result.type === 'daily_quota' ? 'DAILY_QUOTA_EXCEEDED' : 'RATE_LIMIT_EXCEEDED',
        message,
        details: { plan: user.plan, limit: result.limit, reset_seconds: result.resetSeconds },
        request_id: request.id,
      },
    })
  }
}
