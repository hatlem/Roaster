// Unit tests for Publish Validator (14-Day Rule)

import { PublishValidator } from '../../src/services/publishValidator';
import { ComplianceConfig } from '../../src/types';
import { addDays, subDays } from 'date-fns';

describe('PublishValidator', () => {
  let validator: PublishValidator;
  const config: ComplianceConfig = {
    maxDailyHours: 9,
    maxWeeklyHours: 40,
    minDailyRest: 11,
    minWeeklyRest: 35,
    publishDeadlineDays: 14,
    maxOvertimePerWeek: 10,
    maxOvertimePer4Weeks: 25,
    maxOvertimePerYear: 200,
  };

  beforeEach(() => {
    validator = new PublishValidator(config);
  });

  describe('validatePublish', () => {
    it('should pass when publishing 14+ days before start', () => {
      const rosterStartDate = addDays(new Date(), 20); // 20 days in future
      const publishDate = new Date();

      const result = validator.validatePublish(rosterStartDate, publishDate);

      expect(result.canPublish).toBe(true);
      expect(result.isLate).toBe(false);
      expect(result.warnings).toHaveLength(0);
      expect(result.daysUntilStart).toBe(20);
    });

    it('should flag as late when publishing less than 14 days before start', () => {
      const rosterStartDate = addDays(new Date(), 10); // Only 10 days in future
      const publishDate = new Date();

      const result = validator.validatePublish(rosterStartDate, publishDate);

      expect(result.canPublish).toBe(true); // Can still publish, but flagged
      expect(result.isLate).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('COMPLIANCE WARNING');
      expect(result.warnings[0]).toContain('14-day rule');
    });

    it('should calculate correct deadline date', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-15T00:00:00Z');

      const result = validator.validatePublish(rosterStartDate, publishDate);

      // Deadline should be 14 days before start = Jan 18
      const expectedDeadline = new Date('2024-01-18T00:00:00Z');
      expect(result.publishDeadline.toISOString()).toBe(expectedDeadline.toISOString());
    });

    it('should warn when publishing close to deadline but on time', () => {
      const rosterStartDate = addDays(new Date(), 15); // 15 days (1 day buffer)
      const publishDate = new Date();

      const result = validator.validatePublish(rosterStartDate, publishDate);

      expect(result.isLate).toBe(false);
      expect(result.daysUntilStart).toBe(15);
    });

    it('should handle exactly 14 days as on-time', () => {
      const rosterStartDate = addDays(new Date(), 14);
      const publishDate = new Date();

      const result = validator.validatePublish(rosterStartDate, publishDate);

      expect(result.isLate).toBe(false);
      expect(result.daysUntilStart).toBe(14);
    });
  });

  describe('wasPublishedOnTime', () => {
    it('should return true when published 14+ days early', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-15T00:00:00Z'); // 17 days early

      const result = validator.wasPublishedOnTime(rosterStartDate, publishDate);

      expect(result).toBe(true);
    });

    it('should return false when published less than 14 days early', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-25T00:00:00Z'); // Only 7 days early

      const result = validator.wasPublishedOnTime(rosterStartDate, publishDate);

      expect(result).toBe(false);
    });
  });

  describe('getPublishTimingDays', () => {
    it('should return positive number when published early', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-10T00:00:00Z'); // 22 days before = 8 days early

      const days = validator.getPublishTimingDays(rosterStartDate, publishDate);

      expect(days).toBe(8); // 22 days before start - 14 day requirement = 8 days early
    });

    it('should return negative number when published late', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-25T00:00:00Z'); // 7 days before = 7 days late

      const days = validator.getPublishTimingDays(rosterStartDate, publishDate);

      expect(days).toBe(-7); // 7 days before start - 14 day requirement = -7 days
    });

    it('should return 0 when published exactly on deadline', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-18T00:00:00Z'); // Exactly 14 days

      const days = validator.getPublishTimingDays(rosterStartDate, publishDate);

      expect(days).toBe(0);
    });
  });

  describe('getPublishTimingStatus', () => {
    it('should return early status', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-10T00:00:00Z');

      const status = validator.getPublishTimingStatus(rosterStartDate, publishDate);

      expect(status).toContain('early');
    });

    it('should return late status with VIOLATION', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-25T00:00:00Z');

      const status = validator.getPublishTimingStatus(rosterStartDate, publishDate);

      expect(status).toContain('late');
      expect(status).toContain('VIOLATION');
    });

    it('should return exact deadline status', () => {
      const rosterStartDate = new Date('2024-02-01T00:00:00Z');
      const publishDate = new Date('2024-01-18T00:00:00Z');

      const status = validator.getPublishTimingStatus(rosterStartDate, publishDate);

      expect(status).toContain('exactly on deadline');
    });
  });
});
