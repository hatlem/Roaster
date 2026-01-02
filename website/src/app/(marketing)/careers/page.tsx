import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Careers",
  description: "Join the Roaster team and help shape the future of workforce scheduling.",
};

const openPositions = [
  {
    title: "Senior Full-Stack Developer",
    department: "Engineering",
    location: "Oslo, Norway",
    type: "Full-time",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Oslo, Norway",
    type: "Full-time",
  },
  {
    title: "Customer Success Manager",
    department: "Customer Success",
    location: "Oslo, Norway",
    type: "Full-time",
  },
  {
    title: "Sales Development Representative",
    department: "Sales",
    location: "Oslo, Norway",
    type: "Full-time",
  },
];

const benefits = [
  {
    title: "Competitive Salary",
    description: "We pay at or above market rates for all positions.",
    icon: "fa-money-bill-wave",
  },
  {
    title: "Flexible Work",
    description: "Hybrid work model with flexible hours.",
    icon: "fa-home",
  },
  {
    title: "Health & Wellness",
    description: "Comprehensive health insurance and gym membership.",
    icon: "fa-heart",
  },
  {
    title: "Learning Budget",
    description: "Annual budget for courses, conferences, and books.",
    icon: "fa-graduation-cap",
  },
  {
    title: "Equipment",
    description: "Latest MacBook Pro and ergonomic workspace setup.",
    icon: "fa-laptop",
  },
  {
    title: "Team Events",
    description: "Regular team activities and annual company trips.",
    icon: "fa-users",
  },
];

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Careers
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Join our <em className="italic">team</em>
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Help us build the future of compliant workforce scheduling in Norway.
          </p>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">Why join {company.name}?</h2>
            <p className="text-xl text-ink/60">
              We&apos;re building software that makes a real difference for Norwegian businesses and workers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cream rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-rocket text-ocean text-2xl" />
              </div>
              <h3 className="font-display text-xl mb-2">Growing Fast</h3>
              <p className="text-ink/60 text-sm">
                We&apos;re scaling rapidly with 500+ customers and counting.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lightbulb text-forest text-2xl" />
              </div>
              <h3 className="font-display text-xl mb-2">Real Impact</h3>
              <p className="text-ink/60 text-sm">
                Your work directly helps protect workers&apos; rights.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-gold text-2xl" />
              </div>
              <h3 className="font-display text-xl mb-2">Career Growth</h3>
              <p className="text-ink/60 text-sm">
                Opportunity to grow with the company as we scale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">Benefits & Perks</h2>
            <p className="text-xl text-ink/60">We take care of our team</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit) => (
              <div key={benefit.title} className="bg-white rounded-2xl p-6">
                <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center mb-4">
                  <i className={`fas ${benefit.icon} text-ocean text-xl`} />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-ink/60 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">Open Positions</h2>
            <p className="text-xl text-ink/60">Find your next role</p>
          </div>

          <div className="space-y-4">
            {openPositions.map((position) => (
              <div key={position.title} className="bg-cream rounded-2xl p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-display text-xl mb-1">{position.title}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-ink/60">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-building" />
                        {position.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-map-marker-alt" />
                        {position.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-clock" />
                        {position.type}
                      </span>
                    </div>
                  </div>
                  <button className="bg-ocean text-white px-6 py-2 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* No Position? */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">Don&apos;t see your role?</h2>
          <p className="text-xl text-white/60 mb-8">
            We&apos;re always looking for talented people. Send us your CV and we&apos;ll keep you in mind.
          </p>
          <Link href="/contact" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            Get in touch <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
