import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.gdprPage.metaTitle,
    description: dict.gdprPage.metaDescription,
  };
}

export default async function GDPRPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.gdprPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.gdprPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.gdprPage.subtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-ocean/5 rounded-3xl p-8 mb-12">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-shield-alt text-ocean text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">{dict.gdprPage.designTitle}</h3>
                <p className="text-ink/60">
                  {dict.gdprPage.designText}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="font-display text-3xl mb-6">{dict.gdprPage.commitmentsTitle}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-database text-forest" />
                  </div>
                  <h3 className="font-semibold mb-2">{dict.gdprPage.euResidency}</h3>
                  <p className="text-ink/60 text-sm">
                    {dict.gdprPage.euResidencyDesc}
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-lock text-ocean" />
                  </div>
                  <h3 className="font-semibold mb-2">{dict.gdprPage.encryption}</h3>
                  <p className="text-ink/60 text-sm">
                    {dict.gdprPage.encryptionDesc}
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-file-contract text-gold" />
                  </div>
                  <h3 className="font-semibold mb-2">{dict.gdprPage.dpaAvailable}</h3>
                  <p className="text-ink/60 text-sm">
                    {dict.gdprPage.dpaAvailableDesc}
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-user-shield text-terracotta" />
                  </div>
                  <h3 className="font-semibold mb-2">{dict.gdprPage.subjectRights}</h3>
                  <p className="text-ink/60 text-sm">
                    {dict.gdprPage.subjectRightsDesc}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">{dict.gdprPage.processingTitle}</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                {dict.gdprPage.processingText}
              </p>
              <ul className="list-disc pl-6 text-ink/60 space-y-2">
                {dict.gdprPage.processingItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">{dict.gdprPage.subProcessorsTitle}</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                {dict.gdprPage.subProcessorsText}
              </p>
              <div className="bg-cream rounded-2xl p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone/30">
                      <th className="text-left py-2 font-semibold">{dict.common.provider}</th>
                      <th className="text-left py-2 font-semibold">{dict.common.purpose}</th>
                      <th className="text-left py-2 font-semibold">{dict.common.location}</th>
                    </tr>
                  </thead>
                  <tbody className="text-ink/60">
                    <tr className="border-b border-stone/20">
                      <td className="py-3">{dict.gdprPage.subProcessor1}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor1Purpose}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor1Location}</td>
                    </tr>
                    <tr className="border-b border-stone/20">
                      <td className="py-3">{dict.gdprPage.subProcessor2}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor2Purpose}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor2Location}</td>
                    </tr>
                    <tr>
                      <td className="py-3">{dict.gdprPage.subProcessor3}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor3Purpose}</td>
                      <td className="py-3">{dict.gdprPage.subProcessor3Location}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">{dict.gdprPage.dpoTitle}</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                {dict.gdprPage.dpoText}{" "}
                <a href={`mailto:privacy@${company.contact.email.split("@")[1]}`} className="text-ocean hover:underline">
                  privacy@{company.contact.email.split("@")[1]}
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
