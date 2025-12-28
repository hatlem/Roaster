// Visual Compliance Indicator Generator
// Generates color-coded visual indicators for compliance status

import {
  VisualComplianceIndicator,
  QuickFix,
  RestPeriodViolation,
  WorkingHoursViolation,
  PublishValidation,
} from '../types/index.enhanced';

export class VisualComplianceGenerator {
  /**
   * Generate visual indicator for rest period violations
   */
  static forRestPeriodViolation(violation: RestPeriodViolation): VisualComplianceIndicator {
    const shortfall = violation.requiredRest - violation.actualRest;
    const severity = shortfall > 5 ? 'critical' : shortfall > 2 ? 'high' : 'medium';

    const quickFixes: QuickFix[] = [
      {
        action: 'add_rest_time',
        description: `Add ${shortfall} hours rest between shifts`,
        impact: `Extends rest period to ${violation.requiredRest} hours`,
        autoApplicable: false,
      },
      {
        action: 'reschedule_shift',
        description: 'Move shift to later time slot',
        impact: 'Ensures compliance with rest requirements',
        autoApplicable: false,
      },
    ];

    return {
      status: 'violation',
      color: 'red',
      icon: 'error',
      message: violation.violation,
      severity,
      quickFixes,
    };
  }

  /**
   * Generate visual indicator for working hours violations
   */
  static forWorkingHoursViolation(violation: WorkingHoursViolation): VisualComplianceIndicator {
    const excess = violation.actual - violation.limit;
    const severity = excess > 5 ? 'critical' : excess > 2 ? 'high' : 'medium';

    const quickFixes: QuickFix[] = [];

    if (violation.type === 'DAILY') {
      quickFixes.push({
        action: 'reduce_shift_duration',
        description: `Reduce shift by ${excess.toFixed(1)} hours`,
        impact: `Brings daily hours to ${violation.limit}h limit`,
        autoApplicable: true,
      });
    }

    if (violation.type === 'WEEKLY') {
      quickFixes.push({
        action: 'redistribute_hours',
        description: 'Redistribute hours across week',
        impact: 'Balances workload while maintaining coverage',
        autoApplicable: false,
      });
    }

    return {
      status: 'violation',
      color: 'red',
      icon: 'error',
      message: violation.violation,
      severity,
      quickFixes,
    };
  }

  /**
   * Generate visual indicator for publish validation
   */
  static forPublishValidation(validation: PublishValidation): VisualComplianceIndicator {
    if (validation.isLate) {
      const daysLate = Math.abs(validation.daysUntilStart - 14);

      return {
        status: 'violation',
        color: 'red',
        icon: 'error',
        message: `Publishing ${daysLate} days late (violates 14-day rule)`,
        severity: 'critical',
        quickFixes: [
          {
            action: 'acknowledge_violation',
            description: 'Acknowledge late publication and document reason',
            impact: 'Creates audit trail for compliance review',
            autoApplicable: false,
          },
        ],
      };
    }

    if (validation.daysUntilStart < 16) {
      return {
        status: 'warning',
        color: 'yellow',
        icon: 'alert',
        message: `Only ${validation.daysUntilStart} days until roster starts (close to 14-day deadline)`,
        severity: 'medium',
        quickFixes: [],
      };
    }

    return {
      status: 'compliant',
      color: 'green',
      icon: 'check',
      message: `Publishing ${validation.daysUntilStart} days early (compliant with 14-day rule)`,
      severity: 'low',
      quickFixes: [],
    };
  }

  /**
   * Generate visual indicator for general compliance status
   */
  static forComplianceStatus(
    violations: number,
    warnings: number
  ): VisualComplianceIndicator {
    if (violations > 0) {
      return {
        status: 'violation',
        color: 'red',
        icon: 'error',
        message: `${violations} compliance violation${violations > 1 ? 's' : ''} detected`,
        severity: violations > 5 ? 'critical' : violations > 2 ? 'high' : 'medium',
      };
    }

    if (warnings > 0) {
      return {
        status: 'warning',
        color: 'yellow',
        icon: 'alert',
        message: `${warnings} warning${warnings > 1 ? 's' : ''} to review`,
        severity: 'low',
      };
    }

    return {
      status: 'compliant',
      color: 'green',
      icon: 'check',
      message: 'Fully compliant with Arbeidsmiljøloven',
      severity: 'low',
    };
  }

  /**
   * Generate summary indicator for roster
   */
  static forRosterSummary(data: {
    totalShifts: number;
    shiftsWithViolations: number;
    shiftsWithWarnings: number;
    isLatePublication: boolean;
  }): VisualComplianceIndicator {
    const { totalShifts, shiftsWithViolations, shiftsWithWarnings, isLatePublication } = data;

    if (isLatePublication || shiftsWithViolations > 0) {
      const issues = [];
      if (isLatePublication) issues.push('late publication');
      if (shiftsWithViolations > 0) issues.push(`${shiftsWithViolations} shift violations`);

      return {
        status: 'violation',
        color: 'red',
        icon: 'error',
        message: `Compliance issues: ${issues.join(', ')}`,
        severity: 'high',
      };
    }

    if (shiftsWithWarnings > 0) {
      const complianceRate = ((totalShifts - shiftsWithWarnings) / totalShifts) * 100;

      return {
        status: 'warning',
        color: 'yellow',
        icon: 'alert',
        message: `${shiftsWithWarnings}/${totalShifts} shifts have warnings (${complianceRate.toFixed(0)}% compliant)`,
        severity: 'medium',
      };
    }

    return {
      status: 'compliant',
      color: 'green',
      icon: 'check',
      message: `All ${totalShifts} shifts compliant`,
      severity: 'low',
    };
  }
}
