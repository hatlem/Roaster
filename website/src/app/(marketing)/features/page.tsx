import Link from "next/link";
import { features, navigation } from "@/content";

export const metadata = {
  title: "How it works | Roaster",
  description: "Automatic compliance with Norwegian working time regulations",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6">
            {features.hero.title}
          </h1>
          <p className="text-xl text-ink/60 leading-relaxed">
            {features.hero.subtitle}
          </p>
        </div>
      </section>

      {/* The rules section */}
      <section className="py-16 px-6 lg:px-8 border-t border-stone">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink/50 mb-10">
            Arbeidsmiljøloven compliance
          </h2>

          <div className="space-y-12">
            {features.rules.map((rule) => (
              <div key={rule.id} className="grid md:grid-cols-12 gap-6 pb-12 border-b border-stone/50 last:border-0">
                <div className="md:col-span-2">
                  <span className="font-mono text-terracotta font-medium">{rule.law}</span>
                </div>
                <div className="md:col-span-4">
                  <h3 className="font-display text-2xl mb-2">{rule.title}</h3>
                </div>
                <div className="md:col-span-6">
                  <p className="text-ink/60 mb-3">{rule.description}</p>
                  <p className="text-sm text-ink/40">
                    <span className="text-terracotta">→</span> {rule.consequence}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product features */}
      <section className="py-20 px-6 lg:px-8 bg-ink text-cream">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-cream/50 mb-10">
            Product features
          </h2>

          <div className="grid md:grid-cols-2 gap-x-16 gap-y-12">
            {features.main.map((feature) => (
              <div key={feature.id}>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `var(--${feature.color})` }}
                >
                  <i className={`fas fa-${feature.icon} text-cream`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-cream/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            Try it free for 14 days
          </h2>
          <p className="text-xl text-ink/60 mb-8">
            Set up takes 10 minutes. No credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href={navigation.cta.primary.href} className="btn-primary">
              {navigation.cta.primary.name}
            </Link>
            <Link href={navigation.cta.secondary.href} className="btn-secondary">
              {navigation.cta.secondary.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
