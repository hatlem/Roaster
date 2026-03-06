import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.privacyPage.metaTitle,
    description: dict.privacyPage.metaDescription,
  };
}

export default async function PrivacyPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.privacyPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.privacyPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.common.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">{dict.privacyPage.introTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.privacyPage.introText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.collectTitle}</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.privacyPage.collectText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.privacyPage.collectItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.useTitle}</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.privacyPage.useText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.privacyPage.useItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.retentionTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.privacyPage.retentionText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.securityTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.privacyPage.securityText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.rightsTitle}</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.privacyPage.rightsText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.privacyPage.rightsItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.privacyPage.contactTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.privacyPage.contactText}{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
