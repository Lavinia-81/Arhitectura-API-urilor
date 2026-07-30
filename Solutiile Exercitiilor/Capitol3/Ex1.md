Ex1. Structura de foldere pentru API-ul cultural
Cerință: Construiește scheletul proiectului și pune câte un fișier gol în fiecare folder.

---

Soluție (arhitectură pe straturi, profesională)
```
src/
  controllers/
    works.controller.ts
  services/
    works.service.ts
  repositories/
    works.repository.ts
  middlewares/
    logging.middleware.ts
  validators/
    works.validator.ts
  errors/
    error.handler.ts
    api.error.ts
  routes/
    works.routes.ts
  config/
    env.ts
  utils/
    request-id.ts
```
---

Explicație
controllers → subțiri, doar orchestrare
services → logică de business
repositories → acces la date (mock / DB)
middlewares → logging, auth, rate limiting
validators → Zod / schema custom
errors → handler centralizat + clase de erori
routes → definirea rutelor
utils → funcții auxiliare