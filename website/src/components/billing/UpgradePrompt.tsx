"use client"

import Link from "next/link"

interface UpgradePromptProps {
  feature: string
  requiredPlan: string
  currentPlan?: string
  dictionary: {
    upgradeRequired: string
    featureNotAvailable: string
    upgradeTo: string
    currentPlan: string
  }
}

const PLAN_DISPLAY: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
}

export function UpgradePrompt({ feature, requiredPlan, currentPlan, dictionary: d }: UpgradePromptProps) {
  const planLabel = PLAN_DISPLAY[requiredPlan] || requiredPlan

  return (
    <div className="bg-ocean/5 border border-ocean/20 rounded-2xl p-6 text-center">
      <div className="w-12 h-12 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <i className="fas fa-lock text-ocean text-lg" />
      </div>
      <h3 className="font-display text-lg mb-2">{d.upgradeRequired}</h3>
      <p className="text-ink/60 text-sm mb-1">{d.featureNotAvailable}</p>
      <p className="text-ink/60 text-sm mb-6">
        {d.upgradeTo.replace("{plan}", planLabel)} to unlock <span className="font-medium text-ink">{feature}</span>.
      </p>
      {currentPlan && (
        <p className="text-xs text-ink/40 mb-4">
          {d.currentPlan}: <span className="font-medium">{PLAN_DISPLAY[currentPlan] || currentPlan}</span>
        </p>
      )}
      <Link
        href="/pricing"
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-ocean text-cream font-medium hover:bg-ocean/90 transition-colors"
      >
        <i className="fas fa-arrow-up text-sm" />
        {d.upgradeTo.replace("{plan}", planLabel)}
      </Link>
    </div>
  )
}
