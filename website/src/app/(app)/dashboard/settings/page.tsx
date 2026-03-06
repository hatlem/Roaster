import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { redirect } from "next/navigation"
import { SettingsContent } from "./settings-content"
import { getServerLocale } from "@/i18n/server"
import { getDictionary } from "@/i18n/dictionaries"

export async function generateMetadata() {
  const locale = await getServerLocale()
  const dict = getDictionary(locale)
  return { title: dict.dashboard.settings.title }
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const locale = await getServerLocale()
  const dict = getDictionary(locale)

  // Fetch organization with billing info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          orgNumber: true,
          contactEmail: true,
          address: true,
          maxDailyHours: true,
          maxWeeklyHours: true,
          minDailyRest: true,
          minWeeklyRest: true,
          publishDeadline: true,
          overtimePremium: true,
          subscriptionPlan: true,
          subscriptionStatus: true,
          stripeCustomerId: true,
        },
      },
    },
  })

  const org = user?.organization

  const billingInfo = {
    plan: org?.subscriptionPlan || "free",
    status: org?.subscriptionStatus || null,
    hasStripeCustomer: !!org?.stripeCustomerId,
  }

  const orgInfo = {
    name: org?.name || "",
    orgNumber: org?.orgNumber || "",
    contactEmail: org?.contactEmail || "",
    address: org?.address || "",
    maxDailyHours: org?.maxDailyHours ?? 9,
    maxWeeklyHours: org?.maxWeeklyHours ?? 40,
    minDailyRest: org?.minDailyRest ?? 11,
    minWeeklyRest: org?.minWeeklyRest ?? 35,
    publishDeadline: org?.publishDeadline ?? 14,
    overtimePremium: org?.overtimePremium ? Number(org.overtimePremium) * 100 - 100 : 40,
  }

  return <SettingsContent orgInfo={orgInfo} billingInfo={billingInfo} dictionary={dict} />
}
