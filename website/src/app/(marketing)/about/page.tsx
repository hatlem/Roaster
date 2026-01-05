import Link from "next/link";
import { about, company, navigation } from "@/content";

export const metadata = {
  title: "About | Roaster",
  description: "Scheduling software built for Norwegian labor law compliance.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="pt-32 pb-16 px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display text-5xl md:text-6xl leading-tight mb-6">
            {about.hero.title}
          </h1>
          <p className="text-xl text-ink/60 leading-relaxed">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 px-6 lg:px-8 border-t border-stone">
        <div className="max-w-3xl mx-auto">
          <div className="space-y-6">
            {about.story.paragraphs.map((p, i) => (
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
            Based in
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
            Questions?
          </h2>
          <p className="text-xl text-ink/60 mb-8">
            We&apos;d love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact" className="btn-primary">
              Get in touch
            </Link>
            <Link href={navigation.cta.primary.href} className="btn-secondary">
              Start free trial
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
