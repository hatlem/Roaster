// Internationalization (i18n) Configuration
// Support for Norwegian (no) and English (en)

export type SupportedLocale = 'no' | 'en';

export interface Translations {
  common: {
    cancel: string;
    save: string;
    delete: string;
    edit: string;
    create: string;
    close: string;
    yes: string;
    no: string;
    loading: string;
    error: string;
    success: string;
  };
  auth: {
    login: string;
    logout: string;
    register: string;
    email: string;
    password: string;
    forgotPassword: string;
    invalidCredentials: string;
  };
  roster: {
    title: string;
    create: string;
    publish: string;
    draft: string;
    published: string;
    startDate: string;
    endDate: string;
    shifts: string;
    addShift: string;
    publishWarning: string;
    latePublicationWarning: string;
  };
  compliance: {
    violation: string;
    warning: string;
    compliant: string;
    restPeriodViolation: string;
    dailyHoursViolation: string;
    weeklyHoursViolation: string;
    overtimeViolation: string;
    fourteenDayRule: string;
    minDailyRest: string;
    minWeeklyRest: string;
  };
  employee: {
    employees: string;
    schedule: string;
    preferences: string;
    notifications: string;
    availability: string;
    timeOff: string;
    shifts: string;
  };
}

// Norwegian translations
export const norwegianTranslations: Translations = {
  common: {
    cancel: 'Avbryt',
    save: 'Lagre',
    delete: 'Slett',
    edit: 'Rediger',
    create: 'Opprett',
    close: 'Lukk',
    yes: 'Ja',
    no: 'Nei',
    loading: 'Laster...',
    error: 'Feil',
    success: 'Suksess',
  },
  auth: {
    login: 'Logg inn',
    logout: 'Logg ut',
    register: 'Registrer',
    email: 'E-post',
    password: 'Passord',
    forgotPassword: 'Glemt passord?',
    invalidCredentials: 'Ugyldig e-post eller passord',
  },
  roster: {
    title: 'Vaktplan',
    create: 'Opprett vaktplan',
    publish: 'Publiser',
    draft: 'Utkast',
    published: 'Publisert',
    startDate: 'Startdato',
    endDate: 'Sluttdato',
    shifts: 'Vakter',
    addShift: 'Legg til vakt',
    publishWarning: 'Er du sikker på at du vil publisere denne vaktplanen?',
    latePublicationWarning: 'ADVARSEL: Denne publiseringen er forsinket og bryter 14-dagers regelen (Arbeidsmiljøloven § 10-2)',
  },
  compliance: {
    violation: 'Brudd',
    warning: 'Advarsel',
    compliant: 'I samsvar',
    restPeriodViolation: 'Brudd på hviletid',
    dailyHoursViolation: 'Daglig arbeidstidsgrense overskredet',
    weeklyHoursViolation: 'Ukentlig arbeidstidsgrense overskredet',
    overtimeViolation: 'Overtidsgrense overskredet',
    fourteenDayRule: '14-dagers regelen',
    minDailyRest: 'Minimum 11 timers hvile per 24 timer',
    minWeeklyRest: 'Minimum 35 timers sammenhengende hvile per 7 dager',
  },
  employee: {
    employees: 'Ansatte',
    schedule: 'Timeplan',
    preferences: 'Preferanser',
    notifications: 'Varsler',
    availability: 'Tilgjengelighet',
    timeOff: 'Fravær',
    shifts: 'Vakter',
  },
};

// English translations
export const englishTranslations: Translations = {
  common: {
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    close: 'Close',
    yes: 'Yes',
    no: 'No',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
  },
  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    invalidCredentials: 'Invalid email or password',
  },
  roster: {
    title: 'Roster',
    create: 'Create roster',
    publish: 'Publish',
    draft: 'Draft',
    published: 'Published',
    startDate: 'Start date',
    endDate: 'End date',
    shifts: 'Shifts',
    addShift: 'Add shift',
    publishWarning: 'Are you sure you want to publish this roster?',
    latePublicationWarning: 'WARNING: This publication is late and violates the 14-day rule (Working Environment Act § 10-2)',
  },
  compliance: {
    violation: 'Violation',
    warning: 'Warning',
    compliant: 'Compliant',
    restPeriodViolation: 'Rest period violation',
    dailyHoursViolation: 'Daily hours limit exceeded',
    weeklyHoursViolation: 'Weekly hours limit exceeded',
    overtimeViolation: 'Overtime limit exceeded',
    fourteenDayRule: '14-day rule',
    minDailyRest: 'Minimum 11 hours rest per 24 hours',
    minWeeklyRest: 'Minimum 35 hours continuous rest per 7 days',
  },
  employee: {
    employees: 'Employees',
    schedule: 'Schedule',
    preferences: 'Preferences',
    notifications: 'Notifications',
    availability: 'Availability',
    timeOff: 'Time Off',
    shifts: 'Shifts',
  },
};

// Translation store
const translations: Record<SupportedLocale, Translations> = {
  no: norwegianTranslations,
  en: englishTranslations,
};

/**
 * Get translation for a key
 */
export function t(locale: SupportedLocale, key: string): string {
  const keys = key.split('.');
  let value: any = translations[locale];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
      return key;
    }
  }

  return value;
}

/**
 * Get translation function for a specific locale
 */
export function getTranslator(locale: SupportedLocale) {
  return (key: string) => t(locale, key);
}

/**
 * Format date according to Norwegian standards
 */
export function formatDate(date: Date, locale: SupportedLocale = 'no'): string {
  if (locale === 'no') {
    return date.toLocaleDateString('no-NO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format time according to Norwegian standards (24-hour format)
 */
export function formatTime(date: Date, locale: SupportedLocale = 'no'): string {
  return date.toLocaleTimeString(locale === 'no' ? 'no-NO' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: locale !== 'no',
  });
}

/**
 * Format currency (Norwegian Kroner)
 */
export function formatCurrency(amount: number, locale: SupportedLocale = 'no'): string {
  return new Intl.NumberFormat(locale === 'no' ? 'no-NO' : 'en-US', {
    style: 'currency',
    currency: 'NOK',
  }).format(amount);
}
