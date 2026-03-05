import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { countryToLocale, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';

// Generate static params for all country codes
export function generateStaticParams() {
  return Object.keys(countryToLocale).map((country) => ({
    locale: country,
  }));
}

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale: country } = await params;

  // Get the actual locale from country code
  const locale = countryToLocale[country as keyof typeof countryToLocale];

  if (!locale) {
    notFound();
  }

  const dictionary = getDictionary(locale);

  return (
    <>
      <LocalizedHeader dictionary={dictionary} locale={locale} country={country} />
      <main className="pt-16">
        {children}
      </main>
      <LocalizedFooter dictionary={dictionary} country={country} />
    </>
  );
}
