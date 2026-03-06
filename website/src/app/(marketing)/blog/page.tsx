import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return {
    title: dict.blogPage.metaTitle,
    description: dict.blogPage.metaDescription,
  };
}

export default async function BlogPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);

  return (
    <>
      {/* Hero */}
      <section className="py-24 bg-cream relative noise-bg">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <span className="feature-tag mb-6 inline-block">
            <span className="w-2 h-2 bg-forest rounded-full mr-2" />
            {dict.blogPage.tagline}
          </span>
          <h1 className="font-display text-5xl md:text-7xl mb-6">
            {dict.blogPage.title}
          </h1>
          <p className="text-xl text-ink/60 max-w-2xl mx-auto">
            {dict.blogPage.subtitle}
          </p>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dict.blogPage.posts.map((post, index) => (
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
                  <p className="text-ink/60 text-sm mb-4">{post.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-ink/40">{post.date}</span>
                    <span className="text-ocean text-sm font-medium cursor-pointer hover:underline">
                      {dict.common.readMore} <i className="fas fa-arrow-right ml-1" />
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
          <h2 className="font-display text-3xl mb-4">{dict.common.stayUpdated}</h2>
          <p className="text-ink/60 mb-8">
            {dict.blogPage.newsletter}
          </p>
          <div className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder={dict.common.enterYourEmail}
              className="flex-1 px-4 py-3 rounded-xl border border-stone/50 focus:ring-2 focus:ring-ocean focus:border-ocean"
            />
            <button className="bg-ocean text-white px-6 py-3 rounded-xl font-medium hover:bg-ocean/90 transition-colors">
              {dict.common.subscribe}
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
