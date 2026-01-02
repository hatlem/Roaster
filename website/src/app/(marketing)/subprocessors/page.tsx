import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Subprocessors",
  description: "List of third-party service providers we use.",
};

const SUBPROCESSORS = [
  { name: "Railway", purpose: "Cloud hosting and infrastructure", location: "United States", website: "https://railway.app", gdprCompliant: true },
  { name: "Stripe", purpose: "Payment processing", location: "United States", website: "https://stripe.com", gdprCompliant: true },
  { name: "Cloudflare", purpose: "CDN, DNS, and security", location: "United States (global edge)", website: "https://cloudflare.com", gdprCompliant: true },
  { name: "Resend", purpose: "Transactional email delivery", location: "United States", website: "https://resend.com", gdprCompliant: true },
  { name: "OpenAI", purpose: "AI model provider", location: "United States", website: "https://openai.com", gdprCompliant: true },
];

export default function SubprocessorsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Legal
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Subprocessors
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Last updated: January 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <p className="text-ink/60 mb-6 leading-relaxed">
            {company.name} uses the following third-party service providers (subprocessors) to help deliver our services.
            All subprocessors are bound by data processing agreements and comply with applicable data protection laws.
          </p>

          <div className="overflow-x-auto my-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-cream">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">Subprocessor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ink/60 uppercase">GDPR</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {SUBPROCESSORS.map((sp) => (
                  <tr key={sp.name}>
                    <td className="px-4 py-4">
                      <a href={sp.website} target="_blank" rel="noopener noreferrer" className="text-ocean hover:underline font-medium">
                        {sp.name}
                      </a>
                    </td>
                    <td className="px-4 py-4 text-sm text-ink/60">{sp.purpose}</td>
                    <td className="px-4 py-4 text-sm text-ink/60">{sp.location}</td>
                    <td className="px-4 py-4">
                      {sp.gdprCompliant && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-forest/10 text-forest">Compliant</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="font-display text-3xl mb-6 mt-12">Changes to Subprocessors</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            We will notify customers of any changes to our subprocessor list. For questions about our data processing practices,
            please contact us at{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>

          <div className="border-t pt-8 mt-12 text-sm text-ink/60">
            See also:{" "}
            <Link href="/privacy" className="text-ocean hover:underline">Privacy Policy</Link>
            {" | "}
            <Link href="/terms" className="text-ocean hover:underline">Terms of Service</Link>
            {" | "}
            <Link href="/dpa" className="text-ocean hover:underline">DPA</Link>
          </div>
        </div>
      </section>
    </>
  );
}
