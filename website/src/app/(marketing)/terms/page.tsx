import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Terms of Service",
  description: "Terms and conditions for using Roaster scheduling software.",
};

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Last updated: January 1, 2026
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 prose prose-lg">
          <h2 className="font-display text-3xl mb-6">Agreement to Terms</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            By accessing or using {company.name}&apos;s scheduling software and services, you agree
            to be bound by these Terms of Service. If you do not agree to these terms, please
            do not use our services.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Description of Service</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            {company.name} provides a cloud-based employee scheduling platform designed to help
            Norwegian businesses comply with Arbeidsmiljoloven (the Working Environment Act).
            Our service includes schedule creation, compliance validation, reporting, and
            related features.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">User Accounts</h2>
          <p className="text-ink/60 mb-4 leading-relaxed">
            When you create an account, you agree to:
          </p>
          <ul className="list-disc pl-6 text-ink/60 mb-6 space-y-2">
            <li>Provide accurate and complete information</li>
            <li>Maintain the security of your account credentials</li>
            <li>Notify us immediately of any unauthorized access</li>
            <li>Accept responsibility for all activities under your account</li>
          </ul>

          <h2 className="font-display text-3xl mb-6 mt-12">Subscription and Payment</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            Our services are provided on a subscription basis. By subscribing, you agree to pay
            the applicable fees based on your selected plan and number of employees. Subscriptions
            automatically renew unless cancelled before the renewal date.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Compliance Disclaimer</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            While our software is designed to help you comply with Norwegian labor laws, it is
            provided as a tool to assist your compliance efforts. Ultimate responsibility for
            legal compliance remains with you as the employer. We recommend consulting with
            legal professionals for specific compliance questions.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Data Processing</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            We process employee data on your behalf as a data processor under GDPR. You remain
            the data controller and are responsible for ensuring you have appropriate legal
            basis for processing employee data. See our Privacy Policy and Data Processing
            Agreement for details.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Intellectual Property</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            The {company.name} platform, including all software, designs, and content, is owned
            by us and protected by intellectual property laws. You receive a limited license
            to use the service during your subscription.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Limitation of Liability</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            To the maximum extent permitted by law, {company.name} shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages resulting from
            your use of or inability to use the service.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Governing Law</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            These terms are governed by the laws of Norway. Any disputes shall be resolved
            in the courts of Oslo, Norway.
          </p>

          <h2 className="font-display text-3xl mb-6 mt-12">Contact</h2>
          <p className="text-ink/60 mb-6 leading-relaxed">
            For questions about these terms, contact us at{" "}
            <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
              {company.contact.email}
            </a>.
          </p>
        </div>
      </section>
    </>
  );
}
