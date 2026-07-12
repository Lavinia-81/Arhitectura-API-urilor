// monitoring/slo.ts
import { PrismaClient } from '@prisma/client'
// Create or reuse a PrismaClient to avoid creating multiple clients in dev/hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}
const prisma: PrismaClient = (globalThis as any).__prisma ?? new PrismaClient()
// Use globalThis to access process in environments where 'process' may not be declared
if ((globalThis as any).process && (globalThis as any).process.env && (globalThis as any).process.env.NODE_ENV !== 'production') {
  (globalThis as any).__prisma = prisma
}
import { sendAlert } from './alerts'

export async function calculateErrorBudget() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  
  const totalRequests = await prisma.usageLog.count({
    where: { createdAt: { gte: monthStart } },
  })
  
  const errorRequests = await prisma.usageLog.count({
    where: {
      createdAt: { gte: monthStart },
      statusCode: { in: [500, 502, 503, 504] },
    },
  })
  
  const availability = totalRequests === 0 ? 1 : (totalRequests - errorRequests) / totalRequests
  const errorBudgetUsed = 1 - availability
  const errorBudgetRemaining = 0.001 - errorBudgetUsed // 99.9% target = 0.001 error budget
  
  if (errorBudgetRemaining < 0) {
    await sendAlert(
      'Error budget exhausted!',
      `Used: ${(errorBudgetUsed * 100).toFixed(2)}%, Remaining: ${errorBudgetRemaining * 100}%`,
      'critical'
    )
  }
  
  return { availability, errorBudgetUsed, errorBudgetRemaining }
}