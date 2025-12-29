import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Locale = 'no' | 'en';

interface Translations {
  [key: string]: {
    no: string;
    en: string;
  };
}

const translations: Translations = {
  // Auth
  'auth.login': { no: 'Logg inn', en: 'Log in' },
  'auth.email': { no: 'E-post', en: 'Email' },
  'auth.password': { no: 'Passord', en: 'Password' },
  'auth.biometric': { no: 'Bruk biometri', en: 'Use biometric' },
  'auth.logout': { no: 'Logg ut', en: 'Log out' },

  // Navigation
  'nav.schedule': { no: 'Turplan', en: 'Schedule' },
  'nav.marketplace': { no: 'Markedsplass', en: 'Marketplace' },
  'nav.timeoff': { no: 'Fravær', en: 'Time Off' },
  'nav.notifications': { no: 'Varsler', en: 'Notifications' },
  'nav.profile': { no: 'Profil', en: 'Profile' },

  // Schedule
  'schedule.title': { no: 'Min turplan', en: 'My Schedule' },
  'schedule.noShifts': { no: 'Ingen vakter funnet', en: 'No shifts found' },
  'schedule.hours': { no: 'timer', en: 'hours' },

  // Shift Details
  'shift.details': { no: 'Vaktdetaljer', en: 'Shift Details' },
  'shift.date': { no: 'Dato', en: 'Date' },
  'shift.time': { no: 'Tid', en: 'Time' },
  'shift.duration': { no: 'Varighet', en: 'Duration' },
  'shift.location': { no: 'Lokasjon', en: 'Location' },
  'shift.compliance': { no: 'Compliance', en: 'Compliance' },

  // Compliance
  'compliance.compliant': { no: 'Regelkonform', en: 'Compliant' },
  'compliance.warning': { no: 'Advarsel', en: 'Warning' },
  'compliance.violation': { no: 'Brudd', en: 'Violation' },
  'compliance.restPeriod': { no: 'Hviletid', en: 'Rest Period' },
  'compliance.maxHours': { no: 'Maks timer', en: 'Max Hours' },
  'compliance.overtime': { no: 'Overtid', en: 'Overtime' },

  // Marketplace
  'marketplace.title': { no: 'Ledige vakter', en: 'Available Shifts' },
  'marketplace.claim': { no: 'Ta vakt', en: 'Claim Shift' },
  'marketplace.noShifts': { no: 'Ingen ledige vakter', en: 'No available shifts' },
  'marketplace.claimed': { no: 'Vakt overtatt', en: 'Shift claimed' },

  // Time Off
  'timeoff.title': { no: 'Fravær', en: 'Time Off' },
  'timeoff.request': { no: 'Søk om fravær', en: 'Request Time Off' },
  'timeoff.type': { no: 'Type', en: 'Type' },
  'timeoff.startDate': { no: 'Fra dato', en: 'Start Date' },
  'timeoff.endDate': { no: 'Til dato', en: 'End Date' },
  'timeoff.reason': { no: 'Årsak', en: 'Reason' },
  'timeoff.submit': { no: 'Send søknad', en: 'Submit Request' },
  'timeoff.vacation': { no: 'Ferie', en: 'Vacation' },
  'timeoff.sick': { no: 'Sykdom', en: 'Sick Leave' },
  'timeoff.personal': { no: 'Personlig', en: 'Personal' },
  'timeoff.balance': { no: 'Saldo', en: 'Balance' },
  'timeoff.days': { no: 'dager', en: 'days' },
  'timeoff.pending': { no: 'Til behandling', en: 'Pending' },
  'timeoff.approved': { no: 'Godkjent', en: 'Approved' },
  'timeoff.rejected': { no: 'Avslått', en: 'Rejected' },

  // Notifications
  'notifications.title': { no: 'Varsler', en: 'Notifications' },
  'notifications.markAllRead': { no: 'Merk alle som lest', en: 'Mark All Read' },
  'notifications.noNew': { no: 'Ingen nye varsler', en: 'No new notifications' },

  // Profile
  'profile.title': { no: 'Profil', en: 'Profile' },
  'profile.settings': { no: 'Innstillinger', en: 'Settings' },
  'profile.language': { no: 'Språk', en: 'Language' },
  'profile.preferences': { no: 'Preferanser', en: 'Preferences' },

  // Common
  'common.save': { no: 'Lagre', en: 'Save' },
  'common.cancel': { no: 'Avbryt', en: 'Cancel' },
  'common.confirm': { no: 'Bekreft', en: 'Confirm' },
  'common.error': { no: 'Feil', en: 'Error' },
  'common.success': { no: 'Vellykket', en: 'Success' },
  'common.loading': { no: 'Laster...', en: 'Loading...' },
};

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export const LocaleProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>('no');

  useEffect(() => {
    // Load saved locale preference
    AsyncStorage.getItem('locale').then((saved) => {
      if (saved === 'no' || saved === 'en') {
        setLocaleState(saved);
      }
    });
  }, []);

  const setLocale = async (newLocale: Locale) => {
    setLocaleState(newLocale);
    await AsyncStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    return translations[key]?.[locale] || key;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
};

export const useLocale = () => {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within LocaleProvider');
  }
  return context;
};
