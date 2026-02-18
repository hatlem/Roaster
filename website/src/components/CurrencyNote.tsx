'use client';

import { useParams } from 'next/navigation';
import { countryToLocale, type Locale } from '@/i18n/config';
import { getCountryConfig } from '@/i18n/countries';

const CURRENCY_NAMES: Record<string, Record<string, string>> = {
  en: {
    EUR: 'Euro', USD: 'US Dollar', GBP: 'British Pound', NOK: 'Norwegian Krone',
    SEK: 'Swedish Krona', DKK: 'Danish Krone', CHF: 'Swiss Franc', PLN: 'Polish Zloty',
  },
  no: {
    EUR: 'euro', USD: 'amerikanske dollar', GBP: 'britiske pund', NOK: 'norske kroner',
    SEK: 'svenske kroner', DKK: 'danske kroner', CHF: 'sveitsiske franc', PLN: 'polske zloty',
  },
  sv: {
    EUR: 'euro', USD: 'amerikanska dollar', GBP: 'brittiska pund', NOK: 'norska kronor',
    SEK: 'svenska kronor', DKK: 'danska kronor', CHF: 'schweiziska franc', PLN: 'polska zloty',
  },
  da: {
    EUR: 'euro', USD: 'amerikanske dollar', GBP: 'britiske pund', NOK: 'norske kroner',
    SEK: 'svenske kroner', DKK: 'danske kroner', CHF: 'schweizerfranc', PLN: 'polske zloty',
  },
  de: {
    EUR: 'Euro', USD: 'US-Dollar', GBP: 'Britisches Pfund', NOK: 'Norwegische Krone',
    SEK: 'Schwedische Krone', DKK: 'Danische Krone', CHF: 'Schweizer Franken', PLN: 'Polnischer Zloty',
  },
  fr: {
    EUR: 'euro', USD: 'dollar americain', GBP: 'livre sterling', NOK: 'couronne norvegienne',
    SEK: 'couronne suedoise', DKK: 'couronne danoise', CHF: 'franc suisse', PLN: 'zloty polonais',
  },
  es: {
    EUR: 'euro', USD: 'dolar estadounidense', GBP: 'libra esterlina', NOK: 'corona noruega',
    SEK: 'corona sueca', DKK: 'corona danesa', CHF: 'franco suizo', PLN: 'zloty polaco',
  },
  it: {
    EUR: 'euro', USD: 'dollaro statunitense', GBP: 'sterlina britannica', NOK: 'corona norvegese',
    SEK: 'corona svedese', DKK: 'corona danese', CHF: 'franco svizzero', PLN: 'zloty polacco',
  },
  nl: {
    EUR: 'euro', USD: 'Amerikaanse dollar', GBP: 'Brits pond', NOK: 'Noorse kroon',
    SEK: 'Zweedse kroon', DKK: 'Deense kroon', CHF: 'Zwitserse frank', PLN: 'Poolse zloty',
  },
  pt: {
    EUR: 'euro', USD: 'dolar americano', GBP: 'libra esterlina', NOK: 'coroa norueguesa',
    SEK: 'coroa sueca', DKK: 'coroa dinamarquesa', CHF: 'franco suico', PLN: 'zloty polones',
  },
  pl: {
    EUR: 'euro', USD: 'dolar amerykanski', GBP: 'funt szterling', NOK: 'korona norweska',
    SEK: 'korona szwedzka', DKK: 'korona dunska', CHF: 'frank szwajcarski', PLN: 'zloty polski',
  },
  fi: {
    EUR: 'euro', USD: 'Yhdysvaltain dollari', GBP: 'Englannin punta', NOK: 'Norjan kruunu',
    SEK: 'Ruotsin kruunu', DKK: 'Tanskan kruunu', CHF: 'Sveitsin frangi', PLN: 'Puolan zloty',
  },
}

const DISPLAY_TEXT: Record<string, string> = {
  en: 'All prices are displayed in {currency} ({name})',
  no: 'Alle priser vises i {currency} ({name})',
  sv: 'Alla priser visas i {currency} ({name})',
  da: 'Alle priser vises i {currency} ({name})',
  de: 'Alle Preise werden in {currency} ({name}) angezeigt',
  fr: 'Tous les prix sont affiches en {currency} ({name})',
  es: 'Todos los precios se muestran en {currency} ({name})',
  it: 'Tutti i prezzi sono visualizzati in {currency} ({name})',
  nl: 'Alle prijzen worden weergegeven in {currency} ({name})',
  pt: 'Todos os precos sao exibidos em {currency} ({name})',
  pl: 'Wszystkie ceny sa wyswietlane w {currency} ({name})',
  fi: 'Kaikki hinnat naytetaan valuutassa {currency} ({name})',
}

function resolveLang(locale: string): string {
  if (locale.startsWith('no') || locale.startsWith('nb')) return 'no'
  if (locale.startsWith('de')) return 'de'
  if (locale.startsWith('fr')) return 'fr'
  if (locale.startsWith('en')) return 'en'
  const base = locale.split('-')[0]
  if (base in CURRENCY_NAMES) return base
  return 'en'
}

export function CurrencyNote() {
  const params = useParams();
  const country = (params?.locale as string) || 'en';
  const locale = (countryToLocale[country as keyof typeof countryToLocale] || 'en') as Locale;
  const countryConfig = getCountryConfig(locale);
  const currency = countryConfig.currency.code;
  const lang = resolveLang(locale);
  const name = CURRENCY_NAMES[lang]?.[currency] || CURRENCY_NAMES.en[currency];
  if (!name) return null;

  const template = DISPLAY_TEXT[lang] || DISPLAY_TEXT.en;
  const text = template.replace('{currency}', currency).replace('{name}', name);

  return (
    <p className="text-sm text-ink/60">
      {text}
    </p>
  );
}
