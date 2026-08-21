// import 'dotenv/config'
// import { PrismaClient } from '@prisma/client'
// import { generateApiKey, hashApiKey } from '../src/utils/apiKeys.js'

// const prisma = new PrismaClient()

// async function main() {
//   const prefix = process.argv[2] || 'poezii_dev'

//   // 1. Generează cheia reală
//   const apiKey = generateApiKey().replace('poezii_', `${prefix}_`)

//   // 2. Hash-uiește cheia
//   const keyHash = hashApiKey(apiKey)

//   // 3. Inserează în DB
//   const record = await prisma.apiKey.create({
//    data: {
//       prefix,
//       keyHash,
//       plan: 'FREE',
//       expiresAt: null,
//       lastUsed: null,
//     },

//   })

//   // 4. Afișează cheia reală
//   console.log('\n=== Cheie API generată ===')
//   console.log(`Cheia completă: ${apiKey}`)
//   console.log(`Prefix: ${prefix}`)
//   console.log(`ID în DB: ${record.id}`)
//   console.log('\nSalvează cheia într-un loc sigur. Nu o vei mai putea vedea niciodată.\n')

//   await prisma.$disconnect()
// }

// main().catch(async (err) => {
//   console.error(err)
//   await prisma.$disconnect()
// })
