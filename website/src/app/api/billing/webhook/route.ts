import { NextRequest, NextResponse } from "next/server"
import { getStripe, planFromPriceId } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import { exitOnboardingSequenceAsync } from "@/lib/services/email-onboarding"
import Stripe from "stripe"
import { getServerLocale } from "@/i18n/server"
import { getDictionary } from "@/i18n/dictionaries"

// Disable body parsing -- Stripe needs the raw body for signature verification
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  const stripe = getStripe()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("[billing/webhook] STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: dict.api.billing.webhookSecretNotConfigured }, { status: 500 })
  }

  // Read the raw body for signature verification
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: dict.api.billing.missingStripeSignature }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("[billing/webhook] Signature verification failed:", message)
    return NextResponse.json({ error: dict.api.billing.invalidSignature }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break
      }
      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      }
      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      }
      default: {
        // Unhandled event type - that's fine, just acknowledge
        console.log(`[billing/webhook] Unhandled event type: ${event.type}`)
      }
    }
  } catch (error) {
    console.error(`[billing/webhook] Error handling ${event.type}:`, error)
    // Return 200 anyway to prevent Stripe retries for app-level errors
    return NextResponse.json({ received: true, error: dict.api.billing.handlerFailed }, { status: 200 })
  }

  return NextResponse.json({ received: true })
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const organizationId = session.metadata?.organizationId
  const plan = session.metadata?.plan
  const subscriptionId = session.subscription as string | null

  if (!organizationId) {
    console.error("[billing/webhook] checkout.session.completed missing organizationId in metadata")
    return
  }

  console.log(`[billing/webhook] Checkout completed: org=${organizationId} plan=${plan}`)

  // Fetch subscription details for status
  let subscriptionStatus = "active"
  if (subscriptionId) {
    const stripe = getStripe()
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    subscriptionStatus = subscription.status
  }

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscriptionPlan: plan || "starter",
      subscriptionStatus,
      stripeSubscriptionId: subscriptionId,
      stripeCustomerId: session.customer as string,
    },
  })

  // Exit onboarding email sequence when user subscribes
  const customerEmail = session.customer_details?.email || session.customer_email
  if (customerEmail) {
    exitOnboardingSequenceAsync(customerEmail, "subscribed")
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const organizationId = subscription.metadata?.organizationId

  if (!organizationId) {
    // Try to find org by Stripe customer ID
    const org = await prisma.organization.findFirst({
      where: { stripeCustomerId: subscription.customer as string },
    })
    if (!org) {
      console.error("[billing/webhook] subscription.updated: cannot find organization")
      return
    }
    return updateOrgSubscription(org.id, subscription)
  }

  await updateOrgSubscription(organizationId, subscription)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  const org = await prisma.organization.findFirst({
    where: { stripeCustomerId: customerId },
  })

  if (!org) {
    console.error("[billing/webhook] subscription.deleted: cannot find organization for customer", customerId)
    return
  }

  console.log(`[billing/webhook] Subscription deleted: org=${org.id}`)

  await prisma.organization.update({
    where: { id: org.id },
    data: {
      subscriptionPlan: "free",
      subscriptionStatus: "canceled",
      stripeSubscriptionId: null,
    },
  })
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function updateOrgSubscription(organizationId: string, subscription: Stripe.Subscription) {
  // Determine plan from the first subscription item's price
  const priceId = subscription.items.data[0]?.price?.id
  const plan = priceId ? planFromPriceId(priceId) : null

  console.log(`[billing/webhook] Subscription updated: org=${organizationId} status=${subscription.status} plan=${plan}`)

  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      ...(plan ? { subscriptionPlan: plan } : {}),
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
    },
  })
}
