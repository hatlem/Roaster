import Link from "next/link";
import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";

export default async function NotFound() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  const t = dict.notFound;

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="font-display text-8xl text-terracotta mb-4">404</p>
        <h1 className="font-display text-3xl mb-4">{t.title}</h1>
        <p className="text-ink/60 mb-8">
          {t.description}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary">
            {t.goHome}
          </Link>
          <Link href="/contact" className="btn-secondary">
            {t.contactUs}
          </Link>
        </div>
      </div>
    </div>
  );
}
