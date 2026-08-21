// scripts/dailyQuotaAggregation.ts

import { PrismaClient } from '@prisma/client'

// Creează o instanță Prisma pentru a interacționa cu baza de date
const prisma = new PrismaClient() as any

// Setează începutul zilei curente (ora 00:00)
// Scriptul poate rula la finalul zilei sau la fiecare oră
const today = new Date()
today.setHours(0, 0, 0, 0)

// Obține utilizarea API-ului pentru ziua curentă,
// grupată pe apiKeyId (fiecare cheie API)
// Filtrează doar înregistrările ne-facturate (billed: false)
const usage = await prisma.apiUsage.groupBy({
  by: ['apiKeyId'],          // grupare pe cheia API
  where: {
    timestamp: { gte: today }, // doar request-urile din ziua curentă
    billed: false,             // doar cele ne-facturate
  },
  _sum: {
    units: true,               // calculează suma unităților consumate
  },
})

// Pentru fiecare cheie API, actualizează sau creează înregistrarea din dailyQuota
for (const item of usage) {
  await prisma.dailyQuota.upsert({
    // Identificator unic: combinația apiKeyId + date
    where: { apiKeyId_date: { apiKeyId: item.apiKeyId, date: today } },

    // Dacă există deja înregistrarea pentru azi, incrementează unitățile
    update: { units: { increment: item._sum.units || 0 } },

    // Dacă nu există, creează o înregistrare nouă
    create: {
      apiKeyId: item.apiKeyId,
      date: today,
      units: item._sum.units || 0,
    },
  })
}

// Marchează toate înregistrările din apiUsage ca facturate,
// pentru a evita dublarea facturării la următoarea rulare
await prisma.apiUsage.updateMany({
  where: {
    timestamp: { gte: today }, // doar cele din ziua curentă
    billed: false,             // doar cele ne-facturate
  },
  data: { billed: true },      // marchează ca facturate
})
