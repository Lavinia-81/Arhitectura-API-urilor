Ex1. Resurse vs acțiuni — API de bibliotecă
Cerință: Scrie 5 endpoint-uri pentru un API de bibliotecă (cărți, autori, împrumuturi). Asigură-te că sunt resurse, nu acțiuni.

Soluție (RESTful, corect modelate ca resurse)
GET    /v1/books
POST   /v1/books
GET    /v1/books/{id}
GET    /v1/authors
GET    /v1/loans


Explicație:
- Nu folosim /borrowBook, /addAuthor, /getBooks.
- Totul este resursă: books, authors, loans.
- Verbele sunt în HTTP, nu în URL.