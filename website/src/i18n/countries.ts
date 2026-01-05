// Country-specific configuration
// All locale-specific data: currencies, VAT, authorities, payment methods, formats

import type { Locale } from './config';

export interface CountryConfig {
  // Basic info
  name: string;
  nativeName: string;
  flag: string;

  // Currency
  currency: {
    code: string;
    symbol: string;
    position: 'before' | 'after';
    thousandsSeparator: string;
    decimalSeparator: string;
  };

  // Pricing (base prices, will be converted from EUR)
  priceMultiplier: number; // Multiplier from base EUR prices

  // VAT
  vat: {
    rate: number; // e.g., 0.25 for 25%
    name: string; // "MVA", "Moms", "VAT", "MwSt", etc.
    included: boolean; // Whether prices include VAT
  };

  // Labor law
  laborLaw: {
    name: string;
    shortName: string;
    inspectionAuthority: string;
    inspectionAuthorityShort: string;
  };

  // Rest requirements (hours)
  restRequirements: {
    dailyRest: number;
    weeklyRest: number;
    maxDailyHours: number;
    maxWeeklyHours: number;
    publishingNotice: number; // Days advance notice for schedules
  };

  // Payment methods (Stripe)
  paymentMethods: ('card' | 'sepa' | 'invoice')[];

  // Formats
  formats: {
    date: string; // e.g., "DD.MM.YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
    time: string; // e.g., "HH:mm", "h:mm A"
    phone: string; // e.g., "+47 XXX XX XXX"
    phonePrefix: string; // e.g., "+47"
  };
}

