// Features content - focused on specific Norwegian labor law compliance

export const features = {
  hero: {
    title: "How it works",
    subtitle: "Every scheduling rule from Arbeidsmiljøloven, checked automatically",
  },

  // The specific rules we enforce
  rules: [
    {
      id: "aml-10-8",
      law: "§ 10-8",
      title: "14-day publishing rule",
      description: "Schedules must be published 14 days before they take effect. We track every roster and warn you before you miss the deadline.",
      consequence: "Employees can refuse shifts published late.",
    },
    {
      id: "aml-10-11",
      law: "§ 10-11 (1)",
      title: "11-hour daily rest",
      description: "Every employee needs 11 hours off between shifts. We block scheduling that violates this—no exceptions.",
      consequence: "Violation can result in orders from Arbeidstilsynet.",
    },
    {
      id: "aml-10-11-weekly",
      law: "§ 10-11 (2)",
      title: "35-hour weekly rest",
      description: "One continuous 35-hour rest period per 7 days, including a Sunday where possible. We calculate this automatically.",
      consequence: "Systematic violations lead to fines.",
    },
    {
      id: "aml-10-6",
      law: "§ 10-6",
      title: "Overtime limits",
      description: "Max 10 hours/week, 25 hours/4 weeks, 200 hours/year. We track running totals and warn before you hit limits.",
      consequence: "Overtime beyond limits requires union agreement.",
    },
    {
      id: "aml-10-4",
      law: "§ 10-4",
      title: "40-hour work week",
      description: "Standard max is 40 hours/week (37.5 with tariff). Night/weekend work has stricter limits. We handle all the variations.",
      consequence: "Hours beyond count as overtime.",
    },
  ],

  // How the product works
  main: [
    {
      id: "validation",
      icon: "shield-alt",
      color: "forest",
      title: "Real-time validation",
      description: "Every shift is checked against Arbeidsmiljøloven before you save it. Red means illegal. Green means compliant.",
    },
    {
      id: "publishing",
      icon: "calendar-alt",
      color: "ocean",
      title: "Publishing deadlines",
      description: "See exactly when each roster must be published. Get reminded 3 days before. Never miss the 14-day rule again.",
    },
    {
      id: "reports",
      icon: "file-alt",
      color: "terracotta",
      title: "Arbeidstilsynet-ready reports",
      description: "If the labor inspectorate asks for documentation, export everything in their format with one click.",
    },
    {
      id: "overtime",
      icon: "clock",
      color: "gold",
      title: "Overtime tracking",
      description: "Running totals per week, month, and year. Per employee. Alerts before anyone hits a limit.",
    },
    {
      id: "marketplace",
      icon: "exchange-alt",
      color: "ocean",
      title: "Shift swaps",
      description: "Employees trade shifts themselves. Manager approves. Compliance is validated automatically. Everyone's happy.",
    },
    {
      id: "mobile",
      icon: "mobile-alt",
      color: "forest",
      title: "Mobile for employees",
      description: "Employees see their schedule, clock in with GPS, request time off, and pick up shifts. All from their phone.",
    },
  ],
} as const;

// Remove fake stats - only show real data when we have it
export const complianceStats = {
  // These would be filled in with real data
  complianceRate: null,
  timeSaved: null,
  customersCount: null,
  employeesScheduled: null,
} as const;
