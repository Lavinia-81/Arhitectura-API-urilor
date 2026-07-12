// utils/jwt.ts
// Type definitions for 'jsonwebtoken' may be missing in this project.
// Silence the TS error here; install @types/jsonwebtoken for proper typings.
// @ts-ignore
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!

export function generateToken(userId: string, scope: string[]): string {
  return jwt.sign(
    { userId, scope },
    JWT_SECRET,
    { expiresIn: '30m' }  // expirare scurtă – nu zile, nu luni
  )
}

export function verifyToken(token: string): { userId: string; scope: string[] } {
  return jwt.verify(token, JWT_SECRET) as any
}