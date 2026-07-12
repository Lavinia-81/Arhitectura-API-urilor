// services/antiScraping.ts
import redis from '../utils/redis.js'

export async function detectScraping(apiKeyId: string, ip: string, requestedId: number) {
  
  // 1. Detectare pattern secvențial
  const lastIdKey = `scraping:lastId:${apiKeyId}`
  const lastId = await redis.get(lastIdKey)
  if (lastId && parseInt(lastId) === requestedId - 1) {
    const seqCount = await redis.incr(`scraping:seq:${apiKeyId}`)
    if (seqCount > 10) {
      return { isScraping: true, reason: 'sequential_pattern' }
    }
    await redis.expire(`scraping:seq:${apiKeyId}`, 60)
  } else {
    await redis.set(lastIdKey, requestedId)
  }
  
  // 2. Detectare IP-uri multiple pentru aceeași cheie
  const ipKey = `scraping:ips:${apiKeyId}`
  await redis.sadd(ipKey, ip)
  const uniqueIps = await redis.scard(ipKey)
  if (uniqueIps > 5) {
    return { isScraping: true, reason: 'multiple_ips' }
  }
  await redis.expire(ipKey, 600) // 10 minute
  
  return { isScraping: false }
}