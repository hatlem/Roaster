// Internationalization (i18n) Configuration
// Support for Norwegian (no), English (en), Spanish (es), French (fr), German (de), Polish (pl), and Swedish (sv)

import type { SupportedLocale, Translations } from './types';
export * from './types';

// Import all locale translations
import { no } from './locales/no';
import { en } from './locales/en';
import { es } from './locales/es';
import { fr } from './locales/fr';
import { de } from './locales/de';
import { pl } from './locales/pl';
import { sv } from './locales/sv';

// Translation store
const translations: Record<SupportedLocale, Translations> = {
  no,
  en,
  es,
  fr,
  de,
  pl,
  sv,
};

/**
 * Get translation for a key
 */
export function t(locale: SupportedLocale, key: string): string {
  const keys = key.split('.');
  let value: unknown = translations[locale];

  for (const k of keys) {
    value = (value as Record<string, unknown>)?.[k];
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
      return key;
    }
  }

  return value as string;
}

/**
 * Get translation function for a specific locale
 */
export function getTranslator(locale: SupportedLocale) {
  return (key: string) => t(locale, key);
}

/**
 * Get all translations for a locale
 */
export function getTranslations(locale: SupportedLocale): Translations {
  return translations[locale];
}

/**
 * Get supported locales
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(translations) as SupportedLocale[];
}

/**
 * Check if a locale is supported
 */
export function isLocaleSupported(locale: string): locale is SupportedLocale {
  return locale in translations;
}

/**
 * Get the browser's preferred locale, falling back to default
 */
export function getBrowserLocale(defaultLocale: SupportedLocale = 'no'): SupportedLocale {
  if (typeof navigator === 'undefined') {
    return defaultLocale;
  }

  const browserLocale = navigator.language.split('-')[0];
  return isLocaleSupported(browserLocale) ? browserLocale : defaultLocale;
}

/**
 * Format date according to locale standards
 */
export function formatDate(date: Date, locale: SupportedLocale = 'no'): string {
  const localeMap: Record<SupportedLocale, string> = {
    no: 'no-NO',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  // Swedish uses ISO format (YYYY-MM-DD)
  if (locale === 'sv') {
    return date.toLocaleDateString('sv-SE');
  }

  // English uses "MMM DD, YYYY" format
  if (locale === 'en') {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  return date.toLocaleDateString(localeMap[locale], options);
}

/**
 * Format time according to locale standards
 */
export function formatTime(date: Date, locale: SupportedLocale = 'no'): string {
  const localeMap: Record<SupportedLocale, string> = {
    no: 'no-NO',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  // Only English uses 12-hour format
  const use24Hour = locale !== 'en';

  return date.toLocaleTimeString(localeMap[locale], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
  });
}

/**
 * Format currency (Norwegian Kroner by default, or specified currency)
 */
export function formatCurrency(
  amount: number,
  locale: SupportedLocale = 'no',
  currency: string = 'NOK'
): string {
  const localeMap: Record<SupportedLocale, string> = {
    no: 'no-NO',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  return new Intl.NumberFormat(localeMap[locale], {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format number according to locale
 */
export function formatNumber(number: number, locale: SupportedLocale = 'no'): string {
  const localeMap: Record<SupportedLocale, string> = {
    no: 'no-NO',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  return new Intl.NumberFormat(localeMap[locale]).format(number);
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 hours")
 */
export function formatRelativeTime(
  date: Date,
  locale: SupportedLocale = 'no',
  now: Date = new Date()
): string {
  const localeMap: Record<SupportedLocale, string> = {
    no: 'no-NO',
    en: 'en-US',
    es: 'es-ES',
    fr: 'fr-FR',
    de: 'de-DE',
    pl: 'pl-PL',
    sv: 'sv-SE',
  };

  const diffInSeconds = Math.floor((date.getTime() - now.getTime()) / 1000);
  const absSeconds = Math.abs(diffInSeconds);

  let value: number;
  let unit: Intl.RelativeTimeFormatUnit;

  if (absSeconds < 60) {
    value = diffInSeconds;
    unit = 'second';
  } else if (absSeconds < 3600) {
    value = Math.floor(diffInSeconds / 60);
    unit = 'minute';
  } else if (absSeconds < 86400) {
    value = Math.floor(diffInSeconds / 3600);
    unit = 'hour';
  } else if (absSeconds < 2592000) {
    value = Math.floor(diffInSeconds / 86400);
    unit = 'day';
  } else if (absSeconds < 31536000) {
    value = Math.floor(diffInSeconds / 2592000);
    unit = 'month';
  } else {
    value = Math.floor(diffInSeconds / 31536000);
    unit = 'year';
  }

  const rtf = new Intl.RelativeTimeFormat(localeMap[locale], { numeric: 'auto' });
  return rtf.format(value, unit);
}

// Re-export locales for direct access if needed
export { no, en, es, fr, de, pl, sv };
