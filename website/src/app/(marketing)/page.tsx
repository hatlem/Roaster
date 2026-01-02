import Link from "next/link";
import { company, navigation, features, complianceStats, testimonials, industries } from "@/content";
import EmailCaptureForm from "@/components/EmailCaptureForm";

export default function HomePage() {
  const featuredTestimonial = testimonials.find((t) => t.featured);

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center bg-cream noise-bg overflow-hidden">
        <div className="accent-circle w-[600px] h-[600px] bg-terracotta/10 -top-32 -right-32 blur-3xl" />
        <div className="accent-circle w-[400px] h-[400px] bg-ocean/10 bottom-0 left-0 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-forest rounded-full mr-2" />
                Built for Arbeidsmiljoloven
              </span>
              <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6">
                Schedule with <em className="not-italic text-terracotta">confidence</em>
              </h1>
              <p className="text-xl text-ink/60 mb-8 leading-relaxed max-w-lg">
                {company.description}
              </p>
              <EmailCaptureForm variant="light" className="max-w-xl" />
              <p className="text-sm text-ink/50 mt-3">
                14-day free trial. No credit card required.
              </p>
            </div>

            {/* Compliance Dashboard Mockup */}
            <div className="relative animate-fade-in-up animate-delay-3">
              <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-ink/10 border border-stone/50 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
                      <i className="fas fa-shield-alt text-forest" />
                    </div>
                    <span className="font-semibold">Compliance Dashboard</span>
                  </div>
                  <span className="px-3 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full">
                    ALL CLEAR
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-cream rounded-2xl p-4">
                    <p className="text-xs text-ink/50 mb-1">Rest Periods</p>
                    <p className="text-2xl font-display font-medium text-forest">100%</p>
                    <p className="text-xs text-ink/40">All employees compliant</p>
                  </div>
                  <div className="bg-cream rounded-2xl p-4">
                    <p className="text-xs text-ink/50 mb-1">14-Day Rule</p>
                    <p className="text-2xl font-display font-medium text-forest">On Track</p>
                    <p className="text-xs text-ink/40">Published 16 days ahead</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-forest/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-ocean/20 flex items-center justify-center text-xs font-bold">
                        E1
                      </div>
                      <div>
                        <p className="text-sm font-medium">Employee 1</p>
                        <p className="text-xs text-ink/50">Next shift: Tomorrow 08:00</p>
                      </div>
                    </div>
                    <span className="text-xs text-forest font-medium">14h rest</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-forest/5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-terracotta/20 flex items-center justify-center text-xs font-bold">
                        E2
                      </div>
                      <div>
                        <p className="text-sm font-medium">Employee 2</p>
                        <p className="text-xs text-ink/50">Next shift: Wed 14:00</p>
                      </div>
                    </div>
                    <span className="text-xs text-forest font-medium">48h rest</span>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-stone/50 float z-20">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-forest text-lg" />
                  <span className="text-sm font-semibold">AML Compliant</span>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-full h-full bg-terracotta/10 rounded-3xl -z-10" />
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="accent-circle w-[500px] h-[500px] bg-terracotta/10 -top-32 -left-32 blur-3xl" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="feature-tag bg-cream/10 text-cream/80 mb-6 inline-block">
                The Problem
              </span>
              <h2 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
                Norwegian labor law is <em className="not-italic text-terracotta">complex</em>
              </h2>
              <p className="text-xl text-cream/60 mb-8 leading-relaxed">
                Arbeidsmiljoloven has strict requirements: 11-hour daily rest, 35-hour weekly rest,
                14-day publishing rules, overtime limits. Manual tracking is error-prone and
                time-consuming.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-terracotta/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-terracotta" />
                  </div>
                  <div>
                    <p className="font-semibold">Up to 500,000 NOK in fines</p>
                    <p className="text-sm text-cream/50">For serious compliance violations</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-terracotta/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-terracotta" />
                  </div>
                  <div>
                    <p className="font-semibold">10+ hours per week</p>
                    <p className="text-sm text-cream/50">Average time spent on manual compliance checks</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="feature-tag bg-forest/20 text-forest mb-6 inline-block">
                The Solution
              </span>
              <h2 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
                {company.name} handles it <em className="not-italic text-forest">automatically</em>
              </h2>
              <p className="text-xl text-cream/60 mb-8 leading-relaxed">
                Every schedule is validated in real-time against all Norwegian labor law
                requirements. Violations are prevented before they happen.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-forest/10 rounded-2xl border border-forest/20">
                  <div className="w-12 h-12 bg-forest/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-alt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">{complianceStats.complianceRate} compliance rate</p>
                    <p className="text-sm text-cream/50">Across all {company.name} customers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-forest/10 rounded-2xl border border-forest/20">
                  <div className="w-12 h-12 bg-forest/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-bolt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">{complianceStats.timeSaved} less admin time</p>
                    <p className="text-sm text-cream/50">Automated compliance saves hours every week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="feature-tag mb-6 inline-block">
              <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
              Compliance Features
            </span>
            <h2 className="font-display text-5xl md:text-6xl mb-4">
              {features.hero.title}
            </h2>
            <p className="text-xl text-ink/60 max-w-2xl mx-auto">
              {features.hero.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.main.map((feature) => (
              <div
                key={feature.id}
                className="bg-white p-8 rounded-3xl border border-stone/50 hover:shadow-xl hover:border-ink/10 transition-all group"
              >
                <div
                  className={`w-14 h-14 bg-${feature.color}/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                  style={{ backgroundColor: `var(--${feature.color}, #3a6b7c)` + "1a" }}
                >
                  <i className={`fas fa-${feature.icon} text-2xl`} style={{ color: `var(--${feature.color}, #3a6b7c)` }} />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-ink/60">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-terracotta transition-colors group"
            >
              See all features
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      {featuredTestimonial && (
        <section className="py-24 bg-white relative">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="bg-ink rounded-3xl p-12 md:p-16 text-cream relative overflow-hidden">
              <div className="accent-circle w-[400px] h-[400px] bg-terracotta/10 -top-32 -right-32 blur-3xl" />
              <div className="relative">
                <i className="fas fa-quote-left text-4xl text-cream/20 mb-8" />
                <blockquote className="font-display text-3xl md:text-4xl leading-tight mb-8">
                  &ldquo;{featuredTestimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-cream/20 rounded-full flex items-center justify-center text-lg font-bold">
                    {featuredTestimonial.author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{featuredTestimonial.author.name}</p>
                    <p className="text-cream/60">
                      {featuredTestimonial.author.role}, {featuredTestimonial.author.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="py-24 bg-stone/30 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-6xl md:text-7xl text-ink mb-2">
                {complianceStats.customersCount}
              </p>
              <p className="text-ink/60 font-medium">Norwegian businesses</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-ink mb-2">
                {complianceStats.employeesScheduled}
              </p>
              <p className="text-ink/60 font-medium">Employees scheduled</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-terracotta mb-2">
                {complianceStats.complianceRate}
              </p>
              <p className="text-ink/60 font-medium">Compliance rate</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-forest mb-2">
                {complianceStats.timeSaved}
              </p>
              <p className="text-ink/60 font-medium">Time saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl md:text-6xl mb-4">
              Works for <em className="not-italic text-terracotta">your</em> industry
            </h2>
            <p className="text-xl text-ink/60">Tailored compliance for every sector</p>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4">
            {industries.slice(0, 6).map((industry) => (
              <Link
                key={industry.id}
                href={`/industries#${industry.id}`}
                className="group bg-white p-6 rounded-2xl border border-stone/50 hover:shadow-lg hover:border-ocean/30 transition-all text-center"
              >
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                  style={{ backgroundColor: `var(--${industry.color}, #3a6b7c)` + "1a" }}
                >
                  <i className={`fas fa-${industry.icon} text-xl`} style={{ color: `var(--${industry.color}, #3a6b7c)` }} />
                </div>
                <p className="font-semibold text-sm">{industry.name}</p>
              </Link>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/industries"
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-terracotta transition-colors group"
            >
              View all industries
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="accent-circle w-[600px] h-[600px] bg-terracotta/10 -top-32 left-1/2 -translate-x-1/2 blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="font-display text-5xl md:text-7xl mb-6">
            Ready to schedule with <em className="not-italic text-terracotta">confidence?</em>
          </h2>
          <p className="text-xl text-cream/60 mb-10 max-w-2xl mx-auto">
            Start your free 14-day trial. No credit card required. Full compliance from day one.
          </p>
          <EmailCaptureForm variant="dark" className="max-w-xl mx-auto" />
        </div>
      </section>
    </>
  );
}
