import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.apiDocsPage.metaTitle,
    description: dict.apiDocsPage.metaDescription,
  };
}

export default async function APIDocsPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.apiDocsPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.apiDocsPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.apiDocsPage.subtitle}
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">{dict.apiDocsPage.quickStart}</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">{dict.apiDocsPage.authentication}</h3>
              <p className="text-ink/60 mb-4">
                {dict.apiDocsPage.authText}
              </p>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">{dict.apiDocsPage.baseUrl}</h3>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <code>https://api.roaster.no/v1</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">{dict.apiDocsPage.exampleRequest}</h3>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <pre>{`curl -X GET "https://api.roaster.no/v1/employees" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">{dict.apiDocsPage.endpoints}</h2>

          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="text-left p-4 font-semibold">{dict.common.method}</th>
                  <th className="text-left p-4 font-semibold">{dict.common.endpoint}</th>
                  <th className="text-left p-4 font-semibold">{dict.common.description}</th>
                </tr>
              </thead>
              <tbody>
                {dict.apiDocsPage.apiEndpoints.map((ep, index) => (
                  <tr key={index} className="border-b border-stone/30 last:border-0">
                    <td className="p-4">
                      <span className={`font-mono text-sm font-semibold px-2 py-1 rounded ${
                        ep.method === "GET" ? "bg-forest/10 text-forest" :
                        ep.method === "POST" ? "bg-ocean/10 text-ocean" :
                        ep.method === "PUT" ? "bg-gold/10 text-gold" :
                        "bg-terracotta/10 text-terracotta"
                      }`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{ep.endpoint}</td>
                    <td className="p-4 text-ink/60">{ep.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">{dict.apiDocsPage.rateLimits}</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">{dict.content.plans.starter.name}</h3>
              <p className="text-3xl font-display text-ocean mb-1">100</p>
              <p className="text-ink/60 text-sm">{dict.apiDocsPage.requestsPerMinute}</p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">{dict.content.plans.professional.name}</h3>
              <p className="text-3xl font-display text-forest mb-1">1,000</p>
              <p className="text-ink/60 text-sm">{dict.apiDocsPage.requestsPerMinute}</p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">{dict.content.plans.enterprise.name}</h3>
              <p className="text-3xl font-display text-gold mb-1">{dict.apiDocsPage.custom}</p>
              <p className="text-ink/60 text-sm">{dict.apiDocsPage.basedOnNeeds}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">{dict.apiDocsPage.sdks}</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <i className="fab fa-js text-gold text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold">JavaScript / TypeScript</h3>
                <p className="text-ink/60 text-sm">npm install @roaster/sdk</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
                <i className="fab fa-python text-ocean text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold">Python</h3>
                <p className="text-ink/60 text-sm">pip install roaster-sdk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl mb-4">{dict.apiDocsPage.readyToIntegrate}</h2>
          <p className="text-white/60 mb-8">
            {dict.apiDocsPage.apiAccessInfo}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
              {dict.common.startFreeTrial} <i className="fas fa-arrow-right" />
            </Link>
            <Link href="/contact" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              {dict.common.contactSales}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
