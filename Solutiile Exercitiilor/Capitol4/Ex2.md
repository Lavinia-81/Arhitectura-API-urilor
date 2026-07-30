Ex2 — Prima bază de date cu Prisma + PostgreSQL

-----

1. Instalare Prisma
```
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```
-----

2. .env
```DATABASE_URL="postgresql://postgres:password@localhost:5432/poezii-api"```

-----

3. prisma/schema.prisma
```
model Work {
  id     String @id @default(uuid())
  title  String
  author String
  year   Int
}
```
-----


4. Migrare
```npx prisma migrate dev --name init```

-----


5. Generare client
```npx prisma generate```

-----

6. Script de test — scripts/test-db.ts
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
