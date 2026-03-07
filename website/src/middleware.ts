import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale, type Locale, localeToCountry } from './i18n/config';

/** ISO 27001 A.8.9 — Security headers applied to all responses */
function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

function getPreferredLocale(request: NextRequest): Locale {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return defaultLocale;

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

  for (const { code } of languages) {
    if (locales.includes(code as Locale)) {
      return code as Locale;
    }
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

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const pathnameSegments = pathname.split('/');
  const pathnameLocale = pathnameSegments[1];

  const countryToLocale: Record<string, Locale> = {};
  for (const [locale, country] of Object.entries(localeToCountry)) {
    countryToLocale[country] = locale as Locale;
  }

  const localeFromCountry = countryToLocale[pathnameLocale];
  if (localeFromCountry) {
    // Set locale cookie for country-code URLs
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', localeFromCountry, { path: '/', sameSite: 'lax' });
    return applySecurityHeaders(response);
  }

  if (locales.includes(pathnameLocale as Locale)) {
    const response = NextResponse.next();
    response.cookies.set('NEXT_LOCALE', pathnameLocale, { path: '/', sameSite: 'lax' });
    return applySecurityHeaders(response);
  }

  // Detect locale and set cookie for all other pages
  const preferredLocale = getPreferredLocale(request);
  const response = NextResponse.next();

  // Only set cookie if not already set to the right value
  const existingLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (!existingLocale) {
    response.cookies.set('NEXT_LOCALE', preferredLocale, { path: '/', sameSite: 'lax' });
  }

  // Redirect root path to locale-specific homepage
  if (pathname === '/' && preferredLocale !== defaultLocale) {
    const country = localeToCountry[preferredLocale];
    const url = request.nextUrl.clone();
    url.pathname = `/${country}`;
    const redirectResponse = NextResponse.redirect(url);
    redirectResponse.cookies.set('NEXT_LOCALE', preferredLocale, { path: '/', sameSite: 'lax' });
    return applySecurityHeaders(redirectResponse);
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
};
