import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const benefitIcons = [
  "fa-money-bill-wave",
  "fa-home",
  "fa-heart",
  "fa-graduation-cap",
  "fa-laptop",
  "fa-users",
];

const perkIcons = [
  "fa-rocket",
  "fa-lightbulb",
  "fa-chart-line",
];

const perkColors = ["ocean", "forest", "gold"] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.careersPage.metaTitle,
    description: dict.careersPage.metaDescription,
  };
}

export default async function CareersPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.careersPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.careersPage.title.split(' ').slice(0, -1).join(' ')} <em className="italic">{dict.careersPage.title.split(' ').slice(-1)}</em>
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.careersPage.subtitle}
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">{dict.careersPage.whyJoinTitle}</h2>
            <p className="text-xl text-ink/60">
              {dict.careersPage.whyJoinText}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {dict.careersPage.perks.map((perk, i) => (
              <div key={i} className="bg-cream rounded-2xl p-6 text-center">
                <div className={`w-16 h-16 bg-${perkColors[i]}/10 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <i className={`fas ${perkIcons[i]} text-${perkColors[i]} text-2xl`} />
                </div>
                <h3 className="font-display text-xl mb-2">{perk.title}</h3>
                <p className="text-ink/60 text-sm">
                  {perk.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">{dict.careersPage.benefitsTitle}</h2>
            <p className="text-xl text-ink/60">{dict.careersPage.benefitsSubtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dict.careersPage.benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-2xl p-6">
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
                  <i className={`fas ${benefitIcons[i]} text-ocean text-xl`} />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-ink/60 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">{dict.careersPage.openPositions}</h2>
            <p className="text-xl text-ink/60">{dict.careersPage.findYourRole}</p>
          </div>

          <div className="space-y-4">
            {dict.careersPage.positions.map((position, i) => (
              <div key={i} className="bg-cream rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl mb-1">{position.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-ink/60">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-building" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-map-marker-alt" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock" />
                        {dict.common.fullTime}
                      </span>
                    </div>
                  </div>
                  <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
                    {dict.common.applyNow}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* No Position? */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">{dict.careersPage.dontSeeRole}</h2>
          <p className="text-xl text-white/60 mb-8">
            {dict.careersPage.dontSeeRoleText}
          </p>
          <Link href="/contact" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            {dict.common.getInTouch} <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
