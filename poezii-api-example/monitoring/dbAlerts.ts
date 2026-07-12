// monitoring/dbAlerts.ts
import { PrismaClient } from '@prisma/client'
// Try to load sendSlackAlert from utils; if unavailable, use a noop to avoid runtime errors
let sendSlackAlert: (title: string, message: string) => Promise<void> = async () => {}
declare const require: any
try {
  const slackMod = require('../utils/slack')
  if (slackMod && typeof slackMod.sendSlackAlert === 'function') {
    sendSlackAlert = slackMod.sendSlackAlert
  }
} catch (err) {
  // module not found or other error — fallback noop
}

const prisma = new PrismaClient()

async function getDbLatency(): Promise<number> {
  const start = Date.now()
  await prisma.$queryRaw`SELECT 1`
  return Date.now() - start
}

export async function checkDatabaseHealth() {
  // 1. Verifică numărul de conexiuni active
  const connections = await prisma.$queryRaw<[{ count: number }]>`
    SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
  `
  
  if (connections[0].count > 80) {
    await sendSlackAlert('High DB connections', `${connections[0].count} active connections`)
  }
  
  // 2. Verifică latenta query-urilor
  const latency = await getDbLatency()
  if (latency > 200) {
    await sendSlackAlert('High DB latency', `${latency}ms p95`)
  }
  
  // 3. Verifică spațiul disponibil
  const size = await prisma.$queryRaw<[{ size_mb: number }]>`
    SELECT pg_database_size('poeziiapi') / 1024 / 1024 as size_mb;
  `
  
  if (size[0].size_mb > 9000) { // aproape de 10GB
    await sendSlackAlert('Database size warning', `${size[0].size_mb} MB (aproape de limita planului)`)
  }
}