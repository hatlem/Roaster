import { demo, testimonials, pricing } from "@/content";
import { DemoForm } from "@/components/forms/DemoForm";

export const metadata = {
  title: "Start Free Trial",
  description: "Start your 14-day free trial of Roaster. No credit card required.",
};

export default function DemoPage() {
  const featuredTestimonial = testimonials.find((t) => t.featured);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg min-h-screen">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left - Info */}
            <div>
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-forest rounded-full mr-2" />
                {pricing.trial.days}-Day Free Trial
              </span>
              <h1 className="font-display text-5xl md:text-6xl mb-6">
                {demo.hero.title}
              </h1>
              <p className="text-xl text-ink/60 mb-12">
                {demo.hero.subtitle}
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-2 gap-6">
                {demo.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-forest/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className={`fas fa-${benefit.icon} text-forest`} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{benefit.title}</p>
                      <p className="text-ink/60 text-xs">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              {featuredTestimonial && (
                <div className="mt-12 bg-ink rounded-2xl p-6 text-cream">
                  <i className="fas fa-quote-left text-cream/20 mb-4" />
                  <p className="text-sm mb-4 italic">
                    &ldquo;{featuredTestimonial.quote.substring(0, 150)}...&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-cream/20 rounded-full flex items-center justify-center text-xs font-bold">
                      {featuredTestimonial.author.initials}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{featuredTestimonial.author.name}</p>
                      <p className="text-cream/60 text-xs">{featuredTestimonial.author.company}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-stone/50 shadow-xl">
              <h2 className="font-display text-3xl mb-2">Create your account</h2>
              <p className="text-ink/60 mb-8">
                Start your {pricing.trial.days}-day free trial in minutes.
              </p>
              <DemoForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
