"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { BillingSection } from "@/components/billing/BillingSection"
import type { Dictionary } from "@/i18n/dictionaries"

type Tab = "organization" | "compliance" | "collectiveAgreement" | "notifications" | "integrations" | "billing"

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
  collectiveAgreement: "fa-handshake",
  notifications: "fa-bell",
  integrations: "fa-plug",
  billing: "fa-credit-card",
}

// Country-specific labor law defaults
const COUNTRY_COMPLIANCE_DEFAULTS: Record<string, Record<string, number>> = {
  NO: { maxDailyHours: 9, maxWeeklyHours: 40, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 14, overtimePremium: 40 },
  SE: { maxDailyHours: 13, maxWeeklyHours: 40, minDailyRest: 11, minWeeklyRest: 36, publishDeadline: 14, overtimePremium: 50 },
  DK: { maxDailyHours: 13, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 16, overtimePremium: 50 },
  FI: { maxDailyHours: 10, maxWeeklyHours: 40, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 14, overtimePremium: 50 },
  DE: { maxDailyHours: 10, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 24, publishDeadline: 7, overtimePremium: 25 },
  AT: { maxDailyHours: 10, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 36, publishDeadline: 14, overtimePremium: 50 },
  CH: { maxDailyHours: 12.5, maxWeeklyHours: 45, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 14, overtimePremium: 25 },
  FR: { maxDailyHours: 10, maxWeeklyHours: 35, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 7, overtimePremium: 25 },
  BE: { maxDailyHours: 9, maxWeeklyHours: 38, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 7, overtimePremium: 50 },
  NL: { maxDailyHours: 12, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 36, publishDeadline: 28, overtimePremium: 0 },
  ES: { maxDailyHours: 9, maxWeeklyHours: 40, minDailyRest: 12, minWeeklyRest: 36, publishDeadline: 5, overtimePremium: 75 },
  PT: { maxDailyHours: 8, maxWeeklyHours: 40, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 7, overtimePremium: 25 },
  IT: { maxDailyHours: 13, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 24, publishDeadline: 7, overtimePremium: 15 },
  PL: { maxDailyHours: 8, maxWeeklyHours: 40, minDailyRest: 11, minWeeklyRest: 35, publishDeadline: 7, overtimePremium: 50 },
  GB: { maxDailyHours: 13, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 24, publishDeadline: 7, overtimePremium: 0 },
  IE: { maxDailyHours: 13, maxWeeklyHours: 48, minDailyRest: 11, minWeeklyRest: 24, publishDeadline: 7, overtimePremium: 0 },
}

const COUNTRY_LAW_NAMES: Record<string, string> = {
  NO: "Arbeidsmiljøloven",
  SE: "Arbetsmiljölagen",
  DK: "Arbejdsmiljøloven",
  FI: "Työaikalaki",
  DE: "Arbeitszeitgesetz",
  AT: "Arbeitszeitgesetz",
  CH: "Arbeitsgesetz",
  FR: "Code du travail",
  BE: "Loi sur le travail",
  NL: "Arbeidstijdenwet",
  ES: "Estatuto de los Trabajadores",
  PT: "Código do Trabalho",
  IT: "Contratto Collettivo Nazionale",
  PL: "Kodeks pracy",
  GB: "Working Time Regulations",
  IE: "Organisation of Working Time Act",
}

