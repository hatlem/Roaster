import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Integrations",
  description: "Connect Roaster with your favorite tools and payroll systems.",
};

const integrations = [
  {
    name: "Tripletex",
    category: "Payroll",
    description: "Automatic export of working hours to Tripletex payroll system.",
    icon: "fa-calculator",
    color: "ocean",
  },
  {
    name: "Visma",
    category: "Payroll",
    description: "Seamless integration with Visma for payroll processing.",
    icon: "fa-file-invoice",
    color: "forest",
  },
  {
    name: "PowerOffice Go",
    category: "Payroll",
    description: "Sync employee data and hours with PowerOffice Go.",
    icon: "fa-sync",
    color: "gold",
  },
  {
    name: "Slack",
    category: "Communication",
    description: "Get shift notifications and updates directly in Slack.",
    icon: "fa-hashtag",
    color: "terracotta",
  },
  {
    name: "Microsoft Teams",
    category: "Communication",
    description: "Integrate with Teams for schedule notifications.",
    icon: "fa-comments",
    color: "ocean",
  },
  {
    name: "Google Calendar",
    category: "Calendar",
    description: "Sync shifts to employees' Google Calendar.",
    icon: "fa-calendar",
    color: "forest",
  },
  {
    name: "Outlook",
    category: "Calendar",
    description: "Automatic calendar sync with Microsoft Outlook.",
    icon: "fa-envelope",
    color: "gold",
  },
  {
    name: "Zapier",
    category: "Automation",
    description: "Connect to 5000+ apps through Zapier automation.",
    icon: "fa-bolt",
    color: "terracotta",
  },
];

export default function IntegrationsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Integrations
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Connect your <em className="italic">tools</em>
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Seamlessly integrate {company.name} with your existing payroll, calendar, and communication tools.
          </p>
        </div>
      </section>

      {/* Integrations Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations.map((integration) => (
              <div key={integration.name} className="bg-cream rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 bg-${integration.color}/10 rounded-xl flex items-center justify-center mb-4`}>
                  <i className={`fas ${integration.icon} text-${integration.color} text-xl`} />
                </div>
                <span className="text-xs font-medium text-ink/40 uppercase tracking-wider">
                  {integration.category}
                </span>
                <h3 className="font-display text-xl mt-1 mb-2">{integration.name}</h3>
                <p className="text-ink/60 text-sm">{integration.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Section */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-code text-ocean text-2xl" />
          </div>
          <h2 className="font-display text-4xl mb-6">Build Custom Integrations</h2>
          <p className="text-xl text-ink/60 mb-8">
            Use our REST API to build custom integrations with your internal systems.
            Available on Professional and Enterprise plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/api-docs" className="btn-primary">
              View API Docs <i className="fas fa-arrow-right ml-2" />
            </Link>
            <Link href="/contact" className="btn-secondary">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">Need a custom integration?</h2>
          <p className="text-xl text-white/60 mb-8">
            Our team can help you integrate with your specific systems.
          </p>
          <Link href="/contact" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            Contact us <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
