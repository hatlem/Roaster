import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.industriesPage.metaTitle,
    description: dict.industriesPage.metaDescription,
  };
}

export default async function IndustriesPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
            {dict.industriesPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.industriesPage.title} <em className="not-italic text-terracotta">{dict.industriesPage.titleEmphasis}</em> {dict.industriesPage.titleEnd}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.industriesPage.subtitle}
          </p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dict.content.industries.map((industry) => (
              <div
                key={industry.id}
                id={industry.id}
                className="bg-cream/50 rounded-3xl p-8 border border-stone/50 hover:shadow-xl transition-all"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ backgroundColor: `var(--${industry.color}, #3a6b7c)` + "1a" }}
                >
                  <i
                    className={`fas fa-${industry.icon} text-3xl`}
                    style={{ color: `var(--${industry.color}, #3a6b7c)` }}
                  />
                </div>
                <h3 className="font-display text-2xl mb-2">{industry.name}</h3>
                <p className="text-ink/60 mb-6">{industry.description}</p>

                <div className="mb-6">
                  <h4 className="font-semibold text-sm mb-3">{dict.industriesPage.keyChallenges}</h4>
                  <ul className="space-y-2">
                    {industry.challenges.map((challenge, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink/60">
                        <i className="fas fa-exclamation-circle text-terracotta/60 mt-0.5" />
                        {challenge}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-3">{dict.industriesPage.howWeHelp}</h4>
                  <ul className="space-y-2">
                    {industry.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-ink/60">
                        <i className="fas fa-check-circle text-forest mt-0.5" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-5xl mb-6">
            {dict.common.readyToGetStarted}
          </h2>
          <p className="text-xl text-cream/60 mb-10">
            {dict.industriesPage.ctaDescription}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/onboarding" className="bg-cream text-ink px-8 py-4 rounded-full font-semibold hover:bg-cream/90 transition-all inline-flex items-center justify-center gap-2">
              {dict.common.startFreeTrial}
              <i className="fas fa-arrow-right" />
            </Link>
            <Link href="/demo" className="bg-white/10 text-cream px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20">
              {dict.common.bookADemo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
