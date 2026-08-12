// prisma/seed.ts

import { PrismaClient, Plan } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Creează instanța Prisma pentru acces la baza de date
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // -------------------------------------------------------------
  // 1. Șterge toate datele existente (reset complet)
  // -------------------------------------------------------------
  await prisma.usageLog.deleteMany()   // șterge logurile de utilizare
  await prisma.apiKey.deleteMany()     // șterge cheile API
  await prisma.poem.deleteMany()       // șterge poeziile
  await prisma.author.deleteMany()     // șterge autorii

  // -------------------------------------------------------------
  // 2. Creează autori de bază
  // -------------------------------------------------------------
  const eminescu = await prisma.author.create({
    data: {
      name: 'Mihai Eminescu',
      slug: 'mihai-eminescu',
      bio: 'Cel mai important poet romantic român.',
      birthYear: 1850,
      deathYear: 1889,
    },
  })

  const arghezi = await prisma.author.create({
    data: {
      name: 'Tudor Arghezi',
      slug: 'tudor-arghezi',
      bio: 'Poet și scriitor român, cunoscut pentru originalitatea limbajului.',
      birthYear: 1880,
      deathYear: 1967,
    },
  })

  // -------------------------------------------------------------
  // 3. Creează poezii asociate autorilor
  // -------------------------------------------------------------
  await prisma.poem.create({
    data: {
      title: 'Luceafărul',
      slug: 'luceafarul',
      fullText: 'A fost odată ca-n povești,\nA fost ca niciodată...', // text scurt
      summary: 'Povestea cosmică a Luceafărului.',
      year: 1883,
      type: 'EPIC',
      keywords: 'luceafăr,iubire,cosmic',
      authorId: eminescu.id, // asociere cu autorul
    },
  })

  await prisma.poem.create({
    data: {
      title: 'Flori de mucigai',
      slug: 'flori-de-mucigai',
      fullText: 'Din negru'+"'"+'mi-ai crescut, floare...', // evită conflictul de ghilimele
      summary: 'Versuri puternice despre suferință și speranță.',
      year: 1931,
      type: 'LYRIC',
      keywords: 'mucigai,suferință,speranță',
      authorId: arghezi.id,
    },
  })

  // -------------------------------------------------------------
  // 4. Creează o cheie API de test (plan PRO)
  // -------------------------------------------------------------
  const plainKey = `poezii_test_${Math.random().toString(36).substring(2, 15)}`
  const keyHash = await bcrypt.hash(plainKey, 10) // hash-uim cheia API

  await prisma.apiKey.create({
    data: {
      prefix: 'poezii_test', // prefix pentru identificare rapidă
      keyHash: keyHash,      // salvăm doar hash-ul, nu cheia reală
      plan: Plan.PRO,        // plan PRO pentru testare
    },
  })

  console.log(`Seeding completed.`)
  console.log(`Test API key (PRO): ${plainKey}`) // afișăm cheia reală în consolă
}

// -------------------------------------------------------------
// 5. Rulează scriptul și gestionează erorile
// -------------------------------------------------------------
main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect() // închide conexiunea la DB
  })
