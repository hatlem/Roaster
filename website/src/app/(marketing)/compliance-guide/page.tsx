import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

const sectionIcons = [
  "fa-calendar-check",
  "fa-bed",
  "fa-calendar-week",
  "fa-clock",
  "fa-hourglass-half",
  "fa-archive",
];

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.complianceGuidePage.metaTitle,
    description: dict.complianceGuidePage.metaDescription,
  };
}

export default async function ComplianceGuidePage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.complianceGuidePage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.complianceGuidePage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.complianceGuidePage.subtitle}
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-ocean/5 rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-gavel text-ocean text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{dict.complianceGuidePage.aboutTitle}</h3>
                <p className="text-ink/60">
                  {dict.complianceGuidePage.aboutText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-12">
          {dict.complianceGuidePage.sections.map((section, index) => (
            <div key={index} className="border-b border-stone/30 pb-12 last:border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${sectionIcons[index]} text-forest text-xl`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-display text-2xl">{section.title}</h2>
                    <span className="text-xs font-medium bg-ink/10 px-2 py-1 rounded-full">
                      {section.law}
                    </span>
                  </div>
                  <p className="text-ink/60 leading-relaxed">{section.description}</p>
                </div>
              </div>
              <div className="ml-16">
                <h4 className="font-medium mb-3">{dict.complianceGuidePage.howWeHelp}</h4>
                <ul className="space-y-2">
                  {section.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-ink/60">
                      <i className="fas fa-check text-forest mt-1" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">{dict.complianceGuidePage.needHelp}</h2>
          <p className="text-xl text-ink/60 mb-8">
            {dict.complianceGuidePage.needHelpText}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="btn-primary">
              {dict.common.startFreeTrial} <i className="fas fa-arrow-right ml-2" />
            </Link>
            <Link href="/contact" className="btn-secondary">
              {dict.complianceGuidePage.talkToExpert}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
