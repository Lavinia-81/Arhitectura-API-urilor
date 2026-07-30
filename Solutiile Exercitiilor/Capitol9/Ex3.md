Ex3. Criptează un câmp — encryptField / decryptField

-----

Criptăm apiKey înainte de salvare.

R => Cheie de criptare
```ENCRYPTION_KEY="32bytessecretkey32bytessecretkey"```

-----

R => Funcții de criptare
```
// src/security/crypto.ts
import crypto from "crypto";

const key = Buffer.from(process.env.ENCRYPTION_KEY!, "utf8");
const ivLength = 16;

export function encryptField(value: string): string {
  const iv = crypto.randomBytes(ivLength);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptField(value: string): string {
  const [ivHex, encryptedHex] = value.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
```
-----

R => Salvare criptată în DB:
```
await prisma.apiKey.create({
  data: {
    userId,
    apiKey: encryptField(apiKey)
  }
});
```
-----

R => Verificare în DB:
```
SELECT apiKey FROM apiKey;
Rezultat: hex string criptat, nu cheia reală.
```
-----