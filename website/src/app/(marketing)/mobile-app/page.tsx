import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const featureIcons = [
  "fa-calendar-alt",
  "fa-exchange-alt",
  "fa-clock",
  "fa-bell",
  "fa-plane",
  "fa-comments",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.mobileAppPage.metaTitle,
    description: dict.mobileAppPage.metaDescription,
  };
}

export default async function MobileAppPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-forest rounded-full mr-2" />
                {dict.mobileAppPage.tagline}
              </span>
              <h1 className="font-display text-5xl md:text-6xl mb-6">
                {dict.mobileAppPage.title.split(' ').slice(0, -1).join(' ')} <em className="italic">{dict.mobileAppPage.title.split(' ').slice(-1)}</em>
              </h1>
              <p className="text-xl text-ink/60 mb-8">
                {dict.mobileAppPage.subtitle}
              </p>
              <div className="flex gap-4">
                <button className="bg-ink text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3 hover:bg-ink/90 transition-colors">
                  <i className="fab fa-apple text-xl" />
                  <div className="text-left">
                    <div className="text-xs opacity-70">{dict.mobileAppPage.downloadAppStore}</div>
                    <div className="font-semibold">{dict.mobileAppPage.appStore}</div>
                  </div>
                </button>
                <button className="bg-ink text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3 hover:bg-ink/90 transition-colors">
                  <i className="fab fa-google-play text-xl" />
                  <div className="text-left">
                    <div className="text-xs opacity-70">{dict.mobileAppPage.getItOn}</div>
                    <div className="font-semibold">{dict.mobileAppPage.googlePlay}</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl max-w-xs mx-auto">
                <div className="bg-ink rounded-[2.5rem] aspect-[9/19] flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <i className="fas fa-mobile-alt text-6xl mb-4" />
                    <p className="font-medium">{dict.mobileAppPage.appPreview}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">{dict.mobileAppPage.everythingTitle}</h2>
            <p className="text-xl text-ink/60">{dict.mobileAppPage.everythingSubtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dict.mobileAppPage.features.map((feature, i) => (
              <div key={i} className="text-center p-6">
                <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fas ${featureIcons[i]} text-ocean text-2xl`} />
                </div>
                <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                <p className="text-ink/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-5xl text-ocean mb-2">4.8</p>
              <p className="text-ink/60">{dict.mobileAppPage.appStoreRating}</p>
            </div>
            <div>
              <p className="font-display text-5xl text-forest mb-2">10k+</p>
              <p className="text-ink/60">{dict.mobileAppPage.activeUsers}</p>
            </div>
            <div>
              <p className="font-display text-5xl text-gold mb-2">95%</p>
              <p className="text-ink/60">{dict.mobileAppPage.userSatisfaction}</p>
            </div>
            <div>
              <p className="font-display text-5xl text-terracotta mb-2">2 min</p>
              <p className="text-ink/60">{dict.mobileAppPage.avgCheckTime}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">{dict.mobileAppPage.ctaTitle}</h2>
          <p className="text-xl text-white/60 mb-8">
            {dict.mobileAppPage.ctaText}
          </p>
          <Link href="/demo" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            {dict.common.startFreeTrial} <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
