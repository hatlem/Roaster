import { notFound } from 'next/navigation';
import { DM_Sans } from 'next/font/google';
import { countryToLocale, localeToCountry, type Locale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { LocalizedHeader } from '@/components/LocalizedHeader';
import { LocalizedFooter } from '@/components/LocalizedFooter';
import '../globals.css';

const dmSans = DM_Sans({
  variable: '--font-dm-sans',
  subsets: ['latin'],
});

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
    <html lang={locale} className="scroll-smooth">
      <head>
        <title>{dictionary.metadata.title}</title>
        <meta name="description" content={dictionary.metadata.description} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <LocalizedHeader dictionary={dictionary} locale={locale} country={country} />
        <main className="pt-16">
          {children}
        </main>
        <LocalizedFooter dictionary={dictionary} country={country} />
      </body>
    </html>
  );
}
