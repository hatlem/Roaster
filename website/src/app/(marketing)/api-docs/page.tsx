import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "API Documentation",
  description: "Developer documentation for the Roaster REST API.",
};

const endpoints = [
  {
    method: "GET",
    path: "/api/v1/employees",
    description: "List all employees",
  },
  {
    method: "POST",
    path: "/api/v1/employees",
    description: "Create a new employee",
  },
  {
    method: "GET",
    path: "/api/v1/rosters",
    description: "List all rosters",
  },
  {
    method: "POST",
    path: "/api/v1/rosters",
    description: "Create a new roster",
  },
  {
    method: "GET",
    path: "/api/v1/shifts",
    description: "List shifts with filters",
  },
  {
    method: "POST",
    path: "/api/v1/shifts",
    description: "Create a new shift",
  },
  {
    method: "POST",
    path: "/api/v1/compliance/validate",
    description: "Validate schedule compliance",
  },
  {
    method: "GET",
    path: "/api/v1/reports/hours",
    description: "Get working hours report",
  },
];

export default function APIDocsPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Developers
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            API Documentation
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Build custom integrations with the {company.name} REST API.
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">Quick Start</h2>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3">Authentication</h3>
              <p className="text-ink/60 mb-4">
                All API requests require authentication using an API key. Include your key in the Authorization header:
              </p>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <code>Authorization: Bearer YOUR_API_KEY</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Base URL</h3>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <code>https://api.roaster.no/v1</code>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Example Request</h3>
              <div className="bg-ink rounded-xl p-4 font-mono text-sm text-white overflow-x-auto">
                <pre>{`curl -X GET "https://api.roaster.no/v1/employees" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">Endpoints</h2>

          <div className="bg-white rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-ink text-white">
                <tr>
                  <th className="text-left p-4 font-semibold">Method</th>
                  <th className="text-left p-4 font-semibold">Endpoint</th>
                  <th className="text-left p-4 font-semibold">Description</th>
                </tr>
              </thead>
              <tbody>
                {endpoints.map((endpoint, index) => (
                  <tr key={index} className="border-b border-stone/30 last:border-0">
                    <td className="p-4">
                      <span className={`font-mono text-sm font-semibold px-2 py-1 rounded ${
                        endpoint.method === "GET" ? "bg-forest/10 text-forest" :
                        endpoint.method === "POST" ? "bg-ocean/10 text-ocean" :
                        endpoint.method === "PUT" ? "bg-gold/10 text-gold" :
                        "bg-terracotta/10 text-terracotta"
                      }`}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-sm">{endpoint.path}</td>
                    <td className="p-4 text-ink/60">{endpoint.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Rate Limits */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">Rate Limits</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Starter</h3>
              <p className="text-3xl font-display text-ocean mb-1">100</p>
              <p className="text-ink/60 text-sm">requests per minute</p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Professional</h3>
              <p className="text-3xl font-display text-forest mb-1">1,000</p>
              <p className="text-ink/60 text-sm">requests per minute</p>
            </div>
            <div className="bg-cream rounded-2xl p-6">
              <h3 className="font-semibold mb-2">Enterprise</h3>
              <p className="text-3xl font-display text-gold mb-1">Custom</p>
              <p className="text-ink/60 text-sm">based on your needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* SDKs */}
      <section className="py-16 bg-cream">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <h2 className="font-display text-3xl mb-8">SDKs & Libraries</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                <i className="fab fa-js text-gold text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold">JavaScript / TypeScript</h3>
                <p className="text-ink/60 text-sm">npm install @roaster/sdk</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-ocean/10 rounded-xl flex items-center justify-center">
                <i className="fab fa-python text-ocean text-2xl" />
              </div>
              <div>
                <h3 className="font-semibold">Python</h3>
                <p className="text-ink/60 text-sm">pip install roaster-sdk</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-ink text-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl mb-4">Ready to integrate?</h2>
          <p className="text-white/60 mb-8">
            API access is available on Professional and Enterprise plans.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/demo" className="bg-white text-ink px-8 py-4 rounded-2xl font-medium hover:bg-white/90 transition-colors inline-flex items-center gap-2">
              Start free trial <i className="fas fa-arrow-right" />
            </Link>
            <Link href="/contact" className="border border-white/30 text-white px-8 py-4 rounded-2xl font-medium hover:bg-white/10 transition-colors inline-flex items-center gap-2">
              Contact sales
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
