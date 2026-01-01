// Company information - single source of truth
// Update this file to change company details across the entire site

export const company = {
  name: "Roaster",
  legalName: "Getia AS",
  tagline: "The only scheduling software built for Norwegian labor laws",
  description: "Automate compliance with Arbeidsmiljøloven. Never worry about rest periods, overtime limits, or the 14-day publishing rule again.",

  contact: {
    email: "hello@getia.no",
    phone: null, // Add when available
    address: {
      street: null, // Add when available
      city: "Oslo",
      country: "Norway",
    },
  },

  social: {
    linkedin: null, // Add when available
    twitter: null, // Add when available
  },

  legal: {
    orgNumber: null, // Add when available (e.g., "123 456 789")
    vatNumber: null, // Add when available
  },

  year: new Date().getFullYear(),
} as const;

export const navigation = {
  main: [
    { name: "Features", href: "/features" },
    { name: "Industries", href: "/industries" },
    { name: "Pricing", href: "/pricing" },
    { name: "Customers", href: "/customers" },
    { name: "About", href: "/about" },
  ],
  footer: {
    product: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Industries", href: "/industries" },
      { name: "Integrations", href: "/integrations" },
      { name: "Mobile App", href: "/mobile-app" },
    ],
    resources: [
      { name: "Blog", href: "/blog" },
      { name: "Customer Stories", href: "/customers" },
      { name: "Compliance Guide", href: "/compliance-guide" },
      { name: "API Docs", href: "/api-docs" },
    ],
    company: [
      { name: "About Us", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
    legal: [
      { name: "GDPR", href: "/gdpr" },
      { name: "Security", href: "/security" },
    ],
  },
  cta: {
    primary: { name: "Start free trial", href: "/demo" },
    secondary: { name: "Contact sales", href: "/contact" },
  },
} as const;
