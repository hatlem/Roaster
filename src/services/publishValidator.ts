// Roster Publishing Validation Service
// Implements Norwegian Working Environment Act § 10-2, § 10-6
// The 14-Day Rule: Roster must be published at least 14 days before it starts

import { differenceInDays, addDays, isBefore } from 'date-fns';
import { PublishValidation, ComplianceConfig } from '../types';

export class PublishValidator {
  constructor(private config: ComplianceConfig) {}

  /**
   * Validates if a roster can be published according to the 14-day rule
   * Returns detailed validation information
   */
  validatePublish(rosterStartDate: Date, proposedPublishDate?: Date): PublishValidation {
    const publishDate = proposedPublishDate || new Date();
    const daysUntilStart = differenceInDays(rosterStartDate, publishDate);

    // Calculate the deadline (14 days before roster starts)
    const publishDeadline = addDays(rosterStartDate, -this.config.publishDeadlineDays);

    // Check if we're past the deadline
    const isLate = isBefore(publishDeadline, publishDate);

    const warnings: string[] = [];

    if (isLate) {
      warnings.push(
        `COMPLIANCE WARNING: Publishing ${Math.abs(daysUntilStart - this.config.publishDeadlineDays)} days late. ` +
        `The roster should have been published by ${publishDeadline.toLocaleDateString('no-NO')}. ` +
        `This violates the 14-day rule (Arbeidsmiljøloven § 10-2).`
      );
    }

    if (daysUntilStart < 7 && !isLate) {
      warnings.push(
        `Warning: Only ${daysUntilStart} days until roster starts. Consider publishing rosters earlier for better planning.`
      );
    }

    return {
      canPublish: true, // Can still publish even if late, but it's flagged
      daysUntilStart,
      isLate,
      publishDeadline,
      warnings,
    };
  }

  /**
   * Check if a roster was published on time
   */
  wasPublishedOnTime(rosterStartDate: Date, actualPublishDate: Date): boolean {
    const daysBeforeStart = differenceInDays(rosterStartDate, actualPublishDate);
    return daysBeforeStart >= this.config.publishDeadlineDays;
  }

  /**
   * Calculate how many days early/late a publication was
   */
  getPublishTimingDays(rosterStartDate: Date, actualPublishDate: Date): number {
    const daysBeforeStart = differenceInDays(rosterStartDate, actualPublishDate);
    return daysBeforeStart - this.config.publishDeadlineDays;
  }

  /**
   * Get a human-readable status of publication timing
   */
  getPublishTimingStatus(rosterStartDate: Date, actualPublishDate: Date): string {
    const timingDays = this.getPublishTimingDays(rosterStartDate, actualPublishDate);

    if (timingDays > 0) {
      return `Published ${timingDays} days early`;
    } else if (timingDays < 0) {
      return `Published ${Math.abs(timingDays)} days late (VIOLATION)`;
    } else {
      return `Published exactly on deadline`;
    }
  }
}
