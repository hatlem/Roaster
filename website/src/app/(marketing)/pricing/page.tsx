"use client";

import { useState } from "react";
import Link from "next/link";
import { pricing, navigation } from "@/content";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6">
            Pricing
          </h1>
          <p className="text-xl text-ink/60 leading-relaxed mb-8">
            {pricing.trial.days}-day free trial. No credit card required.
          </p>

          {/* Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                !isYearly ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                isYearly ? "bg-ink text-cream" : "text-ink/60 hover:text-ink"
              }`}
            >
              Yearly
              <span className="ml-2 text-xs opacity-70">−20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-16 px-6 lg:px-8 border-t border-stone">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {pricing.plans.map((plan) => {
              const price = isYearly ? plan.basePrice.yearly : plan.basePrice.monthly;

              return (
                <div
                  key={plan.id}
                  className={`p-6 rounded-lg ${
                    plan.highlighted
                      ? "bg-ink text-cream"
                      : "bg-stone/30"
                  }`}
                >
                  <h3 className="font-semibold text-lg mb-1">{plan.name}</h3>
                  <p className={`text-sm mb-6 ${plan.highlighted ? "text-cream/60" : "text-ink/60"}`}>
                    {plan.description}
                  </p>

                  <div className="mb-6">
                    {price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-4xl">€{price}</span>
                        <span className={`text-sm ${plan.highlighted ? "text-cream/60" : "text-ink/60"}`}>
                          /employee/month
                        </span>
                      </div>
                    ) : (
                      <span className="font-display text-2xl">Contact us</span>
                    )}
                  </div>

                  <ul className="space-y-2 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className={plan.highlighted ? "text-cream/60" : "text-ink/60"}>→</span>
                        <span className={plan.highlighted ? "text-cream/80" : ""}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.id === "enterprise" ? "/contact" : "/onboarding"}
                    className={`block text-center py-3 rounded-lg font-medium transition-colors ${
                      plan.highlighted
                        ? "bg-cream text-ink hover:bg-cream/90"
                        : "bg-ink text-cream hover:bg-ink/90"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 lg:px-8 border-t border-stone">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl mb-10">Questions</h2>
          <div className="space-y-8">
            {pricing.faq.map((item, i) => (
              <div key={i}>
                <h3 className="font-medium mb-2">{item.question}</h3>
                <p className="text-ink/60">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8 bg-ink text-cream">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            Try it free for {pricing.trial.days} days
          </h2>
          <p className="text-cream/60 text-xl mb-8">
            Get started in 10 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={navigation.cta.primary.href}
              className="bg-cream text-ink px-6 py-3 rounded-lg font-medium hover:bg-cream/90 transition-colors text-center"
            >
              {navigation.cta.primary.name}
            </Link>
            <Link
              href={navigation.cta.secondary.href}
              className="border border-cream/30 text-cream px-6 py-3 rounded-lg font-medium hover:bg-cream/10 transition-colors text-center"
            >
              {navigation.cta.secondary.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
