<<<<<<< HEAD
# Poezii API — Versiunea Educațională

Aceasta este versiunea **educațională** a proiectului *Poezii API*, folosită ca studiu de caz în cartea **„API de la Creare la Monetizare”**.  
Conține doar codul esențial, fără fișiere generate automat (`node_modules`, `dist`) și fără date sensibile (`.env`).
=======
# Arhitectura si Securitatea API-urilor Moderne
Resurse oficiale ale cărții

Acesta este repository‑ul central al cărții Arhitectura si Securitatea API-urilor Moderne, locul unde cititorii găsesc toate resursele auxiliare: cod, diagrame, exerciții, soluții, exemple și materiale suplimentare.
>>>>>>> 6e4dc441ce816dbf2cd86f6d7d7e693aed817d6b

Pentru proiectul complet, activ și utilizat pentru deploy pe Render, consultați repository-ul oficial:

<<<<<<< HEAD
👉 **https://github.com/Lavinia-81/poezii-api**

---

## 🎯 Scopul acestui folder

- Oferă cititorilor acces direct la codul sursă.
- Permite studierea arhitecturii API-ului fără elemente inutile.
- Este folosit în capitolele despre:
  - modelare
  - seed data
  - repository pattern
  - servicii
  - controllere
  - middleware
  - routing
  - validare
  - caching
  - logging
  - securitate
  - testare
  - deploy

---

## 🧱 Structura proiectului
=======
## Structura ecosistemului
Cartea este însoțită de trei repository‑uri dedicate, fiecare având un rol clar:

## 1️⃣ Poezii API – Proiectul complet al cărții
Conține aplicația completă Fastify + TypeScript + Prisma + Redis, folosită ca studiu de caz în carte.
Include:
```
autentificare cu chei API

rate limiting diferențiat

caching

full‑text search

endpointuri premium

CI/CD

deploy pe Render / VPS
```

Este proiectul principal pe care se bazează capitolele tehnice.

---

## 2️⃣ Diagrame – Arhitectură, UML, Flowcharts
Conține toate diagramele folosite în carte:
>>>>>>> 6e4dc441ce816dbf2cd86f6d7d7e693aed817d6b
```
src/                → logica aplicației (controllers, services, routes)
prisma/             → schema bazei de date + migrations
scripts/            → scripturi auxiliare (ex: seed)
test/               → teste unitare
admin/              → instrumente administrative
monitoring/         → fișiere pentru monitorizare
stripe/             → integrare Stripe
markdown/           → documentație internă
db.sql              → script SQL pentru inițializare
Dockerfile          → configurare container
ecosystem.config.js → configurare PM2
render.yaml         → configurare deploy Render
deploy.sh           → script de deploy
postgresql.config   → configurare PostgreSQL
package.json        → dependențe și comenzi
tsconfig.json       → configurare TypeScript
```

---

<<<<<<< HEAD
## 🚀 Cum rulezi versiunea completă

Versiunea educațională **nu include** `node_modules` sau `dist`.  
Pentru a rula API-ul complet, folosește repository-ul oficial:
=======
## 3️⃣ Exerciții + Soluții – Practică pe capitole 
Conține exercițiile din carte și soluțiile oficiale, organizate pe capitole:
>>>>>>> 6e4dc441ce816dbf2cd86f6d7d7e693aed817d6b
```
git clone https://github.com/Lavinia-81/poezii-api
cd poezii-api
npm install
npm run build
npm start
```

---

## 📝 Notă editorială

Această versiune este optimizată pentru claritate și învățare.  
Nu este destinată deploy-ului.  
Pentru producție, folosiți repository-ul oficial.

---

<<<<<<< HEAD
## 📚 Referințe

Cartea: **API De la Creare la Monetizare**  
Autor: *Maria Lavinia*  
Studiu de caz: *Poezii API*
=======
### 📝 Licență
MIT License — resursele pot fi folosite liber în scop educațional.
>>>>>>> 6e4dc441ce816dbf2cd86f6d7d7e693aed817d6b
