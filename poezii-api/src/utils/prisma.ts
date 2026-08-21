// src/utils/prisma.ts

import { PrismaClient } from '@prisma/client'

// -------------------------------------------------------------
// Singleton pentru Prisma în development
// -------------------------------------------------------------
// În development, Fastify poate fi reîncărcat de mai multe ori (HMR).
// Dacă am crea o nouă instanță Prisma la fiecare reload, am avea
// multiple conexiuni deschise către PostgreSQL → foarte rău.
//
// De aceea folosim globalThis pentru a păstra o singură instanță.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Instanța Prisma folosită în toată aplicația
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Loguri utile în development
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'], // în producție doar erori

    errorFormat: 'pretty', // formatare frumoasă pentru erori
  })

// Dacă nu suntem în producție → salvăm instanța în globalThis
// astfel încât să nu fie recreată la fiecare reload.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// -------------------------------------------------------------
// Testarea conexiunii la pornire
// -------------------------------------------------------------
// Prisma încearcă să se conecteze la PostgreSQL imediat.
// Dacă nu reușește → procesul se oprește cu eroare.
prisma.$connect()
  .then(() => {
    console.log('Prisma s-a conectat la PostgreSQL')
  })
  .catch((error) => {
    console.error('Prisma nu s-a putut conecta la PostgreSQL', error)
    process.exit(1)
  })

// -------------------------------------------------------------
// Închidere elegantă
// -------------------------------------------------------------
// Când procesul Node.js se închide, Prisma trebuie să închidă
// conexiunile către PostgreSQL pentru a evita leak-uri.
process.on('beforeExit', async () => {
  console.log('Închidem conexiunea Prisma...')
  await prisma.$disconnect()
})

export default prisma
