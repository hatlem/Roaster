import Link from "next/link";
import { about, company, navigation } from "@/content";

export const metadata = {
  title: "About",
  description: "Learn about our mission to make labor law compliance effortless for Norwegian businesses.",
};

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            About {company.name}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {about.hero.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {about.hero.subtitle}
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-display text-4xl mb-6">{about.story.title}</h2>
              {about.story.paragraphs.map((p, i) => (
                <p key={i} className="text-ink/60 mb-4 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
            <div className="bg-cream rounded-3xl p-8">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="font-display text-4xl text-terracotta">{about.stats.founded}</p>
                  <p className="text-ink/60 text-sm">Founded</p>
                </div>
                <div>
                  <p className="font-display text-4xl text-forest">{about.stats.customers}</p>
                  <p className="text-ink/60 text-sm">Customers</p>
                </div>
                <div>
                  <p className="font-display text-2xl">{about.stats.location}</p>
                  <p className="text-ink/60 text-sm">Headquarters</p>
                </div>
                <div>
                  <p className="font-display text-2xl">{about.stats.teamSize}</p>
                  <p className="text-ink/60 text-sm">Team</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-24 bg-ink text-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-5xl mb-6">{about.mission.title}</h2>
          <p className="text-2xl text-cream/80 leading-relaxed">
            {about.mission.description}
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl mb-4">Our Values</h2>
            <p className="text-xl text-ink/60">What guides everything we do</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {about.values.map((value, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-terracotta/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fas fa-${value.icon} text-terracotta text-2xl`} />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-ink/60 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl mb-4">Our Team</h2>
            <p className="text-xl text-ink/60">The people behind {company.name}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {about.team.map((member, i) => (
              <div key={i} className="text-center">
                <div className="w-24 h-24 bg-ocean/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold text-ocean">
                  {member.initials}
                </div>
                <h3 className="font-semibold text-lg">{member.name}</h3>
                <p className="text-terracotta text-sm mb-2">{member.role}</p>
                <p className="text-ink/60 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-5xl mb-6">
            Join {company.name} today
          </h2>
          <p className="text-xl text-cream/60 mb-10">
            Start your free 14-day trial and see the difference.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href={navigation.cta.primary.href} className="bg-cream text-ink px-8 py-4 rounded-full font-semibold hover:bg-cream/90 transition-all inline-flex items-center justify-center gap-2">
              {navigation.cta.primary.name}
              <i className="fas fa-arrow-right" />
            </Link>
            <Link href={navigation.cta.secondary.href} className="bg-white/10 text-cream px-8 py-4 rounded-full font-semibold hover:bg-white/20 transition-all border border-white/20">
              {navigation.cta.secondary.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
