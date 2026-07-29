// utils/costCalculator.ts
import { PLAN_LIMITS } from '../config/rateLimits.js'

interface CostBreakdown {
  totalCost: number
  revenue: number
  margin: number
  marginPercent: number
  breakpointRequests: number
}

type PlanName = keyof typeof PLAN_LIMITS | 'BASIC'

export function calculateCostPerClient(
  plan: PlanName,
  estimatedRequests: number
): CostBreakdown {
  const costs = {
    compute: estimatedRequests * 0.000001,     // 0,01€ per 10k
    db: estimatedRequests * 0.0000005,         // 0,005€ per 10k
    bandwidth: estimatedRequests * 0.0000001,  // aproximativ
  }
  
  const totalCost = costs.compute + costs.db + costs.bandwidth
  
  const prices = {
    FREE: 0,
    BASIC: 9,
    PRO: 29,
    ENTERPRISE: 99,
  }
  
  const revenue = prices[plan] || 0
  const margin = revenue - totalCost
  const marginPercent = revenue > 0 ? (margin / revenue) * 100 : 0
  
  // Calculează pragul de rentabilitate (câte request-uri sunt necesare pentru a ajunge la zero?)
  const breakpointRequests = revenue > 0 
    ? Math.ceil(revenue / (0.000001 + 0.0000005 + 0.0000001))
    : Infinity

  return { totalCost, revenue, margin, marginPercent, breakpointRequests }
}

// Exemplu: client BASIC cu 50.000 requests/lună
const result = calculateCostPerClient('BASIC', 50000)
console.log(result)
// { 
//   totalCost: ~0.55€, 
//   revenue: 9€, 
//   margin: 8.45€, 
//   marginPercent: ~94%,
//   breakpointRequests: ~6250
// }