// src/utils/redis.ts

import Redis from 'ioredis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379'

const redis = new Redis.default(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000)
    console.warn(`Redis: reconectare în ${delay}ms (încercarea ${times})`)
    return delay
  },
  reconnectOnError: (err: Error) => {
    const transient = ['READONLY', 'ETIMEDOUT', 'ECONNRESET']
    const shouldReconnect = transient.some(t => err.message.includes(t))

    if (shouldReconnect) {
      console.warn('Redis: eroare temporară, se reconectează...', err.message)
      return true
    }
    return false
  },
})

// Evenimente
redis.on('connect', () => {
  console.log('✅ Redis conectat cu succes')
})

redis.on('error', (error: Error) => {
  console.error('Redis: eroare de conexiune', error.message)
})

redis.on('close', () => {
  console.warn('Redis: conexiunea s-a închis')
})

redis.on('reconnecting', () => {
  console.log('Redis: încearcă să se reconecteze...')
})

// Utilitare caching
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key)
  if (!data) return null
  try {
    return JSON.parse(data) as T
  } catch {
    return null
  }
}

export const cacheSet = async <T>(
  key: string,
  value: T,
  ttlSeconds: number = 3600
): Promise<void> => {
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
}

export const cacheDelete = async (pattern: string): Promise<void> => {
  const keys = await redis.keys(pattern)
  if (keys.length > 0) {
    await redis.del(...keys)
  }
}

export const cacheClear = async (): Promise<void> => {
  await redis.flushall()
}

export default redis