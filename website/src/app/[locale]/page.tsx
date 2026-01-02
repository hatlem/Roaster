import Link from 'next/link';
import { getDictionary } from '@/i18n/dictionaries';
import { countryToLocale, localeToCountry, laborLawByLocale, type Locale } from '@/i18n/config';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale: country } = await params;
  const locale = countryToLocale[country as keyof typeof countryToLocale] || 'en';
  const dict = getDictionary(locale);
  const laborLaw = laborLawByLocale[locale];

  // Stats (would come from API in production)
  const stats = {
    complianceRate: '99.2%',
    timeSaved: '60%',
    customersCount: '500+',
    employeesScheduled: '25k+',
  };

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
                {dict.hero.tagline}
              </span>
              <h1 className="font-display text-5xl md:text-7xl leading-[1.05] mb-6">
                {dict.hero.title} <em className="not-italic text-terracotta">{dict.hero.titleEmphasis}</em>
              </h1>
              <p className="text-xl text-ink/60 mb-8 leading-relaxed max-w-lg">
                {dict.hero.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href={`/${country}/demo`} className="btn-primary group">
                  {dict.nav.startTrial}
                  <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href={`/${country}/demo`} className="btn-secondary">
                  {dict.nav.scheduleDemo}
                </Link>
              </div>
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
                    <p className="text-xs text-ink/50 mb-1">{dict.features.items['rest-periods'].title}</p>
                    <p className="text-2xl font-display font-medium text-forest">100%</p>
                  </div>
                  <div className="bg-cream rounded-2xl p-4">
                    <p className="text-xs text-ink/50 mb-1">{dict.features.items['14-day-rule'].title}</p>
                    <p className="text-2xl font-display font-medium text-forest">OK</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl border border-stone/50 float z-20">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-forest text-lg" />
                  <span className="text-sm font-semibold">{laborLaw.shortName}</span>
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
                {dict.problem.tagline}
              </span>
              <h2 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
                {dict.problem.title} <em className="not-italic text-terracotta">{dict.problem.titleEmphasis}</em>
              </h2>
              <p className="text-xl text-cream/60 mb-8 leading-relaxed">
                {dict.problem.description}
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-terracotta/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-exclamation-triangle text-terracotta" />
                  </div>
                  <div>
                    <p className="font-semibold">500,000+ {dict.problem.fines}</p>
                    <p className="text-sm text-cream/50">{dict.problem.finesDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-terracotta/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-clock text-terracotta" />
                  </div>
                  <div>
                    <p className="font-semibold">10+ {dict.problem.hours}</p>
                    <p className="text-sm text-cream/50">{dict.problem.hoursDesc}</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="feature-tag bg-forest/20 text-forest mb-6 inline-block">
                {dict.solution.tagline}
              </span>
              <h2 className="font-display text-5xl md:text-6xl leading-[1.05] mb-6">
                {dict.solution.title} <em className="not-italic text-forest">{dict.solution.titleEmphasis}</em>
              </h2>
              <p className="text-xl text-cream/60 mb-8 leading-relaxed">
                {dict.solution.description}
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-forest/10 rounded-2xl border border-forest/20">
                  <div className="w-12 h-12 bg-forest/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-shield-alt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">{stats.complianceRate} {dict.solution.complianceRate}</p>
                    <p className="text-sm text-cream/50">{dict.solution.complianceRateDesc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-forest/10 rounded-2xl border border-forest/20">
                  <div className="w-12 h-12 bg-forest/20 rounded-xl flex items-center justify-center">
                    <i className="fas fa-bolt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">{stats.timeSaved} {dict.solution.timeSaved}</p>
                    <p className="text-sm text-cream/50">{dict.solution.timeSavedDesc}</p>
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
              {dict.features.tagline}
            </span>
            <h2 className="font-display text-5xl md:text-6xl mb-4">
              {dict.features.title}
            </h2>
            <p className="text-xl text-ink/60 max-w-2xl mx-auto">
              {dict.features.subtitle}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(dict.features.items).map(([id, feature]) => (
              <div
                key={id}
                className="bg-white p-8 rounded-3xl border border-stone/50 hover:shadow-xl hover:border-ink/10 transition-all group"
              >
                <div className="w-14 h-14 bg-ocean/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <i className="fas fa-check-circle text-2xl text-ocean" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-ink/60">{feature.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link
              href={`/${country}/features`}
              className="inline-flex items-center gap-2 text-ink font-semibold hover:text-terracotta transition-colors group"
            >
              {dict.features.seeAll}
              <i className="fas fa-arrow-right text-sm group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-stone/30 relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-6xl md:text-7xl text-ink mb-2">
                {stats.customersCount}
              </p>
              <p className="text-ink/60 font-medium">{dict.stats.businesses}</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-ink mb-2">
                {stats.employeesScheduled}
              </p>
              <p className="text-ink/60 font-medium">{dict.stats.employees}</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-terracotta mb-2">
                {stats.complianceRate}
              </p>
              <p className="text-ink/60 font-medium">{dict.stats.complianceRate}</p>
            </div>
            <div>
              <p className="font-display text-6xl md:text-7xl text-forest mb-2">
                {stats.timeSaved}
              </p>
              <p className="text-ink/60 font-medium">{dict.stats.timeSaved}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="accent-circle w-[600px] h-[600px] bg-terracotta/10 -top-32 left-1/2 -translate-x-1/2 blur-3xl" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <h2 className="font-display text-5xl md:text-7xl mb-6">
            {dict.cta.title} <em className="not-italic text-terracotta">{dict.cta.titleEmphasis}</em>
          </h2>
          <p className="text-xl text-cream/60 mb-10 max-w-2xl mx-auto">
            {dict.cta.description}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href={`/${country}/demo`}
              className="bg-cream text-ink px-8 py-4 rounded-full text-lg font-semibold hover:bg-cream/90 transition-all hover:scale-105 inline-flex items-center justify-center gap-2 group"
            >
              {dict.nav.startTrial}
              <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href={`/${country}/demo`}
              className="bg-white/10 text-cream px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all inline-flex items-center justify-center border border-white/20"
            >
              {dict.nav.scheduleDemo}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
