import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Mobile App",
  description: "Access your schedules on the go with the Roaster mobile app.",
};

const features = [
  {
    title: "View Your Schedule",
    description: "See your upcoming shifts at a glance with a beautiful calendar view.",
    icon: "fa-calendar-alt",
  },
  {
    title: "Swap Shifts",
    description: "Request shift swaps with colleagues directly from your phone.",
    icon: "fa-exchange-alt",
  },
  {
    title: "Clock In/Out",
    description: "Track your working hours with GPS-verified time tracking.",
    icon: "fa-clock",
  },
  {
    title: "Instant Notifications",
    description: "Get notified immediately about schedule changes.",
    icon: "fa-bell",
  },
  {
    title: "Request Time Off",
    description: "Submit vacation and leave requests with one tap.",
    icon: "fa-plane",
  },
  {
    title: "Team Chat",
    description: "Communicate with your team directly in the app.",
    icon: "fa-comments",
  },
];

export default function MobileAppPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="feature-tag mb-6 inline-block">
                <span className="w-2 h-2 bg-forest rounded-full mr-2" />
                Mobile App
              </span>
              <h1 className="font-display text-5xl md:text-6xl mb-6">
                Your schedule in your <em className="italic">pocket</em>
              </h1>
              <p className="text-xl text-ink/60 mb-8">
                Employees can view schedules, swap shifts, and track hours—all from their smartphone.
              </p>
              <div className="flex gap-4">
                <button className="bg-ink text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3 hover:bg-ink/90 transition-colors">
                  <i className="fab fa-apple text-xl" />
                  <div className="text-left">
                    <div className="text-xs opacity-70">Download on the</div>
                    <div className="font-semibold">App Store</div>
                  </div>
                </button>
                <button className="bg-ink text-white px-6 py-3 rounded-xl font-medium flex items-center gap-3 hover:bg-ink/90 transition-colors">
                  <i className="fab fa-google-play text-xl" />
                  <div className="text-left">
                    <div className="text-xs opacity-70">Get it on</div>
                    <div className="font-semibold">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white rounded-[3rem] p-4 shadow-2xl max-w-xs mx-auto">
                <div className="bg-ink rounded-[2.5rem] aspect-[9/19] flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <i className="fas fa-mobile-alt text-6xl mb-4" />
                    <p className="font-medium">App Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl mb-4">Everything your employees need</h2>
            <p className="text-xl text-ink/60">Powerful features in a simple, intuitive app</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center p-6">
                <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className={`fas ${feature.icon} text-ocean text-2xl`} />
                </div>
                <h3 className="font-display text-xl mb-2">{feature.title}</h3>
                <p className="text-ink/60">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-cream">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="font-display text-5xl text-ocean mb-2">4.8</p>
              <p className="text-ink/60">App Store Rating</p>
            </div>
            <div>
              <p className="font-display text-5xl text-forest mb-2">10k+</p>
              <p className="text-ink/60">Active Users</p>
            </div>
            <div>
              <p className="font-display text-5xl text-gold mb-2">95%</p>
              <p className="text-ink/60">User Satisfaction</p>
            </div>
            <div>
              <p className="font-display text-5xl text-terracotta mb-2">2 min</p>
              <p className="text-ink/60">Avg. Check Time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-4xl mb-6">Ready to get started?</h2>
          <p className="text-xl text-white/60 mb-8">
            Start your free trial and give your employees access to the mobile app.
          </p>
          <Link href="/demo" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
            Start free trial <i className="fas fa-arrow-right" />
          </Link>
        </div>
      </section>
    </>
  );
}
