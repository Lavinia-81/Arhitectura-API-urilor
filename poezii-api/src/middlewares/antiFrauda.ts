// middlewares/antiFraud.ts
import Redis from 'ioredis'
import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '../utils/prisma.js'

// ioredis v5's typings may not expose a construct signature in some setups;
// cast to any to avoid TS build errors while preserving runtime behavior.
const redis = new (Redis as any)(process.env.REDIS_URL!)

const TEMPORARY_EMAIL_DOMAINS = [
  'tempmail.com', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'yopmail.com', 'throwaway.com', 'temp-mail.org',
]

function isTemporaryEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase()
  return TEMPORARY_EMAIL_DOMAINS.includes(domain)
}

export async function antiFraudMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const user = (request as any).user
  const ip = request.ip

  if (!user) return // Only for authenticated requests

  // 1. Verifică dacă aceeași cheie este folosită din multe IP-uri
  const ipKey = `fraud:ips:${user.id}`
  const uniqueIps = await redis.sadd(ipKey, ip)
  await redis.expire(ipKey, 3600) // 1 oră

  if (uniqueIps > 10) {
    request.log.warn({ apiKeyId: user.id, ips: uniqueIps }, 'API key used from many IPs')

    // La 20+ IP-uri, suspect – revocăm automat
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

  // 2. Verifică dacă email-ul este temporar
  const dbUser = await (prisma as any).user.findUnique({ where: { id: user.id } })
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

  // 3. Verifică rata de request-uri anormală (posibil scraping)
  const rateKey = `fraud:rate:${user.id}`
  const currentRate = await redis.incr(rateKey)
  if (currentRate === 1) await redis.expire(rateKey, 60)

  if (currentRate > 1000) {
    request.log.warn({ apiKeyId: user.id, rate: currentRate }, 'Suspiciously high request rate')

    // Dacă utilizatorul este FREE și face 1000 req/min, probabil scraping
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

async function sendFraudAlert(email: string, message: string) {
  // Trimite email utilizatorului
  console.log(`Sending fraud alert to ${email}: ${message}`)

  // Opțional: trimite și în Slack pentru monitorizare
  // await sendSlackAlert('Fraud detected', `${email}: ${message}`)
}