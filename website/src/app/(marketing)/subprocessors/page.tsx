import Link from "next/link";
import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const SUBPROCESSOR_WEBSITES = [
  "https://railway.app",
  "https://stripe.com",
  "https://cloudflare.com",
  "https://getmailer.co",
  "https://openai.com",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.subprocessorsPage.metaTitle,
    description: dict.subprocessorsPage.metaDescription,
  };
}

export default async function SubprocessorsPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.subprocessorsPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.subprocessorsPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.common.lastUpdated}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.subprocessorsPage.introText}
          </p>

          <div className="overflow-x-auto my-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">{dict.subprocessorsPage.subprocessor}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">{dict.common.purpose}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">{dict.common.location}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">{dict.common.gdpr}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dict.subprocessorsPage.items.map((sp, i) => (
                  <tr key={sp.name}>
                    <td className="px-4 py-4">
                      <a href={SUBPROCESSOR_WEBSITES[i]} target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">
                        {sp.name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-ink/60">{sp.purpose}</td>
                    <td className="px-4 py-4 text-sm text-ink/60">{sp.location}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-forest/10 text-forest">{dict.common.compliant}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-3xl mb-6 mt-12">{dict.subprocessorsPage.changesTitle}</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {dict.subprocessorsPage.changesText}{" "}
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
            <Link href="/dpa" className="text-ocean hover:underline">{dict.dpaPage.title}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
