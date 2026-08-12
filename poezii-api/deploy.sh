#!/bin/bash
set -e  # Oprește scriptul la prima eroare — foarte important pentru deploy sigur

echo "Construim aplicația..."
# Compilează TypeScript → JavaScript în dist/
npm run build

echo "Testăm..."
# Rulează testele înainte de deploy — previne deploy-uri corupte
npm test

echo "Aplicăm migrările..."
# Aplică migrările Prisma pe baza de date (fără a genera altele noi)
npx prisma migrate deploy

echo "Repornim aplicația..."
# Dacă procesul există → reload fără downtime
# Dacă nu există → start nou
pm2 reload poezii-api || pm2 start dist/index.js --name poezii-api

echo "Deploy finalizat cu succes!"
