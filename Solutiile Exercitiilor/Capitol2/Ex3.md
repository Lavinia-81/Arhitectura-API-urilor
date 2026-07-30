Ex3. Paginare, filtrare, sortare — GET /v1/books
Cerință: Scrie specificația cu page, limit, filtrare după autor, sortare după an. Include limite maxime.

Soluție (specificație completă)
EndpointGET /v1/books

Parametri
page — implicit 1, minim 1
limit — implicit 20, maxim 100
author — filtrare după numele autorului
sort — year_asc | year_desc

Exemplu de request
```GET /v1/books?page=2&limit=20&author=eminescu&sort=year_desc```

Exemplu de răspuns
```
{
  "data": [...],
  "meta": {
    "page": 2,
    "limit": 20,
    "total": 480,
    "request_id": "req_92ab1f"
  },
  "links": {
    "self": "/v1/books?page=2&limit=20&author=eminescu&sort=year_desc",
    "next": "/v1/books?page=3&limit=20&author=eminescu&sort=year_desc"
  }
}
```
