"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { BillingSection } from "@/components/billing/BillingSection"

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

const TABS: { id: Tab; label: string }[] = [
  { id: "organization", label: "Organization" },
  { id: "compliance", label: "Compliance Rules" },
  { id: "notifications", label: "Notifications" },
  { id: "integrations", label: "Integrations" },
  { id: "billing", label: "Billing" },
]

export function SettingsContent({
  orgInfo,
  billingInfo,
}: {
  orgInfo: OrgInfo
  billingInfo: BillingInfo
}) {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<Tab>("organization")

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
        <h1 className="font-display text-4xl mb-2">Settings</h1>
        <p className="text-ink/60">Configure your organization and compliance settings</p>

        {/* Success/cancel banners from Stripe redirect */}
        {searchParams.get("billing") === "success" && (
          <div className="mt-4 bg-forest/10 text-forest p-4 rounded-xl text-sm flex items-center gap-3">
            <i className="fas fa-check-circle" />
            <span>Subscription activated successfully! Your plan has been updated.</span>
          </div>
        )}
        {searchParams.get("billing") === "cancelled" && (
          <div className="mt-4 bg-gold/10 text-gold p-4 rounded-xl text-sm flex items-center gap-3">
            <i className="fas fa-info-circle" />
            <span>Checkout was cancelled. No changes were made to your subscription.</span>
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
            <OrganizationTab orgInfo={orgInfo} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab orgInfo={orgInfo} />
          )}
          {activeTab === "notifications" && (
            <PlaceholderTab
              title="Notifications"
              description="Notification settings are coming soon."
            />
          )}
          {activeTab === "integrations" && (
            <PlaceholderTab
              title="Integrations"
              description="Integration settings are coming soon."
            />
          )}
          {activeTab === "billing" && (
            <BillingSection billing={billingInfo} />
          )}
        </div>
      </div>
    </div>
  )
}

function OrganizationTab({ orgInfo }: { orgInfo: OrgInfo }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-6">Organization Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Organization Name</label>
            <input
              type="text"
              defaultValue={orgInfo.name}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Organization Number</label>
            <input
              type="text"
              defaultValue={orgInfo.orgNumber}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Contact Email</label>
            <input
              type="email"
              defaultValue={orgInfo.contactEmail}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Address</label>
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
          Cancel
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors">
          Save Changes
        </button>
      </div>
    </>
  )
}

function ComplianceTab({ orgInfo }: { orgInfo: OrgInfo }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <h2 className="font-display text-xl mb-6">Labor Law Compliance Settings</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Max Daily Hours</label>
            <input
              type="number"
              defaultValue={orgInfo.maxDailyHours}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Max Weekly Hours</label>
            <input
              type="number"
              defaultValue={orgInfo.maxWeeklyHours}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Min Daily Rest (hours)</label>
            <input
              type="number"
              defaultValue={orgInfo.minDailyRest}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Min Weekly Rest (hours)</label>
            <input
              type="number"
              defaultValue={orgInfo.minWeeklyRest}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Publish Deadline (days)</label>
            <input
              type="number"
              defaultValue={orgInfo.publishDeadline}
              className="w-full px-4 py-3 border border-stone/50 rounded-xl focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Overtime Premium (%)</label>
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
          Cancel
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-colors">
          Save Changes
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
