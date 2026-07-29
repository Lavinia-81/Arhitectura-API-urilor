#!/bin/bash
set -e  # Oprește scriptul la prima eroare

echo "🔧 Construim aplicația..."
npm run build

echo "🧪 Testăm..."
npm test

echo "📦 Aplicăm migrările..."
npx prisma migrate deploy

echo "🚀 Repornim aplicația..."
pm2 reload poezii-api || pm2 start dist/index.js --name poezii-api

echo "✅ Deploy finalizat cu succes!"