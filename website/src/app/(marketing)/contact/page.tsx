import { getServerLocale } from "@/i18n/server";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { company } from "@/content";
import { ContactForm } from "@/components/forms/ContactForm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.contactPage.metaTitle,
    description: dict.contactPage.metaDescription,
  };
}

export default async function ContactPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left - Info */}
            <div>
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-ocean rounded-full mr-2" />
                {dict.contactPage.tagline}
              </span>
              <h1 className="font-display text-5xl md:text-6xl mb-6">
                {dict.content.contact.heroTitle}
              </h1>
              <p className="text-xl text-ink/60 mb-12">
                {dict.content.contact.heroSubtitle}
              </p>

              {/* Contact Info */}
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-envelope text-ocean" />
                  </div>
                  <div>
                    <p className="font-semibold">{dict.common.email}</p>
                    <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
                      {company.contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-map-marker-alt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">{dict.common.location}</p>
                    <p className="text-ink/60">
                      {company.contact.address.city}, {company.contact.address.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="font-display text-2xl mb-6">{dict.contactPage.commonQuestions}</h3>
                <div className="space-y-4">
                  {dict.content.contact.faq.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-stone/50">
                      <h4 className="font-semibold mb-2">{item.question}</h4>
                      <p className="text-ink/60 text-sm">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-stone/50 shadow-xl h-fit">
              <h2 className="font-display text-3xl mb-8">{dict.contactPage.sendMessage}</h2>
              <ContactForm dictionary={dict} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
