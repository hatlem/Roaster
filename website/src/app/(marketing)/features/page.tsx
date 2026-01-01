import Link from "next/link";
import { features, complianceStats, navigation } from "@/content";

export const metadata = {
  title: "Features",
  description: "Comprehensive compliance features designed for Norwegian businesses",
};

export default function FeaturesPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
            Compliance Features
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {features.hero.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {features.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Main Features */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.main.map((feature) => (
              <div
                key={feature.id}
                className="bg-cream/50 p-8 rounded-3xl border border-stone/50 hover:shadow-xl transition-all group"
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"
                  style={{ backgroundColor: `var(--${feature.color}, #3a6b7c)` + "1a" }}
                >
                  <i
                    className={`fas fa-${feature.icon} text-3xl`}
                    style={{ color: `var(--${feature.color}, #3a6b7c)` }}
                  />
                </div>
                <h3 className="font-display text-2xl mb-3">{feature.title}</h3>
                <p className="text-ink/60 mb-4">{feature.description}</p>
                {feature.lawReference && (
                  <span className="inline-block bg-ink/5 text-ink/60 text-xs font-medium px-3 py-1 rounded-full">
                    {feature.lawReference}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-6xl mb-2">{complianceStats.customersCount}</p>
              <p className="text-cream/60">Norwegian businesses</p>
            </div>
            <div>
              <p className="font-display text-6xl mb-2">{complianceStats.employeesScheduled}</p>
              <p className="text-cream/60">Employees scheduled</p>
            </div>
            <div>
              <p className="font-display text-6xl text-terracotta mb-2">{complianceStats.complianceRate}</p>
              <p className="text-cream/60">Compliance rate</p>
            </div>
            <div>
              <p className="font-display text-6xl text-forest mb-2">{complianceStats.timeSaved}</p>
              <p className="text-cream/60">Time saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Extended Features */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl mb-4">Everything you need</h2>
            <p className="text-xl text-ink/60">Beyond compliance, we help you work smarter</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.extended.map((feature) => (
              <div
                key={feature.id}
                className="bg-white p-6 rounded-2xl border border-stone/50 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
                  <i className={`fas fa-${feature.icon} text-ocean text-xl`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-ink/60 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-5xl mb-6">
            Ready to see it in action?
          </h2>
          <p className="text-xl text-ink/60 mb-10">
            Start your free 14-day trial today.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={navigation.cta.primary.href} className="btn-primary">
              {navigation.cta.primary.name}
              <i className="fas fa-arrow-right" />
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
