// src/config/rate.Limiter.ts
// Rate limits configuration for different user plans

type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'

// Define plan limits in a shape expected by getEffectiveLimits
export const PLAN_LIMITS = {
  FREE: {
    rpm: 10,        // requests per minute
    burst: 20,      // burst capacity
    daily: 50 * 6 * 4,    // approximate daily allowance
    monthly: 50 * 6 * 4 * 3,
  },
  PRO: {
    rpm: 20,    burst: 500,
    daily: 30 * 6 * 4,
    monthly: 500 * 6 * 4 * 3,
  },
  ENTERPRISE: {
    rpm: 30,
    burst: 50,
    daily: 100 * 6 * 4,
    monthly: 1000 * 6 * 4 * 3,
  },
} as const

const ENDPOINT_LIMITS: Record<string, { multiplier: number }> = {}

export function getEffectiveLimits(plan: Plan, endpoint: string) {
  const planLimits = PLAN_LIMITS[plan]
  const endpointMultiplier = ENDPOINT_LIMITS[endpoint]?.multiplier || 1.0
  
  return {
    rpm: Math.floor(planLimits.rpm / endpointMultiplier),
    burst: Math.floor(planLimits.burst / endpointMultiplier),
    daily: planLimits.daily,
    monthly: planLimits.monthly,
  }
}