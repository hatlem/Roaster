// AI Shift Suggestions Service
// Provides smart scheduling recommendations using rule-based algorithms
// Considers: preferences, compliance, skills, labor costs, and historical patterns

import { PrismaClient, User, Shift, EmployeePreference, ActualHours } from '@prisma/client';
import {
  addDays,
  addWeeks,
  differenceInHours,
  differenceInMinutes,
  isWithinInterval,
  startOfDay,
  endOfDay,
  getDay,
  isSameDay,
  parseISO,
  format
} from 'date-fns';
import { ShiftData, ComplianceConfig } from '../types';
import { LaborCostCalculator } from './laborCostCalculator';
import { RestPeriodValidator } from './restPeriodValidator';
import { WorkingHoursValidator } from './workingHoursValidator';
import { getComplianceConfig } from '../config/compliance';

const prisma = new PrismaClient();

// Types for AI scheduling
export interface ShiftRequirement {
  startTime: Date;
  endTime: Date;
  breakMinutes: number;
  department?: string;
  location?: string;
  requiredSkills?: string[];
  minEmployees?: number;
  maxEmployees?: number;
  preferredEmployees?: string[];
}

export interface EmployeeSuggestion {
  userId: string;
  user?: {
    firstName: string;
    lastName: string;
    department?: string;
    position?: string;
  };
  fitScore: number;
  reasons: string[];
  warnings: string[];
  estimatedCost: number;
  complianceStatus: 'compliant' | 'warning' | 'violation';
}

export interface ScheduleSuggestion {
  shift: ShiftRequirement;
  suggestions: EmployeeSuggestion[];
  bestMatch?: EmployeeSuggestion;
}

export interface OptimizationSuggestion {
  type: 'swap' | 'split' | 'merge' | 'reassign' | 'cost_reduction';
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  affectedShifts: string[];
  suggestedChanges: {
    shiftId: string;
    currentUserId?: string;
    suggestedUserId?: string;
    reason: string;
  }[];
  complianceImpact: 'improves' | 'neutral' | 'worsens';
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}

export interface AutoScheduleResult {
  scheduledShifts: {
    requirement: ShiftRequirement;
    assignedUser: string;
    fitScore: number;
    estimatedCost: number;
  }[];
  unscheduledShifts: {
    requirement: ShiftRequirement;
    reason: string;
  }[];
  totalCost: number;
  complianceSummary: {
    compliantShifts: number;
    warningShifts: number;
    violationShifts: number;
  };
  suggestions: string[];
}

export interface AvailabilityPrediction {
  userId: string;
  date: Date;
  predictedAvailable: boolean;
  confidence: number; // 0-100
  factors: {
    historicalPattern: number;
    preferences: number;
    recentSchedule: number;
    dayOfWeek: number;
  };
  reasoning: string[];
}

export class AIShiftSuggestionService {
  private laborCostCalculator: LaborCostCalculator;
  private restPeriodValidator: RestPeriodValidator;
  private workingHoursValidator: WorkingHoursValidator;
  private config: ComplianceConfig;

  constructor() {
    this.config = getComplianceConfig();
    this.laborCostCalculator = new LaborCostCalculator(this.config);
    this.restPeriodValidator = new RestPeriodValidator(this.config);
    this.workingHoursValidator = new WorkingHoursValidator(this.config);
  }

