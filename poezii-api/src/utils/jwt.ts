// utils/jwt.ts

// Type definitions for 'jsonwebtoken' may be missing in this project.
// Silence the TS error here; install @types/jsonwebtoken for proper typings.
// @ts-ignore
import jwt from 'jsonwebtoken'

// Cheia secretă folosită pentru semnarea JWT-urilor.
// Trebuie să fie lungă, random și stocată DOAR în variabile de mediu.
const JWT_SECRET = process.env.JWT_SECRET!

/**
 * Generează un token JWT pentru un utilizator.
 *
 * Payload-ul include:
 *   - userId: ID-ul utilizatorului
 *   - scope: lista de permisiuni (ex: ['read:poems', 'admin:authors'])
 *
 * Tokenul expiră în 30 de minute → foarte important pentru securitate.
 */
export function generateToken(userId: string, scope: string[]): string {
  return jwt.sign(
    { userId, scope },   // payload
    JWT_SECRET,          // secretul de semnare
    { expiresIn: '30m' } // expirare scurtă – recomandat pentru API tokens
  )
}

/**
 * Verifică și decodează un token JWT.
 *
 * Dacă tokenul este invalid sau expirat, jwt.verify aruncă eroare.
 * Returnează payload-ul original:
 *   { userId: string, scope: string[] }
 */
export function verifyToken(token: string): { userId: string; scope: string[] } {
  return jwt.verify(token, JWT_SECRET) as any
}
