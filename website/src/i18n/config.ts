// i18n Configuration
export const locales = [
  'en',    // Default (English)
  'no',    // Norwegian
  'sv',    // Swedish (se)
  'da',    // Danish (dk)
  'fi',    // Finnish
  'de',    // German
  'de-AT', // Austrian German (at)
  'de-CH', // Swiss German (ch)
  'fr',    // French
  'fr-BE', // Belgian French (be)
  'nl',    // Dutch
  'es',    // Spanish
  'pt',    // Portuguese
  'it',    // Italian
  'pl',    // Polish
  'en-GB', // British English (uk)
  'en-IE', // Irish English (ie)
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

// Map country codes to locale codes
export const countryToLocale: Record<string, Locale> = {
  no: 'no',
  se: 'sv',
  dk: 'da',
  fi: 'fi',
  de: 'de',
  at: 'de-AT',
  ch: 'de-CH',
  fr: 'fr',
  be: 'fr-BE',
  nl: 'nl',
  es: 'es',
  pt: 'pt',
  it: 'it',
  pl: 'pl',
  uk: 'en-GB',
  ie: 'en-IE',
};

// Map locale to country code (for URLs)
export const localeToCountry: Record<Locale, string> = {
  en: 'en',
  no: 'no',
  sv: 'se',
  da: 'dk',
  fi: 'fi',
  de: 'de',
  'de-AT': 'at',
  'de-CH': 'ch',
  fr: 'fr',
  'fr-BE': 'be',
  nl: 'nl',
  es: 'es',
  pt: 'pt',
  it: 'it',
  pl: 'pl',
  'en-GB': 'uk',
  'en-IE': 'ie',
};

// Labor law references per locale
export const laborLawByLocale: Record<Locale, { name: string; shortName: string }> = {
  en: { name: 'Labor Law', shortName: 'Compliant' },
  no: { name: 'Arbeidsmiljøloven', shortName: 'AML' },
  sv: { name: 'Arbetsmiljölagen', shortName: 'AML' },
  da: { name: 'Arbejdsmiljøloven', shortName: 'AML' },
  fi: { name: 'Työaikalaki', shortName: 'TAL' },
  de: { name: 'Arbeitszeitgesetz', shortName: 'ArbZG' },
  'de-AT': { name: 'Arbeitszeitgesetz', shortName: 'AZG' },
  'de-CH': { name: 'Arbeitsgesetz', shortName: 'ArG' },
  fr: { name: 'Code du travail', shortName: 'CT' },
  'fr-BE': { name: 'Loi sur le travail', shortName: 'LT' },
  nl: { name: 'Arbeidstijdenwet', shortName: 'ATW' },
  es: { name: 'Estatuto de los Trabajadores', shortName: 'ET' },
  pt: { name: 'Código do Trabalho', shortName: 'CT' },
  it: { name: 'Contratto Collettivo Nazionale', shortName: 'CCNL' },
  pl: { name: 'Kodeks pracy', shortName: 'KP' },
  'en-GB': { name: 'Working Time Regulations', shortName: 'WTR' },
  'en-IE': { name: 'Organisation of Working Time Act', shortName: 'OWTA' },
};

// Country names in their native language
export const countryNames: Record<Locale, string> = {
  en: 'International',
  no: 'Norge',
  sv: 'Sverige',
  da: 'Danmark',
  fi: 'Suomi',
  de: 'Deutschland',
  'de-AT': 'Österreich',
  'de-CH': 'Schweiz',
  fr: 'France',
  'fr-BE': 'Belgique',
  nl: 'Nederland',
  es: 'España',
  pt: 'Portugal',
  it: 'Italia',
  pl: 'Polska',
  'en-GB': 'United Kingdom',
  'en-IE': 'Ireland',
};