  /**
   * Calculate fit score (0-100) for an employee-shift combination
   * Higher score = better fit
   */
  async calculateFitScore(
    userId: string,
    shift: ShiftRequirement | Shift,
    rosterId?: string
  ): Promise<{
    score: number;
    breakdown: {
      preferenceScore: number;
      complianceScore: number;
      historicalScore: number;
      availabilityScore: number;
      costScore: number;
    };
    reasons: string[];
    warnings: string[];
  }> {
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        shiftsAssigned: true,
        actualHours: {
          where: {
            date: {
              gte: addWeeks(new Date(), -4), // Last 4 weeks
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return {
        score: 0,
        breakdown: {
          preferenceScore: 0,
          complianceScore: 0,
          historicalScore: 0,
          availabilityScore: 0,
          costScore: 0,
        },
        reasons: ['User not found or inactive'],
        warnings: [],
      };
    }

    // Get existing shifts for compliance checking
    let existingShifts: ShiftData[] = [];
    if (rosterId) {
      const roster = await prisma.roster.findUnique({
        where: { id: rosterId },
        include: { shifts: { where: { userId } } },
      });
      if (roster) {
        existingShifts = roster.shifts.map(s => ({
          id: s.id,
          startTime: s.startTime,
          endTime: s.endTime,
          breakMinutes: s.breakMinutes,
          userId: s.userId,
        }));
      }
    }

    const shiftStart = 'startTime' in shift ? shift.startTime : shift.startTime;
    const shiftEnd = 'endTime' in shift ? shift.endTime : shift.endTime;
    const shiftBreak = 'breakMinutes' in shift ? shift.breakMinutes : shift.breakMinutes;

    // 1. Preference Score (0-30 points)
    const preferenceScore = this.calculatePreferenceScore(
      user.preferences[0],
      shiftStart,
      shiftEnd,
      reasons
    );

    // 2. Compliance Score (0-30 points)
    const { complianceScore, complianceWarnings } = await this.calculateComplianceScore(
      userId,
      { startTime: shiftStart, endTime: shiftEnd, breakMinutes: shiftBreak, userId },
      existingShifts,
      reasons
    );
    warnings.push(...complianceWarnings);

    // 3. Historical Pattern Score (0-20 points)
    const historicalScore = this.calculateHistoricalScore(
      user.actualHours,
      shiftStart,
      shiftEnd,
      reasons
    );

    // 4. Availability Score (0-10 points)
    const availabilityScore = await this.calculateAvailabilityScore(
      userId,
      shiftStart,
      shiftEnd,
      reasons
    );

    // 5. Cost Efficiency Score (0-10 points)
    const costScore = await this.calculateCostScore(
      user,
      shiftStart,
      shiftEnd,
      shiftBreak,
      existingShifts,
      reasons
    );

    const totalScore = Math.round(
      preferenceScore + complianceScore + historicalScore + availabilityScore + costScore
    );

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: {
        preferenceScore,
        complianceScore,
        historicalScore,
        availabilityScore,
        costScore,
      },
      reasons,
      warnings,
    };
  }

  /**
   * Suggest best employees for each shift
   */
  async suggestShiftAssignments(
    rosterId: string,
    shifts: ShiftRequirement[]
  ): Promise<ScheduleSuggestion[]> {
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: { organization: true },
    });

    if (!roster) {
      throw new Error('Roster not found');
    }

