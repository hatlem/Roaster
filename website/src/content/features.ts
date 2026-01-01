// Features content - single source of truth
// Update this file to change feature descriptions across the site

export const features = {
  hero: {
    title: "Built for AML",
    subtitle: "Every feature designed with Norwegian labor law at its core",
  },

  main: [
    {
      id: "14-day-rule",
      icon: "calendar-alt",
      color: "ocean",
      title: "14-Day Publishing Rule",
      description: "Automatic deadline tracking ensures schedules are published at least 14 days before they start (§ 10-2).",
      lawReference: "§ 10-2",
    },
    {
      id: "rest-periods",
      icon: "bed",
      color: "forest",
      title: "Rest Period Validation",
      description: "Real-time checks for 11-hour daily rest and 35-hour weekly rest requirements (§ 10-8).",
      lawReference: "§ 10-8",
    },
    {
      id: "working-hours",
      icon: "clock",
      color: "terracotta",
      title: "Working Hour Limits",
      description: "Enforce 9-hour daily and 40-hour weekly maximums with real-time tracking (§ 10-4).",
      lawReference: "§ 10-4",
    },
    {
      id: "overtime",
      icon: "hourglass-half",
      color: "gold",
      title: "Overtime Management",
      description: "Track weekly, monthly, and annual overtime limits with automatic alerts (§ 10-6).",
      lawReference: "§ 10-6",
    },
    {
      id: "reports",
      icon: "file-alt",
      color: "ocean",
      title: "Audit-Ready Reports",
      description: "Generate comprehensive compliance reports for Arbeidstilsynet inspections in one click.",
      lawReference: null,
    },
    {
      id: "marketplace",
      icon: "exchange-alt",
      color: "forest",
      title: "Shift Marketplace",
      description: "Employees can swap shifts with manager approval, all validated for compliance automatically.",
      lawReference: null,
    },
  ],

  extended: [
    {
      id: "ai-scheduling",
      icon: "robot",
      title: "AI-Powered Scheduling",
      description: "Our intelligent scheduling engine creates optimal rosters while ensuring 100% compliance with Norwegian labor laws.",
    },
    {
      id: "mobile",
      icon: "mobile-alt",
      title: "Mobile App",
      description: "Employees can view schedules, request time off, and pick up shifts from their phones.",
    },
    {
      id: "notifications",
      icon: "bell",
      title: "Smart Notifications",
      description: "Automatic alerts for schedule changes, shift reminders, and compliance warnings.",
    },
    {
      id: "integrations",
      icon: "plug",
      title: "Payroll Integration",
      description: "Seamless integration with Norwegian payroll systems including Visma, Tripletex, and more.",
    },
    {
      id: "analytics",
      icon: "chart-line",
      title: "Labor Analytics",
      description: "Insights into labor costs, scheduling efficiency, and compliance trends.",
    },
    {
      id: "multi-location",
      icon: "building",
      title: "Multi-Location",
      description: "Manage schedules across multiple locations with centralized compliance oversight.",
    },
  ],
} as const;

export const complianceStats = {
  complianceRate: "99.2%",
  timeSaved: "60%",
  customersCount: "500+",
  employeesScheduled: "25k+",
} as const;
