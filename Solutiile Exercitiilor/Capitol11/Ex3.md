Ex3. Endpoint POST /billing/subscribe — Stripe Checkout
Cerință: Creează un checkout session Stripe.

-----

R => Instalare Stripe
```npm install stripe```
-----

R => Endpoint
```
// src/controllers/billing.controller.ts
import Stripe from "stripe";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function subscribeController(req, reply) {
  const { plan } = req.body;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [
      {
        price: process.env[`STRIPE_PRICE_${plan}`],
        quantity: 1
      }
    ],
    success_url: "https://yourapp.com/success",
    cancel_url: "https://yourapp.com/cancel"
  });
  return reply.send({ url: session.url });
}
```
-----

R => Test local
```
curl -X POST http://localhost:3000/billing/subscribe \
  -H "Content-Type: application/json" \
  -d '{"plan":"BASIC"}'```