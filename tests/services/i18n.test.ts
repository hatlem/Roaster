// Unit tests for Internationalization (i18n)
// Tests translation, date/time formatting, and currency formatting

import {
  t,
  getTranslator,
  formatDate,
  formatTime,
  formatCurrency,
  norwegianTranslations,
  englishTranslations,
} from '../../src/utils/i18n';

describe('i18n', () => {
  describe('t() translation function', () => {
    it('should translate common keys in Norwegian', () => {
      expect(t('no', 'common.save')).toBe('Lagre');
      expect(t('no', 'common.cancel')).toBe('Avbryt');
      expect(t('no', 'common.delete')).toBe('Slett');
      expect(t('no', 'common.yes')).toBe('Ja');
      expect(t('no', 'common.no')).toBe('Nei');
    });

    it('should translate common keys in English', () => {
      expect(t('en', 'common.save')).toBe('Save');
      expect(t('en', 'common.cancel')).toBe('Cancel');
      expect(t('en', 'common.delete')).toBe('Delete');
      expect(t('en', 'common.yes')).toBe('Yes');
      expect(t('en', 'common.no')).toBe('No');
    });

    it('should translate roster keys in Norwegian', () => {
      expect(t('no', 'roster.title')).toBe('Vaktplan');
      expect(t('no', 'roster.publish')).toBe('Publiser');
      expect(t('no', 'roster.draft')).toBe('Utkast');
      expect(t('no', 'roster.published')).toBe('Publisert');
    });

    it('should translate compliance keys in Norwegian', () => {
      expect(t('no', 'compliance.violation')).toBe('Brudd');
      expect(t('no', 'compliance.warning')).toBe('Advarsel');
      expect(t('no', 'compliance.compliant')).toBe('I samsvar');
      expect(t('no', 'compliance.fourteenDayRule')).toBe('14-dagers regelen');
    });

    it('should return key when translation is missing', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = t('no', 'nonexistent.key');

      expect(result).toBe('nonexistent.key');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Translation missing for key: nonexistent.key in locale: no'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle nested keys correctly', () => {
      expect(t('no', 'auth.login')).toBe('Logg inn');
      expect(t('en', 'auth.login')).toBe('Login');
      expect(t('no', 'employee.timeOff')).toBe('Fravær');
      expect(t('en', 'employee.timeOff')).toBe('Time Off');
    });

    it('should translate Norwegian labor law specific terms', () => {
      expect(t('no', 'compliance.minDailyRest')).toBe(
        'Minimum 11 timers hvile per 24 timer'
      );
      expect(t('no', 'compliance.minWeeklyRest')).toBe(
        'Minimum 35 timers sammenhengende hvile per 7 dager'
      );
      expect(t('no', 'roster.latePublicationWarning')).toContain('14-dagers regelen');
      expect(t('no', 'roster.latePublicationWarning')).toContain('Arbeidsmiljøloven');
    });
  });

  describe('getTranslator()', () => {
    it('should return a translation function for Norwegian', () => {
      const tNo = getTranslator('no');

      expect(tNo('common.save')).toBe('Lagre');
      expect(tNo('common.cancel')).toBe('Avbryt');
    });

    it('should return a translation function for English', () => {
      const tEn = getTranslator('en');

      expect(tEn('common.save')).toBe('Save');
      expect(tEn('common.cancel')).toBe('Cancel');
    });
  });

  describe('formatDate()', () => {
    it('should format date in Norwegian format (DD.MM.YYYY)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const formatted = formatDate(date, 'no');

      // Norwegian format: day.month.year
      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
      expect(formatted).toContain('15');
      expect(formatted).toContain('06');
      expect(formatted).toContain('2024');
    });

    it('should format date in English format', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const formatted = formatDate(date, 'en');

      // English format: Month Day, Year
      expect(formatted).toContain('Jun');
      expect(formatted).toContain('15');
      expect(formatted).toContain('2024');
    });

    it('should default to Norwegian format when no locale specified', () => {
      const date = new Date('2024-01-01T12:00:00Z');
      const formatted = formatDate(date);

      expect(formatted).toMatch(/^\d{2}\.\d{2}\.\d{4}$/);
    });

    it('should handle different dates correctly', () => {
      const newYear = new Date('2024-01-01T00:00:00Z');
      const christmas = new Date('2024-12-25T00:00:00Z');

      const formattedNY = formatDate(newYear, 'no');
      const formattedXmas = formatDate(christmas, 'no');

      expect(formattedNY).toContain('01');
      expect(formattedNY).toContain('2024');
      expect(formattedXmas).toContain('25');
      expect(formattedXmas).toContain('12');
    });
  });

  describe('formatTime()', () => {
    it('should format time in 24-hour format for Norwegian', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const formatted = formatTime(date, 'no');

      // Norwegian uses 24-hour format
      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
      expect(formatted).not.toContain('AM');
      expect(formatted).not.toContain('PM');
    });

    it('should format time in 12-hour format for English', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const formatted = formatTime(date, 'en');

      // English can use 12-hour format
      // The time will depend on timezone, but should contain AM or PM
      expect(formatted.includes('AM') || formatted.includes('PM')).toBe(true);
    });

    it('should default to Norwegian 24-hour format', () => {
      const date = new Date('2024-06-15T09:15:00Z');
      const formatted = formatTime(date);

      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle midnight and noon correctly in 24-hour format', () => {
      const midnight = new Date('2024-06-15T00:00:00Z');
      const noon = new Date('2024-06-15T12:00:00Z');

      const formattedMidnight = formatTime(midnight, 'no');
      const formattedNoon = formatTime(noon, 'no');

      // 24-hour format should show 00:00 and 12:00
      expect(formattedMidnight).toMatch(/^\d{2}:\d{2}$/);
      expect(formattedNoon).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should not include seconds in formatted time', () => {
      const date = new Date('2024-06-15T14:30:45Z');
      const formatted = formatTime(date, 'no');

      expect(formatted).not.toContain('45');
      expect(formatted.split(':').length).toBe(2);
    });
  });

  describe('formatCurrency()', () => {
    it('should format currency as Norwegian Kroner (NOK)', () => {
      const amount = 1500;
      const formatted = formatCurrency(amount, 'no');

      expect(formatted).toContain('kr');
      expect(formatted).toContain('1');
      expect(formatted).toContain('500');
    });

    it('should format large amounts with proper grouping', () => {
      const amount = 125000;
      const formatted = formatCurrency(amount, 'no');

      expect(formatted).toContain('125');
      expect(formatted).toContain('000');
      expect(formatted).toContain('kr');
    });

    it('should handle decimal amounts', () => {
      const amount = 1234.56;
      const formatted = formatCurrency(amount, 'no');

      expect(formatted).toContain('kr');
      expect(formatted).toContain('1');
      expect(formatted).toContain('234');
    });

    it('should format zero correctly', () => {
      const amount = 0;
      const formatted = formatCurrency(amount, 'no');

      expect(formatted).toContain('0');
      expect(formatted).toContain('kr');
    });

    it('should handle negative amounts', () => {
      const amount = -500;
      const formatted = formatCurrency(amount, 'no');

      expect(formatted).toContain('500');
      expect(formatted).toContain('kr');
      expect(formatted).toContain('-');
    });

    it('should default to Norwegian format', () => {
      const amount = 2500;
      const formatted = formatCurrency(amount);

      expect(formatted).toContain('kr');
    });

    it('should format in English locale with NOK currency', () => {
      const amount = 1500;
      const formatted = formatCurrency(amount, 'en');

      // Should still be NOK but formatted for English locale
      expect(formatted).toContain('NOK');
      expect(formatted).toContain('1,500');
    });

    it('should handle overtime premium calculation amounts', () => {
      // Test with typical Norwegian overtime calculation: 200 NOK/hr * 1.4
      const regularRate = 200;
      const overtimeRate = regularRate * 1.4;
      const formatted = formatCurrency(overtimeRate, 'no');

      expect(formatted).toContain('280');
      expect(formatted).toContain('kr');
    });
  });

  describe('Translation completeness', () => {
    it('should have matching keys in Norwegian and English translations', () => {
      const noKeys = Object.keys(norwegianTranslations);
      const enKeys = Object.keys(englishTranslations);

      expect(noKeys.sort()).toEqual(enKeys.sort());
    });

    it('should have all expected translation categories', () => {
      expect(norwegianTranslations).toHaveProperty('common');
      expect(norwegianTranslations).toHaveProperty('auth');
      expect(norwegianTranslations).toHaveProperty('roster');
      expect(norwegianTranslations).toHaveProperty('compliance');
      expect(norwegianTranslations).toHaveProperty('employee');

      expect(englishTranslations).toHaveProperty('common');
      expect(englishTranslations).toHaveProperty('auth');
      expect(englishTranslations).toHaveProperty('roster');
      expect(englishTranslations).toHaveProperty('compliance');
      expect(englishTranslations).toHaveProperty('employee');
    });
  });
});
