Ex5. Simulează un incident real

-----

Scenariu: baza de date pică

1️. Oprești PostgreSQL  Local:
```
sudo systemctl stop postgresql
Cloud (Neon / Render / Railway): Stop DB Instance
```
-----

2️. Verifici comportamentul API-ului
Exemplu:
```curl http://localhost:3000/works```

Răspuns tipic:
```
{
  "error": {
    "code": "ERR_DB_CONNECTION",
    "message": "Nu se poate conecta la baza de date.",
    "request_id": "req_123"
  }
}
```
-----

3️. Analizezi logurile
Fastify + Pino:
```[error] DB connection failed: ECONNREFUSED```

-----

4️. Repornești baza de date
```sudo systemctl start postgresql```

-----

5️. Verifici dacă API-ul își revine
```curl http://localhost:3000/works```

Dacă răspunde normal → sistemul tău se autoreface corect.
