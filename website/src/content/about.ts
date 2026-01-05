// About page content - honest and specific

export const about = {
  hero: {
    title: "We build scheduling software for Norway",
    subtitle: "Deep knowledge of Arbeidsmiljøloven, built into every feature.",
  },

  story: {
    paragraphs: [
      "Norwegian labor law is specific. § 10-8 says schedules must be published 14 days ahead. § 10-11 requires 11 hours rest between shifts. § 10-6 caps overtime at 10 hours per week. Miss any of these and employees can refuse shifts—or Arbeidstilsynet gets involved.",
      "Most scheduling software is built for the American market, then awkwardly adapted for Europe. We took the opposite approach: built from the ground up for Norwegian law, with every rule from Arbeidsmiljøloven Chapter 10 validated automatically.",
      "The result is software that doesn't just schedule shifts—it prevents compliance violations before they happen.",
    ],
  },

  location: {
    city: "Oslo",
    country: "Norway",
  },

  // Only add real team members when available
  team: [] as { name: string; role: string; initials: string; bio: string }[],
};
