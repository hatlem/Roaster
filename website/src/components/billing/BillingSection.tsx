"use client"

import { useState } from "react"
import { CurrencyNote } from "../CurrencyNote"

interface BillingInfo {
  plan: string | null
  status: string | null
  hasStripeCustomer: boolean
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "Active", color: "bg-forest/10 text-forest" },
  trialing: { label: "Trial", color: "bg-ocean/10 text-ocean" },
  past_due: { label: "Past due", color: "bg-terracotta/10 text-terracotta" },
  canceled: { label: "Canceled", color: "bg-stone text-ink/60" },
  incomplete: { label: "Incomplete", color: "bg-gold/10 text-gold" },
  incomplete_expired: { label: "Expired", color: "bg-stone text-ink/40" },
  unpaid: { label: "Unpaid", color: "bg-terracotta/10 text-terracotta" },
  paused: { label: "Paused", color: "bg-stone text-ink/60" },
}

export function BillingSection({ billing }: { billing: BillingInfo }) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const planLabel = PLAN_LABELS[billing.plan || "free"] || billing.plan || "Free"
  const statusInfo = STATUS_LABELS[billing.status || ""] || null
  const isFree = !billing.plan || billing.plan === "free"
  const isActive = billing.status === "active" || billing.status === "trialing"

  async function handleCheckout(plan: string) {
    setIsLoading(plan)
    setError(null)

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create checkout session")
      }

      // Redirect to Stripe Checkout
      window.location.href = data.data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(null)
    }
  }

  async function handlePortal() {
    setIsLoading("portal")
    setError(null)

    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to open billing portal")
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setIsLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-white rounded-2xl p-6 border border-stone/50">
        <h2 className="font-display text-xl mb-6">Current Plan</h2>

        <div className="flex items-center gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-semibold">{planLabel}</span>
              {statusInfo && (
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              )}
            </div>
            {isFree && (
              <p className="text-ink/60 text-sm mt-1">
                Upgrade to unlock full compliance automation and advanced features.
              </p>
            )}
            {!isFree && isActive && (
              <p className="text-ink/60 text-sm mt-1">
                Your subscription is active. Manage your billing details through the Stripe portal.
              </p>
            )}
            {!isFree && billing.status === "past_due" && (
              <p className="text-terracotta text-sm mt-1">
                Your payment is past due. Please update your payment method to continue service.
              </p>
            )}
            {!isFree && billing.status === "canceled" && (
              <p className="text-ink/60 text-sm mt-1">
                Your subscription has been canceled. Subscribe again to regain access to paid features.
              </p>
            )}
          </div>
        </div>

        {/* Manage Billing button (for paying customers) */}
        {billing.hasStripeCustomer && (
          <button
            onClick={handlePortal}
            disabled={isLoading === "portal"}
            className="px-6 py-3 rounded-xl bg-ink text-cream font-medium hover:bg-ink/90 transition-colors disabled:opacity-70 flex items-center gap-2"
          >
            {isLoading === "portal" ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Opening...
              </>
            ) : (
              <>
                <i className="fas fa-external-link-alt text-sm" />
                Manage Billing
              </>
            )}
          </button>
        )}
      </div>

      {/* Upgrade Plans (for free users or canceled) */}
      {(isFree || billing.status === "canceled") && (
        <div className="bg-white rounded-2xl p-6 border border-stone/50">
          <h2 className="font-display text-xl mb-2">Choose a Plan</h2>
          <div className="mb-6">
            <CurrencyNote />
          </div>

          {error && (
            <div className="bg-terracotta/10 text-terracotta p-4 rounded-xl mb-6 text-sm flex items-start gap-3">
              <i className="fas fa-exclamation-circle mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Starter */}
            <div className="border border-stone/50 rounded-xl p-5">
              <h3 className="font-semibold text-lg mb-1">Starter</h3>
              <p className="text-ink/60 text-sm mb-4">
                For small teams getting started with compliant scheduling.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-3xl">&#8364;9</span>
                <span className="text-ink/60 text-sm">/employee/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Up to 25 employees
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Basic compliance validation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Mobile app access
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Email support
                </li>
              </ul>
              <button
                onClick={() => handleCheckout("starter")}
                disabled={isLoading !== null}
                className="w-full px-6 py-3 rounded-xl border border-ink text-ink font-medium hover:bg-ink hover:text-cream transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading === "starter" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Subscribe to Starter"
                )}
              </button>
            </div>

            {/* Professional */}
            <div className="border-2 border-ocean rounded-xl p-5 relative">
              <span className="absolute -top-3 left-4 bg-ocean text-cream text-xs font-medium px-3 py-1 rounded-full">
                Most Popular
              </span>
              <h3 className="font-semibold text-lg mb-1">Professional</h3>
              <p className="text-ink/60 text-sm mb-4">
                Full compliance automation for growing businesses.
              </p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="font-display text-3xl">&#8364;14</span>
                <span className="text-ink/60 text-sm">/employee/month</span>
              </div>
              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Up to 100 employees
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Full compliance validation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  Shift marketplace &amp; audit reports
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-forest mt-0.5"><i className="fas fa-check text-xs" /></span>
                  API access &amp; priority support
                </li>
              </ul>
              <button
                onClick={() => handleCheckout("professional")}
                disabled={isLoading !== null}
                className="w-full px-6 py-3 rounded-xl bg-ocean text-cream font-medium hover:bg-ocean/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading === "professional" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  "Subscribe to Professional"
                )}
              </button>
            </div>
          </div>

          <p className="text-ink/40 text-sm mt-6 text-center">
            Need unlimited employees or custom integrations?{" "}
            <a href="/contact" className="text-ocean hover:underline">
              Contact us for Enterprise pricing
            </a>
          </p>
        </div>
      )}
    </div>
  )
}
