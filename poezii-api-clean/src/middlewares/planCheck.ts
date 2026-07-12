// middlewares/planCheck.ts
import { FastifyRequest, FastifyReply } from 'fastify'

const planHierarchy: Record<string, number> = {
  FREE: 0,
  BASIC: 1,
  PRO: 2,
  ENTERPRISE: 3,
}

export function requirePlan(minimumPlan: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const userPlan = (request as any).user?.plan || 'FREE'
    
    if (planHierarchy[userPlan] >= planHierarchy[minimumPlan]) {
      return // Continue to the route handler
    }
    
    return reply.status(403).send({
      error: {
        code: 'PLAN_UPGRADE_REQUIRED',
        message: `This endpoint requires a ${minimumPlan} plan or higher. Your current plan: ${userPlan}`,
        current_plan: userPlan,
        required_plan: minimumPlan,
        upgrade_url: 'https://poezii.ro/pricing',
        request_id: request.id,
      },
    })
  }
}

// Example usage in routes:
// app.get('/v1/poems/:id/fulltext', {
//   preHandler: [authenticate, requirePlan('PRO')],
// }, poemController.getFulltext)