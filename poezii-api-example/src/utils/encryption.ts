// utils/encryption.ts
import crypto from 'crypto'

const ENCRYPTION_KEY = Buffer.from(process.env.FIELD_ENC_KEY!, 'hex') // 32 bytes

export function encryptField(plaintext: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  const authTag = cipher.getAuthTag().toString('base64')
  
  return `${iv.toString('base64')}.${authTag}.${encrypted}`
}

export function decryptField(blob: string): string {
  const [ivB64, authTagB64, encrypted] = blob.split('.')
  const iv = Buffer.from(ivB64, 'base64')
  const authTag = Buffer.from(authTagB64, 'base64')
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  decipher.setAuthTag(authTag)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}