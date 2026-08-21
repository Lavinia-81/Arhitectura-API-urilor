// src/config/rate.Limiter.ts
// Configurația limitelor de rată (rate limits) pentru diferite planuri de utilizatori

// Tipurile de planuri disponibile
type Plan = 'FREE' | 'PRO' | 'ENTERPRISE'

// Limitele de rată pentru fiecare plan.
// Aceste valori sunt folosite de funcția getEffectiveLimits.
export const PLAN_LIMITS = {
  FREE: {
    rpm: 10,        // requests per minute (limita de bază)
    burst: 20,      // capacitate de "burst" — spike temporar permis
    daily: 50 * 6 * 4,          // aproximare pentru limita zilnică
    monthly: 50 * 6 * 4 * 3,    // aproximare pentru limita lunară
  },
  PRO: {
    rpm: 20,        // PRO are limite mai mari
    burst: 500,     // burst foarte mare pentru utilizatori PRO
    daily: 30 * 6 * 4,
    monthly: 500 * 6 * 4 * 3,
  },
  ENTERPRISE: {
    rpm: 30,        // cel mai mare throughput
    burst: 50,      // burst moderat
    daily: 100 * 6 * 4,
    monthly: 1000 * 6 * 4 * 3,
  },
} as const

// Limite specifice pe endpoint (opțional)
// multiplier reduce limitele pentru endpoint-uri costisitoare
const ENDPOINT_LIMITS: Record<string, { multiplier: number }> = {}

// Calculează limitele efective pentru un plan + endpoint
export function getEffectiveLimits(plan: Plan, endpoint: string) {
  // Obține limitele planului
  const planLimits = PLAN_LIMITS[plan]

  // Dacă endpoint-ul are un multiplier, îl aplică; altfel folosește 1.0 (fără modificare)
  const endpointMultiplier = ENDPOINT_LIMITS[endpoint]?.multiplier || 1.0
  
  // Returnează limitele ajustate
  return {
    rpm: Math.floor(planLimits.rpm / endpointMultiplier),       // limite RPM ajustate
    burst: Math.floor(planLimits.burst / endpointMultiplier),   // burst ajustat
    daily: planLimits.daily,                                    // limite zilnice
    monthly: planLimits.monthly,                                // limite lunare
  }
}
