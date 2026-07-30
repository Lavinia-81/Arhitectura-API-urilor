Ex3 — Cache cu Redis

------

R1. Instalare Redis client
```npm install redis```

-----

R2. Conectare Redis
```
import { createClient } from "redis";

export const redis = createClient();
redis.connect();
```
-----


R3. Funcția getCachedOrFetch
```
export async function getCachedOrFetch(key: string, fetchFunction: () => Promise<any>) {
  const cached = await redis.get(key);

  if (cached) {
    return JSON.parse(cached);
  }
  const result = await fetchFunction();
  await redis.set(key, JSON.stringify(result), { EX: 60 });
  return result;
}
```
-----


R4. Test cu simulare lentă
```
async function slowFetch() {
  await new Promise(r => setTimeout(r, 1000));
  return { value: "data from slow fetch" };
}

(async () => {
  console.time("first");
  console.log(await getCachedOrFetch("test", slowFetch));
  console.timeEnd("first");
  console.time("second");
  console.log(await getCachedOrFetch("test", slowFetch));
  console.timeEnd("second");
})();
```
-----

Rezultat:
-> prima execuție: ~1000ms
-> a doua execuție: ~1ms (din cache)