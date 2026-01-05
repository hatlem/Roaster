// Testimonials content
// Only add real customer testimonials here - no placeholders

export interface Testimonial {
  id: string;
  quote: string;
  author: {
    name: string;
    role: string;
    company: string;
    initials: string;
  };
  featured?: boolean;
}

// Real testimonials only - leave empty until we have them
export const testimonials: Testimonial[] = [];

// Real customer logos only - leave empty until we have them
export const customerLogos: { name: string; logo: string | null }[] = [];
