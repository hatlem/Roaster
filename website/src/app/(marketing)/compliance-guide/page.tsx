import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Compliance Guide",
  description: "Complete guide to Norwegian labor law compliance for scheduling.",
};

const sections = [
  {
    title: "14-Day Publication Rule",
    icon: "fa-calendar-check",
    law: "§ 10-3",
    content: "Work schedules must be published at least 14 days before they take effect. Employees have a right to know their work schedule in advance.",
    tips: [
      "Set up automated reminders for publication deadlines",
      "Use draft schedules to plan ahead",
      "Document any exceptions with employee agreements",
    ],
  },
  {
    title: "Daily Rest Periods",
    icon: "fa-bed",
    law: "§ 10-8",
    content: "Employees must have at least 11 hours of continuous rest between work periods. This can be reduced to 8 hours by agreement, but compensatory rest must be provided.",
    tips: [
      "Automated validation prevents scheduling violations",
      "Track compensatory rest requirements",
      "Document any agreed exceptions",
    ],
  },
  {
    title: "Weekly Rest Periods",
    icon: "fa-calendar-week",
    law: "§ 10-8",
    content: "Employees must have at least 35 hours of continuous rest per week, including a Sunday where possible. The rest period should include the hours between 00:00 and 06:00.",
    tips: [
      "Schedule weekly rest to include overnight hours",
      "Plan Sunday work only when necessary",
      "Ensure 35-hour minimum is maintained",
    ],
  },
  {
    title: "Maximum Working Hours",
    icon: "fa-clock",
    law: "§ 10-4",
    content: "Normal working hours cannot exceed 9 hours per day and 40 hours per week. For shift work and certain arrangements, different limits may apply.",
    tips: [
      "Track cumulative hours across all shifts",
      "Monitor approaching limit warnings",
      "Plan for coverage during peak periods",
    ],
  },
  {
    title: "Overtime Limits",
    icon: "fa-hourglass-half",
    law: "§ 10-6",
    content: "Overtime is limited to 10 hours per week, 25 hours per 4 weeks, and 200 hours per year. Extended overtime requires union agreement.",
    tips: [
      "Real-time overtime tracking",
      "Automatic alerts before limits are reached",
      "Document overtime necessity",
    ],
  },
  {
    title: "Record Keeping",
    icon: "fa-archive",
    law: "§ 10-7",
    content: "Employers must maintain records of working hours for each employee. These records must be retained for 2 years and available for Arbeidstilsynet inspection.",
    tips: [
      "Automatic hour logging and storage",
      "Easy export for inspections",
      "Complete audit trail",
    ],
  },
];

export default function ComplianceGuidePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Resources
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Compliance Guide
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Everything you need to know about Arbeidsmiljoloven scheduling requirements.
          </p>
        </div>
      </section>

      {/* Introduction */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="bg-ocean/5 rounded-3xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-gavel text-ocean text-xl" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">About Arbeidsmiljoloven</h3>
                <p className="text-ink/60">
                  The Norwegian Working Environment Act (Arbeidsmiljoloven) sets comprehensive
                  requirements for working hours, rest periods, and schedule publication. These
                  regulations are enforced by Arbeidstilsynet (the Norwegian Labour Inspection Authority).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-12">
          {sections.map((section, index) => (
            <div key={index} className="border-b border-stone/30 pb-12 last:border-0">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${section.icon} text-forest text-xl`} />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="font-display text-2xl">{section.title}</h2>
                    <span className="text-xs font-medium bg-ink/10 px-2 py-1 rounded-full">
                      {section.law}
                    </span>
                  </div>
                  <p className="text-ink/60 leading-relaxed">{section.content}</p>
                </div>
              </div>
              <div className="ml-16">
                <h4 className="font-medium mb-3">How {company.name} helps:</h4>
                <ul className="space-y-2">
                  {section.tips.map((tip, tipIndex) => (
                    <li key={tipIndex} className="flex items-start gap-2 text-ink/60">
                      <i className="fas fa-check text-forest mt-1" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">Need help staying compliant?</h2>
          <p className="text-xl text-ink/60 mb-8">
            {company.name} automates compliance validation so you can focus on running your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="btn-primary">
              Start free trial <i className="fas fa-arrow-right ml-2" />
            </Link>
            <Link href="/contact" className="btn-secondary">
              Talk to an expert
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
