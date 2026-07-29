// src/config/endpointLimits.ts
import { PLAN_LIMITS } from './rateLimits.js'


export const ENDPOINT_LIMITS = {
  // Endpoint-uri ușoare
  '/v1/poems': { multiplier: 1.0 },
  '/v1/authors': { multiplier: 1.0 },
  
  // Endpoint-uri moderate
  '/v1/poems/:id': { multiplier: 1.5 },
  
  // Endpoint-uri grele (scumpe)
  '/v1/search': { multiplier: 3.0 },
  '/v1/poems/:id/fulltext': { multiplier: 5.0 },
  
  // Endpoint-uri administrative
  '/v1/admin/poems': { multiplier: 10.0 },
} as const

export type Plan = keyof typeof PLAN_LIMITS

