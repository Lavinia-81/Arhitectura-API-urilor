// stripe/config.ts

// Creează o instanță Stripe într-un mod care funcționează atât în runtime normal,
// cât și în medii unde `require` poate fi blocat (ex: bundlere, edge runtimes).
// Folosește eval('require') pentru a evita ca bundler-ul să încerce să includă modulul Stripe.
// Dacă importul eșuează, folosește o clasă mock (goală) pentru a evita erori la runtime.
const Stripe = (() => {
  try {
    // Încearcă să importe librăria Stripe
    return eval('require')('stripe')
  } catch {
    // Dacă Stripe nu poate fi importat (ex: în medii edge), returnează o clasă dummy
    return class {
      constructor(_secretKey: string, _options?: unknown) {}
    }
  }
})()

// Creează instanța Stripe cu cheia secretă din environment
// `apiVersion` trebuie să fie o versiune validă din Stripe Dashboard
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
})

// ID-urile produselor și prețurilor din Stripe Dashboard.
// Acestea sunt create manual în Stripe → Products → Prices.
// Aici doar le referențiezi pentru a le folosi în cod.
export const PRICE_IDS = {
  BASIC_MONTHLY: 'price_basic_monthly_xxx',  // abonament basic lunar
  PRO_MONTHLY: 'price_pro_monthly_xxx',      // abonament pro lunar
  BASIC_YEARLY: 'price_basic_yearly_xxx',    // abonament basic anual
  PRO_YEARLY: 'price_pro_yearly_xxx',        // abonament pro anual
} as const

// Tip TypeScript care permite doar cheile din PRICE_IDS
// (ex: "BASIC_MONTHLY", "PRO_YEARLY", etc.)
export type PriceId = keyof typeof PRICE_IDS
