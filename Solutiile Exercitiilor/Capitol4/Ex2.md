Ex2 — Prima bază de date cu Prisma + PostgreSQL

-----

R1. Instalare Prisma
```
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```
-----

R2. .env
```DATABASE_URL="postgresql://postgres:password@localhost:5432/poezii-api"```
-----

R3. prisma/schema.prisma
```
model Work {
  id     String @id @default(uuid())
  title  String
  author String
  year   Int
}
```
-----


R4. Migrare
```npx prisma migrate dev --name init```
-----


R5. Generare client
```npx prisma generate```
-----

R6. Script de test — scripts/test-db.ts
```
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const created = await prisma.work.create({
    data: {
      title: "Luceafărul",
      author: "Mihai Eminescu",
      year: 1883
    }
  });

  console.log("Created:", created);

  const all = await prisma.work.findMany();
  console.log("All works:", all);
}

main();
```
-----

Rulezi:
```npx ts-node scripts/test-db.ts```
