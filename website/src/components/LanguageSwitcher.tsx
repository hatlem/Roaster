'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { localeToCountry, countryNames, type Locale } from '@/i18n/config';

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

const availableLocales: Locale[] = [
  'en', 'no', 'sv', 'da', 'fi', 'de', 'de-AT', 'de-CH',
  'fr', 'fr-BE', 'nl', 'es', 'pt', 'it', 'pl', 'en-GB', 'en-IE'
];

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Get the path without the locale prefix
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/';

  const currentCountry = localeToCountry[currentLocale];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-stone/50 transition-colors"
      >
        <span className="text-sm font-medium">{countryNames[currentLocale]}</span>
        <i className={`fas fa-chevron-down text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-stone/50 overflow-hidden z-50 min-w-[200px]">
            <div className="max-h-[400px] overflow-y-auto">
              {availableLocales.map((locale) => {
                const country = localeToCountry[locale];
                const isActive = locale === currentLocale;

                return (
                  <Link
                    key={locale}
                    href={`/${country}${pathWithoutLocale}`}
                    onClick={() => setIsOpen(false)}
                    className={`block px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-forest/10 text-forest font-medium'
                        : 'hover:bg-stone/30'
                    }`}
                  >
                    {countryNames[locale]}
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
