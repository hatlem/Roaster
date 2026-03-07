// About page content - honest and specific

export const about = {
  hero: {
    title: "We build scheduling software for Europe",
    subtitle: "Deep knowledge of labor law, built into every feature.",
  },

  story: {
    paragraphs: [
      "Every European country has its own labor law — Norway's Arbeidsmiljøloven, Germany's Arbeitszeitgesetz, France's Code du Travail, the Netherlands' Arbeidstijdenwet. Each one sets different rules for rest periods, overtime caps, publishing deadlines, and weekly limits. Miss any of them and employees can refuse shifts — or the inspectorate gets involved.",
      "Most scheduling software is built for the American market, then awkwardly adapted for Europe. We took the opposite approach: built from the ground up for European law, with rules from 16 countries validated automatically. From Oslo, we've mapped every working time regulation so you don't have to.",
      "The result is software that doesn't just schedule shifts — it prevents compliance violations before they happen, no matter which country your team works in.",
    ],
  },

  location: {
    city: "Oslo",
    country: "Norway",
  },

  // Only add real team members when available
  team: [] as { name: string; role: string; initials: string; bio: string }[],
};
