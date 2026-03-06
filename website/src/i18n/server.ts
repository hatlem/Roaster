import { cookies, headers } from 'next/headers';
import { locales, defaultLocale, type Locale } from './config';

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    return localeCookie as Locale;
  }

  // Fallback to Accept-Language header
  const headerStore = await headers();
  const acceptLanguage = headerStore.get('accept-language');
  if (acceptLanguage) {
    const languages = acceptLanguage
      .split(',')
      .map(lang => {
        const [code, q = 'q=1'] = lang.trim().split(';');
        return { code: code.toLowerCase(), quality: parseFloat(q.replace('q=', '')) };
      })
      .sort((a, b) => b.quality - a.quality);

    for (const { code } of languages) {
      if (locales.includes(code as Locale)) return code as Locale;
      const langPart = code.split('-')[0];
      const match = locales.find(l => l === langPart || l.startsWith(langPart + '-'));
      if (match) return match;
    }
  }

  return defaultLocale;
}
