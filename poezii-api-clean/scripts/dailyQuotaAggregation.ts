// scripts/dailyQuotaAggregation.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient() as any

// Rulează la fiecare oră, sau la finalul zilei
const today = new Date()
today.setHours(0, 0, 0, 0)

const usage = await prisma.apiUsage.groupBy({
  by: ['apiKeyId'],
  where: {
    timestamp: { gte: today },
    billed: false,
  },
  _sum: {
    units: true,
  },
})

for (const item of usage) {
  await prisma.dailyQuota.upsert({
    where: { apiKeyId_date: { apiKeyId: item.apiKeyId, date: today } },
    update: { units: { increment: item._sum.units || 0 } },
    create: {
      apiKeyId: item.apiKeyId,
      date: today,
      units: item._sum.units || 0,
    },
  })
}

// Marchează înregistrările ca facturate
await prisma.apiUsage.updateMany({
  where: {
    timestamp: { gte: today },
    billed: false,
  },
  data: { billed: true },
})