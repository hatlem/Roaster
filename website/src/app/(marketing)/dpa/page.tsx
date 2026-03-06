import Link from "next/link";
import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.dpaPage.metaTitle,
    description: dict.dpaPage.metaDescription,
  };
}

export default async function DPAPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.dpaPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.dpaPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.common.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">{dict.dpaPage.introTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.dpaPage.introText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.definitionsTitle}</h2>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.dpaPage.definitionItems.map((item, i) => (
              <li key={i}><strong>{item.split(': ')[0]}:</strong> {item.split(': ').slice(1).join(': ')}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.scopeTitle}</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">{dict.dpaPage.scopeText}</p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.dpaPage.scopeItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.subprocessorsTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.dpaPage.subprocessorsText}{" "}
            <Link href="/subprocessors" className="text-ocean hover:underline">{dict.dpaPage.subprocessorsList}</Link>.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.securityTitle}</h2>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            {dict.dpaPage.securityItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.breachTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.dpaPage.breachText}
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.dpaPage.contactTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.dpaPage.contactText}{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>

          <div className="border-t pt-8 mt-12 text-sm text-ink/60">
            {dict.common.seeAlso}{" "}
            <Link href="/privacy" className="text-ocean hover:underline">{dict.footer.privacy}</Link>
            {" | "}
            <Link href="/terms" className="text-ocean hover:underline">{dict.footer.terms}</Link>
            {" | "}
            <Link href="/subprocessors" className="text-ocean hover:underline">{dict.subprocessorsPage.title}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
