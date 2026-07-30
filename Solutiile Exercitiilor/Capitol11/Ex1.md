Ex1. Creează structura planurilor pentru API-ul tău
Cerință: Definește limitele de request-uri și rate limit pentru Free, Basic, Pro.

-----

R => Fișier: src/billing/plans.ts
```
export const Plans = {
  FREE: {
    name: "FREE",
    rpm: 60,
    burst: 10,
    daily: 2000,
    monthly: 30000,
    price: 0
  },
  BASIC: {
    name: "BASIC",
    rpm: 300,
    burst: 50,
    daily: 10000,
    monthly: 300000,
    price: 9.99
  },
  PRO: {
    name: "PRO",
    rpm: 1000,
    burst: 200,
    daily: 50000,
    monthly: 1500000,
    price: 49.99
  }
};
```

Explicație:
-> planurile sunt structurate clar
-> limitele sunt coerente cu capitolele 7–9
-> pot fi folosite direct în rate limiting, billing, usage tracking