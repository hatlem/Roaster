import type { Metadata } from "next";
import Link from "next/link";
import { about, navigation } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.aboutPage.metaTitle,
    description: dict.aboutPage.metaDescription,
  };
}

export default async function AboutPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6">
            {dict.content.about.heroTitle}
          </h1>
          <p className="text-xl text-ink/60 leading-relaxed">
            {dict.content.about.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-6 lg:px-8 border-t border-stone">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {dict.content.about.storyParagraphs.map((p, i) => (
              <p key={i} className="text-lg text-ink/70 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Location */}
      <section className="py-16 px-6 lg:px-8 bg-ink text-cream">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm uppercase tracking-wide text-cream/50 mb-4">
            {dict.aboutPage.basedIn}
          </p>
          <p className="font-display text-4xl md:text-5xl">
            {about.location.city}, {about.location.country}
          </p>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl leading-tight mb-6">
            {dict.aboutPage.questionsTitle}
          </h2>
          <p className="text-xl text-ink/60 mb-8">
            {dict.aboutPage.weLoveToHear}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="btn-primary">
              {dict.common.getInTouch}
            </Link>
            <Link href={navigation.cta.primary.href} className="btn-secondary">
              {dict.common.startFreeTrial}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
