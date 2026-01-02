import Link from 'next/link';
import type { Dictionary } from '@/i18n/dictionaries';
import type { Locale } from '@/i18n/config';
import { LanguageSwitcher } from './LanguageSwitcher';

interface LocalizedHeaderProps {
  dictionary: Dictionary;
  locale: Locale;
  country: string;
}

export function LocalizedHeader({ dictionary, locale, country }: LocalizedHeaderProps) {
  const nav = dictionary.nav;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-stone/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${country}`} className="font-display text-2xl font-bold text-ink">
            Roaster
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href={`/${country}/features`}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.features}
            </Link>
            <Link
              href={`/${country}/pricing`}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.pricing}
            </Link>
            <Link
              href={`/${country}/industries`}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.industries}
            </Link>
            <Link
              href={`/${country}/customers`}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.customers}
            </Link>
            <Link
              href={`/${country}/about`}
              className="text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.about}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href={`/${country}/login`}
              className="hidden md:block text-sm font-medium text-ink/70 hover:text-ink transition-colors"
            >
              {nav.login}
            </Link>
            <Link
              href={`/${country}/demo`}
              className="bg-ink text-cream px-4 py-2 rounded-full text-sm font-semibold hover:bg-ink/90 transition-colors"
            >
              {nav.startTrial}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
