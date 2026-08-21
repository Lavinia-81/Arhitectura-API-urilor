# Prima etapă: build (bucătarul)
# Folosește o imagine Node ușoară (alpine) pentru a construi aplicația
FROM node:20-alpine AS builder

# Setează directorul de lucru în container
WORKDIR /app

# Copiază fișierele de dependințe (package.json + lock)
# și instalează doar dependințele de producție
COPY package*.json ./
RUN npm ci --only=production

# Copiază schema Prisma și generează Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copiază restul codului aplicației și rulează build-ul (ex: TypeScript → JS)
COPY . .
RUN npm run build



# A doua etapă: runtime (ospătarul)
# Folosește o imagine Node curată, fără tool-uri de build
FROM node:20-alpine

# Directorul de lucru pentru runtime
WORKDIR /app

# Copiază doar fișierele necesare pentru rularea aplicației:
# - codul compilat (dist)
# - node_modules din etapa de build
# - prisma (pentru migrații sau acces la schema)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

# Copiază package.json pentru referință (nu pentru instalare)
COPY package*.json ./

# Expune portul pe care rulează serverul Node
EXPOSE 3000

# Comanda de start a aplicației
CMD ["node", "dist/server.js"]
