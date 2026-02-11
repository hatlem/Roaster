import Stripe from "stripe"

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set")
  }
  return key
}

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(getStripeSecretKey())
  }
  return _stripe
}

/**
 * Stripe Price IDs for each plan.
 * Set these in your environment variables after creating products in the Stripe dashboard.
 */
export const STRIPE_PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL,
}

/**
 * Map a Stripe Price ID back to a plan name.
 */
export function planFromPriceId(priceId: string): string | null {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id === priceId) return plan
  }
  return null
}
