// utils/hmac.ts
import crypto from 'crypto'

export function generateHmacSignature(
  method: string,
  url: string,
  timestamp: string,
  body: any,
  secret: string
): string {
  const bodyStr = JSON.stringify(body || {})
  const dataToSign = [method, url, timestamp, bodyStr].join('|')
  return crypto.createHmac('sha256', secret).update(dataToSign).digest('hex')
}

export function verifyHmac(
  method: string,
  url: string,
  timestamp: string,
  body: any,
  signature: string,
  secret: string
): boolean {
  const expected = generateHmacSignature(method, url, timestamp, body, secret)
  
  // timingSafeEqual previne timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expected, 'utf8')
  )
  
  // Anti-replay: cererile mai vechi de 2 minute sunt respinse
  const isRecent = Math.abs(Date.now() - Number(timestamp)) <= 120000
  
  return isValid && isRecent
}