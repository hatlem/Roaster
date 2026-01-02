import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "GDPR Compliance",
  description: "How Roaster ensures GDPR compliance for your employee data.",
};

export default function GDPRPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Compliance
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            GDPR Compliance
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            How we protect your data and ensure regulatory compliance
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
                <h3 className="font-semibold text-lg mb-2">GDPR Compliant by Design</h3>
                <p className="text-ink/60">
                  {company.name} is built from the ground up to comply with GDPR requirements.
                  We serve as your data processor while you remain the data controller.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div>
              <h2 className="font-display text-3xl mb-6">Our Commitments</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-database text-forest" />
                  </div>
                  <h3 className="font-semibold mb-2">EU Data Residency</h3>
                  <p className="text-ink/60 text-sm">
                    All data is stored within the EU/EEA on secure, certified infrastructure.
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-lock text-ocean" />
                  </div>
                  <h3 className="font-semibold mb-2">Encryption</h3>
                  <p className="text-ink/60 text-sm">
                    Data encrypted at rest and in transit using industry-standard protocols.
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-file-contract text-gold" />
                  </div>
                  <h3 className="font-semibold mb-2">DPA Available</h3>
                  <p className="text-ink/60 text-sm">
                    Data Processing Agreement available for all customers upon request.
                  </p>
                </div>
                <div className="bg-cream rounded-2xl p-6">
                  <div className="w-10 h-10 bg-terracotta/10 rounded-lg flex items-center justify-center mb-4">
                    <i className="fas fa-user-shield text-terracotta" />
                  </div>
                  <h3 className="font-semibold mb-2">Data Subject Rights</h3>
                  <p className="text-ink/60 text-sm">
                    Full support for access, rectification, erasure, and portability requests.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">Data Processing</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                As your data processor, we only process employee data according to your instructions
                and for the purposes of providing our scheduling service. This includes:
              </p>
              <ul className="list-disc pl-6 text-ink/60 space-y-2">
                <li>Employee names and contact information</li>
                <li>Work schedules and shift assignments</li>
                <li>Working hours and overtime records</li>
                <li>Leave and availability preferences</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">Sub-processors</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                We use a limited number of sub-processors to provide our service:
              </p>
              <div className="bg-cream rounded-2xl p-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone/30">
                      <th className="text-left py-2 font-semibold">Provider</th>
                      <th className="text-left py-2 font-semibold">Purpose</th>
                      <th className="text-left py-2 font-semibold">Location</th>
                    </tr>
                  </thead>
                  <tbody className="text-ink/60">
                    <tr className="border-b border-stone/20">
                      <td className="py-3">Railway</td>
                      <td className="py-3">Infrastructure hosting</td>
                      <td className="py-3">EU</td>
                    </tr>
                    <tr className="border-b border-stone/20">
                      <td className="py-3">PostgreSQL</td>
                      <td className="py-3">Database</td>
                      <td className="py-3">EU</td>
                    </tr>
                    <tr>
                      <td className="py-3">Email Provider</td>
                      <td className="py-3">Transactional emails</td>
                      <td className="py-3">EU</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">Contact Our DPO</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                For GDPR-related inquiries or to exercise your data subject rights, contact our
                Data Protection Officer at{" "}
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