const COUNTRY_NAMES_EN: Record<string, string> = {
  NO: "Norway",
  SE: "Sweden",
  DK: "Denmark",
  FI: "Finland",
  DE: "Germany",
  AT: "Austria",
  CH: "Switzerland",
  FR: "France",
  BE: "Belgium",
  NL: "Netherlands",
  ES: "Spain",
  PT: "Portugal",
  IT: "Italy",
  PL: "Poland",
  GB: "United Kingdom",
  IE: "Ireland",
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
    { id: "collectiveAgreement", label: d.collectiveAgreement.title },
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
          {activeTab === "collectiveAgreement" && (
            <CollectiveAgreementTab dictionary={d} />
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
  const router = useRouter()
  const [name, setName] = useState(orgInfo.name)
  const [orgNumber, setOrgNumber] = useState(orgInfo.orgNumber)
  const [contactEmail, setContactEmail] = useState(orgInfo.contactEmail)
  const [address, setAddress] = useState(orgInfo.address)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const handleSave = async () => {
    setSaving(true)
    setBanner(null)
    try {
      const res = await fetch("/api/settings/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, orgNumber, contactEmail, address }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setBanner({ type: "error", message: data.error || d.failedToSave })
      } else {
        setBanner({ type: "success", message: d.organizationSaved })
        router.refresh()
      }
    } catch {
      setBanner({ type: "error", message: d.unexpectedError })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(orgInfo.name)
    setOrgNumber(orgInfo.orgNumber)
    setContactEmail(orgInfo.contactEmail)
    setAddress(orgInfo.address)
    setBanner(null)
  }

  return (
    <>
      {banner && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
          banner.type === "success"
            ? "bg-forest/10 text-forest"
            : "bg-red-50 text-red-700"
        }`}>
          <i className={`fas ${banner.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span>{banner.message}</span>
        </div>
      )}

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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{d.organizationNumber}</label>
              <input
                type="text"
                value={orgNumber}
                onChange={(e) => setOrgNumber(e.target.value)}
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
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{d.address}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-4 mb-8">
        <button
          onClick={handleCancel}
          className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200"
        >
          {d.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin" />
              {d.saving}
            </span>
          ) : (
            d.saveChanges
          )}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl p-6 border border-red-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
            <i className="fas fa-exclamation-triangle text-red-500" />
          </div>
          <div>
            <h3 className="font-display text-lg text-red-700">{d.dangerZone}</h3>
            <p className="text-sm text-ink/50">{d.dangerZoneDescription}</p>
          </div>
        </div>
        <div className="flex items-center justify-between p-4 rounded-xl border border-red-200 bg-red-50/30">
          <div>
            <p className="font-medium text-ink/80">{d.deleteOrganization}</p>
            <p className="text-sm text-ink/50">{d.deleteOrganizationDescription}</p>
          </div>
          <button className="px-5 py-2.5 rounded-xl border-2 border-red-400 text-red-600 font-medium hover:bg-red-50 transition-all duration-200 whitespace-nowrap">
            {d.deleteOrganization}
          </button>
        </div>
      </div>
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Compliance Tab                                                             */
/* -------------------------------------------------------------------------- */

function ComplianceFieldIndicator({ fieldKey, value, selectedCountry, dictionary: d }: { fieldKey: string; value: number; selectedCountry: string; dictionary: Dictionary["dashboard"]["settings"] }) {
  const defaults = COUNTRY_COMPLIANCE_DEFAULTS[selectedCountry] ?? COUNTRY_COMPLIANCE_DEFAULTS.NO
  const defaultVal = defaults[fieldKey]
  const countryName = COUNTRY_NAMES_EN[selectedCountry] ?? selectedCountry
  const isDefault = defaultVal !== undefined && value === defaultVal

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {isDefault ? (
        <>
          <i className="fas fa-check-circle text-forest text-xs" />
          <span className="text-xs text-forest/70">{d.countryDefault.replace('{country}', countryName)}</span>
        </>
      ) : (
        <>
          <i className="fas fa-pen text-gold text-xs" />
          <span className="text-xs text-gold/80">{d.customized.replace('{defaultVal}', String(defaultVal))}</span>
        </>
      )}
    </div>
  )
}

function ComplianceTab({ orgInfo, dictionary: d }: { orgInfo: OrgInfo; dictionary: Dictionary["dashboard"]["settings"] }) {
  const router = useRouter()
  const [selectedCountry, setSelectedCountry] = useState("NO")
  const [maxDailyHours, setMaxDailyHours] = useState(orgInfo.maxDailyHours)
  const [maxWeeklyHours, setMaxWeeklyHours] = useState(orgInfo.maxWeeklyHours)
  const [minDailyRest, setMinDailyRest] = useState(orgInfo.minDailyRest)
  const [minWeeklyRest, setMinWeeklyRest] = useState(orgInfo.minWeeklyRest)
  const [publishDeadline, setPublishDeadline] = useState(orgInfo.publishDeadline)
  const [overtimePremium, setOvertimePremium] = useState(orgInfo.overtimePremium)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const applyCountryDefaults = (countryCode: string) => {
    const defaults = COUNTRY_COMPLIANCE_DEFAULTS[countryCode]
    if (defaults) {
      setMaxDailyHours(defaults.maxDailyHours)
      setMaxWeeklyHours(defaults.maxWeeklyHours)
      setMinDailyRest(defaults.minDailyRest)
      setMinWeeklyRest(defaults.minWeeklyRest)
      setPublishDeadline(defaults.publishDeadline)
      setOvertimePremium(defaults.overtimePremium)
    }
  }

  const lawName = COUNTRY_LAW_NAMES[selectedCountry] ?? "Labor Law"

  const handleSave = async () => {
    setSaving(true)
    setBanner(null)
    try {
      const res = await fetch("/api/settings/compliance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxDailyHours,
          maxWeeklyHours,
          minDailyRest,
          minWeeklyRest,
          publishDeadline,
          overtimePremium,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setBanner({ type: "error", message: data.error || d.failedToSave })
      } else {
        setBanner({ type: "success", message: d.complianceSaved })
        router.refresh()
      }
    } catch {
      setBanner({ type: "error", message: d.unexpectedError })
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setMaxDailyHours(orgInfo.maxDailyHours)
    setMaxWeeklyHours(orgInfo.maxWeeklyHours)
    setMinDailyRest(orgInfo.minDailyRest)
    setMinWeeklyRest(orgInfo.minWeeklyRest)
    setPublishDeadline(orgInfo.publishDeadline)
    setOvertimePremium(orgInfo.overtimePremium)
    setBanner(null)
  }

  return (
    <>
      {banner && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
          banner.type === "success"
            ? "bg-forest/10 text-forest"
            : "bg-red-50 text-red-700"
        }`}>
          <i className={`fas ${banner.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span>{banner.message}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-forest/10 flex items-center justify-center">
            <i className="fas fa-gavel text-forest" />
          </div>
          <div>
            <h2 className="font-display text-xl">{d.laborLawSettings}</h2>
            <p className="text-sm text-ink/50">{d.laborLawDescription.replace('{lawName}', lawName)}</p>
          </div>
        </div>

        {/* Country Selector */}
        <div className="mb-6">
          <label className={labelClass}>{d.country}</label>
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value)
              applyCountryDefaults(e.target.value)
            }}
            className={inputClass}
          >
            <option value="NO">{d.countryNO}</option>
            <option value="SE">{d.countrySE}</option>
            <option value="DK">{d.countryDK}</option>
            <option value="FI">{d.countryFI}</option>
            <option value="DE">{d.countryDE}</option>
            <option value="AT">{d.countryAT}</option>
            <option value="CH">{d.countryCH}</option>
            <option value="FR">{d.countryFR}</option>
            <option value="BE">{d.countryBE}</option>
            <option value="NL">{d.countryNL}</option>
            <option value="ES">{d.countryES}</option>
            <option value="PT">{d.countryPT}</option>
            <option value="IT">{d.countryIT}</option>
            <option value="PL">{d.countryPL}</option>
            <option value="GB">{d.countryGB}</option>
            <option value="IE">{d.countryIE}</option>
          </select>
        </div>

        {/* Working Hours Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-ocean" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">{d.workingHours}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.maxDailyHours}</label>
              <input
                type="number"
                value={maxDailyHours}
                onChange={(e) => setMaxDailyHours(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="maxDailyHours" value={maxDailyHours} selectedCountry={selectedCountry} dictionary={d} />
            </div>
            <div>
              <label className={labelClass}>{d.maxWeeklyHours}</label>
              <input
                type="number"
                value={maxWeeklyHours}
                onChange={(e) => setMaxWeeklyHours(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="maxWeeklyHours" value={maxWeeklyHours} selectedCountry={selectedCountry} dictionary={d} />
            </div>
          </div>
        </div>

        {/* Rest Periods Section */}
        <div className="border-t border-stone/30 pt-6 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-forest" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">{d.restPeriods}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.minDailyRest}</label>
              <input
                type="number"
                value={minDailyRest}
                onChange={(e) => setMinDailyRest(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="minDailyRest" value={minDailyRest} selectedCountry={selectedCountry} dictionary={d} />
            </div>
            <div>
              <label className={labelClass}>{d.minWeeklyRest}</label>
              <input
                type="number"
                value={minWeeklyRest}
                onChange={(e) => setMinWeeklyRest(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="minWeeklyRest" value={minWeeklyRest} selectedCountry={selectedCountry} dictionary={d} />
            </div>
          </div>
        </div>

        {/* Overtime Section */}
        <div className="border-t border-stone/30 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
            <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">{d.overtime}</h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{d.publishDeadline}</label>
              <input
                type="number"
                value={publishDeadline}
                onChange={(e) => setPublishDeadline(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="publishDeadline" value={publishDeadline} selectedCountry={selectedCountry} dictionary={d} />
            </div>
            <div>
              <label className={labelClass}>{d.overtimePremium}</label>
              <input
                type="number"
                value={overtimePremium}
                onChange={(e) => setOvertimePremium(Number(e.target.value))}
                className={inputClass}
              />
              <p className="text-xs text-ink/40 mt-1">{lawName}</p>
              <ComplianceFieldIndicator fieldKey="overtimePremium" value={overtimePremium} selectedCountry={selectedCountry} dictionary={d} />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <button
          onClick={handleCancel}
          className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200"
        >
          {d.cancel}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin" />
              {d.saving}
            </span>
          ) : (
            d.saveChanges
          )}
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
  titleKey: string
  descriptionKey: string
}

const EMAIL_NOTIFICATION_KEYS: NotificationOption[] = [
  { key: "rosterPublished", titleKey: "rosterPublishedTitle", descriptionKey: "rosterPublishedDescription" },
  { key: "shiftChanges", titleKey: "shiftChangesTitle", descriptionKey: "shiftChangesDescription" },
  { key: "complianceWarnings", titleKey: "complianceWarningsTitle", descriptionKey: "complianceWarningsDescription" },
  { key: "marketplaceActivity", titleKey: "marketplaceActivityTitle", descriptionKey: "marketplaceActivityDescription" },
  { key: "weeklySummary", titleKey: "weeklySummaryTitle", descriptionKey: "weeklySummaryDescription" },
]

const IN_APP_ALERT_KEYS: NotificationOption[] = [
  { key: "desktopNotifications", titleKey: "desktopNotificationsTitle", descriptionKey: "desktopNotificationsDescription" },
  { key: "soundAlerts", titleKey: "soundAlertsTitle", descriptionKey: "soundAlertsDescription" },
  { key: "shiftReminders", titleKey: "shiftRemindersTitle", descriptionKey: "shiftRemindersDescription" },
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
            <h2 className="font-display text-xl">{d.emailNotifications}</h2>
            <p className="text-sm text-ink/50">{d.emailNotificationsDescription}</p>
          </div>
        </div>

        <div className="space-y-1">
          {EMAIL_NOTIFICATION_KEYS.map((option, i) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-cream/50 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="pr-4">
                <p className="font-medium text-ink/80">{d[option.titleKey as keyof typeof d] as string}</p>
                <p className="text-sm text-ink/50 mt-0.5">{d[option.descriptionKey as keyof typeof d] as string}</p>
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
            <h2 className="font-display text-xl">{d.inAppAlerts}</h2>
            <p className="text-sm text-ink/50">{d.inAppAlertsDescription}</p>
          </div>
        </div>

        <div className="space-y-1">
          {IN_APP_ALERT_KEYS.map((option, i) => (
            <div
              key={option.key}
              className="flex items-center justify-between p-4 rounded-xl hover:bg-cream/50 transition-all duration-200"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="pr-4">
                <p className="font-medium text-ink/80">{d[option.titleKey as keyof typeof d] as string}</p>
                <p className="text-sm text-ink/50 mt-0.5">{d[option.descriptionKey as keyof typeof d] as string}</p>
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
/*  Collective Agreement Tab                                                   */
/* -------------------------------------------------------------------------- */

interface CBAPreset {
  code: string
  name: string
  overtimeWeeklyMax?: number
  overtimeYearlyMax?: number
  minDailyRest?: number
  minWeeklyRest?: number
  sundayPremiumRate?: number
  overtimePremiumOverride?: number
}

const CBA_PRESETS: Record<string, CBAPreset[]> = {
  NO: [
    { code: "LO_NHO", name: "LO/NHO Landsavtalen", overtimeWeeklyMax: 10, overtimeYearlyMax: 200, minDailyRest: 8, sundayPremiumRate: 1.5, overtimePremiumOverride: 1.4 },
    { code: "VIRKE", name: "Virke Landoverenskomsten", overtimeWeeklyMax: 10, overtimeYearlyMax: 200, overtimePremiumOverride: 1.5 },
    { code: "SPEKTER", name: "Spekter", overtimeWeeklyMax: 10, overtimeYearlyMax: 200 },
    { code: "KS", name: "KS (kommunesektoren)", overtimeWeeklyMax: 10, overtimeYearlyMax: 200 },
    { code: "HK_HANDEL", name: "Handel og Kontor", overtimeWeeklyMax: 10, overtimeYearlyMax: 200 },
  ],
  SE: [
    { code: "IF_METALL", name: "IF Metall / Teknikavtalet", overtimeWeeklyMax: 48, overtimeYearlyMax: 200 },
    { code: "HRF", name: "HRF (hotell & restaurang)", overtimeYearlyMax: 200 },
    { code: "HANDELS", name: "Handels (retail)", overtimeYearlyMax: 200 },
    { code: "KOMMUNAL", name: "Kommunal", overtimeYearlyMax: 200 },
  ],
  DK: [
    { code: "3F_DA", name: "3F/DA", minDailyRest: 8 },
    { code: "HK", name: "HK", minDailyRest: 8 },
    { code: "FOA", name: "FOA" },
    { code: "BUPL", name: "BUPL" },
  ],
  FI: [
    { code: "PAM", name: "PAM (palvelualojen)", overtimeYearlyMax: 250 },
    { code: "SAK", name: "SAK", overtimeYearlyMax: 250 },
    { code: "STTK", name: "STTK" },
    { code: "AKAVA", name: "AKAVA" },
  ],
}

interface CollectiveAgreementData {
  id?: string
  name: string
  countryCode: string
  sector: string
  unionCode: string
  overtimeWeeklyMax: string
  overtimeYearlyMax: string
  minDailyRest: string
  minWeeklyRest: string
  overtimePremiumOverride: string
  sundayPremiumRate: string
  nightWorkAllowed: boolean
  nightWorkRequiresConsent: boolean
  effectiveFrom: string
  effectiveTo: string
  notes: string
}

const EMPTY_FORM: CollectiveAgreementData = {
  name: "",
  countryCode: "NO",
  sector: "",
  unionCode: "",
  overtimeWeeklyMax: "",
  overtimeYearlyMax: "",
  minDailyRest: "",
  minWeeklyRest: "",
  overtimePremiumOverride: "",
  sundayPremiumRate: "",
  nightWorkAllowed: true,
  nightWorkRequiresConsent: false,
  effectiveFrom: "",
  effectiveTo: "",
  notes: "",
}

function CollectiveAgreementTab({ dictionary: d }: { dictionary: Dictionary["dashboard"]["settings"] }) {
  const router = useRouter()
  const cd = d.collectiveAgreement
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [existing, setExisting] = useState<CollectiveAgreementData & { id?: string } | null>(null)
  const [form, setForm] = useState<CollectiveAgreementData>(EMPTY_FORM)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null)

  // Fetch existing agreement on mount
  useEffect(() => {
    const fetchAgreement = async () => {
      try {
        const res = await fetch("/api/settings/collective-agreement")
        const data = await res.json()
        if (data.data) {
          const ag = data.data
          setExisting({
            id: ag.id,
            name: ag.name,
            countryCode: ag.countryCode,
            sector: ag.sector ?? "",
            unionCode: ag.unionCode ?? "",
            overtimeWeeklyMax: ag.overtimeWeeklyMax != null ? String(ag.overtimeWeeklyMax) : "",
            overtimeYearlyMax: ag.overtimeYearlyMax != null ? String(ag.overtimeYearlyMax) : "",
            minDailyRest: ag.minDailyRest != null ? String(ag.minDailyRest) : "",
            minWeeklyRest: ag.minWeeklyRest != null ? String(ag.minWeeklyRest) : "",
            overtimePremiumOverride: ag.overtimePremiumOverride != null ? String(ag.overtimePremiumOverride) : "",
            sundayPremiumRate: ag.sundayPremiumRate != null ? String(ag.sundayPremiumRate) : "",
            nightWorkAllowed: ag.nightWorkAllowed,
            nightWorkRequiresConsent: ag.nightWorkRequiresConsent,
            effectiveFrom: ag.effectiveFrom ? ag.effectiveFrom.slice(0, 10) : "",
            effectiveTo: ag.effectiveTo ? ag.effectiveTo.slice(0, 10) : "",
            notes: ag.notes ?? "",
          })
        }
      } catch {
        // silently fail — no agreement
      } finally {
        setLoading(false)
      }
    }
    fetchAgreement()
  }, [])

  const openForm = (prefill?: CollectiveAgreementData) => {
    setForm(prefill ?? existing ?? EMPTY_FORM)
    setSelectedPreset(prefill?.unionCode ?? existing?.unionCode ?? "")
    setShowForm(true)
    setBanner(null)
  }

  const applyPreset = (code: string, countryCode: string) => {
    const presets = CBA_PRESETS[countryCode] ?? []
    const preset = presets.find((p) => p.code === code)
    if (!preset) return
    setForm((prev) => ({
      ...prev,
      name: preset.name,
      unionCode: preset.code,
      overtimeWeeklyMax: preset.overtimeWeeklyMax != null ? String(preset.overtimeWeeklyMax) : "",
      overtimeYearlyMax: preset.overtimeYearlyMax != null ? String(preset.overtimeYearlyMax) : "",
      minDailyRest: preset.minDailyRest != null ? String(preset.minDailyRest) : "",
      minWeeklyRest: preset.minWeeklyRest != null ? String(preset.minWeeklyRest) : "",
      overtimePremiumOverride: preset.overtimePremiumOverride != null ? String(preset.overtimePremiumOverride) : "",
      sundayPremiumRate: preset.sundayPremiumRate != null ? String(preset.sundayPremiumRate) : "",
    }))
    setBanner({ type: "success", message: cd.presetApplied })
  }

  const handleSave = async () => {
    setSaving(true)
    setBanner(null)
    try {
      const res = await fetch("/api/settings/collective-agreement", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          countryCode: form.countryCode,
          sector: form.sector || null,
          unionCode: form.unionCode || null,
          overtimeWeeklyMax: form.overtimeWeeklyMax !== "" ? Number(form.overtimeWeeklyMax) : null,
          overtimeYearlyMax: form.overtimeYearlyMax !== "" ? Number(form.overtimeYearlyMax) : null,
          minDailyRest: form.minDailyRest !== "" ? Number(form.minDailyRest) : null,
          minWeeklyRest: form.minWeeklyRest !== "" ? Number(form.minWeeklyRest) : null,
          overtimePremiumOverride: form.overtimePremiumOverride !== "" ? Number(form.overtimePremiumOverride) : null,
          sundayPremiumRate: form.sundayPremiumRate !== "" ? Number(form.sundayPremiumRate) : null,
          nightWorkAllowed: form.nightWorkAllowed,
          nightWorkRequiresConsent: form.nightWorkRequiresConsent,
          effectiveFrom: form.effectiveFrom || null,
          effectiveTo: form.effectiveTo || null,
          notes: form.notes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setBanner({ type: "error", message: data.error || d.failedToSave })
      } else {
        setExisting({ ...form, id: data.data?.id })
        setShowForm(false)
        setBanner({ type: "success", message: cd.saved })
        router.refresh()
      }
    } catch {
      setBanner({ type: "error", message: d.unexpectedError })
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm(`Remove "${existing?.name}"? This will revert to statutory defaults.`)) return
    setRemoving(true)
    setBanner(null)
    try {
      const res = await fetch("/api/settings/collective-agreement", { method: "DELETE" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setBanner({ type: "error", message: data.error || d.failedToSave })
      } else {
        setExisting(null)
        setShowForm(false)
        setBanner({ type: "success", message: cd.removed })
        router.refresh()
      }
    } catch {
      setBanner({ type: "error", message: d.unexpectedError })
    } finally {
      setRemoving(false)
    }
  }

  const countryPresets = CBA_PRESETS[form.countryCode] ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <i className="fas fa-spinner fa-spin text-ocean text-2xl" />
      </div>
    )
  }

  return (
    <>
      {banner && (
        <div className={`mb-6 p-4 rounded-xl text-sm flex items-center gap-3 ${
          banner.type === "success" ? "bg-forest/10 text-forest" : "bg-red-50 text-red-700"
        }`}>
          <i className={`fas ${banner.type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}`} />
          <span>{banner.message}</span>
        </div>
      )}

      {/* Header card */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
            <i className="fas fa-handshake text-terracotta" />
          </div>
          <div>
            <h2 className="font-display text-xl">{cd.title}</h2>
            <p className="text-sm text-ink/50">{cd.subtitle}</p>
          </div>
        </div>
      </div>

      {/* No agreement state */}
      {!existing && !showForm && (
        <div className="bg-white rounded-2xl p-8 border border-stone/50 mb-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-cream mx-auto flex items-center justify-center mb-4">
            <i className="fas fa-file-contract text-3xl text-ink/30" />
          </div>
          <h3 className="font-display text-xl text-ink/80 mb-2">{cd.noAgreement}</h3>
          <p className="text-sm text-ink/50 mb-6 max-w-md mx-auto">{cd.noAgreementDesc}</p>
          <button
            onClick={() => openForm()}
            className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200"
          >
            <i className="fas fa-plus mr-2" />
            {cd.configure}
          </button>
        </div>
      )}

      {/* Existing agreement summary */}
      {existing && !showForm && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-display text-lg">{existing.name}</h3>
              {existing.unionCode && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ocean bg-ocean/10 px-3 py-1 rounded-lg mt-1">
                  <i className="fas fa-users text-[10px]" />
                  {existing.unionCode}
                </span>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => openForm()}
                className="px-4 py-2 rounded-xl border border-stone/50 text-sm font-medium hover:bg-cream transition-all duration-200"
              >
                <i className="fas fa-edit mr-1.5" />
                {cd.edit}
              </button>
              <button
                onClick={handleRemove}
                disabled={removing}
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-all duration-200 disabled:opacity-50"
              >
                {removing ? <i className="fas fa-spinner fa-spin" /> : <><i className="fas fa-trash mr-1.5" />{cd.remove}</>}
              </button>
            </div>
          </div>

          {/* Active overrides summary */}
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            {existing.overtimeWeeklyMax && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-clock text-terracotta text-xs" />
                {cd.overtimeWeeklyMaxLabel}: <strong>{existing.overtimeWeeklyMax}h</strong>
              </div>
            )}
            {existing.overtimeYearlyMax && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-calendar text-terracotta text-xs" />
                {cd.overtimeYearlyMaxLabel}: <strong>{existing.overtimeYearlyMax}h</strong>
              </div>
            )}
            {existing.minDailyRest && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-moon text-ocean text-xs" />
                {cd.minDailyRestLabel.split('—')[0].trim()}: <strong>{existing.minDailyRest}h</strong>
              </div>
            )}
            {existing.minWeeklyRest && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-bed text-ocean text-xs" />
                {cd.minWeeklyRestLabel.split('—')[0].trim()}: <strong>{existing.minWeeklyRest}h</strong>
              </div>
            )}
            {existing.overtimePremiumOverride && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-percent text-forest text-xs" />
                {cd.overtimePremiumLabel}: <strong>×{existing.overtimePremiumOverride}</strong>
              </div>
            )}
            {existing.sundayPremiumRate && (
              <div className="flex items-center gap-2 text-sm text-ink/70 bg-cream/50 rounded-lg px-3 py-2">
                <i className="fas fa-sun text-gold text-xs" />
                {cd.sundayPremiumLabel}: <strong>×{existing.sundayPremiumRate}</strong>
              </div>
            )}
          </div>

          {existing.effectiveFrom && (
            <p className="text-xs text-ink/40 mt-4">
              {cd.effectiveFromLabel}: {existing.effectiveFrom}
              {existing.effectiveTo ? ` → ${existing.effectiveTo}` : ""}
            </p>
          )}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="space-y-5">
            {/* Country */}
            <div>
              <label className={labelClass}>{cd.countryLabel}</label>
              <select
                value={form.countryCode}
                onChange={(e) => {
                  setForm((prev) => ({ ...prev, countryCode: e.target.value, unionCode: "" }))
                  setSelectedPreset("")
                }}
                className={inputClass}
              >
                <option value="NO">Norway</option>
                <option value="SE">Sweden</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="DE">Germany</option>
                <option value="AT">Austria</option>
                <option value="CH">Switzerland</option>
                <option value="FR">France</option>
                <option value="BE">Belgium</option>
                <option value="NL">Netherlands</option>
                <option value="ES">Spain</option>
                <option value="PT">Portugal</option>
                <option value="IT">Italy</option>
                <option value="PL">Poland</option>
                <option value="GB">United Kingdom</option>
                <option value="IE">Ireland</option>
              </select>
            </div>

            {/* Agreement preset */}
            <div>
              <label className={labelClass}>{cd.agreementLabel}</label>
              <select
                value={selectedPreset}
                onChange={(e) => {
                  setSelectedPreset(e.target.value)
                  if (e.target.value) {
                    applyPreset(e.target.value, form.countryCode)
                  } else {
                    setForm((prev) => ({ ...prev, name: "", unionCode: "" }))
                  }
                }}
                className={inputClass}
              >
                <option value="">{cd.customAgreement}</option>
                {countryPresets.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Name */}
            <div>
              <label className={labelClass}>{cd.agreementLabel} name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                className={inputClass}
                placeholder="e.g. LO/NHO Landsavtalen"
              />
            </div>

            {/* Union code + Sector */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{cd.unionCodeLabel}</label>
                <input
                  type="text"
                  value={form.unionCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, unionCode: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. LO_NHO"
                />
              </div>
              <div>
                <label className={labelClass}>{cd.sectorLabel}</label>
                <input
                  type="text"
                  value={form.sector}
                  onChange={(e) => setForm((prev) => ({ ...prev, sector: e.target.value }))}
                  className={inputClass}
                  placeholder="e.g. retail, hospitality"
                />
              </div>
            </div>

            {/* Rule Overrides */}
            <div className="border-t border-stone/30 pt-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1.5 h-1.5 rounded-full bg-terracotta" />
                <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">{cd.overridesSection}</h3>
              </div>
              <p className="text-xs text-ink/40 mb-4">{cd.overridesDesc}</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{cd.overtimeWeeklyMaxLabel}</label>
                  <input
                    type="number"
                    value={form.overtimeWeeklyMax}
                    onChange={(e) => setForm((prev) => ({ ...prev, overtimeWeeklyMax: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={0}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.overtimeYearlyMaxLabel}</label>
                  <input
                    type="number"
                    value={form.overtimeYearlyMax}
                    onChange={(e) => setForm((prev) => ({ ...prev, overtimeYearlyMax: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={0}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.minDailyRestLabel}</label>
                  <input
                    type="number"
                    value={form.minDailyRest}
                    onChange={(e) => setForm((prev) => ({ ...prev, minDailyRest: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={0}
                    max={24}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.minWeeklyRestLabel}</label>
                  <input
                    type="number"
                    value={form.minWeeklyRest}
                    onChange={(e) => setForm((prev) => ({ ...prev, minWeeklyRest: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={0}
                    max={168}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.overtimePremiumLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.overtimePremiumOverride}
                    onChange={(e) => setForm((prev) => ({ ...prev, overtimePremiumOverride: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={1}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.sundayPremiumLabel}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.sundayPremiumRate}
                    onChange={(e) => setForm((prev) => ({ ...prev, sundayPremiumRate: e.target.value }))}
                    className={inputClass}
                    placeholder={cd.useDefault}
                    min={1}
                  />
                </div>
              </div>
            </div>

            {/* Night Work */}
            <div className="border-t border-stone/30 pt-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1.5 h-1.5 rounded-full bg-ocean" />
                <h3 className="font-medium text-ink/70 text-sm uppercase tracking-wide">{cd.nightWorkSection}</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 rounded-xl bg-cream/30 border border-stone/30">
                  <span className="text-sm font-medium text-ink/80">{cd.nightWorkAllowed}</span>
                  <ToggleSwitch
                    enabled={form.nightWorkAllowed}
                    onToggle={() => setForm((prev) => ({ ...prev, nightWorkAllowed: !prev.nightWorkAllowed }))}
                  />
                </div>
                {form.nightWorkAllowed && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-cream/30 border border-stone/30">
                    <span className="text-sm font-medium text-ink/80">{cd.nightWorkConsent}</span>
                    <ToggleSwitch
                      enabled={form.nightWorkRequiresConsent}
                      onToggle={() => setForm((prev) => ({ ...prev, nightWorkRequiresConsent: !prev.nightWorkRequiresConsent }))}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Effective dates */}
            <div className="border-t border-stone/30 pt-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{cd.effectiveFromLabel}</label>
                  <input
                    type="date"
                    value={form.effectiveFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveFrom: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{cd.effectiveToLabel}</label>
                  <input
                    type="date"
                    value={form.effectiveTo}
                    onChange={(e) => setForm((prev) => ({ ...prev, effectiveTo: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className={labelClass}>{cd.notesLabel}</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="Any additional notes about this agreement..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={() => { setShowForm(false); setBanner(null) }}
              className="px-6 py-3 rounded-xl border border-stone/50 font-medium hover:bg-cream transition-all duration-200"
            >
              {d.cancel}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-ocean text-white font-medium hover:bg-ocean/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin" />
                  {d.saving}
                </span>
              ) : (
                cd.save
              )}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

/* -------------------------------------------------------------------------- */
/*  Integrations Tab                                                           */
/* -------------------------------------------------------------------------- */

interface Integration {
  name: string
  descriptionKey: string
  color: string
  connected: boolean
  status: "coming_soon" | "request_access" | "connected"
  categoryKey: string
}

const INTEGRATIONS: Integration[] = [
  // Payroll
  { name: "Visma", descriptionKey: "vismaDescription", color: "#c65d3b", connected: false, status: "coming_soon", categoryKey: "categoryPayroll" },
  { name: "Tripletex", descriptionKey: "tripletexDescription", color: "#2d5a4a", connected: false, status: "coming_soon", categoryKey: "categoryPayroll" },
  { name: "Xledger", descriptionKey: "xledgerDescription", color: "#3a6b7c", connected: false, status: "coming_soon", categoryKey: "categoryPayroll" },
  // Calendar
  { name: "Google Calendar", descriptionKey: "googleCalendarDescription", color: "#b8860b", connected: false, status: "request_access", categoryKey: "categoryCalendar" },
  { name: "Outlook", descriptionKey: "outlookDescription", color: "#3a6b7c", connected: false, status: "coming_soon", categoryKey: "categoryCalendar" },
  // Communication
  { name: "Slack", descriptionKey: "slackDescription", color: "#2d5a4a", connected: false, status: "request_access", categoryKey: "categoryCommunication" },
  { name: "Teams", descriptionKey: "teamsDescription", color: "#3a6b7c", connected: false, status: "coming_soon", categoryKey: "categoryCommunication" },
]

function IntegrationsTab({ dictionary: d }: { dictionary: Dictionary["dashboard"]["settings"] }) {
  const categories = [...new Set(INTEGRATIONS.map((i) => i.categoryKey))]

  return (
    <>
      {categories.map((categoryKey, catIdx) => (
        <div key={categoryKey} className="bg-white rounded-2xl p-6 border border-stone/50 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ocean/10 flex items-center justify-center">
              <i className={`fas ${
                categoryKey === "categoryPayroll" ? "fa-file-invoice-dollar" :
                categoryKey === "categoryCalendar" ? "fa-calendar-alt" :
                "fa-comments"
              } text-ocean`} />
            </div>
            <h2 className="font-display text-xl">{d[categoryKey as keyof typeof d] as string}</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {INTEGRATIONS.filter((i) => i.categoryKey === categoryKey).map((integration, i) => (
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
                    <p className="text-sm text-ink/50 mt-1">{d[integration.descriptionKey as keyof typeof d] as string}</p>
                    <div className="mt-3">
                      {integration.status === "connected" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-forest bg-forest/10 px-3 py-1.5 rounded-lg">
                          <i className="fas fa-check-circle" />
                          {d.connected}
                        </span>
                      ) : integration.status === "request_access" ? (
                        <button className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-ocean px-3 py-1.5 rounded-lg hover:bg-ocean/90 transition-all duration-200">
                          <i className="fas fa-envelope text-[10px]" />
                          {d.requestAccess}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink/40 bg-stone/30 px-3 py-1.5 rounded-lg cursor-default">
                          <i className="fas fa-clock text-[10px]" />
                          {d.comingSoon}
                        </span>
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
            <h2 className="font-display text-xl">{d.customApi}</h2>
            <p className="text-sm text-ink/50">{d.customApiDescription}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>{d.apiKey}</label>
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
            {d.viewApiDocumentation}
            <i className="fas fa-arrow-right text-xs" />
          </a>
        </div>
      </div>
    </>
  )
}
