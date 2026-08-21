// middlewares/planCheck.ts

import { FastifyRequest, FastifyReply } from 'fastify'

// Ierarhia planurilor — fiecare plan are un nivel numeric.
// Planurile superioare au acces la toate endpointurile planurilor inferioare.
const planHierarchy: Record<string, number> = {
  FREE: 0,        // cel mai restrictiv
  BASIC: 1,
  PRO: 2,
  ENTERPRISE: 3,  // cel mai permisiv
}

// Middleware generator — primește un plan minim necesar
// și întoarce un middleware care verifică dacă utilizatorul are acel plan.
export function requirePlan(minimumPlan: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Planul utilizatorului (extras din auth middleware)
    const userPlan = (request as any).user?.plan || 'FREE'
    
    // Dacă nivelul planului utilizatorului >= nivelul planului minim → acces permis
    if (planHierarchy[userPlan] >= planHierarchy[minimumPlan]) {
      return // continuă către handler-ul rutei
    }
    
    // Dacă nu are plan suficient → acces interzis
    return reply.status(403).send({
      error: {
        code: 'PLAN_UPGRADE_REQUIRED',
        message: `This endpoint requires a ${minimumPlan} plan or higher. Your current plan: ${userPlan}`,
        current_plan: userPlan,
        required_plan: minimumPlan,
        upgrade_url: 'https://poezii.ro/pricing', // link pentru upgrade
        request_id: request.id,                   // ID-ul requestului pentru debugging
      },
    })
  }
}

// Exemplu de utilizare în rute:
//
// app.get('/v1/poems/:id/fulltext', {
//   preHandler: [authenticate, requirePlan('PRO')],
// }, poemController.getFulltext)
//
// → doar utilizatorii cu plan PRO sau ENTERPRISE pot accesa acest endpoint
