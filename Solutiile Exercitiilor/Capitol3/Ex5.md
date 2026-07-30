Ex5. Error handler centralizat
Cerință: Transformă toate erorile într-un răspuns JSON consistent.

-----

Soluție (handler matur, profesional)
```
// src/errors/error.handler.ts
export function errorHandler(error, req, reply) {
  const status = error.statusCode || 500;

  reply.status(status).send({
    error: {
      code: error.code || "ERR_INTERNAL",
      message: error.message || "A apărut o eroare internă.",
      request_id: req.request_id
    }
  });
}
```
-----

Exemplu de clasă de eroare
```
// src/errors/api.error.ts
export class ApiError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}
```
-----

Explicație: 
- Toate erorile sunt transformate în JSON coerent.
- Cod HTTP corect.
- Obiect error clar, standardizat.
- Integrare perfectă cu middleware-ul de logging.