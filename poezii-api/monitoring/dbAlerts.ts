// monitoring/dbAlerts.ts

import { PrismaClient } from '@prisma/client'

// Încearcă să încarce funcția sendSlackAlert din utils/slack.
// Dacă modulul nu există sau nu are funcția, folosește o funcție "goală" (noop)
// pentru a evita erori la runtime.
let sendSlackAlert: (title: string, message: string) => Promise<void> = async () => {}

// require este declarat pentru a evita erori TypeScript în medii fără Node typings
declare const require: any

try {
  // Încearcă să importe modulul Slack
  const slackMod = require('../utils/slack')

  // Dacă modulul există și are funcția sendSlackAlert, o folosește
  if (slackMod && typeof slackMod.sendSlackAlert === 'function') {
    sendSlackAlert = slackMod.sendSlackAlert
  }
} catch (err) {
  // Dacă importul eșuează, rămâne funcția noop
}

// Creează o instanță Prisma pentru a interacționa cu baza de date
const prisma = new PrismaClient()

// Măsoară latența unui query simplu către baza de date
async function getDbLatency(): Promise<number> {
  const start = Date.now()               // Timpul de start
  await prisma.$queryRaw`SELECT 1`       // Query minimal pentru test
  return Date.now() - start              // Diferența = latența
}

// Funcția principală care verifică sănătatea bazei de date
export async function checkDatabaseHealth() {
  // 1. Verifică numărul de conexiuni active în PostgreSQL
  const connections = await prisma.$queryRaw<[{ count: number }]>`
    SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
  `
  
  // Dacă sunt peste 80 conexiuni active, trimite alertă Slack
  if (connections[0].count > 80) {
    await sendSlackAlert('High DB connections', `${connections[0].count} active connections`)
  }
  
  // 2. Verifică latența query-urilor
  const latency = await getDbLatency()

  // Dacă latența depășește 200ms, trimite alertă
  if (latency > 200) {
    await sendSlackAlert('High DB latency', `${latency}ms p95`)
  }
  
  // 3. Verifică dimensiunea bazei de date (în MB)
  const size = await prisma.$queryRaw<[{ size_mb: number }]>`
    SELECT pg_database_size('poeziiapi') / 1024 / 1024 as size_mb;
  `
  
  // Dacă baza de date depășește ~9GB, trimite alertă (aproape de limita planului)
  if (size[0].size_mb > 9000) { // aproape de 10GB
    await sendSlackAlert('Database size warning', `${size[0].size_mb} MB (aproape de limita planului)`)
  }
}
