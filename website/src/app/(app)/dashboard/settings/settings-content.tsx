"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BillingSection } from "@/components/billing/BillingSection"
import type { Dictionary } from "@/i18n/dictionaries"

type Tab = "organization" | "compliance" | "notifications" | "integrations" | "billing"

interface OrgInfo {
  name: string
  orgNumber: string
  contactEmail: string
  address: string
  maxDailyHours: number
  maxWeeklyHours: number
  minDailyRest: number
  minWeeklyRest: number
  publishDeadline: number
  overtimePremium: number
}

interface BillingInfo {
  plan: string | null
  status: string | null
  hasStripeCustomer: boolean
}

export function SettingsContent({
  orgInfo,
  billingInfo,
  dictionary,
}: {
  orgInfo: OrgInfo
  billingInfo: BillingInfo
  dictionary: Dictionary
}) {
  const searchParams = useSearchParams()
  const d = dictionary.dashboard.settings
  const [activeTab, setActiveTab] = useState<Tab>("organization")

  const TABS: { id: Tab; label: string }[] = [
    { id: "organization", label: d.organization },
    { id: "compliance", label: d.complianceRules },
    { id: "notifications", label: d.notifications },
    { id: "integrations", label: d.integrations },
    { id: "billing", label: d.billing },
  ]

  // Switch to billing tab if redirected from Stripe
  useEffect(() => {
    const billingParam = searchParams.get("billing")
    if (billingParam === "success" || billingParam === "cancelled") {
      setActiveTab("billing")
    }
  }, [searchParams])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{d.title}</h1>
        <p className="text-ink/60">{d.subtitle}</p>

        {/* Success/cancel banners from Stripe redirect */}
        {searchParams.get("billing") === "success" && (
          <div className="mt-4 bg-forest/10 text-forest p-4 rounded-xl text-sm flex items-center gap-3">
            <i className="fas fa-check-circle" />
            <span>{d.subscriptionSuccess}</span>
          </div>
        )}
        {searchParams.get("billing") === "cancelled" && (
          <div className="mt-4 bg-gold/10 text-gold p-4 rounded-xl text-sm flex items-center gap-3">
            <i className="fas fa-info-circle" />
            <span>{d.checkoutCancelled}</span>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Sidebar Navigation */}
        <div className="space-y-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-ocean/10 text-ocean"
                  : "hover:bg-cream text-ink/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2">
          {activeTab === "organization" && (
            <OrganizationTab orgInfo={orgInfo} dictionary={d} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab orgInfo={orgInfo} dictionary={d} />
          )}
          {activeTab === "notifications" && (
            <PlaceholderTab
              title={d.notifications}
              description={d.notificationsComingSoon}
            />
          )}
          {activeTab === "integrations" && (
            <PlaceholderTab
              title={d.integrations}
              description={d.integrationsComingSoon}
            />
          )}
          {activeTab === "billing" && (
            <BillingSection billing={billingInfo} dictionary={dictionary.dashboard.components.billing} />
          )}
        </div>
      </div>
    </div>
  )
}

function OrganizationTab({ orgInfo, dictionary: d }: { orgInfo: OrgInfo; dictionary: Dictionary["dashboard"]["settings"] }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-6">{d.organizationDetails}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.organizationName}</label>
            <input
              type="text"
              defaultValue={orgInfo.name}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.organizationNumber}</label>
            <input
              type="text"
              defaultValue={orgInfo.orgNumber}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.contactEmail}</label>
            <input
              type="email"
              defaultValue={orgInfo.contactEmail}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.address}</label>
            <input
              type="text"
              defaultValue={orgInfo.address}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors">
          {d.cancel}
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors">
          {d.saveChanges}
        </button>
      </div>
    </>
  )
}

function ComplianceTab({ orgInfo, dictionary: d }: { orgInfo: OrgInfo; dictionary: Dictionary["dashboard"]["settings"] }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-6">{d.laborLawSettings}</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{d.maxDailyHours}</label>
            <input
              type="number"
              defaultValue={orgInfo.maxDailyHours}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.maxWeeklyHours}</label>
            <input
              type="number"
              defaultValue={orgInfo.maxWeeklyHours}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.minDailyRest}</label>
            <input
              type="number"
              defaultValue={orgInfo.minDailyRest}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.minWeeklyRest}</label>
            <input
              type="number"
              defaultValue={orgInfo.minWeeklyRest}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.publishDeadline}</label>
            <input
              type="number"
              defaultValue={orgInfo.publishDeadline}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">{d.overtimePremium}</label>
            <input
              type="number"
              defaultValue={orgInfo.overtimePremium}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-colors">
          {d.cancel}
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors">
          {d.saveChanges}
        </button>
      </div>
    </>
  )
}

function PlaceholderTab({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-stone/50">
      <h2 className="font-display text-xl mb-4">{title}</h2>
      <p className="text-ink/60">{description}</p>
    </div>
  )
}
