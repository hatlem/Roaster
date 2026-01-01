import { contact, company } from "@/content";

export const metadata = {
  title: "Contact",
  description: "Get in touch with the Roaster team.",
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Left - Info */}
            <div>
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-ocean rounded-full mr-2" />
                Contact Us
              </span>
              <h1 className="font-display text-5xl md:text-6xl mb-6">
                {contact.hero.title}
              </h1>
              <p className="text-xl text-ink/60 mb-12">
                {contact.hero.subtitle}
              </p>

              {/* Contact Info */}
              <div className="space-y-6 mb-12">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-envelope text-ocean" />
                  </div>
                  <div>
                    <p className="font-semibold">Email</p>
                    <a href={`mailto:${company.contact.email}`} className="text-ocean hover:underline">
                      {company.contact.email}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-forest/10 rounded-xl flex items-center justify-center">
                    <i className="fas fa-map-marker-alt text-forest" />
                  </div>
                  <div>
                    <p className="font-semibold">Location</p>
                    <p className="text-ink/60">
                      {company.contact.address.city}, {company.contact.address.country}
                    </p>
                  </div>
                </div>
              </div>

              {/* FAQ */}
              <div>
                <h3 className="font-display text-2xl mb-6">Common Questions</h3>
                <div className="space-y-4">
                  {contact.faq.map((item, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-stone/50">
                      <h4 className="font-semibold mb-2">{item.question}</h4>
                      <p className="text-ink/60 text-sm">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="bg-white rounded-3xl p-8 lg:p-12 border border-stone/50 shadow-xl h-fit">
              <h2 className="font-display text-3xl mb-8">Send us a message</h2>
              <form className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium mb-2">
                      First name *
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium mb-2">
                      Last name *
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Work email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                  />
                </div>
                <div>
                  <label htmlFor="company" className="block text-sm font-medium mb-2">
                    Company *
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2">
                    How can we help? *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone focus:border-ocean focus:outline-none focus:ring-2 focus:ring-ocean/20 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full btn-primary justify-center"
                >
                  {contact.form.submitText}
                  <i className="fas fa-arrow-right" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
