// // routes/billing.ts
// import { FastifyInstance } from 'fastify'
// import { stripe, PRICE_IDS } from '../stripe/config'
// import { prisma } from '../utils/prisma'
// import { authenticate } from '../middlewares/auth'
// import { requirePlan } from '../middlewares/planCheck'

// export async function billingRoutes(app: FastifyInstance) {
  
//   // 1. Creează un customer Stripe (după înregistrare)
//   app.post('/billing/create-customer', { preHandler: [authenticate] }, async (request, reply) => {
//     const userId = request.user!.id
//     const user = await prisma.user.findUnique({ where: { id: userId } })
    
//     if (!user) {
//       return reply.status(404).send({ error: 'User not found' })
//     }
    
//     const customer = await stripe.customers.create({
//       email: user.email,
//       metadata: { userId: String(userId) },
//     })
    
//     await prisma.user.update({
//       where: { id: userId },
//       data: { stripeCustomerId: customer.id },
//     })
    
//     return reply.send({ customerId: customer.id })
//   })
  
//   // 2. Creează checkout session pentru abonament
//   app.post('/billing/subscribe', { preHandler: [authenticate] }, async (request, reply) => {
//     const { priceId } = request.body as { priceId: PriceId }
//     const user = request.user!
    
//     const customerId = user.stripeCustomerId
//     if (!customerId) {
//       return reply.status(400).send({ error: 'No Stripe customer found. Call /billing/create-customer first.' })
//     }
    
//     const session = await stripe.checkout.sessions.create({
//       customer: customerId,
//       line_items: [{ price: PRICE_IDS[priceId], quantity: 1 }],
//       mode: 'subscription',
//       success_url: 'https://poezii.ro/dashboard?success=true',
//       cancel_url: 'https://poezii.ro/pricing?canceled=true',
//       metadata: { userId: String(user.id) },
//     })
    
//     return reply.send({ url: session.url })
//   })
  
//   // 3. Webhook – Stripe ne spune ce s-a întâmplat
//   app.post('/billing/webhook', async (request, reply) => {
//     const sig = request.headers['stripe-signature'] as string
//     let event: Stripe.Event
    
//     try {
//       event = stripe.webhooks.constructEvent(
//         request.body as any,
//         sig,
//         process.env.STRIPE_WEBHOOK_SECRET!
//       )
//     } catch (err) {
//       request.log.error({ error: err }, 'Webhook signature verification failed')
//       return reply.status(400).send(`Webhook Error: ${(err as Error).message}`)
//     }
    
//     // Procesează evenimentul
//     switch (event.type) {
//       case 'checkout.session.completed':
//         await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
//         break
        
//       case 'invoice.paid':
//         await handleInvoicePaid(event.data.object as Stripe.Invoice)
//         break
        
//       case 'invoice.payment_failed':
//         await handlePaymentFailed(event.data.object as Stripe.Invoice)
//         break
        
//       case 'customer.subscription.deleted':
//         await handleSubscriptionCancelled(event.data.object as Stripe.Subscription)
//         break
//     }
    
//     return reply.send({ received: true })
//   })
  
//   // 4. Obține facturile utilizatorului
//   app.get('/billing/invoices', { preHandler: [authenticate] }, async (request, reply) => {
//     const user = request.user!
    
//     if (!user.stripeCustomerId) {
//       return reply.send({ invoices: [] })
//     }
    
//     const invoices = await stripe.invoices.list({
//       customer: user.stripeCustomerId,
//       limit: 24,
//     })
    
//     return reply.send({ invoices: invoices.data })
//   })
  
//   // 5. Anulează abonamentul
//   app.post('/billing/cancel', { preHandler: [authenticate, requirePlan('BASIC')] }, async (request, reply) => {
//     const user = request.user!
    
//     if (!user.stripeSubscriptionId) {
//       return reply.status(400).send({ error: 'No active subscription' })
//     }
    
//     await stripe.subscriptions.update(user.stripeSubscriptionId, {
//       cancel_at_period_end: true,
//     })
    
//     return reply.send({ message: 'Subscription will be cancelled at the end of the billing period' })
//   })
// }

// // Funcții helper
// async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
//   const userId = session.metadata?.userId
//   if (!userId) return
  
//   const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
//   const priceId = subscription.items.data[0].price.id
//   let plan = 'BASIC'
  
//   if (priceId === PRICE_IDS.PRO_MONTHLY || priceId === PRICE_IDS.PRO_YEARLY) {
//     plan = 'PRO'
//   }
  
//   await prisma.user.update({
//     where: { id: parseInt(userId) },
//     data: {
//       plan,
//       stripeSubscriptionId: subscription.id,
//       subscriptionStatus: 'active',
//       subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
//     },
//   })
// }

// async function handleInvoicePaid(invoice: Stripe.Invoice) {
//   // Actualizează data ultimei facturi, trimite email, etc.
//   console.log(`Invoice ${invoice.id} paid`)
// }

// async function handlePaymentFailed(invoice: Stripe.Invoice) {
//   const subscriptionId = invoice.subscription as string
//   const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  
//   const user = await prisma.user.findFirst({
//     where: { stripeSubscriptionId: subscriptionId },
//   })
  
//   if (user) {
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { subscriptionStatus: 'past_due' },
//     })
    
//     // Trimite email de notificare
//     await sendPaymentFailedEmail(user.email)
//   }
// }

// async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
//   const user = await prisma.user.findFirst({
//     where: { stripeSubscriptionId: subscription.id },
//   })
  
//   if (user) {
//     await prisma.user.update({
//       where: { id: user.id },
//       data: { plan: 'FREE', subscriptionStatus: 'cancelled' },
//     })
//   }
// }

// async function sendPaymentFailedEmail(email: string) {
//   // Implementare cu Resend, SendGrid, etc.
//   console.log(`Sending payment failed email to ${email}`)
// }