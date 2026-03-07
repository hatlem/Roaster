import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { prisma } from "@/lib/db"
import { requireRole, errorResponse } from "@/lib/api-utils"
import { getServerLocale } from "@/i18n/server"
import { getDictionary } from "@/i18n/dictionaries"

// POST /api/billing/portal - Create a Stripe Customer Portal session
export async function POST() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  try {

    const session = await requireRole(["ADMIN"])

    // Get user with organization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })

    if (!user?.organization) {
      return errorResponse(dict.api.billing.noOrgFound, 400)
    }

    const org = user.organization

    if (!org.stripeCustomerId) {
      return errorResponse(dict.api.billing.noBillingAccount, 400)
    }

    const stripe = getStripe()
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3846"

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings`,
    })

    return NextResponse.json({
      success: true,
      data: { url: portalSession.url },
    })
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return errorResponse(dict.api.common.unauthorized, 401)
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return errorResponse(dict.api.billing.onlyAdminsBilling, 403)
    }
    console.error("[billing/portal] Error:", error)
    return errorResponse(dict.api.billing.failedCreatePortal, 500)
  }
}
