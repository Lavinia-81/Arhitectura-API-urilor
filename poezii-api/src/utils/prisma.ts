// src/utils/prisma.ts

import { PrismaClient } from '@prisma/client'

// Singleton pentru Prisma în development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty',
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Testarea conexiunii la pornire
prisma.$connect()
  .then(() => {
    console.log('Prisma s-a conectat la PostgreSQL')
  })
  .catch((error) => {
    console.error('Prisma nu s-a putut conecta la PostgreSQL', error)
    process.exit(1)
  })

// Închidere elegantă
process.on('beforeExit', async () => {
  console.log('Închidem conexiunea Prisma...')
  await prisma.$disconnect()
})

export default prisma