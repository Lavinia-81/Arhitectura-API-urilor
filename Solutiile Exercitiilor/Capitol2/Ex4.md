Ex4. Erori standardizate — API cultural
Cerință: Definește 4 coduri de eroare specifice și scrie câte un exemplu de răspuns.

---

Soluție (coduri + exemple)

ERR_BOOK_NOT_FOUND
```
{
  "error": {
    "code": "ERR_BOOK_NOT_FOUND",
    "message": "Cartea nu a fost găsită.",
    "request_id": "req_1a2b3c"
  }
}
```

ERR_AUTHOR_NOT_FOUND
```
{
  "error": {
    "code": "ERR_AUTHOR_NOT_FOUND",
    "message": "Autorul nu există în baza de date.",
    "request_id": "req_4d5e6f"
  }
}
```

ERR_INVALID_FILTER
```
{
  "error": {
    "code": "ERR_INVALID_FILTER",
    "message": "Filtrul specificat nu este valid.",
    "request_id": "req_7g8h9i"
  }
}
```

ERR_RATE_LIMIT_EXCEEDED
```
{
  "error": {
    "code": "ERR_RATE_LIMIT_EXCEEDED",
    "message": "Ai depășit limita de requesturi.",
    "retry_after": 30,
    "request_id": "req_abc123"
  }
}
```