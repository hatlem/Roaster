import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Data Processing Addendum",
  description: "Data Processing Addendum for our services.",
};

export default function DPAPage() {
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
            Data Processing Addendum
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Last updated: January 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">1. Introduction</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            This Data Processing Addendum (&quot;DPA&quot;) forms part of the agreement between you (&quot;Customer&quot;) and
            Admirate AS (&quot;Processor&quot;) for the use of our scheduling software and related services.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">2. Definitions</h2>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li><strong>Personal Data:</strong> Any information relating to an identified or identifiable natural person</li>
            <li><strong>Processing:</strong> Any operation performed on personal data</li>
            <li><strong>Controller:</strong> The entity that determines the purposes and means of processing</li>
            <li><strong>Processor:</strong> The entity that processes personal data on behalf of the controller</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">3. Scope of Processing</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">The Processor shall:</p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Process personal data only on documented instructions from the Customer</li>
            <li>Ensure that persons processing data are subject to confidentiality obligations</li>
            <li>Implement appropriate technical and organizational security measures</li>
            <li>Assist the Customer in responding to data subject requests</li>
            <li>Delete or return all personal data upon termination of services</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">4. Subprocessors</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            The Customer authorizes the Processor to engage subprocessors as listed in the{" "}
            <Link href="/subprocessors" className="text-ocean hover:underline">Subprocessors List</Link>.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">5. Security Measures</h2>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Encryption of data in transit (TLS 1.2+) and at rest (AES-256)</li>
            <li>Access controls and authentication</li>
            <li>Regular security assessments</li>
            <li>Incident response procedures</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">6. Data Breach Notification</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            In the event of a personal data breach, the Processor shall notify the Customer within 72 hours.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">7. Contact</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            If you have questions about this DPA or our data practices, please contact us at{" "}
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
            <Link href="/subprocessors" className="text-ocean hover:underline">Subprocessors</Link>
          </div>
        </div>
      </section>
    </>
  );
}
