# Poezii API — API Modern pentru Literatura Română
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://fastify.dev/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)

Poezii API este proiectul demonstrativ oficial al cărții **„ARHITECTURA ȘI SECURITATEA API‑URILOR MODERNE”**, construit pentru a exemplifica arhitectura unui API modern, scalabil, sigur și ușor de extins.
Acest API oferă acces la poezii, autori, căutare full‑text, planuri de acces prin chei API și un sistem complet de monitorizare a consumului.
Proiectul este realizat cu Fastify + TypeScript, include rate limiting inteligent, Redis, Prisma, JWT, logging profesional, documentație Swagger/Redoc, și respectă bunele practici prezentate în carte.

---

### Cartea oficială

**[ARHITECTURA ȘI SECURITATEA API‑URILOR MODERNE]
[![Buy on Amazon](https://img.shields.io/badge/Amazon-Book-orange.svg)](https://www.amazon.co.uk/dp/B0H9TFM89S) 
Cartea este disponibilă pe Amazon și reprezintă versiunea publicată, matură și completă a lucrării.

---

##  Obiectivul proiectului

Demonstrează arhitectura unui API modern, modular și scalabil.
Oferă un exemplu real pentru conceptele discutate în carte: routing, servicii, repository pattern, caching, securitate, deploy.
Servește ca material educațional pentru dezvoltatori, studenți și arhitecți software.
Permite testarea și explorarea unui API complet funcțional, cu planuri de acces și rate limiting diferențiat.

---

## Caracteristici principale
Acces la poezii, autori, căutare full‑text
Chei API cu planuri: FREE, PRO, ENTERPRISE
Rate limiting inteligent (Redis)
Endpoint dedicat pentru monitorizarea consumului: /v1/usage
Structură modernă: Fastify + TypeScript
Documentație completă: Swagger & Redoc
Logging profesional (request/response/errors)
Validare robustă a datelor
Securitate: JWT, API Keys, limitări pe planuri, protecție la abuz

---

## Instalare

Instalare dependințe:
`npm install`

## Configurare
Creează un fișier .env în rădăcina proiectului:

```
PORT=3000
NODE_ENV=development

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# JWT / API Keys
JWT_SECRET=un_secret_puternic_aici
```

---

## Rulare

- Mod dezvoltare:
  `npm run dev`

- Mod producție:

```
npm run build
npm start
```

---

## Autentificare

API-ul folosește chei API transmise în header:
`x-api-key: YOUR_API_KEY`

Planurile disponibile:
```
FREE — limită redusă

PRO — limită extinsă

ENTERPRISE — acces complet
```

---

## Header‑uri returnate:

```
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-RateLimit-Plan
Retry-After (doar la 429)
```

---

## Endpoint-uri principale

```
# Healthcheck
`GET /health`

# API Keys
POST /v1/api-keys` — generează o cheie API
GET /v1/api-keys` — listează cheile API ale utilizatorului

```

---

## Autori

```GET /v1/authors` — listă autori
GET /v1/authors/{id} - Obținerea unui Autor după ID
GET /v1/authors?page=1&limit=20 - Listarea Autorilo
GET /v1/authors/slug/{slug} - Obținerea unui Autor după Slug
```

---

## Poezii

```
GET /v1/poems?page=1&limit=10&search=eminescu&type=LYRIC&yearMin=1880&yearMax=1900&sortBy=title&sortOrder=asc - Listarea Poeziilor (Filtrare + Sortare + Paginare)
GET /v1/poems/{id}?fullText=true|false - Obținerea unei Poezii după ID
GET /v1/poems/{id}/text - Obținerea Textului Integral al unei Poezii
GET /v1/poems/slug/{slug}?fullText=true|false - Obținerea unei Poezii după Slug
GET /v1/search/fulltext?text={cuvant} - Căutare Full‑Text în Poezii
GET /v1/poems/{id}/text - Textul integral al unei poezii
GET /v1/poems/popular?limit=10 - Cele Mai Populare Poezii
```

---

## Admin – Poezii
```
POST /v1/poems - Creare poezie
PUT /v1/poems/{id} - Actualizare poezie
DELETE /v1/poems/{id} - Ștergere poezie
```

---

## Usage (monitorizare consum)
  `GET /v1/usage`

 Exemplu răspuns:
 ```{
  "plan": "PRO",
  "limit": 500,
  "used": 123,
  "remaining": 377,
  "resetIn": 42,
  "blocked": false
  }
  ```

  ---

## Status Codes
```
200 — OK
400 — Invalid request
401 — Missing / invalid API key
403 — Plan insuficient
404 — Resursa nu există
429 — Rate limit depășit
500 — Eroare server
```
---

## Roadmap

- Căutare avansată (full-text search)
- Endpoint pentru imagini / manuscrise
- Webhooks pentru consum API
- Dashboard UI pentru utilizatori
- Export date în format JSON/CSV
- Sistem de abonamente PRO/ENTERPRISE

---

## Licență

MIT License.

---

## Contribuții

- Pull requests sunt binevenite.
- Pentru schimbări majore, deschide un issue înainte.
- Respectă stilul de cod și arhitectura proiectului.
