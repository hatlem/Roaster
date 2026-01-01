// Testimonials content - single source of truth
// Replace with real customer testimonials when available

export interface Testimonial {
  id: string;
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
    initials: string;
  };
  stats?: {
    label: string;
    value: string;
  };
  featured?: boolean;
}

// Note: These are placeholder testimonials
// Replace with real customer quotes when available
export const testimonials: Testimonial[] = [
  {
    id: "featured-1",
    quote: "Before Roaster, we had a team of five managing schedules. Now two people handle it with better accuracy. We passed our Arbeidstilsynet inspection with zero findings.",
    author: {
      name: "Customer Name",
      role: "Operations Director",
      company: "Healthcare Provider",
      initials: "CN",
    },
    stats: {
      label: "Time saved on scheduling",
      value: "60%",
    },
    featured: true,
  },
  {
    id: "retail-1",
    quote: "The automatic 14-day validation alone is worth the investment. We no longer worry about publishing deadlines.",
    author: {
      name: "Customer Name",
      role: "HR Manager",
      company: "Retail Chain",
      initials: "CN",
    },
  },
  {
    id: "hospitality-1",
    quote: "We went from spending hours on compliance reports to generating them in seconds. Game changer for our team.",
    author: {
      name: "Customer Name",
      role: "General Manager",
      company: "Hotel Group",
      initials: "CN",
    },
  },
  {
    id: "logistics-1",
    quote: "The shift marketplace feature reduced our admin workload significantly. Employees love managing their own swaps.",
    author: {
      name: "Customer Name",
      role: "CEO",
      company: "Logistics Company",
      initials: "CN",
    },
  },
];

// Placeholder company logos for social proof
// Replace with real customer logos when available
export const customerLogos = [
  { name: "Company 1", logo: null },
  { name: "Company 2", logo: null },
  { name: "Company 3", logo: null },
  { name: "Company 4", logo: null },
  { name: "Company 5", logo: null },
];
