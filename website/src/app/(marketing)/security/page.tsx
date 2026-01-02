import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Security",
  description: "How Roaster protects your data with enterprise-grade security.",
};

export default function SecurityPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Security
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Enterprise-grade Security
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Your data is protected with industry-leading security measures
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-forest/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-lock text-forest text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">Encrypted</h3>
              <p className="text-ink/60">AES-256 encryption at rest, TLS 1.3 in transit</p>
            </div>
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-ocean/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-server text-ocean text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">EU Hosted</h3>
              <p className="text-ink/60">All data stored in EU data centers</p>
            </div>
            <div className="text-center p-8 bg-cream rounded-3xl">
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-shield-alt text-gold text-2xl" />
              </div>
              <h3 className="font-display text-2xl mb-2">Monitored</h3>
              <p className="text-ink/60">24/7 security monitoring and alerting</p>
            </div>
          </div>

          <div className="space-y-16">
            <div>
              <h2 className="font-display text-3xl mb-8">Infrastructure Security</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-forest" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Isolated Infrastructure</h4>
                    <p className="text-ink/60 text-sm">Each customer&apos;s data is logically isolated</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-forest" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Regular Backups</h4>
                    <p className="text-ink/60 text-sm">Automated daily backups with point-in-time recovery</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-forest" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">DDoS Protection</h4>
                    <p className="text-ink/60 text-sm">Enterprise-grade protection against attacks</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-forest/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-forest" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Firewall Protection</h4>
                    <p className="text-ink/60 text-sm">Web application firewall with custom rules</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-8">Application Security</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-ocean" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Secure Authentication</h4>
                    <p className="text-ink/60 text-sm">Password hashing with bcrypt, optional 2FA</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-ocean" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Role-based Access</h4>
                    <p className="text-ink/60 text-sm">Granular permissions for different user roles</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-ocean" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Audit Logging</h4>
                    <p className="text-ink/60 text-sm">Complete audit trail of all schedule changes</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 bg-ocean/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-check text-ocean" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">Session Management</h4>
                    <p className="text-ink/60 text-sm">Secure session handling with automatic expiry</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-8">Compliance & Certifications</h2>
              <div className="bg-cream rounded-3xl p-8">
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-ocean">GDPR</span>
                    </div>
                    <h4 className="font-semibold">GDPR Compliant</h4>
                    <p className="text-ink/60 text-sm">Full compliance with EU data protection</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-forest">ISO</span>
                    </div>
                    <h4 className="font-semibold">ISO 27001</h4>
                    <p className="text-ink/60 text-sm">Information security management</p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <span className="font-bold text-gold">SOC 2</span>
                    </div>
                    <h4 className="font-semibold">SOC 2 Type II</h4>
                    <p className="text-ink/60 text-sm">Security and availability controls</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-3xl mb-6">Report a Vulnerability</h2>
              <p className="text-ink/60 mb-4 leading-relaxed">
                We take security seriously. If you discover a potential security vulnerability,
                please report it responsibly to{" "}
                <a href={`mailto:security@${company.contact.email.split("@")[1]}`} className="text-ocean hover:underline">
                  security@{company.contact.email.split("@")[1]}
                </a>.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
