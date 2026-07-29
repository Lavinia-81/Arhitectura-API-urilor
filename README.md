# Poezii API — Versiunea Educațională

Aceasta este versiunea **educațională** a proiectului *Poezii API*, folosită ca studiu de caz în cartea **„API de la Creare la Monetizare”**.  
Conține doar codul esențial, fără fișiere generate automat (`node_modules`, `dist`) și fără date sensibile (`.env`).

Pentru proiectul complet, activ și utilizat pentru deploy pe Render, consultați repository-ul oficial:

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

## 🚀 Cum rulezi versiunea completă

Versiunea educațională **nu include** `node_modules` sau `dist`.  
Pentru a rula API-ul complet, folosește repository-ul oficial:
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

## 📚 Referințe

Cartea: **API De la Creare la Monetizare**  
Autor: *Maria Lavinia*  
Studiu de caz: *Poezii API*
