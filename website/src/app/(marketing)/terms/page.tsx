import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.termsPage.metaTitle,
    description: dict.termsPage.metaDescription,
  };
}

export default async function TermsPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.termsPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.termsPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.common.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">{dict.termsPage.agreementTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.agreementText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.serviceTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.serviceText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.accountsTitle}</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.termsPage.accountsText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.termsPage.accountsItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.subscriptionTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.subscriptionText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.complianceTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.complianceText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.dataTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.dataText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.ipTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.ipText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.liabilityTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.liabilityText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.governingTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.governingText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.termsPage.contactTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.termsPage.contactText}{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
