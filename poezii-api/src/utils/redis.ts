// src/utils/redis.ts

import { Redis } from 'ioredis'

// -------------------------------------------------------------
// 1. Detectăm dacă suntem în development fără Redis
// -------------------------------------------------------------
const isDev = process.env.NODE_ENV === 'development'
const hasRedisUrl = !!process.env.REDIS_URL

// -------------------------------------------------------------
// 2. Instanța Redis (reală sau fallback)
// -------------------------------------------------------------
let redis: any

if (isDev && !hasRedisUrl) {
  console.warn('Redis dezactivat în development (nu există REDIS_URL)')

  redis = {
    get: async (_key?: string) => null,
    set: async (_key?: string, _value?: any, _mode?: any, _ttl?: number) => null,
    incr: async (_key?: string) => 0,
    del: async (_key?: string) => null,
    keys: async (_pattern?: string) => [],
    flushall: async () => null,
    expire: async (_key?: string, _seconds?: number) => null,
    ttl: async (_key?: string) => 60,
    sadd: async (_key?: string, _value?: string) => null,
    scard: async (_key?: string) => 0,
    ping: async () => 'PONG',
    quit: async () => null,
  }
} else {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,

    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000)
      console.warn(`Redis: reconectare în ${delay}ms (încercarea ${times})`)
      return delay
    },

    reconnectOnError: (err: Error) => {
      const transient = ['READONLY', 'ETIMEDOUT', 'ECONNRESET']
      return transient.some(t => err.message.includes(t))
    },
  })

  redis.on('connect', () => console.log('Redis conectat cu succes'))
  redis.on('error', (error: Error) => console.error('Redis: eroare de conexiune', error.message))
  redis.on('close', () => console.warn('Redis: conexiunea s-a închis'))
  redis.on('reconnecting', () => console.log('Redis: încearcă să se reconecteze...'))
}

// -------------------------------------------------------------
// 3. Funcții utilitare pentru caching JSON
// -------------------------------------------------------------
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key)
  if (!data) return null
  try { return JSON.parse(data) as T } catch { return null }
}

export const cacheSet = async <T>(key: string, value: T, ttlSeconds = 3600) => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export const cacheDelete = async (pattern: string) => {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) await redis.del(...keys)
}

export const cacheClear = async () => {
  await redis.flushall()
}

export default redis
