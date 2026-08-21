// utils/apiKeys.ts

import crypto from 'crypto'
import bcrypt from 'bcryptjs'

/**
 * Generează o cheie API random, cu prefix.
 *
 * Prefixul "poezii_" este extrem de util:
 *  - identifici rapid cheile generate de sistemul tău
 *  - poți filtra logurile mai ușor
 *  - eviți confuzia cu alte token-uri (JWT, HMAC etc.)
 *
 * Cheia finală are ~56 caractere → suficient de lungă pentru a fi imposibil de ghicit.
 */
export function generateApiKey(): string {
  return 'poezii_' + crypto.randomBytes(24).toString('hex')
  // Exemplu: poezii_a7f3e8c2b9d1f4e5a6b7c8d9e0f1a2b3c4d5e6f7
}

/**
 * Hash-uiește cheia API înainte de salvare.
 *
 * De ce bcrypt?
 *  - este lent → protejează împotriva brute-force
 *  - este standard pentru parole și token-uri sensibile
 *  - chiar dacă baza de date este compromisă, cheile API rămân protejate
 *
 * Costul 10 este un echilibru bun între securitate și performanță.
 */
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

/**
 * Verifică dacă o cheie API furnizată de client corespunde hash-ului din DB.
 *
 * bcrypt.compare:
 *  - previne timing attacks
 *  - este sigur pentru token-uri lungi
 */
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}
