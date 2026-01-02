import Link from "next/link";
import { company } from "@/content";

export const metadata = {
  title: "Blog",
  description: "Insights on Norwegian labor law compliance and workforce scheduling.",
};

const posts = [
  {
    title: "Understanding the 14-Day Rule in Norwegian Labor Law",
    excerpt: "A complete guide to the 14-day advance notice requirement for publishing work schedules under Arbeidsmiljoloven.",
    category: "Compliance",
    date: "Dec 15, 2025",
    readTime: "5 min read",
  },
  {
    title: "How to Calculate Overtime Under Norwegian Law",
    excerpt: "Learn the rules for overtime calculation, including maximum limits and compensation requirements.",
    category: "Compliance",
    date: "Dec 10, 2025",
    readTime: "7 min read",
  },
  {
    title: "Rest Period Requirements: What Employers Need to Know",
    excerpt: "Detailed breakdown of daily and weekly rest period requirements and how to stay compliant.",
    category: "Compliance",
    date: "Dec 5, 2025",
    readTime: "6 min read",
  },
  {
    title: "5 Common Scheduling Mistakes and How to Avoid Them",
    excerpt: "The most frequent compliance violations we see and practical tips to prevent them.",
    category: "Best Practices",
    date: "Nov 28, 2025",
    readTime: "4 min read",
  },
  {
    title: "Preparing for an Arbeidstilsynet Inspection",
    excerpt: "What documents you need, what inspectors look for, and how to ensure you pass.",
    category: "Compliance",
    date: "Nov 20, 2025",
    readTime: "8 min read",
  },
  {
    title: "The True Cost of Non-Compliance in Norway",
    excerpt: "Understanding the financial and reputational risks of labor law violations.",
    category: "Industry",
    date: "Nov 15, 2025",
    readTime: "5 min read",
  },
];

export default function BlogPage() {
  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            Blog
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            Insights & Updates
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            Expert guidance on Norwegian labor law compliance and workforce management.
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post, index) => (
              <article key={index} className="bg-cream rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-48 bg-stone/20 flex items-center justify-center">
                  <i className="fas fa-newspaper text-4xl text-stone" />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-medium bg-ocean/10 text-ocean px-2 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-ink/40">{post.readTime}</span>
                  </div>
                  <h3 className="font-display text-xl mb-2 hover:text-ocean cursor-pointer">
                    {post.title}
                  </h3>
                  <p className="text-ink/60 text-sm mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink/40">{post.date}</span>
                    <span className="text-ocean text-sm font-medium cursor-pointer hover:underline">
                      Read more <i className="fas fa-arrow-right ml-1" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 bg-cream">
        <div className="max-w-2xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl mb-4">Stay updated</h2>
          <p className="text-ink/60 mb-8">
            Get the latest compliance tips and product updates delivered to your inbox.
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-xl border border-stone/50 focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
            <button className="bg-ocean text-white px-6 py-3 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
