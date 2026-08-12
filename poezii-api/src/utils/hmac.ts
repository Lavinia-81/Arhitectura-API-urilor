// utils/hmac.ts

import crypto from 'crypto'

/**
 * Generează o semnătură HMAC-SHA256 pentru un request.
 *
 * Semnătura este calculată pe baza:
 *   - method (GET, POST etc.)
 *   - url (ruta exactă)
 *   - timestamp (în milisecunde)
 *   - body (serializat JSON)
 *   - secret (cheia privată a clientului)
 *
 * Formatul datelor semnate:
 *   METHOD|URL|TIMESTAMP|BODY_JSON
 */
export function generateHmacSignature(
  method: string,
  url: string,
  timestamp: string,
  body: any,
  secret: string
): string {
  // Serializăm corpul requestului
  const bodyStr = JSON.stringify(body || {})

  // Construim payload-ul care va fi semnat
  const dataToSign = [method, url, timestamp, bodyStr].join('|')

  // Generăm HMAC-SHA256
  return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex')
}

/**
 * Verifică dacă semnătura HMAC este validă.
 *
 * Mecanisme de securitate:
 *   1. Comparare constant-time (timingSafeEqual)
 *      → previne atacurile de tip timing attack.
 *
 *   2. Anti-replay:
 *      → timestamp-ul trebuie să fie în ultimele 2 minute.
 *      → cererile vechi sunt respinse.
 */
export function verifyHmac(
  method: string,
  url: string,
  timestamp: string,
  body: any,
  signature: string,
  secret: string
): boolean {
  // Semnătura așteptată
  const expected = generateHmacSignature(method, url, timestamp, body, secret)
  
  // Comparare constant-time pentru a preveni timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expected, 'utf8')
  )
  
  // Anti-replay: timestamp-ul trebuie să fie recent (max 2 minute)
  const isRecent = Math.abs(Date.now() - Number(timestamp)) <= 120000
  
  return isValid && isRecent
}
