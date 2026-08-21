// monitoring/slo.ts

import { PrismaClient } from '@prisma/client'

// Creează sau reutilizează o instanță PrismaClient pentru a evita multiple conexiuni
// în timpul dezvoltării (hot-reload poate crea instanțe duplicate)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Dacă există deja un PrismaClient global, îl folosește;
// altfel creează unul nou
const prisma: PrismaClient = (globalThis as any).__prisma ?? new PrismaClient()

// În medii non-production, salvează instanța Prisma în globalThis
// pentru a preveni crearea de instanțe multiple la fiecare reload
if (
  (globalThis as any).process &&
  (globalThis as any).process.env &&
  (globalThis as any).process.env.NODE_ENV !== 'production'
) {
  (globalThis as any).__prisma = prisma
}

import { sendAlert } from './alerts'

// Calculează SLO (Service Level Objective) pentru disponibilitate
// și verifică dacă a fost consumat bugetul de erori
export async function calculateErrorBudget() {
  // Setează începutul lunii curente (ex: 1 august, ora 00:00)
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  
  // Numărul total de request-uri din această lună
  const totalRequests = await prisma.usageLog.count({
    where: { createdAt: { gte: monthStart } },
  })
  
  // Numărul de request-uri care au returnat erori server (5xx)
  const errorRequests = await prisma.usageLog.count({
    where: {
      createdAt: { gte: monthStart },
      statusCode: { in: [500, 502, 503, 504] },
    },
  })
  
  // Disponibilitatea = (request-uri bune / total)
  // Dacă totalRequests = 0, considerăm disponibilitate 100%
  const availability =
    totalRequests === 0 ? 1 : (totalRequests - errorRequests) / totalRequests
  
  // Cât din bugetul de erori a fost consumat
  const errorBudgetUsed = 1 - availability
  
  // Bugetul rămas — ținta este 99.9% disponibilitate
  // 99.9% => 0.001 buget de erori
  const errorBudgetRemaining = 0.001 - errorBudgetUsed
  
  // Dacă bugetul de erori a fost depășit, trimite alertă critică
  if (errorBudgetRemaining < 0) {
    await sendAlert(
      'Error budget exhausted!',
      `Used: ${(errorBudgetUsed * 100).toFixed(2)}%, Remaining: ${errorBudgetRemaining * 100}%`,
      'critical'
    )
  }
  
  // Returnează valorile pentru dashboard/monitorizare
  return { availability, errorBudgetUsed, errorBudgetRemaining }
}
