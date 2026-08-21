// utils/encryption.ts

import crypto from 'crypto'

// Cheia de criptare AES-256 trebuie să aibă EXACT 32 bytes.
// Este citită din env ca hex → Buffer de 32 bytes.
const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENC_KEY!, 'hex') // 32 bytes

/**
 * Criptează un câmp text folosind AES-256-GCM.
 * Returnează un string în format:
 * 
 *    iv.authTag.ciphertext
 * 
 * Toate în Base64.
 */
export function encryptField(plaintext: string): string {
  // IV (nonce) de 12 bytes — recomandat pentru GCM
  const iv = crypto.randomBytes(12)

  // Inițializăm cipher-ul AES-256-GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  
  // Criptăm textul în Base64
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  // AuthTag — protejează integritatea datelor
  const authTag = cipher.getAuthTag().toString('base64')
  
  // Returnăm totul concatenat
  return `${iv.toString('base64')}.${authTag}.${encrypted}`
}

/**
 * Decriptează un câmp criptat cu encryptField().
 * Acceptă formatul:
 * 
 *    iv.authTag.ciphertext
 */
export function decryptField(blob: string): string {
  // Separăm componentele
  const [ivB64, authTagB64, encrypted] = blob.split('.')

  // Convertim din Base64 în Buffer
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  
  // Inițializăm decipher-ul AES-256-GCM
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)

  // Setăm AuthTag-ul pentru verificarea integrității
  decipher.setAuthTag(authTag)
  
  // Decriptăm textul
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
