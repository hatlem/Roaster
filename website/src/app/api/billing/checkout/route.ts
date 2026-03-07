import { NextRequest, NextResponse } from "next/server"
import { getStripe, STRIPE_PRICE_IDS } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import { requireRole, errorResponse } from "@/lib/api-utils"
import { getServerLocale } from "@/i18n/server"
import { getDictionary } from "@/i18n/dictionaries"

// POST /api/billing/checkout - Create a Stripe Checkout session
export async function POST(request: NextRequest) {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {

    const session = await requireRole(["ADMIN"])

    const { plan } = await request.json()

    if (!plan || !["starter", "professional"].includes(plan)) {
      return errorResponse(dict.api.billing.invalidPlan)
    }

    const priceId = STRIPE_PRICE_IDS[plan]
    if (!priceId) {
      return errorResponse(dict.api.billing.priceNotConfigured)
    }

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return errorResponse(dict.api.billing.noOrgFoundOnboard)
    }

    const org = user.organization
    const stripe = getStripe()

    // Create or retrieve Stripe customer
    let customerId = org.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: org.contactEmail,
        name: org.name,
        metadata: {
          project: "roaster",
          organizationId: org.id,
        },
      })
      customerId = customer.id

      await prisma.organization.update({
        where: { id: org.id },
        data: { stripeCustomerId: customerId },
      })
    }

    // Build the Checkout session
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3846"

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      currency: "eur",
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        project: "roaster",
        plan,
        organizationId: org.id,
      },
      subscription_data: {
        metadata: {
          project: "roaster",
          plan,
          organizationId: org.id,
        },
      },
      success_url: `${appUrl}/dashboard/settings?billing=success`,
      cancel_url: `${appUrl}/dashboard/settings?billing=cancelled`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      success: true,
      data: { url: checkoutSession.url },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401)
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.billing.onlyAdminsBilling, 403)
    }
    console.error("[billing/checkout] Error:", error)
    return errorResponse(dict.api.billing.failedCreateCheckout, 500)
  }
}
