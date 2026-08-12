Ex3. Watermark _trace derivat din API Key

-----

Câmp _trace în răspunsurile /v1/works
Idee: hash simplu din API key, fără a o expune direct.
```
// src/utils/trace.ts
import crypto from "crypto";
export function buildTrace(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex")
    .slice(0, 12); // scurt, dar unic
}
```
-----

```
// src/controllers/works.controller.ts
import { buildTrace } from "../utils/trace";

export async function getWorksController(req, reply) {
  const apiKey = req.headers["x-api-key"] as string;
  const works = await WorksService.getWorks({});

  return reply.send({
    data: works,
    _trace: apiKey ? buildTrace(apiKey) : null
  });
}
```
-----

- fiecare utilizator cu altă cheie API -> alt _trace
- watermark discret, dar util pentru tracking.