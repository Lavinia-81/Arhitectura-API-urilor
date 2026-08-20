# Poezii API — Modern API for Romanian Classical Literature

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black.svg)](https://fastify.dev/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)

**Poezii API** is the official demo project of the book **“Modern API Architecture & Security”**, built to demonstrate how to design a modern, scalable, secure, and extensible API.

The API provides structured access to Romanian poetry and authors, full‑text search, API key plans, usage monitoring, and a complete rate‑limiting system.  
It is built with **Fastify + TypeScript**, includes intelligent rate limiting, Redis caching, Prisma ORM, JWT authentication, professional logging, Swagger/Redoc documentation, and follows the best practices presented in the book.

---

## 📘 Official Book

**Modern API Architecture & Security**  
[![Buy on Amazon](https://img.shields.io/badge/Amazon-Book-orange.svg)](https://www.amazon.co.uk/dp/B0H9TFM89S)

The book is available on Amazon and represents the mature, published version of the work.

---

## Project Purpose

- Demonstrates the architecture of a modern, modular, scalable API  
- Provides a real example for concepts discussed in the book: routing, services, repository pattern, caching, security, deployment  
- Serves as educational material for developers, students, and software architects  
- Allows testing and exploration of a fully functional API with differentiated rate‑limiting plans  

---

## Key Features

- Access to poems, authors, full‑text search  
- API keys with plans: **FREE**, **PRO**, **ENTERPRISE**  
- Intelligent rate limiting (Redis)  
- Usage monitoring endpoint: `/v1/usage`  
- Modern structure: Fastify + TypeScript  
- Full documentation: Swagger & Redoc  
- Professional logging (request/response/errors)  
- Robust data validation  
- Security: JWT, API Keys, plan restrictions, abuse protection  

---

## Technologies Used
```
Backend
Fastify — modern, fast framework with a powerful plugin system
TypeScript — strict typing, architectural clarity
Prisma ORM — elegant PostgreSQL access, migrations, models
Redis — rate limiting, caching, usage monitoring
JWT — authentication for admin routes
Swagger + Redoc — auto‑generated documentation
OpenTelemetry — tracing for debugging and observability
Pino Logger — high‑performance logging
```

---

## Project Structure
```
src/
├── controllers/      # Endpoint logic
├── routes/           # Route definitions (v1, admin, usage)
├── services/         # Business logic (authors, poems, API keys)
├── utils/            # Prisma, logger, rate limiting, validation
├── middlewares/      # Authentication, API key parsing
├── config/           # Rate limits, env, swagger config
└── index.ts          # Fastify bootstrap + plugins, etc.
```

---

## Getting Started (Required)

After cloning the repository, install all dependencies:
```
git clone https://github.com/.../poezii-api.git
cd poezii-api

npm install
```

This step:

- installs all required Node.js modules  
- configures Fastify and its plugins  
- installs Prisma ORM and the client generator  
- installs Redis client  
- prepares TypeScript and the compiler  
- sets up the environment for running the API  

---

## After Installing Dependencies
```
Configure environment variables
cp .env.example .env
Fill in PostgreSQL, Redis, JWT, etc.

Start external services
PostgreSQL (database)
Redis (rate limiting + caching)

Run Prisma migrations
npx prisma migrate dev

Start the server
npm run dev
```

---

## .env Configuration
```
PORT=3000
NODE_ENV=development

PostgreSQL
DATABASE_URL="postgresql://postgres:password@localhost:5432/poezii"

Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

JWT / API Keys
JWT_SECRET=your_strong_secret_here
```

---

## Authentication
```
API keys are sent via header:
x-api-key: YOUR_API_KEY

Available plans:
FREE — limited
PRO — extended
ENTERPRISE — full access
```

---

## Rate‑Limit Headers
```
X-RateLimit-Limit
X-RateLimit-Remaining
X-RateLimit-Reset
X-RateLimit-Plan
Retry-After (429 only)
```

---

## Main Endpoints

### Healthcheck
```GET /health```

### API Keys
```
POST /v1/api-keys     # generate API key
GET  /v1/api-keys     # list user API keys
```

---

## Authors
```
GET /v1/authors
GET /v1/authors/{id}
GET /v1/authors?page=1&limit=20
GET /v1/authors/slug/{slug}
GET /v1/authors/{id}/poems
GET /v1/authors/{id}/poems/popular
```

---

## Poems
```
GET /v1/poems?page=1&limit=10&search=eminescu&type=LYRIC&yearMin=1880&yearMax=1900&sortBy=title&sortOrder=asc
GET /v1/poems/{id}?fullText=true|false
GET /v1/poems/{id}/text
GET /v1/poems/slug/{slug}?fullText=true|false
GET /v1/search/fulltext?text={word}
GET /v1/poems/popular?limit=10
```

---

## Admin — Poems
```
POST   /v1/poems
PUT    /v1/poems/{id}
DELETE /v1/poems/{id}
```

---

## Usage Monitoring

```GET /v1/usage```

### Example Response
```
{
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
403 — Insufficient plan
404 — Resource not found
429 — Rate limit exceeded
500 — Server error
```

---

## Roadmap

- Advanced full‑text search  
- Image / manuscript endpoints  
- API usage webhooks  
- User dashboard UI  
- JSON/CSV export  
- PRO/ENTERPRISE subscription system  

---

## License

MIT License.

---

## Contributions

- Pull requests are welcome  
- For major changes, open an issue first  
- Follow the project’s architecture and coding style  
