// Pricing content - single source of truth
// Update this file to change pricing across the site
// Base prices are in EUR, converted per locale using country config

export const pricing = {
  // Base currency for price definitions (converted per locale)
  baseCurrency: "EUR",

  billingPeriods: {
    monthly: { label: "Monthly", discount: 0 },
    yearly: { label: "Yearly", discount: 20 }, // 20% discount for yearly
  },

  plans: [
    {
      id: "starter",
      name: "Starter",
      description: "Perfect for small teams getting started with compliant scheduling",
      // Base prices in EUR
      basePrice: {
        monthly: 9,
        yearly: 7, // per month, billed yearly
      },
      priceUnit: "per employee/month",
      features: [
        "Up to 25 employees",
        "Basic compliance validation",
        "Publishing rule enforcement",
        "Rest period checks",
        "Email support",
        "Mobile app access",
      ],
      cta: "Start free trial",
      highlighted: false,
      badge: null,
    },
    {
      id: "professional",
      name: "Professional",
      description: "For growing businesses that need full compliance automation",
      basePrice: {
        monthly: 14,
        yearly: 11,
      },
      priceUnit: "per employee/month",
      features: [
        "Up to 100 employees",
        "Full compliance validation",
        "Overtime tracking & alerts",
        "Shift marketplace",
        "Audit-ready reports",
        "Priority support",
        "API access",
        "Payroll integrations",
      ],
      cta: "Start free trial",
      highlighted: true,
      badge: "Most Popular",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations with complex scheduling needs",
      basePrice: {
        monthly: null,
        yearly: null,
      },
      priceUnit: "custom pricing",
      features: [
        "Unlimited employees",
        "Multi-location support",
        "Custom integrations",
        "Dedicated account manager",
        "SLA guarantees",
        "On-premise option",
        "Custom compliance rules",
        "Advanced analytics",
      ],
      cta: "Contact sales",
      highlighted: false,
      badge: null,
    },
  ],

  trial: {
    days: 14,
    creditCardRequired: false,
  },

  faq: [
    {
      question: "What's included in the free trial?",
      answer: "The 14-day free trial includes full access to all Professional plan features. No credit card required to start.",
    },
    {
      question: "Can I change plans later?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.",
    },
    {
      question: "Is there a setup fee?",
      answer: "No, there are no setup fees. You only pay the monthly or yearly subscription based on your employee count.",
    },
    {
      question: "How does employee pricing work?",
      answer: "You're billed based on the number of active employees you schedule each month. Inactive employees don't count.",
    },
    {
      question: "Do you offer discounts for nonprofits?",
      answer: "Yes, we offer special pricing for nonprofits and educational institutions. Contact our sales team for details.",
    },
  ],
} as const;