export const countryConfigs: Record<Locale, CountryConfig> = {
  // Norway
  no: {
    name: 'Norway',
    nativeName: 'Norge',
    flag: '🇳🇴',
    currency: {
      code: 'NOK',
      symbol: 'kr',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 11.5, // EUR to NOK
    vat: {
      rate: 0.25,
      name: 'MVA',
      included: true,
    },
    laborLaw: {
      name: 'Arbeidsmiljøloven',
      shortName: 'AML',
      inspectionAuthority: 'Arbeidstilsynet',
      inspectionAuthorityShort: 'Arbeidstilsynet',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 9,
      maxWeeklyHours: 40,
      publishingNotice: 14,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+47 XXX XX XXX',
      phonePrefix: '+47',
    },
  },

  // Sweden
  sv: {
    name: 'Sweden',
    nativeName: 'Sverige',
    flag: '🇸🇪',
    currency: {
      code: 'SEK',
      symbol: 'kr',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 11.5, // EUR to SEK
    vat: {
      rate: 0.25,
      name: 'Moms',
      included: true,
    },
    laborLaw: {
      name: 'Arbetsmiljölagen',
      shortName: 'AML',
      inspectionAuthority: 'Arbetsmiljöverket',
      inspectionAuthorityShort: 'AV',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 36,
      maxDailyHours: 10,
      maxWeeklyHours: 40,
      publishingNotice: 14,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'YYYY-MM-DD',
      time: 'HH:mm',
      phone: '+46 XX XXX XX XX',
      phonePrefix: '+46',
    },
  },

  // Denmark
  da: {
    name: 'Denmark',
    nativeName: 'Danmark',
    flag: '🇩🇰',
    currency: {
      code: 'DKK',
      symbol: 'kr',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 7.5, // EUR to DKK
    vat: {
      rate: 0.25,
      name: 'Moms',
      included: true,
    },
    laborLaw: {
      name: 'Arbejdsmiljøloven',
      shortName: 'AML',
      inspectionAuthority: 'Arbejdstilsynet',
      inspectionAuthorityShort: 'AT',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 10,
      maxWeeklyHours: 48,
      publishingNotice: 14,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+45 XX XX XX XX',
      phonePrefix: '+45',
    },
  },

  // Finland
  fi: {
    name: 'Finland',
    nativeName: 'Suomi',
    flag: '🇫🇮',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.255, // 25.5% as of 2024
      name: 'ALV',
      included: true,
    },
    laborLaw: {
      name: 'Työaikalaki',
      shortName: 'TAL',
      inspectionAuthority: 'Aluehallintovirasto',
      inspectionAuthorityShort: 'AVI',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 10,
      maxWeeklyHours: 40,
      publishingNotice: 7,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+358 XX XXX XXXX',
      phonePrefix: '+358',
    },
  },

  // Germany
  de: {
    name: 'Germany',
    nativeName: 'Deutschland',
    flag: '🇩🇪',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.19,
      name: 'MwSt',
      included: true,
    },
    laborLaw: {
      name: 'Arbeitszeitgesetz',
      shortName: 'ArbZG',
      inspectionAuthority: 'Gewerbeaufsicht',
      inspectionAuthorityShort: 'GAA',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 24,
      maxDailyHours: 10,
      maxWeeklyHours: 48,
      publishingNotice: 4,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+49 XXX XXXXXXX',
      phonePrefix: '+49',
    },
  },

  // Austria
  'de-AT': {
    name: 'Austria',
    nativeName: 'Österreich',
    flag: '🇦🇹',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.20,
      name: 'USt',
      included: true,
    },
    laborLaw: {
      name: 'Arbeitszeitgesetz',
      shortName: 'AZG',
      inspectionAuthority: 'Arbeitsinspektorat',
      inspectionAuthorityShort: 'AI',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 36,
      maxDailyHours: 10,
      maxWeeklyHours: 48,
      publishingNotice: 14,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+43 XXX XXXXXXX',
      phonePrefix: '+43',
    },
  },

  // Switzerland
  'de-CH': {
    name: 'Switzerland',
    nativeName: 'Schweiz',
    flag: '🇨🇭',
    currency: {
      code: 'CHF',
      symbol: 'CHF',
      position: 'before',
      thousandsSeparator: "'",
      decimalSeparator: '.',
    },
    priceMultiplier: 0.95, // EUR to CHF
    vat: {
      rate: 0.081, // 8.1%
      name: 'MwSt',
      included: true,
    },
    laborLaw: {
      name: 'Arbeitsgesetz',
      shortName: 'ArG',
      inspectionAuthority: 'SECO',
      inspectionAuthorityShort: 'SECO',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 9,
      maxWeeklyHours: 45,
      publishingNotice: 14,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+41 XX XXX XX XX',
      phonePrefix: '+41',
    },
  },

  // France
  fr: {
    name: 'France',
    nativeName: 'France',
    flag: '🇫🇷',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.20,
      name: 'TVA',
      included: true,
    },
    laborLaw: {
      name: 'Code du travail',
      shortName: 'CT',
      inspectionAuthority: 'Inspection du travail',
      inspectionAuthorityShort: 'DREETS',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 10,
      maxWeeklyHours: 35,
      publishingNotice: 7,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+33 X XX XX XX XX',
      phonePrefix: '+33',
    },
  },

  // Belgium
  'fr-BE': {
    name: 'Belgium',
    nativeName: 'Belgique',
    flag: '🇧🇪',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.21,
      name: 'TVA',
      included: true,
    },
    laborLaw: {
      name: 'Loi sur le travail',
      shortName: 'LT',
      inspectionAuthority: 'SPF Emploi',
      inspectionAuthorityShort: 'SPF',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 9,
      maxWeeklyHours: 38,
      publishingNotice: 5,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+32 XXX XX XX XX',
      phonePrefix: '+32',
    },
  },

  // Netherlands
  nl: {
    name: 'Netherlands',
    nativeName: 'Nederland',
    flag: '🇳🇱',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'before',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.21,
      name: 'BTW',
      included: true,
    },
    laborLaw: {
      name: 'Arbeidstijdenwet',
      shortName: 'ATW',
      inspectionAuthority: 'Nederlandse Arbeidsinspectie',
      inspectionAuthorityShort: 'NLA',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 36,
      maxDailyHours: 12,
      maxWeeklyHours: 60,
      publishingNotice: 28,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD-MM-YYYY',
      time: 'HH:mm',
      phone: '+31 X XX XX XX XX',
      phonePrefix: '+31',
    },
  },

  // Spain
  es: {
    name: 'Spain',
    nativeName: 'España',
    flag: '🇪🇸',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.21,
      name: 'IVA',
      included: true,
    },
    laborLaw: {
      name: 'Estatuto de los Trabajadores',
      shortName: 'ET',
      inspectionAuthority: 'Inspección de Trabajo',
      inspectionAuthorityShort: 'ITSS',
    },
    restRequirements: {
      dailyRest: 12,
      weeklyRest: 36,
      maxDailyHours: 9,
      maxWeeklyHours: 40,
      publishingNotice: 5,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+34 XXX XXX XXX',
      phonePrefix: '+34',
    },
  },

  // Portugal
  pt: {
    name: 'Portugal',
    nativeName: 'Portugal',
    flag: '🇵🇹',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.23,
      name: 'IVA',
      included: true,
    },
    laborLaw: {
      name: 'Código do Trabalho',
      shortName: 'CT',
      inspectionAuthority: 'ACT',
      inspectionAuthorityShort: 'ACT',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 10,
      maxWeeklyHours: 40,
      publishingNotice: 7,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+351 XXX XXX XXX',
      phonePrefix: '+351',
    },
  },

  // Italy
  it: {
    name: 'Italy',
    nativeName: 'Italia',
    flag: '🇮🇹',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'after',
      thousandsSeparator: '.',
      decimalSeparator: ',',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.22,
      name: 'IVA',
      included: true,
    },
    laborLaw: {
      name: 'Contratto Collettivo Nazionale',
      shortName: 'CCNL',
      inspectionAuthority: 'Ispettorato del Lavoro',
      inspectionAuthorityShort: 'INL',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 24,
      maxDailyHours: 13,
      maxWeeklyHours: 48,
      publishingNotice: 0,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+39 XXX XXX XXXX',
      phonePrefix: '+39',
    },
  },

  // Poland
  pl: {
    name: 'Poland',
    nativeName: 'Polska',
    flag: '🇵🇱',
    currency: {
      code: 'PLN',
      symbol: 'zł',
      position: 'after',
      thousandsSeparator: ' ',
      decimalSeparator: ',',
    },
    priceMultiplier: 4.3, // EUR to PLN
    vat: {
      rate: 0.23,
      name: 'VAT',
      included: true,
    },
    laborLaw: {
      name: 'Kodeks pracy',
      shortName: 'KP',
      inspectionAuthority: 'Państwowa Inspekcja Pracy',
      inspectionAuthorityShort: 'PIP',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 35,
      maxDailyHours: 12,
      maxWeeklyHours: 48,
      publishingNotice: 7,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD.MM.YYYY',
      time: 'HH:mm',
      phone: '+48 XXX XXX XXX',
      phonePrefix: '+48',
    },
  },

  // United Kingdom
  'en-GB': {
    name: 'United Kingdom',
    nativeName: 'United Kingdom',
    flag: '🇬🇧',
    currency: {
      code: 'GBP',
      symbol: '£',
      position: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
    },
    priceMultiplier: 0.86, // EUR to GBP
    vat: {
      rate: 0.20,
      name: 'VAT',
      included: true,
    },
    laborLaw: {
      name: 'Working Time Regulations',
      shortName: 'WTR',
      inspectionAuthority: 'Health and Safety Executive',
      inspectionAuthorityShort: 'HSE',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 24,
      maxDailyHours: 13,
      maxWeeklyHours: 48,
      publishingNotice: 0,
    },
    paymentMethods: ['card', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+44 XXXX XXXXXX',
      phonePrefix: '+44',
    },
  },

  // Ireland
  'en-IE': {
    name: 'Ireland',
    nativeName: 'Ireland',
    flag: '🇮🇪',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0.23,
      name: 'VAT',
      included: true,
    },
    laborLaw: {
      name: 'Organisation of Working Time Act',
      shortName: 'OWTA',
      inspectionAuthority: 'Workplace Relations Commission',
      inspectionAuthorityShort: 'WRC',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 24,
      maxDailyHours: 13,
      maxWeeklyHours: 48,
      publishingNotice: 0,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+353 XX XXX XXXX',
      phonePrefix: '+353',
    },
  },

  // English (International/Default)
  en: {
    name: 'International',
    nativeName: 'International',
    flag: '🌍',
    currency: {
      code: 'EUR',
      symbol: '€',
      position: 'before',
      thousandsSeparator: ',',
      decimalSeparator: '.',
    },
    priceMultiplier: 1,
    vat: {
      rate: 0,
      name: 'VAT',
      included: false,
    },
    laborLaw: {
      name: 'Labor Law',
      shortName: 'Compliant',
      inspectionAuthority: 'Labor Inspection',
      inspectionAuthorityShort: 'LI',
    },
    restRequirements: {
      dailyRest: 11,
      weeklyRest: 24,
      maxDailyHours: 10,
      maxWeeklyHours: 48,
      publishingNotice: 7,
    },
    paymentMethods: ['card', 'sepa', 'invoice'],
    formats: {
      date: 'DD/MM/YYYY',
      time: 'HH:mm',
      phone: '+XX XXX XXX XXXX',
      phonePrefix: '',
    },
  },
};

// Helper functions
export function getCountryConfig(locale: Locale): CountryConfig {
  return countryConfigs[locale];
}

export function formatPrice(amount: number, locale: Locale): string {
  const config = countryConfigs[locale];
  const { symbol, position, thousandsSeparator, decimalSeparator } = config.currency;

  const formatted = amount
    .toFixed(0)
    .replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);

  return position === 'before'
    ? `${symbol}${formatted}`
    : `${formatted} ${symbol}`;
}

export function getLocalPrice(baseEurPrice: number, locale: Locale): number {
  const config = countryConfigs[locale];
  return Math.round(baseEurPrice * config.priceMultiplier);
}

export function formatPriceWithVat(baseEurPrice: number, locale: Locale): string {
  const localPrice = getLocalPrice(baseEurPrice, locale);
  return formatPrice(localPrice, locale);
}
