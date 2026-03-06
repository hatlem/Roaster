import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const integrationIcons = [
  "fa-calculator",
  "fa-file-invoice",
  "fa-sync",
  "fa-hashtag",
  "fa-comments",
  "fa-calendar",
  "fa-envelope",
  "fa-bolt",
];

const integrationColors = [
  "ocean",
  "forest",
  "gold",
  "terracotta",
  "ocean",
  "forest",
  "gold",
  "terracotta",
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.integrationsPage.metaTitle,
    description: dict.integrationsPage.metaDescription,
  };
}

export default async function IntegrationsPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  const categoryMap: Record<string, string> = {
    payroll: dict.integrationsPage.categories.payroll,
    communication: dict.integrationsPage.categories.communication,
    calendar: dict.integrationsPage.categories.calendar,
    automation: dict.integrationsPage.categories.automation,
  };

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.integrationsPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.integrationsPage.title.split(' ').slice(0, -1).join(' ')} <em className="italic">{dict.integrationsPage.title.split(' ').slice(-1)}</em>
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.integrationsPage.subtitle}
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {dict.integrationsPage.integrations.map((integration, i) => (
              <div key={integration.name} className="bg-cream rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${integrationColors[i]}/10 rounded-xl flex items-center justify-center mb-4`}>
                  <i className={`fas ${integrationIcons[i]} text-${integrationColors[i]} text-xl`} />
                </div>
                <span className="text-xs font-medium text-ink/40 uppercase tracking-wider">
                  {categoryMap[integration.category] || integration.category}
                </span>
                <h3 className="font-display text-xl mt-1 mb-2">{integration.name}</h3>
                <p className="text-ink/60 text-sm">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-code text-ocean text-2xl" />
          </div>
          <h2 className="font-display text-4xl mb-6">{dict.integrationsPage.customTitle}</h2>
          <p className="text-xl text-ink/60 mb-8">
            {dict.integrationsPage.customText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api-docs" className="btn-primary">
              {dict.integrationsPage.viewApiDocs} <i className="fas fa-arrow-right ml-2" />
            </Link>
            <Link href="/contact" className="btn-secondary">
              {dict.common.contactSales}
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">{dict.integrationsPage.needCustom}</h2>
          <p className="text-xl text-white/60 mb-8">
            {dict.integrationsPage.needCustomText}
          </p>
          <Link href="/contact" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            {dict.common.contactUs} <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
