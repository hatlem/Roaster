import Link from "next/link";
import { company, navigation, features } from "@/content";

export default function HomePage() {
  return (
    <>
      {/* Hero - Simple and direct */}
      <section className="pt-32 pb-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-ink/50 mb-4 tracking-wide uppercase text-sm">
            Scheduling software for Norway
          </p>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl leading-[1.1] mb-6">
            {company.tagline}
          </h1>
          <p className="text-xl md:text-2xl text-ink/60 mb-10 leading-relaxed max-w-2xl">
            {company.description}
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

      {/* The actual rules we enforce */}
      <section className="py-20 bg-ink text-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-cream/50 mb-4 tracking-wide uppercase text-sm">
              Arbeidsmiljøloven Chapter 10
            </p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight mb-4">
              The rules we track
            </h2>
            <p className="text-cream/60 text-lg">
              Norwegian working time regulations have specific requirements.
              Miss one and your employees can refuse shifts—or worse, Arbeidstilsynet gets involved.
            </p>
          </div>

          <div className="space-y-px">
            {features.rules.map((rule, index) => (
              <div
                key={rule.id}
                className="group grid md:grid-cols-12 gap-6 py-8 border-t border-cream/10 hover:bg-cream/5 transition-colors -mx-6 px-6"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-terracotta text-sm">{rule.law}</span>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-semibold text-lg">{rule.title}</h3>
                </div>
                <div className="md:col-span-5">
                  <p className="text-cream/60">{rule.description}</p>
                </div>
                <div className="md:col-span-2 text-right">
                  <span className="text-xs text-cream/40 uppercase tracking-wide">
                    {index === 0 ? "→ Tracked" : "Tracked"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works - simple grid */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-ink/50 mb-4 tracking-wide uppercase text-sm">
              How it works
            </p>
            <h2 className="font-display text-4xl md:text-5xl leading-tight">
              Schedule. Validate. Done.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
            {features.main.map((feature) => (
              <div key={feature.id} className="group">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                  style={{ backgroundColor: `var(--${feature.color})` }}
                >
                  <i className={`fas fa-${feature.icon} text-cream`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-ink/60 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simple demo section */}
      <section className="py-20 bg-stone/30">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            See it in action
          </h2>
          <p className="text-xl text-ink/60 mb-10 max-w-2xl mx-auto">
            Book a 20-minute demo. We&apos;ll show you how Roaster handles your specific scheduling needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="btn-primary">
              Book a demo
            </Link>
            <Link href="/onboarding" className="btn-secondary">
              Or start a free trial
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA - Honest startup message */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <p className="text-ink/50 mb-4 tracking-wide uppercase text-sm">
            Built in Oslo
          </p>
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            Norwegian law, Norwegian software
          </h2>
          <p className="text-xl text-ink/60 mb-8 leading-relaxed">
            We&apos;re a small team focused on one thing: making Norwegian labor law compliance automatic.
            No generic &ldquo;international&rdquo; solution—just deep knowledge of Arbeidsmiljøloven built into every feature.
          </p>
          <Link
            href="/about"
            className="inline-flex items-center gap-2 font-semibold hover:text-terracotta transition-colors group"
          >
            About us
            <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </>
  );
}
