import { company } from "@/content";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.securityPage.metaTitle,
    description: dict.securityPage.metaDescription,
  };
}

export default async function SecurityPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.securityPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.securityPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.securityPage.subtitle}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-forest text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">{dict.securityPage.encrypted}</h3>
              <p className="text-ink/60">{dict.securityPage.encryptedDesc}</p>
            </div>
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-server text-ocean text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">{dict.securityPage.euHosted}</h3>
              <p className="text-ink/60">{dict.securityPage.euHostedDesc}</p>
            </div>
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-gold text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">{dict.securityPage.monitored}</h3>
              <p className="text-ink/60">{dict.securityPage.monitoredDesc}</p>
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <h2 className="font-display text-3xl mb-8">{dict.securityPage.infraTitle}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {dict.securityPage.infraItems.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-forest" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-ink/60 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-8">{dict.securityPage.appTitle}</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {dict.securityPage.appItems.map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className="fas fa-check text-ocean" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{item.title}</h4>
                      <p className="text-ink/60 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-8">{dict.securityPage.complianceTitle}</h2>
              <div className="bg-cream rounded-3xl p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-ocean">{dict.common.gdpr}</span>
                    </div>
                    <h4 className="font-semibold">{dict.securityPage.gdprCompliant}</h4>
                    <p className="text-ink/60 text-sm">{dict.securityPage.gdprCompliantDesc}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-forest">ISO</span>
                    </div>
                    <h4 className="font-semibold">{dict.securityPage.iso27001}</h4>
                    <p className="text-ink/60 text-sm">{dict.securityPage.iso27001Desc}</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-gold">SOC 2</span>
                    </div>
                    <h4 className="font-semibold">{dict.securityPage.soc2}</h4>
                    <p className="text-ink/60 text-sm">{dict.securityPage.soc2Desc}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">{dict.securityPage.vulnerabilityTitle}</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                {dict.securityPage.vulnerabilityText}{" "}
                <a href={`mailto:security@${company.contact.email.split("@")[1]}`} className="text-ocean hover:underline">
                  security@{company.contact.email.split("@")[1]}
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
