// middlewares/antiFraud.ts

import Redis from 'ioredis'
import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma.js'

// ioredis v5 are uneori probleme cu tipurile TypeScript,
// așa că îl convertim la "any" pentru a evita erori la build.
const redis = new (Redis as any)(process.env.REDIS_URL!)

// Lista de domenii de email temporare (folosite adesea pentru fraudă)
const TEMPORARY_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'throwaway.com', 'temp-mail.org',
]

// Verifică dacă email-ul aparține unui domeniu temporar
function isTemporaryEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return TEMPORARY_EMAIL_DOMAINS.includes(domain)
}

// Middleware antifraudă — rulează pentru fiecare request autenticat
export async function antiFraudMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user   // utilizatorul autentificat
  const ip = request.ip                // IP-ul requestului

  if (!user) return // rulează doar pentru request-uri autentificate

  // -------------------------------------------------------------
  // 1. Verifică dacă aceeași cheie API este folosită din multe IP-uri
  // -------------------------------------------------------------

  const ipKey = `fraud:ips:${user.id}`

  // Redis SADD → adaugă IP-ul în set; returnează numărul total de IP-uri unice
  const uniqueIps = await redis.sadd(ipKey, ip)

  // Setul expiră după 1 oră → monitorizare pe interval scurt
  await redis.expire(ipKey, 3600)

  // Dacă sunt peste 10 IP-uri → suspect, logăm
  if (uniqueIps > 10) {
    request.log.warn({ apiKeyId: user.id, ips: uniqueIps }, 'API key used from many IPs')

    // Dacă sunt peste 20 IP-uri → foarte suspect → revocăm cheia automat
    if (uniqueIps > 20) {
      await (prisma as any).apiKey.update({
        where: { id: user.id },
        data: { isActive: false, revocationReason: 'suspicious_activity_many_ips' },
      })

      await sendFraudAlert(user.email, 'API Key revoked due to key sharing')

      return reply.status(403).send({
        error: {
          code: 'API_KEY_REVOKED',
          message: 'This API key has been revoked due to suspicious activity.',
          contact: 'support@poezii.ro',
        },
      })
    }
  }

  // -------------------------------------------------------------
  // 2. Verifică dacă email-ul utilizatorului este temporar
  // -------------------------------------------------------------

  const dbUser = await (prisma as any).user.findUnique({ where: { id: user.id } })

  // Dacă email-ul este temporar → suspendăm contul
  if (dbUser?.email && isTemporaryEmail(dbUser.email)) {
    await (prisma as any).user.update({
      where: { id: user.id },
      data: { plan: 'FREE', subscriptionStatus: 'suspended' },
    })

    return reply.status(403).send({
      error: {
        code: 'INVALID_EMAIL',
        message: 'Please use a permanent email address. Temporary email domains are not allowed.',
      },
    })
  }

  // -------------------------------------------------------------
  // 3. Verifică rata de request-uri (posibil scraping / abuz)
  // -------------------------------------------------------------

  const rateKey = `fraud:rate:${user.id}`

  // Redis INCR → crește contorul de request-uri
  const currentRate = await redis.incr(rateKey)

  // Prima incrementare → setăm expirarea la 60 secunde
  if (currentRate === 1) await redis.expire(rateKey, 60)

  // Dacă depășește 1000 req/min → suspect
  if (currentRate > 1000) {
    request.log.warn({ apiKeyId: user.id, rate: currentRate }, 'Suspiciously high request rate')

    // Dacă utilizatorul este FREE → clar scraping → revocăm cheia
    if (dbUser?.plan === 'FREE') {
      await (prisma as any).apiKey.update({
        where: { id: user.id },
        data: { isActive: false, revocationReason: 'excessive_request_rate' },
      })

      return reply.status(403).send({
        error: {
          code: 'API_KEY_REVOKED',
          message: 'This API key has been revoked due to excessive request rate.',
        },
      })
    }
  }
}

// Trimite alertă de fraudă (email + Slack opțional)
async function sendFraudAlert(email: string, message: string) {
  // În producție ai pune aici un serviciu real de email
  console.log(`Sending fraud alert to ${email}: ${message}`)

  // Opțional: trimite și în Slack pentru monitorizare
  // await sendSlackAlert('Fraud detected', `${email}: ${message}`)
}
