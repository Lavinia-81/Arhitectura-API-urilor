Ex2. Configurează două conexiuni Prisma

-----

.env
```
DATABASE_URL="postgresql://app_user:strong_password@localhost:5432/poezii-api"
DATABASE_URL_MIGRATIONS="postgresql://db_owner:owner_password@localhost:5432/poezii_api"
```
-----

schema.prisma
```
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

datasource migrations {
  provider = "postgresql"
  url      = env("DATABASE_URL_MIGRATIONS")
}
```
-----

Migrare
```DATABASE_URL=$(echo $DATABASE_URL_MIGRATIONS) npx prisma migrate dev```

-----

Aplicația rulează cu user-ul limitat
```npm run start```

-----