    // Get all active employees in the organization
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        // Filter by department if specified in shift requirements
      },
      include: {
        preferences: true,
      },
    });

    const suggestions: ScheduleSuggestion[] = [];

    for (const shift of shifts) {
      const employeeSuggestions: EmployeeSuggestion[] = [];

      for (const employee of employees) {
        // Check department match if specified
        if (shift.department && employee.department !== shift.department) {
          continue;
        }

        // Calculate fit score
        const fitResult = await this.calculateFitScore(employee.id, shift, rosterId);

        // Estimate cost
        const shiftData: ShiftData = {
          startTime: shift.startTime,
          endTime: shift.endTime,
          breakMinutes: shift.breakMinutes,
          userId: employee.id,
          // hourlyRate: employee.hourlyRate as number || 200, // Default NOK 200/hr
        };

        const costEstimate = this.laborCostCalculator.calculateShiftCost(shiftData);

        const complianceStatus: 'compliant' | 'warning' | 'violation' =
          fitResult.score >= 70 ? 'compliant' :
          fitResult.score >= 40 ? 'warning' : 'violation';

        employeeSuggestions.push({
          userId: employee.id,
          user: {
            firstName: employee.firstName,
            lastName: employee.lastName,
            department: employee.department || undefined,
            position: employee.position || undefined,
          },
          fitScore: fitResult.score,
          reasons: fitResult.reasons,
          warnings: fitResult.warnings,
          estimatedCost: costEstimate.totalCost,
          complianceStatus,
        });
      }

      // Sort by fit score (descending)
      employeeSuggestions.sort((a, b) => b.fitScore - a.fitScore);

      // Get best match (highest score that's compliant or has warnings, not violations)
      const bestMatch = employeeSuggestions.find(s => s.complianceStatus !== 'violation');

      suggestions.push({
        shift,
        suggestions: employeeSuggestions,
        bestMatch,
      });
    }

    return suggestions;
  }

  /**
   * Automatically generate a full schedule
   */
  async autoSchedule(
    rosterId: string,
    requirements: ShiftRequirement[]
  ): Promise<AutoScheduleResult> {
    const result: AutoScheduleResult = {
      scheduledShifts: [],
      unscheduledShifts: [],
      totalCost: 0,
      complianceSummary: {
        compliantShifts: 0,
        warningShifts: 0,
        violationShifts: 0,
      },
      suggestions: [],
    };

    // Get suggestions for all shifts
    const suggestions = await this.suggestShiftAssignments(rosterId, requirements);

    // Track which employees are already assigned (to avoid over-scheduling)
    const employeeShiftCounts = new Map<string, number>();

    for (const suggestion of suggestions) {
      if (suggestion.bestMatch) {
        // Assign the best match
        result.scheduledShifts.push({
          requirement: suggestion.shift,
          assignedUser: suggestion.bestMatch.userId,
          fitScore: suggestion.bestMatch.fitScore,
          estimatedCost: suggestion.bestMatch.estimatedCost,
        });

        result.totalCost += suggestion.bestMatch.estimatedCost;

        // Track compliance
        if (suggestion.bestMatch.complianceStatus === 'compliant') {
          result.complianceSummary.compliantShifts++;
        } else if (suggestion.bestMatch.complianceStatus === 'warning') {
          result.complianceSummary.warningShifts++;
        } else {
          result.complianceSummary.violationShifts++;
        }

        // Track employee assignments
        const currentCount = employeeShiftCounts.get(suggestion.bestMatch.userId) || 0;
        employeeShiftCounts.set(suggestion.bestMatch.userId, currentCount + 1);
      } else {
        // No suitable employee found
        const reasons = suggestion.suggestions.length === 0
          ? 'No eligible employees available'
          : 'All candidates have compliance violations';

        result.unscheduledShifts.push({
          requirement: suggestion.shift,
          reason: reasons,
        });

        result.suggestions.push(
          `Unable to schedule shift on ${format(suggestion.shift.startTime, 'PPP p')}: ${reasons}`
        );
      }
    }

    // Add general suggestions
    if (result.complianceSummary.violationShifts > 0) {
      result.suggestions.push(
        `Warning: ${result.complianceSummary.violationShifts} shifts have compliance violations. Consider hiring additional staff or adjusting shift times.`
      );
    }

    if (result.unscheduledShifts.length > 0) {
      result.suggestions.push(
        `${result.unscheduledShifts.length} shifts could not be assigned. Review shift requirements or employee availability.`
      );
    }

    // Check for overworked employees
    employeeShiftCounts.forEach((count, userId) => {
      if (count > 5) {
        result.suggestions.push(
          `Employee ${userId} assigned ${count} shifts - consider load balancing.`
        );
      }
    });

    return result;
  }

  /**
   * Suggest improvements to existing schedule
   */
  async optimizeExistingSchedule(rosterId: string): Promise<OptimizationSuggestion[]> {
    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        shifts: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!roster) {
      throw new Error('Roster not found');
    }

    const optimizations: OptimizationSuggestion[] = [];

    // 1. Find shifts that could be assigned to lower-cost employees
    for (const shift of roster.shifts) {
      const shiftRequirement: ShiftRequirement = {
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        department: shift.department || undefined,
      };

      const suggestions = await this.suggestShiftAssignments(rosterId, [shiftRequirement]);
      const currentUserSuggestion = suggestions[0]?.suggestions.find(s => s.userId === shift.userId);
      const bestAlternative = suggestions[0]?.bestMatch;

      if (
        bestAlternative &&
        currentUserSuggestion &&
        bestAlternative.userId !== shift.userId &&
        bestAlternative.estimatedCost < currentUserSuggestion.estimatedCost * 0.9 && // At least 10% savings
        bestAlternative.fitScore >= currentUserSuggestion.fitScore - 10 // Similar fit score
      ) {
        const savings = currentUserSuggestion.estimatedCost - bestAlternative.estimatedCost;

        optimizations.push({
          type: 'reassign',
          description: `Reassign shift from ${shift.user.firstName} ${shift.user.lastName} to ${bestAlternative.user?.firstName} ${bestAlternative.user?.lastName}`,
          currentCost: currentUserSuggestion.estimatedCost,
          optimizedCost: bestAlternative.estimatedCost,
          savings,
          affectedShifts: [shift.id],
          suggestedChanges: [{
            shiftId: shift.id,
            currentUserId: shift.userId,
            suggestedUserId: bestAlternative.userId,
            reason: `Cost savings: NOK ${savings.toFixed(2)} while maintaining similar fit (${bestAlternative.fitScore} vs ${currentUserSuggestion.fitScore})`,
          }],
          complianceImpact:
            bestAlternative.complianceStatus === 'compliant' ? 'improves' : 'neutral',
          implementationDifficulty: 'easy',
        });
      }
    }

    // 2. Identify shifts with compliance violations that could be fixed
    const violatingShifts = roster.shifts.filter(
      s => s.violatesRestPeriod || s.violatesDailyLimit || s.violatesWeeklyLimit
    );

    for (const shift of violatingShifts) {
      const shiftRequirement: ShiftRequirement = {
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: shift.breakMinutes,
        department: shift.department || undefined,
      };

      const suggestions = await this.suggestShiftAssignments(rosterId, [shiftRequirement]);
      const compliantAlternative = suggestions[0]?.suggestions.find(
        s => s.userId !== shift.userId && s.complianceStatus === 'compliant'
      );

      if (compliantAlternative) {
        optimizations.push({
          type: 'reassign',
          description: `Fix compliance violation by reassigning to ${compliantAlternative.user?.firstName} ${compliantAlternative.user?.lastName}`,
          currentCost: 0,
          optimizedCost: compliantAlternative.estimatedCost,
          savings: 0,
          affectedShifts: [shift.id],
          suggestedChanges: [{
            shiftId: shift.id,
            currentUserId: shift.userId,
            suggestedUserId: compliantAlternative.userId,
            reason: 'Resolves compliance violations',
          }],
          complianceImpact: 'improves',
          implementationDifficulty: 'medium',
        });
      }
    }

    // 3. Look for shifts that could be swapped to better match preferences
    const shiftPairs = this.findSwapOpportunities(roster.shifts);

    for (const [shift1, shift2] of shiftPairs) {
      const score1Original = await this.calculateFitScore(shift1.userId, shift1);
      const score2Original = await this.calculateFitScore(shift2.userId, shift2);

      const score1Swapped = await this.calculateFitScore(shift2.userId, shift1);
      const score2Swapped = await this.calculateFitScore(shift1.userId, shift2);

      const currentTotal = score1Original.score + score2Original.score;
      const swappedTotal = score1Swapped.score + score2Swapped.score;

      if (swappedTotal > currentTotal + 20) { // Significant improvement
        optimizations.push({
          type: 'swap',
          description: `Swap shifts between ${shift1.user.firstName} and ${shift2.user.firstName} to better match preferences`,
          currentCost: 0,
          optimizedCost: 0,
          savings: 0,
          affectedShifts: [shift1.id, shift2.id],
          suggestedChanges: [
            {
              shiftId: shift1.id,
              currentUserId: shift1.userId,
              suggestedUserId: shift2.userId,
              reason: `Improves fit score from ${score1Original.score} to ${score1Swapped.score}`,
            },
            {
              shiftId: shift2.id,
              currentUserId: shift2.userId,
              suggestedUserId: shift1.userId,
              reason: `Improves fit score from ${score2Original.score} to ${score2Swapped.score}`,
            },
          ],
          complianceImpact: 'neutral',
          implementationDifficulty: 'medium',
        });
      }
    }

    // Sort optimizations by savings (descending)
    optimizations.sort((a, b) => b.savings - a.savings);

    return optimizations;
  }

  /**
   * Predict employee availability for a date range
   */
  async predictAvailability(
    userId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<AvailabilityPrediction[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        preferences: true,
        actualHours: {
          where: {
            date: {
              gte: addWeeks(dateRange.start, -12), // Look back 12 weeks for patterns
            },
          },
        },
        shiftsAssigned: {
          where: {
            startTime: {
              gte: addWeeks(dateRange.start, -4), // Recent schedule
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const predictions: AvailabilityPrediction[] = [];
    let currentDate = new Date(dateRange.start);

    while (currentDate <= dateRange.end) {
      const prediction = this.predictSingleDayAvailability(
        user,
        currentDate,
        user.preferences[0],
        user.actualHours,
        user.shiftsAssigned
      );

      predictions.push(prediction);
      currentDate = addDays(currentDate, 1);
    }

    return predictions;
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private calculatePreferenceScore(
    preference: EmployeePreference | undefined,
    shiftStart: Date,
    shiftEnd: Date,
    reasons: string[]
  ): number {
    let score = 15; // Base score

    if (!preference) {
      reasons.push('No preferences set (neutral score)');
      return score;
    }

    const dayOfWeek = format(shiftStart, 'EEEE');
    const hour = shiftStart.getHours();

    // Check preferred days (±10 points)
    if (preference.preferredDays.includes(dayOfWeek)) {
      score += 10;
      reasons.push(`Prefers ${dayOfWeek}`);
    } else if (preference.avoidDays.includes(dayOfWeek)) {
      score -= 10;
      reasons.push(`Prefers to avoid ${dayOfWeek}`);
    }

    // Check time of day preferences (±5 points)
    if (preference.preferMorning && hour >= 6 && hour < 12) {
      score += 5;
      reasons.push('Prefers morning shifts');
    } else if (preference.preferEvening && hour >= 12 && hour < 20) {
      score += 5;
      reasons.push('Prefers evening shifts');
    } else if (preference.preferNight && (hour >= 20 || hour < 6)) {
      score += 5;
      reasons.push('Prefers night shifts');
    }

    // Check unavailability
    if (preference.unavailableFrom && preference.unavailableTo) {
      if (
        isWithinInterval(shiftStart, {
          start: preference.unavailableFrom,
          end: preference.unavailableTo,
        })
      ) {
        score = 0;
        reasons.push(`Marked as unavailable: ${preference.unavailableReason || 'No reason given'}`);
      }
    }

    return Math.max(0, Math.min(30, score));
  }

  private async calculateComplianceScore(
    userId: string,
    newShift: ShiftData,
    existingShifts: ShiftData[],
    reasons: string[]
  ): Promise<{ complianceScore: number; complianceWarnings: string[] }> {
    let score = 30; // Start with full score
    const warnings: string[] = [];

    // Check rest periods
    const restViolations = this.restPeriodValidator.validateDailyRest(newShift, existingShifts);

    if (restViolations.length > 0) {
      score -= 15;
      restViolations.forEach(v => {
        warnings.push(v.violation);
        reasons.push(`Rest period violation: ${v.actualRest}h rest (requires ${v.requiredRest}h)`);
      });
    } else {
      reasons.push('Compliant with rest period requirements');
    }

    // Check working hours
    const hoursViolations = this.workingHoursValidator.validateDailyHours(newShift, existingShifts);

    if (hoursViolations.length > 0) {
      score -= 15;
      hoursViolations.forEach(v => {
        warnings.push(v.violation);
        reasons.push(`Working hours violation: ${v.actual.toFixed(1)}h (limit ${v.limit}h)`);
      });
    } else {
      reasons.push('Compliant with working hours limits');
    }

    return { complianceScore: Math.max(0, score), complianceWarnings: warnings };
  }

  private calculateHistoricalScore(
    actualHours: ActualHours[],
    shiftStart: Date,
    shiftEnd: Date,
    reasons: string[]
  ): number {
    if (actualHours.length === 0) {
      reasons.push('No historical data available');
      return 10; // Neutral score
    }

    const dayOfWeek = getDay(shiftStart);
    const hour = shiftStart.getHours();

    // Find similar historical shifts (same day of week, similar time)
    const similarShifts = actualHours.filter(ah => {
      const ahDay = getDay(ah.date);
      const ahHour = ah.clockIn.getHours();
      return ahDay === dayOfWeek && Math.abs(ahHour - hour) <= 2;
    });

    if (similarShifts.length > 0) {
      const avgHours = similarShifts.reduce((sum, ah) => sum + ah.totalHours, 0) / similarShifts.length;
      const shiftHours = differenceInHours(shiftEnd, shiftStart);

      // Score based on how close this shift is to their historical pattern
      const similarity = 1 - Math.min(Math.abs(shiftHours - avgHours) / shiftHours, 1);
      const score = similarity * 20;

      reasons.push(
        `Has worked ${similarShifts.length} similar shifts (avg ${avgHours.toFixed(1)}h)`
      );
      return score;
    }

    reasons.push('No similar historical shifts found');
    return 5;
  }

  private async calculateAvailabilityScore(
    userId: string,
    shiftStart: Date,
    shiftEnd: Date,
    reasons: string[]
  ): Promise<number> {
    // Check for overlapping shifts
    const overlappingShifts = await prisma.shift.findMany({
      where: {
        userId,
        OR: [
          {
            startTime: { lte: shiftStart },
            endTime: { gt: shiftStart },
          },
          {
            startTime: { lt: shiftEnd },
            endTime: { gte: shiftEnd },
          },
        ],
      },
    });

    if (overlappingShifts.length > 0) {
      reasons.push('Has overlapping shift scheduled');
      return 0;
    }

    // Check for time-off requests
    const timeOffRequests = await prisma.timeOffRequest.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'APPROVED'] },
        startDate: { lte: shiftEnd },
        endDate: { gte: shiftStart },
      },
    });

    if (timeOffRequests.length > 0) {
      const status = timeOffRequests[0].status;
      reasons.push(`Has ${status.toLowerCase()} time-off request`);
      return status === 'APPROVED' ? 0 : 5;
    }

    reasons.push('Fully available');
    return 10;
  }

  private async calculateCostScore(
    user: User,
    shiftStart: Date,
    shiftEnd: Date,
    breakMinutes: number,
    existingShifts: ShiftData[],
    reasons: string[]
  ): Promise<number> {
    const shiftData: ShiftData = {
      startTime: shiftStart,
      endTime: shiftEnd,
      breakMinutes,
      userId: user.id,
      // hourlyRate: (user.hourlyRate as number) || 200,
    };

    const cost = this.laborCostCalculator.calculateShiftCost(shiftData);

    // Score based on overtime (prefer non-overtime)
    if (cost.overtimeHours > 0) {
      reasons.push(`Would incur ${cost.overtimeHours.toFixed(1)}h overtime (NOK ${cost.overtimeCost.toFixed(2)})`);
      return 0;
    }

    // Check weekly hours to see if close to limit
    const weekShifts = existingShifts.filter(s => {
      const weekStart = startOfDay(shiftStart);
      const weekEnd = addDays(weekStart, 7);
      return isWithinInterval(s.startTime, { start: weekStart, end: weekEnd });
    });

    const totalWeeklyHours = weekShifts.reduce((sum, s) => {
      const hours = differenceInHours(s.endTime, s.startTime) - s.breakMinutes / 60;
      return sum + hours;
    }, 0) + cost.totalHours;

    if (totalWeeklyHours <= this.config.maxWeeklyHours * 0.8) {
      reasons.push('Well within weekly hours limit');
      return 10;
    } else if (totalWeeklyHours <= this.config.maxWeeklyHours) {
      reasons.push('Approaching weekly hours limit');
      return 5;
    }

    reasons.push('Close to weekly hours limit');
    return 2;
  }

  private findSwapOpportunities(
    shifts: (Shift & { user: User })[]
  ): [Shift & { user: User }, Shift & { user: User }][] {
    const pairs: [Shift & { user: User }, Shift & { user: User }][] = [];

    // Find shifts that are close in time but assigned to different users
    for (let i = 0; i < shifts.length; i++) {
      for (let j = i + 1; j < shifts.length; j++) {
        const shift1 = shifts[i];
        const shift2 = shifts[j];

        // Only consider swaps for different users
        if (shift1.userId === shift2.userId) continue;

        // Only consider swaps for shifts within 3 days of each other
        const dayDiff = Math.abs(
          differenceInHours(shift1.startTime, shift2.startTime) / 24
        );

        if (dayDiff <= 3) {
          pairs.push([shift1, shift2]);
        }
      }
    }

    return pairs;
  }

  private predictSingleDayAvailability(
    user: User,
    date: Date,
    preference: EmployeePreference | undefined,
    historicalHours: ActualHours[],
    recentShifts: Shift[]
  ): AvailabilityPrediction {
    const factors = {
      historicalPattern: 0,
      preferences: 0,
      recentSchedule: 0,
      dayOfWeek: 0,
    };

    const reasoning: string[] = [];

    // 1. Historical pattern (40% weight)
    const dayOfWeek = getDay(date);
    const historicalShiftsOnDay = historicalHours.filter(
      ah => getDay(ah.date) === dayOfWeek
    );

    if (historicalShiftsOnDay.length >= 3) {
      factors.historicalPattern = 40;
      reasoning.push(
        `Historically works on ${format(date, 'EEEE')} (${historicalShiftsOnDay.length} times)`
      );
    } else if (historicalShiftsOnDay.length > 0) {
      factors.historicalPattern = 20;
      reasoning.push(`Occasionally works on ${format(date, 'EEEE')}`);
    } else {
      factors.historicalPattern = 0;
      reasoning.push(`Rarely works on ${format(date, 'EEEE')}`);
    }

    // 2. Preferences (30% weight)
    if (preference) {
      const dayName = format(date, 'EEEE');
      if (preference.preferredDays.includes(dayName)) {
        factors.preferences = 30;
        reasoning.push(`Prefers ${dayName}`);
      } else if (preference.avoidDays.includes(dayName)) {
        factors.preferences = -30;
        reasoning.push(`Prefers to avoid ${dayName}`);
      }

      // Check unavailability
      if (preference.unavailableFrom && preference.unavailableTo) {
        if (
          isWithinInterval(date, {
            start: startOfDay(preference.unavailableFrom),
            end: endOfDay(preference.unavailableTo),
          })
        ) {
          return {
            userId: user.id,
            date,
            predictedAvailable: false,
            confidence: 100,
            factors,
            reasoning: [`Marked as unavailable: ${preference.unavailableReason || 'No reason given'}`],
          };
        }
      }
    }

    // 3. Recent schedule pattern (20% weight)
    const recentShiftsOnDay = recentShifts.filter(
      shift => getDay(shift.startTime) === dayOfWeek
    );

    if (recentShiftsOnDay.length >= 2) {
      factors.recentSchedule = 20;
      reasoning.push(`Recently scheduled on ${format(date, 'EEEE')}s`);
    } else if (recentShiftsOnDay.length === 1) {
      factors.recentSchedule = 10;
    }

    // 4. Day of week general patterns (10% weight)
    // Weekends typically have lower availability
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      factors.dayOfWeek = -10;
      reasoning.push('Weekend - typically lower availability');
    } else {
      factors.dayOfWeek = 10;
      reasoning.push('Weekday - typically higher availability');
    }

    // Calculate total confidence
    const totalScore = Object.values(factors).reduce((sum, f) => sum + f, 0);
    const confidence = Math.min(100, Math.max(0, 50 + totalScore));

    return {
      userId: user.id,
      date,
      predictedAvailable: confidence >= 50,
      confidence,
      factors,
      reasoning,
    };
  }

  /**
   * Helper to calculate shift hours
   */
  private calculateShiftHours(startTime: Date, endTime: Date, breakMinutes: number): number {
    const totalMinutes = differenceInMinutes(endTime, startTime);
    const workingMinutes = totalMinutes - breakMinutes;
    return workingMinutes / 60;
  }
}
