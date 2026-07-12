// stripe/config.ts
const Stripe = (() => {
  try {
    return eval('require')('stripe')
  } catch {
    return class {
      constructor(_secretKey: string, _options?: unknown) {}
    }
  }
})()

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// ID-urile produselor și prețurilor (le creezi în Stripe Dashboard)
export const PRICE_IDS = {
  BASIC_MONTHLY: 'price_basic_monthly_xxx',
  PRO_MONTHLY: 'price_pro_monthly_xxx',
  BASIC_YEARLY: 'price_basic_yearly_xxx',
  PRO_YEARLY: 'price_pro_yearly_xxx',
} as const

export type PriceId = keyof typeof PRICE_IDS