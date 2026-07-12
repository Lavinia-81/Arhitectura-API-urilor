// utils/apiKeys.ts
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// Generează o cheie cu prefix – ajută enorm la debugging
export function generateApiKey(): string {
  return 'poezii_' + crypto.randomBytes(24).toString('hex')
}
// Rezultat: poezii_a7f3e8c2b9d1f4e5a6b7c8d9e0f1a2b3c4d5e6f7

// Hash-uiește înainte de salvare (bcrypt este mai scump, dar mai sigur)
export async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 10)
}

// Verifică cheia
export async function verifyApiKey(key: string, hash: string): Promise<boolean> {
  return bcrypt.compare(key, hash)
}