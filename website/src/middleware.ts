import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale, localeToCountry } from './i18n/config';

// Get the preferred locale from Accept-Language header
function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

  // Parse Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map(lang => {
      const [code, q = 'q=1'] = lang.trim().split(';');
      return {
        code: code.toLowerCase(),
        quality: parseFloat(q.replace('q=', ''))
      };
    })
    .sort((a, b) => b.quality - a.quality);

  // Find matching locale
  for (const { code } of languages) {
    // Exact match
    if (locales.includes(code as Locale)) {
      return code as Locale;
    }
    // Match language part (e.g., 'en' matches 'en-GB')
    const langPart = code.split('-')[0];
    const match = locales.find(locale =>
      locale === langPart || locale.startsWith(langPart + '-')
    );
    if (match) return match;
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for static files, API routes, and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }

  // Check if pathname has a supported locale
  const pathnameSegments = pathname.split('/');
  const pathnameLocale = pathnameSegments[1];

  // Map country codes to locales for URL matching
  const countryToLocale: Record<string, Locale> = {};
  for (const [locale, country] of Object.entries(localeToCountry)) {
    countryToLocale[country] = locale as Locale;
  }

  // Check if URL uses country code (e.g., /se, /dk, /de)
  const localeFromCountry = countryToLocale[pathnameLocale];
  if (localeFromCountry) {
    // Already has a valid locale/country prefix
    return NextResponse.next();
  }

  // Check if URL uses locale directly (e.g., /sv, /da, /de)
  if (locales.includes(pathnameLocale as Locale)) {
    return NextResponse.next();
  }

  // No locale in pathname - redirect to preferred locale
  const preferredLocale = getPreferredLocale(request);
  const country = localeToCountry[preferredLocale];

  // Only redirect to non-default locale
  if (preferredLocale !== defaultLocale) {
    const url = request.nextUrl.clone();
    url.pathname = `/${country}${pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all pathnames except for
    // - api routes
    // - _next (Next.js internals)
    // - static files
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
