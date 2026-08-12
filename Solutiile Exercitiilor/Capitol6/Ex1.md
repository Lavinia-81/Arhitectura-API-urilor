Ex1. Deploy pe Render — primul deploy în cloud

-----

Pași recomandați

1️. Creezi cont pe Render
```https://render.com```

-----

2️. Conectezi contul la GitHub
```
mergi la Dashboard -> New Web Service
alegi repository-ul tău
selectezi branch-ul (ideal main sau deploy)
```
-----

3️. Configurezi serviciul
```
Environment: Node
Build Command: npm install
Start Command: npm run start
sau
node dist/index.js
```
-----

4️. Deploy automat

Render va:
instala dependințele
construi proiectul
porni serverul

-----

5️. Verifici endpoint-ul de health
```
curl https://<numele-tau>.onrender.com/health
Răspuns:  { "status": "ok" }
```
Dacă vezi asta -> API-ul tău rulează în cloud.