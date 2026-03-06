"use client";

import { useState } from "react";
import Link from "next/link";
import { pricing, navigation } from "@/content";
import { CurrencyNote } from "@/components/CurrencyNote";
import type { Dictionary } from "@/i18n/dictionaries";

interface PricingClientProps {
  dict: Dictionary;
}

export function PricingClient({ dict }: PricingClientProps) {
  const [isYearly, setIsYearly] = useState(true);

  // Map plan IDs to dictionary keys
  const planDictKeys: Record<string, keyof typeof dict.content.plans> = {
    starter: "starter",
    professional: "professional",
    enterprise: "enterprise",
  };

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[500px] h-[500px] -top-40 right-[-200px]"
          style={{ background: "radial-gradient(circle, var(--gold), transparent)" }}
        />

        <div className="max-w-3xl mx-auto">
          <p className="text-gold mb-4 tracking-widest uppercase text-xs font-semibold animate-fade-up">
            {dict.pricingPage.tagline}
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 animate-fade-up delay-1">
            {dict.pricingPage.title}
          </h1>
          <p className="text-xl text-ink/55 leading-relaxed mb-4 animate-fade-up delay-2">
            {dict.common.daysFreeTrial.replace('{days}', String(pricing.trial.days))}
          </p>
          <div className="animate-fade-up delay-2">
            <CurrencyNote />
          </div>

          {/* Toggle */}
          <div className="flex items-center gap-1 mt-8 bg-stone/40 rounded-lg p-1 w-fit animate-fade-up delay-3">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-5 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                !isYearly ? "bg-ink text-cream shadow-sm" : "text-ink/50 hover:text-ink"
              }`}
            >
              {dict.pricingPage.monthly}
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-5 py-2 rounded-md font-medium text-sm transition-all duration-200 ${
                isYearly ? "bg-ink text-cream shadow-sm" : "text-ink/50 hover:text-ink"
              }`}
            >
              {dict.pricingPage.yearly}
              <span className="ml-2 text-xs opacity-60">{dict.pricingPage.discount}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.plans.map((plan) => {
              const price = isYearly ? plan.basePrice.yearly : plan.basePrice.monthly;
              const dictKey = planDictKeys[plan.id];
              const planDict = dictKey ? dict.content.plans[dictKey] : null;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-warm-dark text-cream ring-2 ring-terracotta/30 card-hover"
                      : "bg-stone/20 border border-stone/40 card-hover"
                  }`}
                >
                  {plan.highlighted && (
                    <div className="h-1 bg-gradient-to-r from-terracotta to-gold" />
                  )}
                  <div className="p-7">
                    <h3 className="font-semibold text-lg mb-1">
                      {planDict?.name ?? plan.name}
                    </h3>
                    <p className={`text-sm mb-7 ${plan.highlighted ? "text-cream/50" : "text-ink/50"}`}>
                      {planDict?.description ?? plan.description}
                    </p>

                    <div className="mb-7">
                      {price !== null ? (
                        <div className="flex items-baseline gap-1">
                          <span className="font-display text-4xl">&euro;{price}</span>
                          <span className={`text-sm ${plan.highlighted ? "text-cream/50" : "text-ink/50"}`}>
                            {dict.pricingPage.perEmployeeMonth}
                          </span>
                        </div>
                      ) : (
                        <span className="font-display text-2xl">{dict.common.contactUs}</span>
                      )}
                    </div>

                    <ul className="space-y-2.5 mb-8">
                      {(planDict?.features ?? plan.features).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm">
                          <span className={`mt-0.5 ${plan.highlighted ? "text-terracotta" : "text-forest"}`}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                          <span className={plan.highlighted ? "text-cream/75" : "text-ink/70"}>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.id === "enterprise" ? "/contact" : "/onboarding"}
                      className={`block text-center py-3 rounded-lg font-medium transition-all duration-200 ${
                        plan.highlighted
                          ? "bg-cream text-ink hover:bg-cream/90 hover:shadow-lg"
                          : "bg-ink text-cream hover:bg-ink/90 hover:shadow-lg"
                      }`}
                    >
                      {planDict?.cta ?? plan.cta}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="accent-line mb-12 max-w-24" />
          <h2 className="font-display text-3xl md:text-4xl mb-12">{dict.pricingPage.questionsTitle}</h2>
          <div className="space-y-0">
            {dict.content.faq.map((item, i) => (
              <div key={i} className="py-7 border-t border-stone/60 group">
                <h3 className="font-medium mb-2 group-hover:text-terracotta transition-colors duration-200">
                  {item.question}
                </h3>
                <p className="text-ink/55 leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 px-6 lg:px-8 bg-warm-dark text-cream overflow-hidden grain">
        <div
          className="warm-orb w-[500px] h-[500px] -bottom-60 right-[-200px]"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)" }}
        />

        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
            {dict.common.tryFreeForDays.replace('{days}', String(pricing.trial.days))}
          </h2>
          <p className="text-cream/50 text-xl mb-10 max-w-lg">
            {dict.common.getStartedInMinutes}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={navigation.cta.primary.href}
              className="bg-cream text-ink px-6 py-3 rounded-lg font-medium hover:bg-cream/90 transition-all duration-200 text-center hover:shadow-lg"
            >
              {dict.common.startFreeTrial}
            </Link>
            <Link
              href={navigation.cta.secondary.href}
              className="border border-cream/20 text-cream px-6 py-3 rounded-lg font-medium hover:bg-cream/10 transition-all duration-200 text-center"
            >
              {dict.common.bookADemo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
