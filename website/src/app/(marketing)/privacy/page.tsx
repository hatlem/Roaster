import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Privacy Policy",
  description: "How we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Last updated: January 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">Introduction</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {company.name} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your information
            when you use our scheduling software and related services.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Information We Collect</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            We collect information that you provide directly to us, including:
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Name, email address, and contact information</li>
            <li>Company and organization details</li>
            <li>Employee scheduling data and work hours</li>
            <li>Payment and billing information</li>
            <li>Communications with our support team</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">How We Use Your Information</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            We use the information we collect to:
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send technical notices and support messages</li>
            <li>Respond to your comments and questions</li>
            <li>Comply with Norwegian labor law requirements</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">Data Retention</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            In accordance with Norwegian labor law (Arbeidsmiljoloven), we retain scheduling
            and work hour records for a minimum of 2 years. This ensures compliance with
            regulatory requirements and supports potential Arbeidstilsynet audits.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Data Security</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            We implement appropriate technical and organizational measures to protect your
            personal data against unauthorized access, alteration, disclosure, or destruction.
            Our servers are located within the EU/EEA to ensure GDPR compliance.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Your Rights Under GDPR</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            As a data subject, you have the right to:
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Access your personal data</li>
            <li>Rectify inaccurate personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Restrict processing of your personal data</li>
            <li>Data portability</li>
            <li>Object to processing</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">Contact Us</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            If you have questions about this Privacy Policy or our data practices, please contact us at{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
