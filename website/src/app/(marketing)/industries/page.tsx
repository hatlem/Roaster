import Link from "next/link";
import { industries, navigation } from "@/content";

export const metadata = {
  title: "Industries",
  description: "Tailored compliance solutions for every industry.",
};

export default function IndustriesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
            Industries
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Built for <em className="not-italic text-terracotta">your</em> industry
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Tailored compliance solutions for every sector
          </p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {industries.map((industry) => (
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
                  <h4 className="font-semibold text-sm mb-3">Key challenges:</h4>
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
                  <h4 className="font-semibold text-sm mb-3">How we help:</h4>
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
            Ready to get started?
          </h2>
          <p className="text-xl text-cream/60 mb-10">
            See how we can help your industry stay compliant.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={navigation.cta.primary.href} className="bg-cream text-ink px-8 py-4 rounded-full font-semibold hover:bg-cream/90 transition-all inline-flex items-center justify-center gap-2">
              {navigation.cta.primary.name}
              <i className="fas fa-arrow-right" />
            </Link>
            <Link href={navigation.cta.secondary.href} className="bg-white/10 text-cream px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20">
              {navigation.cta.secondary.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
