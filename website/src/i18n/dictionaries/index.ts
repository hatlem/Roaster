// Export all dictionaries
import { en, type Dictionary } from './en';
import { no } from './no';
import { sv } from './sv';
import { da } from './da';
import { fi } from './fi';
import { de } from './de';
import { deAT } from './de-AT';
import { deCH } from './de-CH';
import { fr } from './fr';
import { frBE } from './fr-BE';
import { nl } from './nl';
import { es } from './es';
import { pt } from './pt';
import { it } from './it';
import { pl } from './pl';
import { enGB } from './en-GB';
import { enIE } from './en-IE';

import type { Locale } from '../config';

export type { Dictionary };

const dictionaries: Record<Locale, Dictionary> = {
  en,
  no,
  sv,
  da,
  fi,
  de,
  'de-AT': deAT,
  'de-CH': deCH,
  fr,
  'fr-BE': frBE,
  nl,
  es,
  pt,
  it,
  pl,
  'en-GB': enGB,
  'en-IE': enIE,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] || dictionaries.en;
}

export { dictionaries };
