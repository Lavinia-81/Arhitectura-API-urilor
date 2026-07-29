# Prima etapă: build (bucătarul)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiază și instalează dependințe
COPY package*.json ./
RUN npm ci --only=production

# Generează Prisma Client
COPY prisma ./prisma
RUN npx prisma generate

# Copiază codul și compilează
COPY . .
RUN npm run build

# A doua etapă: runtime (ospătarul)
FROM node:20-alpine

WORKDIR /app

# Copiază doar ce este necesar pentru runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]