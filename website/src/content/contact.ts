// Contact page content - single source of truth

export const contact = {
  hero: {
    title: "Get in touch",
    subtitle: "Have questions? We'd love to hear from you.",
  },

  form: {
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true },
      { name: "lastName", label: "Last name", type: "text", required: true },
      { name: "email", label: "Work email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: false },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "employees", label: "Number of employees", type: "select", required: true, options: [
        "1-25",
        "26-100",
        "101-500",
        "500+",
      ]},
      { name: "message", label: "How can we help?", type: "textarea", required: true },
    ],
    submitText: "Send message",
    successMessage: "Thank you! We'll get back to you within 24 hours.",
  },

  faq: [
    {
      question: "How quickly do you respond?",
      answer: "We typically respond to all inquiries within 24 hours during business days.",
    },
    {
      question: "Do you offer demos?",
      answer: "Yes! We offer personalized demos for businesses of all sizes. Just fill out the form or visit our demo page.",
    },
    {
      question: "Can I try Roaster for free?",
      answer: "Absolutely. We offer a 14-day free trial with full access to all features. No credit card required.",
    },
  ],
};

export const demo = {
  hero: {
    title: "Start your free trial",
    subtitle: "14 days free. No credit card required. Full compliance from day one.",
  },

  benefits: [
    {
      icon: "clock",
      title: "Set up in minutes",
      description: "Import your employees and start scheduling right away.",
    },
    {
      icon: "shield-alt",
      title: "Instant compliance",
      description: "Every schedule is validated against local labor laws automatically.",
    },
    {
      icon: "headset",
      title: "Free onboarding",
      description: "Our team will help you get started and answer any questions.",
    },
    {
      icon: "credit-card",
      title: "No credit card",
      description: "Start your trial without any payment information.",
    },
  ],

  form: {
    fields: [
      { name: "firstName", label: "First name", type: "text", required: true },
      { name: "lastName", label: "Last name", type: "text", required: true },
      { name: "email", label: "Work email", type: "email", required: true },
      { name: "company", label: "Company name", type: "text", required: true },
      { name: "employees", label: "Number of employees", type: "select", required: true, options: [
        "1-25",
        "26-100",
        "101-500",
        "500+",
      ]},
    ],
    submitText: "Start free trial",
  },
};
