import Link from 'next/link';
import { getDictionary } from '@/i18n/dictionaries';
import { countryToLocale, type Locale } from '@/i18n/config';
import { getCountryConfig } from '@/i18n/countries';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale: country } = await params;
  const locale = (countryToLocale[country as keyof typeof countryToLocale] || 'en') as Locale;
  const dict = getDictionary(locale);
  const countryConfig = getCountryConfig(locale);

  const stats = {
    complianceRate: '99.2%',
    timeSaved: '60%',
    customersCount: '500+',
    employeesScheduled: '25k+',
  };

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden noise-bg">
        <div className="accent-circle w-[600px] h-[600px] bg-terracotta/15 -top-32 -right-32" />
        <div className="accent-circle w-[400px] h-[400px] bg-ocean/10 bottom-0 left-0" style={{ animationDelay: '-5s' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="feature-tag mb-6 inline-flex animate-fade-up">
                <span className="w-2 h-2 bg-forest rounded-full mr-2" />
                {dict.hero.tagline}
              </span>
              <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6 animate-fade-up delay-1">
                {dict.hero.title}{' '}
                <em className="not-italic text-terracotta">{dict.hero.titleEmphasis}</em>
              </h1>
              <p className="text-xl text-ink/55 mb-10 leading-relaxed max-w-lg animate-fade-up delay-2">
                {dict.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-3">
                <Link href="/demo" className="btn-primary group">
                  {dict.nav.startTrial}
                  <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/demo" className="btn-secondary">
                  {dict.nav.scheduleDemo}
                </Link>
              </div>
            </div>

            {/* Compliance Dashboard Mockup */}
            <div className="relative animate-fade-up delay-4">
              <div className="bg-white rounded-2xl p-8 shadow-2xl shadow-ink/8 border border-stone/40 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center">
                      <i className="fas fa-shield-alt text-forest" />
                    </div>
                    <span className="font-semibold text-sm tracking-tight">{dict.common.complianceDashboard}</span>
                  </div>
                  <span className="px-3 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full tracking-wide">
                    {dict.common.allClear}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-cream rounded-xl p-4 border border-stone/30">
                    <p className="text-xs text-ink/45 mb-1">{dict.features.items['rest-periods'].title}</p>
                    <p className="text-2xl font-display font-medium text-forest">100%</p>
                  </div>
                  <div className="bg-cream rounded-xl p-4 border border-stone/30">
                    <p className="text-xs text-ink/45 mb-1">{dict.features.items['14-day-rule'].title}</p>
                    <p className="text-2xl font-display font-medium text-forest">OK</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3.5 shadow-lg border border-stone/40 float z-20">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-forest" />
                  <span className="text-sm font-semibold">{countryConfig.laborLaw.shortName}</span>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 w-full h-full bg-gradient-to-br from-terracotta/8 to-gold/5 rounded-2xl -z-10" />
            </div>
          </div>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone/60 to-transparent" />
      </section>

      {/* Problem / Solution */}
      <section className="py-28 bg-warm-dark text-cream relative overflow-hidden noise-bg">
        <div className="accent-circle w-[500px] h-[500px] bg-terracotta/8 -top-32 -left-32" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-20 items-start">
            {/* Problem */}
            <div>
              <span className="feature-tag bg-cream/8 text-cream/70 mb-6 inline-flex">
                {dict.problem.tagline}
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">
                {dict.problem.title}{' '}
                <em className="not-italic text-terracotta">{dict.problem.titleEmphasis}</em>
              </h2>
              <p className="text-lg text-cream/50 mb-10 leading-relaxed">
                {dict.problem.description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-white/[0.04] rounded-xl border border-cream/6 hover:border-cream/12 transition-colors">
                  <div className="w-11 h-11 bg-terracotta/15 rounded-lg flex items-center justify-center shrink-0">
                    <i className="fas fa-exclamation-triangle text-terracotta text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-[0.95rem]">{dict.problem.fines}</p>
                    <p className="text-sm text-cream/40">{dict.problem.finesDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/[0.04] rounded-xl border border-cream/6 hover:border-cream/12 transition-colors">
                  <div className="w-11 h-11 bg-terracotta/15 rounded-lg flex items-center justify-center shrink-0">
                    <i className="fas fa-clock text-terracotta text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-[0.95rem]">10+ {dict.problem.hours}</p>
                    <p className="text-sm text-cream/40">{dict.problem.hoursDesc}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Solution */}
            <div>
              <span className="feature-tag bg-forest/20 text-forest mb-6 inline-flex">
                {dict.solution.tagline}
              </span>
              <h2 className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">
                {dict.solution.title}{' '}
                <em className="not-italic text-forest">{dict.solution.titleEmphasis}</em>
              </h2>
              <p className="text-lg text-cream/50 mb-10 leading-relaxed">
                {dict.solution.description}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-forest/8 rounded-xl border border-forest/15 hover:border-forest/25 transition-colors">
                  <div className="w-11 h-11 bg-forest/15 rounded-lg flex items-center justify-center shrink-0">
                    <i className="fas fa-shield-alt text-forest text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-[0.95rem]">{stats.complianceRate} {dict.solution.complianceRate}</p>
                    <p className="text-sm text-cream/40">{dict.solution.complianceRateDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-forest/8 rounded-xl border border-forest/15 hover:border-forest/25 transition-colors">
                  <div className="w-11 h-11 bg-forest/15 rounded-lg flex items-center justify-center shrink-0">
                    <i className="fas fa-bolt text-forest text-sm" />
                  </div>
                  <div>
                    <p className="font-semibold text-[0.95rem]">{stats.timeSaved} {dict.solution.timeSaved}</p>
                    <p className="text-sm text-cream/40">{dict.solution.timeSavedDesc}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-28 relative noise-bg overflow-hidden">
        <div className="accent-circle w-[500px] h-[500px] bg-ocean/8 -bottom-40 right-[-200px]" style={{ animationDelay: '-8s' }} />

        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <span className="feature-tag mb-6 inline-flex">
              <span className="w-2 h-2 bg-terracotta rounded-full mr-2" />
              {dict.features.tagline}
            </span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl mb-5">
              {dict.features.title}
            </h2>
            <p className="text-lg text-ink/50 max-w-2xl mx-auto">
              {dict.features.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(dict.features.items).map(([id, feature]) => (
              <div
                key={id}
                className="group card-hover bg-white p-7 rounded-xl border border-stone/40 hover:border-stone/70 transition-all duration-300"
              >
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <i className="fas fa-check-circle text-xl text-ocean" />
                </div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-terracotta transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-ink/50 leading-relaxed text-[0.95rem]">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link
              href="/features"
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-terracotta transition-colors group"
            >
              {dict.features.seeAll}
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-stone/30 via-stone/15 to-transparent" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="group">
              <p className="font-display text-6xl md:text-7xl text-ink mb-2 group-hover:scale-105 transition-transform duration-300">
                {stats.customersCount}
              </p>
              <p className="text-ink/50 font-medium text-sm tracking-wide">{dict.stats.businesses}</p>
            </div>
            <div className="group">
              <p className="font-display text-6xl md:text-7xl text-ink mb-2 group-hover:scale-105 transition-transform duration-300">
                {stats.employeesScheduled}
              </p>
              <p className="text-ink/50 font-medium text-sm tracking-wide">{dict.stats.employees}</p>
            </div>
            <div className="group">
              <p className="font-display text-6xl md:text-7xl text-terracotta mb-2 group-hover:scale-105 transition-transform duration-300">
                {stats.complianceRate}
              </p>
              <p className="text-ink/50 font-medium text-sm tracking-wide">{dict.stats.complianceRate}</p>
            </div>
            <div className="group">
              <p className="font-display text-6xl md:text-7xl text-forest mb-2 group-hover:scale-105 transition-transform duration-300">
                {stats.timeSaved}
              </p>
              <p className="text-ink/50 font-medium text-sm tracking-wide">{dict.stats.timeSaved}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-warm-dark text-cream relative overflow-hidden noise-bg">
        <div className="accent-circle w-[600px] h-[600px] bg-terracotta/8 -top-32 left-1/2 -translate-x-1/2" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="font-display text-4xl md:text-5xl lg:text-7xl mb-6 leading-[1.05]">
            {dict.cta.title}{' '}
            <em className="not-italic text-terracotta">{dict.cta.titleEmphasis}</em>
          </h2>
          <p className="text-lg text-cream/45 mb-12 max-w-2xl mx-auto leading-relaxed">
            {dict.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/demo"
              className="bg-cream text-ink px-7 py-3.5 rounded-lg text-base font-semibold hover:bg-cream/90 transition-all hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center justify-center gap-2 group"
            >
              {dict.nav.startTrial}
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/demo"
              className="bg-white/[0.06] text-cream px-7 py-3.5 rounded-lg text-base font-semibold hover:bg-white/[0.12] transition-all inline-flex items-center justify-center border border-cream/15"
            >
              {dict.nav.scheduleDemo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
