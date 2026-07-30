Ex1. HMAC implementation — POST /v1/import

-----

Endpoint cu semnătură HMAC și timestamp
Presupunem:
```
header X-Signature → HMAC
header X-Timestamp → UNIX timestamp (secunde)
secret comun: IMPORT_SECRET
```

```
// src/security/hmac.ts
import crypto from "crypto";
const IMPORT_SECRET = process.env.IMPORT_SECRET!;
export function isValidHmac(body: string, signature: string, timestamp: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > 120) {
    return false; // mai vechi de 2 minute
  }

  const payload = `${timestamp}.${body}`;
  const expected = crypto
    .createHmac("sha256", IMPORT_SECRET)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
```
-----

```
// src/controllers/import.controller.ts
import { isValidHmac } from "../security/hmac";

export async function importController(req, reply) {
  const signature = req.headers["x-signature"] as string;
  const timestampHeader = req.headers["x-timestamp"] as string;

  if (!signature || !timestampHeader) {
    return reply.code(401).send({ error: "Missing HMAC headers" });
  }
  const timestamp = parseInt(timestampHeader, 10);
  const rawBody = JSON.stringify(req.body);

  if (!isValidHmac(rawBody, signature, timestamp)) {
    return reply.code(401).send({ error: "Invalid HMAC or timestamp" });
  }

  // procesare import
  return reply.code(202).send({ status: "accepted" });
}
```