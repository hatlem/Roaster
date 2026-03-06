import type { Metadata } from "next";
import Link from "next/link";
import { navigation, pricing } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.featuresPage.metaTitle,
    description: dict.featuresPage.metaDescription,
  };
}

export default async function FeaturesPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-20 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[500px] h-[500px] -top-40 right-[-200px]"
          style={{ background: "radial-gradient(circle, var(--forest), transparent)" }}
        />

        <div className="max-w-3xl mx-auto">
          <p className="text-forest mb-4 tracking-widest uppercase text-xs font-semibold animate-fade-up">
            {dict.featuresPage.tagline}
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.05] mb-6 animate-fade-up delay-1">
            {dict.featuresPage.metaTitle}
          </h1>
          <p className="text-xl text-ink/55 leading-relaxed animate-fade-up delay-2">
            {dict.featuresPage.metaDescription}
          </p>
        </div>

        <div className="max-w-3xl mx-auto mt-16">
          <div className="accent-line animate-line-reveal delay-4" />
        </div>
      </section>

      {/* The rules section — editorial grid */}
      <section className="py-24 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <p className="text-terracotta mb-12 tracking-widest uppercase text-xs font-semibold">
            {dict.featuresPage.complianceTagline}
          </p>

          <div className="space-y-0">
            {dict.content.rules.map((rule, index) => (
              <div key={index} className="group grid md:grid-cols-12 gap-6 py-10 border-t border-stone/60 last:border-b">
                <div className="md:col-span-2">
                  <span className="font-mono text-terracotta font-medium rule-number">{rule.law}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-display text-2xl mb-2 group-hover:text-terracotta transition-colors duration-300">
                    {rule.title}
                  </h3>
                </div>
                <div className="md:col-span-6">
                  <p className="text-ink/55 mb-3 leading-relaxed">{rule.description}</p>
                  <p className="text-sm text-ink/35 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-terracotta" />
                    {rule.consequence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product features — dark section with cards */}
      <section className="relative py-24 px-6 lg:px-8 bg-warm-dark text-cream overflow-hidden grain">
        <div
          className="warm-orb w-[600px] h-[600px] -top-60 left-[-200px]"
          style={{ background: "radial-gradient(circle, var(--ocean), transparent)", opacity: 0.08 }}
        />

        <div className="max-w-6xl mx-auto">
          <p className="text-ocean mb-12 tracking-widest uppercase text-xs font-semibold">
            {dict.featuresPage.productFeatures}
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            {dict.content.mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="group p-7 rounded-xl border border-cream/8 hover:border-cream/15 hover:bg-cream/[0.03] transition-all duration-300"
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `var(--${feature.color})` }}
                >
                  <i className={`fas fa-${feature.icon} text-cream text-sm`} />
                </div>
                <h3 className="text-xl font-semibold mb-2 group-hover:text-terracotta transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-cream/50 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-28 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[400px] h-[400px] top-[-100px] right-[-100px]"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", animationDelay: "-7s" }}
        />

        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
            {dict.common.tryFreeForDays.replace('{days}', String(pricing.trial.days))}
          </h2>
          <p className="text-xl text-ink/55 mb-10">
            {dict.featuresPage.setupTime}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={navigation.cta.primary.href} className="btn-primary">
              {dict.common.startFreeTrial}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href={navigation.cta.secondary.href} className="btn-secondary">
              {dict.common.bookADemo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
