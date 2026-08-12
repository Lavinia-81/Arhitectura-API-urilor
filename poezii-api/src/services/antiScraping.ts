// services/antiScraping.ts

import redis from '../utils/redis.js'

/**
 * Detectează comportament de scraping pe baza:
 * 1. Pattern-ului secvențial (ex: /poems/1, /poems/2, /poems/3...)
 * 2. Numărului de IP-uri diferite care folosesc aceeași cheie API
 */
export async function detectScraping(apiKeyId: string, ip: string, requestedId: number) {
  
  // -------------------------------------------------------------
  // 1. Detectare pattern secvențial (scraping clasic)
  // -------------------------------------------------------------
  // Cheia unde salvăm ultimul ID accesat
  const lastIdKey = `scraping:lastId:${apiKeyId}`
  const lastId = await redis.get(lastIdKey)

  // Dacă ultimul ID este exact cu 1 mai mic decât cel curent → secvențial
  if (lastId && parseInt(lastId) === requestedId - 1) {

    // Incrementăm contorul de accesări secvențiale
    const seqCount = await redis.incr(`scraping:seq:${apiKeyId}`)

    // Dacă depășește 10 accesări secvențiale → suspect
    if (seqCount > 10) {
      return { isScraping: true, reason: 'sequential_pattern' }
    }

    // Expiră după 60 secunde → fereastră scurtă de analiză
    await redis.expire(`scraping:seq:${apiKeyId}`, 60)

  } else {
    // Dacă nu e secvențial → rescriem ultimul ID
    await redis.set(lastIdKey, requestedId)
  }
  
  // -------------------------------------------------------------
  // 2. Detectare IP-uri multiple pentru aceeași cheie API
  // -------------------------------------------------------------
  const ipKey = `scraping:ips:${apiKeyId}`

  // Adăugăm IP-ul în setul de IP-uri unice
  await redis.sadd(ipKey, ip)

  // Numărăm câte IP-uri diferite au folosit această cheie
  const uniqueIps = await redis.scard(ipKey)

  // Dacă sunt mai mult de 5 IP-uri → probabil key sharing / scraping
  if (uniqueIps > 5) {
    return { isScraping: true, reason: 'multiple_ips' }
  }

  // Setul expiră după 10 minute → analiză pe interval scurt
  await redis.expire(ipKey, 600)
  
  // -------------------------------------------------------------
  // Dacă nu s-a detectat nimic suspect
  // -------------------------------------------------------------
  return { isScraping: false }
}
