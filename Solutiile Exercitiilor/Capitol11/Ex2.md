Ex2. Identifică 3 endpoint-uri premium în API-ul cultural
Cerință: De ce sunt premium? Ce valoare aduc?
-----

R => Exemplu
```1. GET /v1/fulltext/search```
-> căutare full‑text în limba română
-> consum mare de CPU
-> valoare: căutare avansată pentru aplicații culturale, biblioteci, arhive

```2. GET /v1/works/{id}/analytics```
-> statistici despre lucrare (vizualizări, popularitate, trenduri)
-> valoare: insight-uri pentru editori, muzee, instituții culturale

```3. POST /v1/import```
-> import masiv de date culturale
-> protejat cu HMAC
-> valoare: integrare enterprise cu sisteme externe