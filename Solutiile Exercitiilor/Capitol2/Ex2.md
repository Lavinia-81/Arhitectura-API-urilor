Ex2. Structura răspunsului — GET /v1/books/{id}
Cerință: Include data, meta (cu request_id), links.

Soluție JSON (structură editorială, matură)
```
{
  "data": {
    "id": "bk_1029",
    "title": "Ion",
    "author": "Liviu Rebreanu",
    "year": 1920
  },
  "meta": {
    "request_id": "req_8f92c1a7"
  },
  "links": {
    "self": "/v1/books/bk_1029",
    "author": "/v1/authors/liviu-rebreanu"
  }
}
```

Explicație
data = payload-ul principal.
meta = contextul requestului.
links = navigare HATEOAS minimală.