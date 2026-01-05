// Company information - single source of truth

export const company = {
  name: "Roaster",
  legalName: "Getia AS",
  tagline: "Scheduling that knows Norwegian labor law",
  description: "Arbeidsmiljøloven has 50+ rules about working time. We track all of them so you don't have to.",

  contact: {
    email: "hello@getia.no",
    phone: null,
    address: {
      street: null,
      city: "Oslo",
      country: "Norway",
    },
  },

  social: {
    linkedin: null,
    twitter: null,
  },

  legal: {
    orgNumber: null,
    vatNumber: null,
  },

  year: new Date().getFullYear(),
} as const;

export const navigation = {
  main: [
    { name: "How it works", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
  ],
  footer: {
    product: [
      { name: "How it works", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Industries", href: "/industries" },
    ],
    resources: [
      { name: "Compliance Guide", href: "/compliance-guide" },
      { name: "API Docs", href: "/api-docs" },
    ],
    company: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
    legal: [
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
      { name: "GDPR", href: "/gdpr" },
    ],
  },
  cta: {
    primary: { name: "Start free trial", href: "/onboarding" },
    secondary: { name: "Book a demo", href: "/demo" },
  },
} as const;
