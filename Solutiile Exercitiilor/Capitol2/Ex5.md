Ex5. Fragment OpenAPI — endpoint la alegere
Cerință: Include parametri, răspunsuri, securitate.

---

Soluție (OpenAPI 3.1 — GET /v1/books/{id})
```
paths:
  /v1/books/{id}:
    get:
      summary: Get book by ID
      security:
        - ApiKeyAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: Book found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/BookResponse"
        "404":
          description: Book not found
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
```