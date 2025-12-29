// Unit tests for Visual Compliance Indicator Generator
// Tests color-coded visual indicators for compliance status

import { VisualComplianceGenerator } from '../../src/services/visualComplianceGenerator';
import {
  RestPeriodViolation,
  WorkingHoursViolation,
  PublishValidation,
} from '../../src/types/index.enhanced';

describe('VisualComplianceGenerator', () => {
  describe('forRestPeriodViolation', () => {
    it('should generate critical severity for large shortfall', () => {
      const violation: RestPeriodViolation = {
        type: 'DAILY',
        violation: 'Only 5 hours rest between shifts',
        requiredRest: 11,
        actualRest: 5,
        affectedShifts: ['shift-1', 'shift-2'],
      };

      const result = VisualComplianceGenerator.forRestPeriodViolation(violation);

      expect(result.status).toBe('violation');
      expect(result.color).toBe('red');
      expect(result.icon).toBe('error');
      expect(result.severity).toBe('critical'); // 6 hours shortfall > 5
      expect(result.message).toBe(violation.violation);
      expect(result.quickFixes).toBeDefined();
      expect(result.quickFixes!.length).toBeGreaterThan(0);
    });

    it('should generate high severity for moderate shortfall', () => {
      const violation: RestPeriodViolation = {
        type: 'DAILY',
        violation: 'Only 8 hours rest between shifts',
        requiredRest: 11,
        actualRest: 8,
        affectedShifts: ['shift-1', 'shift-2'],
      };

      const result = VisualComplianceGenerator.forRestPeriodViolation(violation);

      expect(result.severity).toBe('high'); // 3 hours shortfall (2-5 range)
    });

    it('should generate medium severity for small shortfall', () => {
      const violation: RestPeriodViolation = {
        type: 'DAILY',
        violation: 'Only 9 hours rest between shifts',
        requiredRest: 11,
        actualRest: 9,
        affectedShifts: ['shift-1', 'shift-2'],
      };

      const result = VisualComplianceGenerator.forRestPeriodViolation(violation);

      expect(result.severity).toBe('medium'); // 2 hours shortfall <= 2
    });

    it('should include quick fixes for rest period violations', () => {
      const violation: RestPeriodViolation = {
        type: 'WEEKLY',
        violation: 'Only 30 hours weekly rest',
        requiredRest: 35,
        actualRest: 30,
        affectedShifts: ['shift-1'],
      };

      const result = VisualComplianceGenerator.forRestPeriodViolation(violation);

      expect(result.quickFixes).toBeDefined();
      expect(result.quickFixes![0].action).toBe('add_rest_time');
      expect(result.quickFixes![0].description).toContain('5 hours');
      expect(result.quickFixes![1].action).toBe('reschedule_shift');
    });

    it('should show correct impact message in quick fixes', () => {
      const violation: RestPeriodViolation = {
        type: 'DAILY',
        violation: 'Insufficient rest',
        requiredRest: 11,
        actualRest: 7,
        affectedShifts: ['shift-1', 'shift-2'],
      };

      const result = VisualComplianceGenerator.forRestPeriodViolation(violation);

      expect(result.quickFixes![0].impact).toContain('11 hours');
    });
  });

  describe('forWorkingHoursViolation', () => {
    it('should generate critical severity for daily violations with large excess', () => {
      const violation: WorkingHoursViolation = {
        type: 'DAILY',
        violation: 'Worked 15 hours in a day',
        limit: 9,
        actual: 15,
        affectedPeriod: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-15'),
        },
      };

      const result = VisualComplianceGenerator.forWorkingHoursViolation(violation);

      expect(result.status).toBe('violation');
      expect(result.color).toBe('red');
      expect(result.icon).toBe('error');
      expect(result.severity).toBe('critical'); // 6 hours excess > 5
      expect(result.message).toBe(violation.violation);
    });

    it('should generate high severity for moderate excess', () => {
      const violation: WorkingHoursViolation = {
        type: 'DAILY',
        violation: 'Worked 12 hours in a day',
        limit: 9,
        actual: 12,
        affectedPeriod: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-15'),
        },
      };

      const result = VisualComplianceGenerator.forWorkingHoursViolation(violation);

      expect(result.severity).toBe('high'); // 3 hours excess
    });

    it('should include reduce shift quick fix for daily violations', () => {
      const violation: WorkingHoursViolation = {
        type: 'DAILY',
        violation: 'Worked 11 hours in a day',
        limit: 9,
        actual: 11,
        affectedPeriod: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-15'),
        },
      };

      const result = VisualComplianceGenerator.forWorkingHoursViolation(violation);

      expect(result.quickFixes).toBeDefined();
      const reduceShiftFix = result.quickFixes!.find(
        (f) => f.action === 'reduce_shift_duration'
      );
      expect(reduceShiftFix).toBeDefined();
      expect(reduceShiftFix!.description).toContain('2.0 hours');
      expect(reduceShiftFix!.impact).toContain('9h limit');
      expect(reduceShiftFix!.autoApplicable).toBe(true);
    });

    it('should include redistribute hours quick fix for weekly violations', () => {
      const violation: WorkingHoursViolation = {
        type: 'WEEKLY',
        violation: 'Worked 48 hours in a week',
        limit: 40,
        actual: 48,
        affectedPeriod: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-21'),
        },
      };

      const result = VisualComplianceGenerator.forWorkingHoursViolation(violation);

      expect(result.quickFixes).toBeDefined();
      const redistributeFix = result.quickFixes!.find(
        (f) => f.action === 'redistribute_hours'
      );
      expect(redistributeFix).toBeDefined();
      expect(redistributeFix!.autoApplicable).toBe(false);
    });

    it('should handle medium severity violations', () => {
      const violation: WorkingHoursViolation = {
        type: 'DAILY',
        violation: 'Worked 10 hours in a day',
        limit: 9,
        actual: 10,
        affectedPeriod: {
          start: new Date('2024-01-15'),
          end: new Date('2024-01-15'),
        },
      };

      const result = VisualComplianceGenerator.forWorkingHoursViolation(violation);

      expect(result.severity).toBe('medium'); // 1 hour excess <= 2
    });
  });

  describe('forPublishValidation', () => {
    it('should generate violation indicator for late publication', () => {
      const validation: PublishValidation = {
        canPublish: true,
        daysUntilStart: 10,
        isLate: true,
        publishDeadline: new Date('2024-01-18'),
        warnings: ['Late publication'],
      };

      const result = VisualComplianceGenerator.forPublishValidation(validation);

      expect(result.status).toBe('violation');
      expect(result.color).toBe('red');
      expect(result.icon).toBe('error');
      expect(result.severity).toBe('critical');
      expect(result.message).toContain('4 days late'); // 14 - 10
      expect(result.message).toContain('14-day rule');
      expect(result.quickFixes).toBeDefined();
      expect(result.quickFixes![0].action).toBe('acknowledge_violation');
    });

    it('should generate warning indicator when close to deadline', () => {
      const validation: PublishValidation = {
        canPublish: true,
        daysUntilStart: 15,
        isLate: false,
        publishDeadline: new Date('2024-01-18'),
        warnings: [],
      };

      const result = VisualComplianceGenerator.forPublishValidation(validation);

      expect(result.status).toBe('warning');
      expect(result.color).toBe('yellow');
      expect(result.icon).toBe('alert');
      expect(result.severity).toBe('medium');
      expect(result.message).toContain('15 days');
      expect(result.message).toContain('close to 14-day deadline');
    });

    it('should generate compliant indicator when publishing early', () => {
      const validation: PublishValidation = {
        canPublish: true,
        daysUntilStart: 20,
        isLate: false,
        publishDeadline: new Date('2024-01-18'),
        warnings: [],
      };

      const result = VisualComplianceGenerator.forPublishValidation(validation);

      expect(result.status).toBe('compliant');
      expect(result.color).toBe('green');
      expect(result.icon).toBe('check');
      expect(result.severity).toBe('low');
      expect(result.message).toContain('20 days early');
      expect(result.message).toContain('compliant with 14-day rule');
      expect(result.quickFixes).toEqual([]);
    });

    it('should handle exactly 16 days until start as warning', () => {
      const validation: PublishValidation = {
        canPublish: true,
        daysUntilStart: 16,
        isLate: false,
        publishDeadline: new Date('2024-01-18'),
        warnings: [],
      };

      const result = VisualComplianceGenerator.forPublishValidation(validation);

      expect(result.status).toBe('warning'); // < 16 check is exclusive
    });
  });

  describe('forComplianceStatus', () => {
    it('should show critical status for many violations', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(8, 0);

      expect(result.status).toBe('violation');
      expect(result.color).toBe('red');
      expect(result.icon).toBe('error');
      expect(result.severity).toBe('critical'); // > 5 violations
      expect(result.message).toBe('8 compliance violations detected');
    });

    it('should show high severity for moderate violations', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(4, 0);

      expect(result.severity).toBe('high'); // 3-5 violations
      expect(result.message).toBe('4 compliance violations detected');
    });

    it('should show medium severity for few violations', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(2, 0);

      expect(result.severity).toBe('medium'); // 1-2 violations
      expect(result.message).toBe('2 compliance violations detected');
    });

    it('should show warning status when only warnings exist', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(0, 5);

      expect(result.status).toBe('warning');
      expect(result.color).toBe('yellow');
      expect(result.icon).toBe('alert');
      expect(result.severity).toBe('low');
      expect(result.message).toBe('5 warnings to review');
    });

    it('should show compliant status when no issues', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(0, 0);

      expect(result.status).toBe('compliant');
      expect(result.color).toBe('green');
      expect(result.icon).toBe('check');
      expect(result.severity).toBe('low');
      expect(result.message).toBe('Fully compliant with Arbeidsmiljøloven');
    });

    it('should handle singular violation message', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(1, 0);

      expect(result.message).toBe('1 compliance violation detected');
    });

    it('should prioritize violations over warnings', () => {
      const result = VisualComplianceGenerator.forComplianceStatus(3, 10);

      expect(result.status).toBe('violation');
      expect(result.message).toContain('violations');
      expect(result.message).not.toContain('warnings');
    });
  });

  describe('forRosterSummary', () => {
    it('should show violation for late publication', () => {
      const data = {
        totalShifts: 50,
        shiftsWithViolations: 0,
        shiftsWithWarnings: 0,
        isLatePublication: true,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      expect(result.status).toBe('violation');
      expect(result.color).toBe('red');
      expect(result.severity).toBe('high');
      expect(result.message).toContain('late publication');
    });

    it('should show violation for shift violations', () => {
      const data = {
        totalShifts: 50,
        shiftsWithViolations: 5,
        shiftsWithWarnings: 0,
        isLatePublication: false,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      expect(result.status).toBe('violation');
      expect(result.message).toContain('5 shift violations');
    });

    it('should show both late publication and shift violations', () => {
      const data = {
        totalShifts: 50,
        shiftsWithViolations: 3,
        shiftsWithWarnings: 0,
        isLatePublication: true,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      expect(result.message).toContain('late publication');
      expect(result.message).toContain('3 shift violations');
    });

    it('should show warning status with compliance rate', () => {
      const data = {
        totalShifts: 100,
        shiftsWithViolations: 0,
        shiftsWithWarnings: 10,
        isLatePublication: false,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      expect(result.status).toBe('warning');
      expect(result.color).toBe('yellow');
      expect(result.severity).toBe('medium');
      expect(result.message).toContain('10/100 shifts have warnings');
      expect(result.message).toContain('90% compliant');
    });

    it('should show compliant status when no issues', () => {
      const data = {
        totalShifts: 75,
        shiftsWithViolations: 0,
        shiftsWithWarnings: 0,
        isLatePublication: false,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      expect(result.status).toBe('compliant');
      expect(result.color).toBe('green');
      expect(result.icon).toBe('check');
      expect(result.severity).toBe('low');
      expect(result.message).toBe('All 75 shifts compliant');
    });

    it('should calculate compliance rate correctly', () => {
      const data = {
        totalShifts: 60,
        shiftsWithViolations: 0,
        shiftsWithWarnings: 15,
        isLatePublication: false,
      };

      const result = VisualComplianceGenerator.forRosterSummary(data);

      // 45/60 = 75% compliant
      expect(result.message).toContain('75% compliant');
    });
  });
});
