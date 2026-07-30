Ex2. Token Bucket cu Redis — endpoint de test
Cerință: Aplică algoritmul într-un endpoint și rulează 100 cereri.

-----

R => Implementare Token Bucket
```
// src/rateLimiter/tokenBucket.ts
import { redis } from "../redis";
import { ratePlans } from "../ratePlans";

export async function tokenBucket(apiKey: string, plan: keyof typeof ratePlans) {
  const { rpm, burst } = ratePlans[plan];
  const bucketKey = `bucket:${apiKey}`;
  const tokens = await redis.get(bucketKey);

  let currentTokens = tokens ? parseInt(tokens) : burst;

  if (currentTokens > 0) {
    currentTokens -= 1;

    await redis.set(bucketKey, currentTokens, { EX: 60 });
    return { allowed: true, remaining: currentTokens };
  }

  return { allowed: false, remaining: 0 };
}
```
-----


R => Endpoint de test
```
// src/routes/testRate.ts
app.get("/test-rate", async (req, reply) => {
  const apiKey = req.headers["x-api-key"] as string;
  const plan = "FREE";
  const result = await tokenBucket(apiKey, plan);

  if (!result.allowed) {
    return reply.code(429).send({ error: "Rate limit exceeded" });
  }
  return reply.send({ ok: true, remaining: result.remaining });
});
```

-----


R => Test cu 100 cereri
```for i in {1..100}; do curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/test-rate; done```

Rezultat tipic pentru FREE:
primele ~10 cereri → 200
restul → 429