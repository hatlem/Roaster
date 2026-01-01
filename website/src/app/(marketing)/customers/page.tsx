import Link from "next/link";
import { testimonials, complianceStats, navigation } from "@/content";

export const metadata = {
  title: "Customers",
  description: "See how Norwegian businesses are succeeding with Roaster.",
};

export default function CustomersPage() {
  const featuredTestimonial = testimonials.find((t) => t.featured);
  const otherTestimonials = testimonials.filter((t) => !t.featured);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Customer Stories
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Trusted by <em className="not-italic text-terracotta">{complianceStats.customersCount}</em> Norwegian businesses
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            See how businesses like yours are automating compliance and saving time.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-ink text-cream">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-5xl mb-2">{complianceStats.customersCount}</p>
              <p className="text-cream/60">Businesses</p>
            </div>
            <div>
              <p className="font-display text-5xl mb-2">{complianceStats.employeesScheduled}</p>
              <p className="text-cream/60">Employees scheduled</p>
            </div>
            <div>
              <p className="font-display text-5xl text-terracotta mb-2">{complianceStats.complianceRate}</p>
              <p className="text-cream/60">Compliance rate</p>
            </div>
            <div>
              <p className="font-display text-5xl text-forest mb-2">{complianceStats.timeSaved}</p>
              <p className="text-cream/60">Time saved</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Testimonial */}
      {featuredTestimonial && (
        <section className="py-24 bg-white">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
            <div className="bg-cream rounded-3xl p-12 relative">
              <i className="fas fa-quote-left text-6xl text-ink/10 absolute top-8 left-8" />
              <div className="relative">
                <blockquote className="font-display text-3xl md:text-4xl leading-tight mb-8">
                  &ldquo;{featuredTestimonial.quote}&rdquo;
                </blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-ocean/20 rounded-full flex items-center justify-center text-xl font-bold text-ocean">
                    {featuredTestimonial.author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{featuredTestimonial.author.name}</p>
                    <p className="text-ink/60">
                      {featuredTestimonial.author.role}, {featuredTestimonial.author.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Other Testimonials */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-5xl mb-4">What our customers say</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {otherTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="bg-white rounded-3xl p-8 border border-stone/50"
              >
                <i className="fas fa-quote-left text-ink/10 text-2xl mb-4" />
                <p className="text-ink/80 mb-6 italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-terracotta/20 rounded-full flex items-center justify-center text-sm font-bold text-terracotta">
                    {testimonial.author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.author.name}</p>
                    <p className="text-ink/60 text-xs">
                      {testimonial.author.role}, {testimonial.author.company}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-cream relative overflow-hidden noise-bg">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-5xl mb-6">
            Join our growing community
          </h2>
          <p className="text-xl text-cream/60 mb-10">
            Start your free 14-day trial today.
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
