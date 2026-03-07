// Features content - focused on European labor law compliance

export const features = {
  hero: {
    title: "How it works",
    subtitle: "Every scheduling rule from your country's labor law, checked automatically",
  },

  // The specific rules we enforce
  rules: [
    {
      id: "publishing-deadline",
      law: "EU / National",
      title: "Schedule publishing deadline",
      description: "Most European countries require advance notice for schedules — 14 days in Norway, 7 days in Germany and France, 28 days in the Netherlands. We track the rule for your country automatically.",
      consequence: "Employees can refuse shifts published late.",
    },
    {
      id: "daily-rest",
      law: "EU WTD Art. 3",
      title: "11-hour daily rest",
      description: "The EU Working Time Directive mandates 11 hours of daily rest across all member states. We block scheduling that violates this — no exceptions.",
      consequence: "Violation can result in orders from the national labor inspectorate.",
    },
    {
      id: "weekly-rest",
      law: "EU WTD Art. 5",
      title: "35-hour weekly rest",
      description: "35 hours continuous rest per week is the baseline — but it varies by country. We calculate the correct requirement automatically.",
      consequence: "Systematic violations lead to fines.",
    },
    {
      id: "overtime-limits",
      law: "National",
      title: "Overtime limits",
      description: "Each country sets different overtime caps — 10h/week in Norway, 8h/week in Germany, 220h/year in France. We track running totals for your country and warn before you hit limits.",
      consequence: "Overtime beyond limits requires special agreements.",
    },
    {
      id: "work-week",
      law: "National",
      title: "Maximum work week",
      description: "From 35 hours in France to 48 hours in the UK — every country defines its own standard. We adapt to your country's rules, including variations for night and weekend work.",
      consequence: "Hours beyond the limit count as overtime.",
    },
  ],

  // How the product works
  main: [
    {
      id: "validation",
      icon: "shield-alt",
      color: "forest",
      title: "Real-time validation",
      description: "Every shift is checked against your country's labor law before you save it. Red means illegal. Green means compliant.",
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
      title: "Audit-ready reports for any labor inspectorate",
      description: "Whether it's Arbeidstilsynet, the Gewerbeaufsichtsamt, or DIRECCTE — export everything in the right format with one click.",
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
