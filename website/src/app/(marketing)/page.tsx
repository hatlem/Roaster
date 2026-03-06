import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import { laborLawByLocale } from "@/i18n/config";

export default async function HomePage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const lawRef = laborLawByLocale[locale];

  return (
    <>
      {/* Hero */}
      <section className="relative pt-36 pb-28 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[500px] h-[500px] -top-40 -right-40"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)" }}
        />
        <div
          className="warm-orb w-[400px] h-[400px] bottom-0 left-[-200px]"
          style={{ background: "radial-gradient(circle, var(--gold), transparent)", animationDelay: "-5s" }}
        />

        <div className="max-w-5xl mx-auto">
          <div className="max-w-3xl">
            <p className="text-terracotta mb-5 tracking-widest uppercase text-xs font-semibold animate-fade-up">
              {dict.homePage.heroTagline}
            </p>
            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-[1.05] mb-8 animate-fade-up delay-1">
              {dict.content.companyTagline}
            </h1>
            <p className="text-xl md:text-2xl text-ink/55 mb-12 leading-relaxed max-w-2xl animate-fade-up delay-2">
              {dict.content.companyDescription}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-3">
              <Link href="/onboarding" className="btn-primary">
                {dict.common.startFreeTrial}
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link href="/demo" className="btn-secondary">
                {dict.common.bookADemo}
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto mt-20">
          <div className="accent-line animate-line-reveal delay-5" />
        </div>
      </section>

      {/* Rules */}
      <section className="relative py-24 bg-warm-dark text-cream overflow-hidden grain">
        <div
          className="warm-orb w-[600px] h-[600px] top-[-200px] right-[-200px]"
          style={{ background: "radial-gradient(circle, var(--terracotta), transparent)", opacity: 0.06 }}
        />

        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            <div className="lg:col-span-5">
              <p className="text-terracotta mb-4 tracking-widest uppercase text-xs font-semibold animate-fade-up">
                {lawRef.name}
              </p>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] animate-fade-up delay-1">
                {dict.homePage.rulesTitle}
              </h2>
            </div>
            <div className="lg:col-span-7 lg:pt-12">
              <p className="text-cream/50 text-lg leading-relaxed max-w-lg animate-fade-up delay-2">
                {dict.homePage.rulesDescription}
              </p>
            </div>
          </div>

          <div className="space-y-0">
            {dict.content.rules.map((rule, index) => (
              <div
                key={index}
                className="group grid md:grid-cols-12 gap-6 py-7 border-t border-cream/8 hover:bg-cream/[0.03] transition-all duration-300 -mx-6 px-6 rounded-lg"
              >
                <div className="md:col-span-2">
                  <span className="font-mono text-terracotta text-sm font-medium rule-number">{rule.law}</span>
                </div>
                <div className="md:col-span-3">
                  <h3 className="font-semibold text-lg group-hover:text-terracotta transition-colors duration-300">{rule.title}</h3>
                </div>
                <div className="md:col-span-5">
                  <p className="text-cream/50 group-hover:text-cream/70 transition-colors duration-300">{rule.description}</p>
                </div>
                <div className="md:col-span-2 flex items-center justify-end">
                  <span className="inline-flex items-center gap-2 text-xs text-cream/30 uppercase tracking-wide group-hover:text-forest transition-colors duration-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-forest opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {dict.common.tracked}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative py-24 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[500px] h-[500px] -bottom-60 right-[-100px]"
          style={{ background: "radial-gradient(circle, var(--ocean), transparent)", animationDelay: "-8s" }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-20">
            <p className="text-ocean mb-4 tracking-widest uppercase text-xs font-semibold">
              {dict.homePage.howItWorks}
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
              {dict.homePage.scheduleValidateDone}
            </h2>
            <p className="text-ink/50 text-lg">
              {dict.homePage.threeSteps}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dict.content.mainFeatures.map((feature, index) => (
              <div
                key={index}
                className="group card-hover p-7 rounded-xl bg-stone/25 border border-stone/40 hover:border-stone/70 transition-colors duration-300"
              >
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `var(--${feature.color})` }}
                >
                  <i className={`fas fa-${feature.icon} text-cream text-sm`} />
                </div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-terracotta transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-ink/55 leading-relaxed text-[0.95rem]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo */}
      <section className="relative py-24 overflow-hidden grain">
        <div className="absolute inset-0 bg-gradient-to-br from-stone/40 via-stone/20 to-transparent" />

        <div className="relative max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="inline-block mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 text-terracotta text-sm font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta animate-pulse" />
              {dict.homePage.demoAvailable}
            </span>
          </div>
          <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
            {dict.homePage.seeItInAction}
          </h2>
          <p className="text-xl text-ink/55 mb-12 max-w-2xl mx-auto leading-relaxed">
            {dict.homePage.demoDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="btn-primary">
              {dict.common.bookADemo}
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/onboarding" className="btn-secondary">
              {dict.homePage.orStartTrial}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative py-28 px-6 lg:px-8 overflow-hidden grain">
        <div
          className="warm-orb w-[400px] h-[400px] top-[-100px] left-[-100px]"
          style={{ background: "radial-gradient(circle, var(--gold), transparent)", animationDelay: "-3s" }}
        />

        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-12 items-end">
          <div className="lg:col-span-7">
            <p className="text-gold mb-4 tracking-widest uppercase text-xs font-semibold">
              {lawRef.shortName}
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-6">
              {dict.homePage.localSoftwareTitle}
            </h2>
            <p className="text-xl text-ink/55 leading-relaxed max-w-xl">
              {dict.homePage.localSoftwareDescription}
            </p>
          </div>
          <div className="lg:col-span-5 lg:text-right">
            <Link
              href="/about"
              className="inline-flex items-center gap-3 font-semibold text-lg hover:text-terracotta transition-colors group"
            >
              {dict.homePage.aboutUs}
              <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
