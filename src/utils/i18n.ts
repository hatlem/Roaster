// Re-export from the new i18n module for backward compatibility
// The i18n system has been restructured into src/i18n/ with split locale files
// Supported languages: Norwegian (no), English (en), Spanish (es), French (fr), German (de), Polish (pl), Swedish (sv)

export {
  type SupportedLocale,
  type Translations,
  type CommonTranslations,
  type AuthTranslations,
  type RosterTranslations,
  type ComplianceTranslations,
  type EmployeeTranslations,
  type LocaleConfig,
  localeConfigs,
  t,
  getTranslator,
  getTranslations,
  getSupportedLocales,
  isLocaleSupported,
  getBrowserLocale,
  formatDate,
  formatTime,
  formatCurrency,
  formatNumber,
  formatRelativeTime,
  no,
  en,
  es,
  fr,
  de,
  pl,
  sv,
} from '../i18n';

// Legacy exports for backward compatibility
import { no, en } from '../i18n';
export const norwegianTranslations = no;
export const englishTranslations = en;
