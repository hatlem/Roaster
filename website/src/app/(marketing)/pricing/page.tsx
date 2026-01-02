"use client";

import { useState } from "react";
import Link from "next/link";
import { pricing, company, navigation } from "@/content";
import EmailCaptureForm from "@/components/EmailCaptureForm";

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
            Simple Pricing
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Plans that <em className="not-italic text-terracotta">scale</em> with you
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto mb-12">
            Start with a {pricing.trial.days}-day free trial. No credit card required.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center gap-4 mb-16">
            <span className={`font-medium ${!isYearly ? "text-ink" : "text-ink/40"}`}>
              {pricing.billingPeriods.monthly.label}
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                isYearly ? "bg-forest" : "bg-ink/20"
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  isYearly ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
            <span className={`font-medium ${isYearly ? "text-ink" : "text-ink/40"}`}>
              {pricing.billingPeriods.yearly.label}
              <span className="ml-2 text-xs bg-forest/10 text-forest px-2 py-1 rounded-full">
                Save {pricing.billingPeriods.yearly.discount}%
              </span>
            </span>
          </div>

          {/* Plans */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricing.plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl p-8 text-left ${
                  plan.highlighted
                    ? "border-2 border-terracotta shadow-xl scale-105"
                    : "border border-stone/50"
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-terracotta text-cream text-xs font-bold px-4 py-1 rounded-full">
                    {plan.badge}
                  </span>
                )}
                <h3 className="font-display text-2xl mb-2">{plan.name}</h3>
                <p className="text-ink/60 text-sm mb-6">{plan.description}</p>
                <div className="mb-6">
                  {plan.price.monthly ? (
                    <>
                      <span className="font-display text-5xl">
                        {pricing.currency} {isYearly ? plan.price.yearly : plan.price.monthly}
                      </span>
                      <span className="text-ink/40 text-sm ml-2">{plan.priceUnit}</span>
                    </>
                  ) : (
                    <span className="font-display text-3xl">Custom pricing</span>
                  )}
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <i className="fas fa-check text-forest mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.id === "enterprise" ? "/contact" : "/onboarding"}
                  className={`block text-center py-3 px-6 rounded-full font-semibold transition-all ${
                    plan.highlighted
                      ? "bg-ink text-cream hover:bg-terracotta"
                      : "bg-ink/5 text-ink hover:bg-ink/10"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-4xl text-center mb-12">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {pricing.faq.map((item, i) => (
              <div key={i} className="border-b border-stone pb-6">
                <h3 className="font-semibold text-lg mb-2">{item.question}</h3>
                <p className="text-ink/60">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="font-display text-5xl mb-6">
            Start your free trial today
          </h2>
          <p className="text-xl text-cream/60 mb-10">
            {pricing.trial.days} days free. No credit card required.
          </p>
          <EmailCaptureForm variant="dark" className="max-w-xl mx-auto" />
        </div>
      </section>
    </>
  );
}
