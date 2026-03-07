import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.cookiesPage.metaTitle,
    description: dict.cookiesPage.metaDescription,
  };
}

export default async function CookiesPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.cookiesPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.cookiesPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.common.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">{dict.cookiesPage.introTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.introText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.whatTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.whatText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.typesTitle}</h2>

          <h3 className="font-display text-2xl mb-4 mt-8">{dict.cookiesPage.essentialTitle}</h3>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.cookiesPage.essentialText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.cookiesPage.essentialItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h3 className="font-display text-2xl mb-4 mt-8">{dict.cookiesPage.analyticsTitle}</h3>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.cookiesPage.analyticsText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.cookiesPage.analyticsItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h3 className="font-display text-2xl mb-4 mt-8">{dict.cookiesPage.functionalTitle}</h3>
          <p className="text-ink/60 mb-4 leading-relaxed">
            {dict.cookiesPage.functionalText}
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.cookiesPage.functionalItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.manageTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.manageText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.retentionTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.retentionText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.updatesTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.updatesText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.cookiesPage.contactTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.cookiesPage.contactText}{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
