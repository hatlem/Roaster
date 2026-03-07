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

const TAB_ICONS: Record<Tab, string> = {
  organization: "fa-building",
  compliance: "fa-gavel",
  notifications: "fa-bell",
  integrations: "fa-plug",
  billing: "fa-credit-card",
}

// Norwegian labor law defaults for comparison
const NORWEGIAN_DEFAULTS: Record<string, number> = {
  maxDailyHours: 9,
  maxWeeklyHours: 40,
  minDailyRest: 11,
  minWeeklyRest: 35,
  publishDeadline: 14,
  overtimePremium: 40,
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
      {/* Warm Header */}
      <div className="mb-10 animate-fade-up">
        <div className="relative">
          <div className="absolute -top-4 -left-4 w-24 h-24 bg-terracotta/10 rounded-full blur-2xl" />
          <div className="relative">
            <div className="accent-line mb-4" />
            <h1 className="font-display text-4xl text-ink mb-2">{d.title}</h1>
            <p className="text-ink/60 text-lg">{d.subtitle}</p>
          </div>
        </div>

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
        <div className="space-y-1 animate-fade-up delay-1">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${
                activeTab === tab.id
                  ? "bg-ocean/10 text-ocean border-l-[3px] border-terracotta"
                  : "hover:bg-cream/80 text-ink/60 hover:text-ink/80 border-l-[3px] border-transparent"
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <i className={`fas ${TAB_ICONS[tab.id]} w-5 text-center text-sm ${
                activeTab === tab.id ? "text-terracotta" : "text-ink/40"
              }`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="md:col-span-2 animate-fade-up delay-2">
          {activeTab === "organization" && (
            <OrganizationTab orgInfo={orgInfo} dictionary={d} />
          )}
          {activeTab === "compliance" && (
            <ComplianceTab orgInfo={orgInfo} dictionary={d} />
          )}
          {activeTab === "notifications" && (
            <NotificationsTab dictionary={d} />
          )}
          {activeTab === "integrations" && (
            <IntegrationsTab dictionary={d} />
          )}
          {activeTab === "billing" && (
            <BillingSection billing={billingInfo} dictionary={dictionary.dashboard.components.billing} />
          )}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Shared input class                                                         */
/* -------------------------------------------------------------------------- */

const inputClass =
  "w-full px-4 py-3 border border-stone/50 rounded-xl bg-white transition-all duration-200 focus:ring-2 focus:ring-ocean focus:border-ocean focus:shadow-sm focus:shadow-ocean/10 outline-none"

const labelClass = "block text-sm font-medium text-ink/80 mb-2"

/* -------------------------------------------------------------------------- */
/*  Organization Tab                                                           */
/* -------------------------------------------------------------------------- */

function OrganizationTab({ orgInfo, dictionary: d }: { orgInfo: OrgInfo; dictionary: Dictionary["dashboard"]["settings"] }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        {/* Section header with icon */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center">
            <i className="fas fa-building text-ocean" />
          </div>
          <h2 className="font-display text-xl">{d.organizationDetails}</h2>
        </div>

        <div className="space-y-5">
          {/* Company info group */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.organizationName}</label>
              <input
                type="text"
                defaultValue={orgInfo.name}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{d.organizationNumber}</label>
              <input
                type="text"
                defaultValue={orgInfo.orgNumber}
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact info group */}
          <div className="border-t border-stone/30 pt-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{d.contactEmail}</label>
                <input
                  type="email"
                  defaultValue={orgInfo.contactEmail}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{d.address}</label>
                <input
                  type="text"
                  defaultValue={orgInfo.address}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-4 mb-8">
        <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200">
          {d.cancel}
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200">
          {d.saveChanges}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500" />
          </div>
          <div>
            <h3 className="font-display text-lg text-red-700">Danger Zone</h3>
            <p className="text-sm text-ink/50">Irreversible actions for your organization</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/30">
          <div>
            <p className="font-medium text-ink/80">Delete Organization</p>
            <p className="text-sm text-ink/50">Permanently remove your organization and all associated data</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl border-2 border-red-400 text-red-600 font-medium hover:bg-red-50 transition-all duration-200 whitespace-nowrap">
            Delete Organization
          </button>
        </div>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Compliance Tab                                                             */
/* -------------------------------------------------------------------------- */

function ComplianceFieldIndicator({ fieldKey, value }: { fieldKey: string; value: number }) {
  const defaultVal = NORWEGIAN_DEFAULTS[fieldKey]
  const isDefault = defaultVal !== undefined && value === defaultVal

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {isDefault ? (
        <>
          <i className="fas fa-check-circle text-forest text-xs" />
          <span className="text-xs text-forest/70">Norwegian default</span>
        </>
      ) : (
        <>
          <i className="fas fa-pen text-gold text-xs" />
          <span className="text-xs text-gold/80">Customized (default: {defaultVal})</span>
        </>
      )}
    </div>
  )
}

function ComplianceTab({ orgInfo, dictionary: d }: { orgInfo: OrgInfo; dictionary: Dictionary["dashboard"]["settings"] }) {
  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center">
            <i className="fas fa-gavel text-forest" />
          </div>
          <div>
            <h2 className="font-display text-xl">{d.laborLawSettings}</h2>
            <p className="text-sm text-ink/50">Based on Arbeidsmiljoloven (Norwegian Working Environment Act)</p>
          </div>
        </div>

        {/* Working Hours Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-ocean" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">Working Hours</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.maxDailyHours}</label>
              <input
                type="number"
                defaultValue={orgInfo.maxDailyHours}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-4 Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="maxDailyHours" value={orgInfo.maxDailyHours} />
            </div>
            <div>
              <label className={labelClass}>{d.maxWeeklyHours}</label>
              <input
                type="number"
                defaultValue={orgInfo.maxWeeklyHours}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-4(1) Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="maxWeeklyHours" value={orgInfo.maxWeeklyHours} />
            </div>
          </div>
        </div>

        {/* Rest Periods Section */}
        <div className="border-t border-stone/30 pt-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-forest" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">Rest Periods</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.minDailyRest}</label>
              <input
                type="number"
                defaultValue={orgInfo.minDailyRest}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-8(1) Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="minDailyRest" value={orgInfo.minDailyRest} />
            </div>
            <div>
              <label className={labelClass}>{d.minWeeklyRest}</label>
              <input
                type="number"
                defaultValue={orgInfo.minWeeklyRest}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-8(2) Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="minWeeklyRest" value={orgInfo.minWeeklyRest} />
            </div>
          </div>
        </div>

        {/* Overtime Section */}
        <div className="border-t border-stone/30 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">Overtime</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.publishDeadline}</label>
              <input
                type="number"
                defaultValue={orgInfo.publishDeadline}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-3 Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="publishDeadline" value={orgInfo.publishDeadline} />
            </div>
            <div>
              <label className={labelClass}>{d.overtimePremium}</label>
              <input
                type="number"
                defaultValue={orgInfo.overtimePremium}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">&sect;10-6(11) Arbeidsmiljoloven</p>
              <ComplianceFieldIndicator fieldKey="overtimePremium" value={orgInfo.overtimePremium} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200">
          {d.cancel}
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200">
          {d.saveChanges}
        </button>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Toggle Switch Component                                                    */
/* -------------------------------------------------------------------------- */

function ToggleSwitch({
  enabled,
  onToggle,
}: {
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 flex-shrink-0 ${
        enabled ? "bg-forest" : "bg-stone"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/*  Notifications Tab                                                          */
/* -------------------------------------------------------------------------- */

interface NotificationOption {
  key: string
  title: string
  description: string
}

const EMAIL_NOTIFICATIONS: NotificationOption[] = [
  {
    key: "rosterPublished",
    title: "Roster Published",
    description: "Get notified when a new roster is published for your team",
  },
  {
    key: "shiftChanges",
    title: "Shift Changes",
    description: "Receive alerts when your shifts are modified or swapped",
  },
  {
    key: "complianceWarnings",
    title: "Compliance Warnings",
    description: "Important alerts when scheduling may violate labor regulations",
  },
  {
    key: "marketplaceActivity",
    title: "Marketplace Activity",
    description: "Updates on shift marketplace requests and approvals",
  },
  {
    key: "weeklySummary",
    title: "Weekly Compliance Summary",
    description: "A weekly digest of compliance status and scheduling metrics",
  },
]

const IN_APP_ALERTS: NotificationOption[] = [
  {
    key: "desktopNotifications",
    title: "Desktop Notifications",
    description: "Show browser notifications for urgent schedule changes",
  },
  {
    key: "soundAlerts",
    title: "Sound Alerts",
    description: "Play a sound for incoming notifications",
  },
  {
    key: "shiftReminders",
    title: "Shift Reminders",
    description: "Get reminded 1 hour before your shift starts",
  },
]

function NotificationsTab({ dictionary: d }: { dictionary: Dictionary["dashboard"]["settings"] }) {
  const [emailToggles, setEmailToggles] = useState<Record<string, boolean>>({
    rosterPublished: true,
    shiftChanges: true,
    complianceWarnings: true,
    marketplaceActivity: false,
    weeklySummary: true,
  })

  const [appToggles, setAppToggles] = useState<Record<string, boolean>>({
    desktopNotifications: false,
    soundAlerts: false,
    shiftReminders: true,
  })

  const toggleEmail = (key: string) => {
    setEmailToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleApp = (key: string) => {
    setAppToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      {/* Email Notifications */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
            <i className="fas fa-envelope text-terracotta" />
          </div>
          <div>
            <h2 className="font-display text-xl">Email Notifications</h2>
            <p className="text-sm text-ink/50">Choose which emails you would like to receive</p>
          </div>
        </div>

        <div className="space-y-1">
          {EMAIL_NOTIFICATIONS.map((option, i) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-cream/50 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="pr-4">
                <p className="font-medium text-ink/80">{option.title}</p>
                <p className="text-sm text-ink/50 mt-0.5">{option.description}</p>
              </div>
              <ToggleSwitch
                enabled={emailToggles[option.key] ?? false}
                onToggle={() => toggleEmail(option.key)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* In-App Alerts */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center">
            <i className="fas fa-bell text-ocean" />
          </div>
          <div>
            <h2 className="font-display text-xl">In-App Alerts</h2>
            <p className="text-sm text-ink/50">Configure how you receive in-app notifications</p>
          </div>
        </div>

        <div className="space-y-1">
          {IN_APP_ALERTS.map((option, i) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-cream/50 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="pr-4">
                <p className="font-medium text-ink/80">{option.title}</p>
                <p className="text-sm text-ink/50 mt-0.5">{option.description}</p>
              </div>
              <ToggleSwitch
                enabled={appToggles[option.key] ?? false}
                onToggle={() => toggleApp(option.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200">
          {d.cancel}
        </button>
        <button className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200">
          {d.saveChanges}
        </button>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Integrations Tab                                                           */
/* -------------------------------------------------------------------------- */

interface Integration {
  name: string
  description: string
  color: string
  connected: boolean
  category: string
}

const INTEGRATIONS: Integration[] = [
  // Payroll
  { name: "Visma", description: "Sync employee data and export payroll reports", color: "#c65d3b", connected: false, category: "Payroll" },
  { name: "Tripletex", description: "Automated time tracking and salary integration", color: "#2d5a4a", connected: false, category: "Payroll" },
  { name: "Xledger", description: "Cloud ERP with real-time financial data sync", color: "#3a6b7c", connected: false, category: "Payroll" },
  // Calendar
  { name: "Google Calendar", description: "Two-way sync of shifts and schedules", color: "#b8860b", connected: true, category: "Calendar" },
  { name: "Outlook", description: "Sync rosters with Microsoft Outlook calendars", color: "#3a6b7c", connected: false, category: "Calendar" },
  // Communication
  { name: "Slack", description: "Post schedule updates and shift notifications", color: "#2d5a4a", connected: true, category: "Communication" },
  { name: "Teams", description: "Microsoft Teams notifications and updates", color: "#3a6b7c", connected: false, category: "Communication" },
]

function IntegrationsTab({ dictionary: d }: { dictionary: Dictionary["dashboard"]["settings"] }) {
  const categories = [...new Set(INTEGRATIONS.map((i) => i.category))]

  return (
    <>
      {categories.map((category, catIdx) => (
        <div key={category} className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center">
              <i className={`fas ${
                category === "Payroll" ? "fa-file-invoice-dollar" :
                category === "Calendar" ? "fa-calendar-alt" :
                "fa-comments"
              } text-ocean`} />
            </div>
            <h2 className="font-display text-xl">{category}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {INTEGRATIONS.filter((i) => i.category === category).map((integration, i) => (
              <div
                key={integration.name}
                className="card-hover p-5 rounded-xl border border-stone/40 bg-cream/20 transition-all duration-200"
                style={{ animationDelay: `${(catIdx * 3 + i) * 60}ms` }}
              >
                <div className="flex items-start gap-3">
                  {/* Icon placeholder: colored circle with first letter */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-display text-lg flex-shrink-0"
                    style={{ backgroundColor: integration.color }}
                  >
                    {integration.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-ink/90">{integration.name}</h3>
                    </div>
                    <p className="text-sm text-ink/50 mt-1">{integration.description}</p>
                    <div className="mt-3">
                      {integration.connected ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest bg-forest/10 px-3 py-1.5 rounded-lg">
                          <i className="fas fa-check-circle" />
                          Connected
                        </span>
                      ) : (
                        <button className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-forest px-3 py-1.5 rounded-lg hover:bg-forest/90 transition-all duration-200">
                          <i className="fas fa-plug text-[10px]" />
                          Connect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Custom API Section */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-warm-dark/10 flex items-center justify-center">
            <i className="fas fa-code text-warm-dark" />
          </div>
          <div>
            <h2 className="font-display text-xl">Custom API</h2>
            <p className="text-sm text-ink/50">Build your own integrations with our REST API</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>API Key</label>
            <div className="flex gap-3">
              <input
                type="text"
                value="sk_live_••••••••••••••••••••••••••••••3f7a"
                readOnly
                className={`${inputClass} bg-cream/50 font-mono text-sm`}
              />
              <button className="px-4 py-3 rounded-xl border border-stone/50 text-ink/60 hover:bg-cream transition-all duration-200 whitespace-nowrap">
                <i className="fas fa-copy" />
              </button>
            </div>
          </div>

          <a
            href="#"
            className="inline-flex items-center gap-2 text-sm text-ocean hover:text-ocean/80 transition-colors font-medium"
          >
            <i className="fas fa-book" />
            View API Documentation
            <i className="fas fa-arrow-right text-xs" />
          </a>
        </div>
      </div>
    </>
  )
}
