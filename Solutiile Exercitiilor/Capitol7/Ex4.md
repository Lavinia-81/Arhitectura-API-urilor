Ex4. Test de concurență — 100 cereri simultane
Cerință: Exact limita respectată (ex.: 60 permise, 40 respinse).

-----

Script concurență (bash)
```seq 100 | xargs -n1 -P100 curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/test-rate```

-----

Rezultat tipic pentru FREE
```
10 cereri → 200
90 cereri → 429
```

-----

Rezultat tipic pentru BASIC
```
50 cereri → 200
50 cereri → 429
```