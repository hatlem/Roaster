// Employee Advocate Agent - Employee Welfare Champion
// This agent focuses on employee wellbeing, preferences, and work-life balance
// It ensures scheduling decisions consider the human impact

import { BaseAgent, EvidenceReference, ScoringComponent } from './baseAgent';
import {
  AgentPersona,
  AgentDecision,
  DecisionContext,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
  EmployeePreferenceData,
} from '../../types/consensus';
import { ShiftData, ComplianceConfig } from '../../types';
import { format, getDay, isWeekend as dateFnsIsWeekend, differenceInDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export class EmployeeAdvocateAgent extends BaseAgent {
  constructor(config: ComplianceConfig) {
    super(config);
  }

  protected definePersona(): AgentPersona {
    return {
      role: 'employee_advocate',
      name: 'Employee Advocate',
      description: 'Champion for employee wellbeing, preferences, and work-life balance',
      expertise: [
        'Employee preference matching',
        'Work-life balance assessment',
        'Burnout prevention',
        'Fair workload distribution',
        'Schedule predictability',
        'Personal time protection',
      ],
      priorities: [
        'Respect employee preferences',
        'Ensure fair workload distribution',
        'Protect work-life balance',
        'Prevent burnout through reasonable scheduling',
        'Consider personal circumstances',
      ],
      weights: {
        preferenceMatch: 0.30,
        workloadFairness: 0.25,
        workLifeBalance: 0.25,
        scheduleStability: 0.20,
      },
    };
  }

  async evaluate(context: DecisionContext): Promise<AgentDecision> {
    const scoringComponents = await this.getScoringComponents(context);

    let totalScore = 0;
    let totalWeight = 0;
    const scoreBreakdown: Record<string, number> = {};

    for (const component of scoringComponents) {
      const weightedScore = (component.score / component.maxScore) * component.weight * 100;
      totalScore += weightedScore;
      totalWeight += component.weight;
      scoreBreakdown[component.name] = component.score;
    }

    const finalScore = totalWeight > 0 ? totalScore / totalWeight : 0;

    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];

    let hasWelfareConcerns = false;

    for (const component of scoringComponents) {
      if (component.score < component.maxScore * 0.5) {
        concerns.push(component.reasoning);
        if (component.name === 'Work-Life Balance' || component.name === 'Preference Alignment') {
          hasWelfareConcerns = true;
        }
      } else {
        reasoning.push(component.reasoning);
      }

      // Generate employee-focused suggestions
      const negativeEvidence = component.evidence.filter(e => e.impact === 'negative');
      for (const evidence of negativeEvidence) {
        suggestions.push(`Consider employee welfare: ${evidence.description}`);
      }
    }

    const { recommendation, confidence } = this.determineRecommendation(
      finalScore,
      hasWelfareConcerns,
      concerns.length > 0
    );

    return this.buildDecision({
      recommendation,
      confidence,
      score: Math.round(finalScore),
      scoreBreakdown,
      reasoning,
      concerns,
      suggestions,
    });
  }

  async getScoringComponents(context: DecisionContext): Promise<ScoringComponent[]> {
    const components: ScoringComponent[] = [];

    if (context.proposal.type === 'shift_assignment') {
      const proposal = context.proposal as ShiftProposal;
      components.push(...this.evaluateShiftForEmployee(proposal, context));
    } else if (context.proposal.type === 'schedule_creation') {
      const proposal = context.proposal as ScheduleProposal;
      components.push(...this.evaluateScheduleForEmployees(proposal, context));
    } else if (context.proposal.type === 'shift_swap') {
      const proposal = context.proposal as SwapProposal;
      components.push(...this.evaluateSwapForEmployees(proposal, context));
    }

    return components;
  }

  // ===========================================================================
  // Shift Assignment Evaluation for Employee
  // ===========================================================================

  private evaluateShiftForEmployee(
    proposal: ShiftProposal,
    context: DecisionContext
  ): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const { shift, userId } = proposal;

    const employeePrefs = context.employeePreferences.find(p => p.userId === userId);
    const userShifts = context.existingShifts.filter(s => s.userId === userId);

    // 1. Preference Alignment
    components.push(this.evaluatePreferenceAlignment(shift, employeePrefs));

    // 2. Work-Life Balance
    components.push(this.evaluateWorkLifeBalance(shift, userShifts));

    // 3. Workload Fairness
    components.push(this.evaluateWorkloadFairness(userId, shift, context));

    // 4. Schedule Stability
    components.push(this.evaluateScheduleStability(shift, userShifts));

    return components;
  }

  private evaluatePreferenceAlignment(
    shift: ShiftData,
    prefs: EmployeePreferenceData | undefined
  ): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 70; // Base score when no preferences

    if (!prefs) {
      evidence.push(this.createEvidence(
        'data',
        'Employee Preferences',
        'No preferences on file - cannot evaluate alignment',
        'neutral',
        0.5
      ));
      return this.createScoringComponent(
        'Preference Alignment',
        score,
        100,
        this.persona.weights.preferenceMatch,
        evidence,
        'No preferences set - using neutral score',
        true
      );
    }

    const dayName = this.getDayName(shift.startTime);
    const shiftHour = shift.startTime.getHours();

    // Check preferred days
    if (prefs.preferredDays.includes(dayName)) {
      score += 15;
      evidence.push(this.createEvidence(
        'preference',
        'Preferred Day',
        `Employee prefers working on ${dayName}`,
        'positive',
        0.8,
        dayName
      ));
    }

    // Check avoided days
    if (prefs.avoidDays.includes(dayName)) {
      score -= 30;
      evidence.push(this.createEvidence(
        'preference',
        'Avoided Day',
        `Employee prefers to avoid ${dayName}`,
        'negative',
        0.9,
        dayName
      ));
    }

    // Check time of day preferences
    const isMorning = shiftHour >= 6 && shiftHour < 12;
    const isEvening = shiftHour >= 12 && shiftHour < 20;
    const isNight = shiftHour >= 20 || shiftHour < 6;

    if (prefs.preferMorning && isMorning) {
      score += 10;
      evidence.push(this.createEvidence(
        'preference',
        'Time Preference',
        'Matches morning shift preference',
        'positive',
        0.6
      ));
    } else if (prefs.preferEvening && isEvening) {
      score += 10;
      evidence.push(this.createEvidence(
        'preference',
        'Time Preference',
        'Matches evening shift preference',
        'positive',
        0.6
      ));
    } else if (prefs.preferNight && isNight) {
      score += 10;
      evidence.push(this.createEvidence(
        'preference',
        'Time Preference',
        'Matches night shift preference',
        'positive',
        0.6
      ));
    } else if ((prefs.preferMorning && !isMorning) ||
               (prefs.preferEvening && !isEvening) ||
               (prefs.preferNight && !isNight)) {
      score -= 10;
      evidence.push(this.createEvidence(
        'preference',
        'Time Preference',
        'Does not match preferred time of day',
        'negative',
        0.5
      ));
    }

    // Check unavailability
    if (prefs.unavailableFrom && prefs.unavailableTo) {
      if (isWithinInterval(shift.startTime, {
        start: prefs.unavailableFrom,
        end: prefs.unavailableTo,
      })) {
        score = 0;
        evidence.push(this.createEvidence(
          'preference',
          'Unavailability',
          `Employee marked unavailable: ${prefs.unavailableReason || 'personal reasons'}`,
          'negative',
          1.0,
          prefs.unavailableReason
        ));
      }
    }

    // Check hours constraints
    if (prefs.maxHoursPerWeek || prefs.minHoursPerWeek) {
      const shiftHours = this.calculateShiftHours(shift);
      if (prefs.maxHoursPerWeek && shiftHours > prefs.maxHoursPerWeek) {
        score -= 20;
        evidence.push(this.createEvidence(
          'preference',
          'Hours Constraint',
          `Shift may exceed preferred max ${prefs.maxHoursPerWeek}h/week`,
          'negative',
          0.7
        ));
      }
    }

    score = Math.max(0, Math.min(100, score));
    const reasoning = score >= 70
      ? `Good preference match: ${evidence.filter(e => e.impact === 'positive').length} preferences met`
      : `Preference concerns: ${evidence.filter(e => e.impact === 'negative').length} mismatches found`;

    return this.createScoringComponent(
      'Preference Alignment',
      score,
      100,
      this.persona.weights.preferenceMatch,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateWorkLifeBalance(shift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 100;

    // Check consecutive working days
    const shiftsThisWeek = existingShifts.filter(s =>
      Math.abs(differenceInDays(s.startTime, shift.startTime)) <= 7
    );

    const consecutiveDays = this.countConsecutiveWorkDays(shift, existingShifts);

    if (consecutiveDays > 5) {
      score -= 30;
      evidence.push(this.createEvidence(
        'pattern',
        'Consecutive Days',
        `${consecutiveDays} consecutive work days - risk of burnout`,
        'negative',
        0.9,
        consecutiveDays
      ));
    } else if (consecutiveDays > 4) {
      score -= 15;
      evidence.push(this.createEvidence(
        'pattern',
        'Consecutive Days',
        `${consecutiveDays} consecutive work days`,
        'neutral',
        0.6,
        consecutiveDays
      ));
    } else {
      evidence.push(this.createEvidence(
        'pattern',
        'Consecutive Days',
        `${consecutiveDays} consecutive work days - reasonable`,
        'positive',
        0.7,
        consecutiveDays
      ));
    }

    // Check weekend work
    if (this.isWeekend(shift.startTime)) {
      const recentWeekendShifts = shiftsThisWeek.filter(s => this.isWeekend(s.startTime));
      if (recentWeekendShifts.length >= 2) {
        score -= 20;
        evidence.push(this.createEvidence(
          'pattern',
          'Weekend Work',
          `Multiple weekend shifts recently - impacts personal time`,
          'negative',
          0.7,
          recentWeekendShifts.length + 1
        ));
      } else {
        evidence.push(this.createEvidence(
          'pattern',
          'Weekend Work',
          'Weekend shift with reasonable frequency',
          'neutral',
          0.4
        ));
      }
    }

    // Check for split shifts or irregular patterns
    const shiftStartHour = shift.startTime.getHours();
    const irregularPattern = existingShifts.some(s => {
      const existingHour = s.startTime.getHours();
      const hourDiff = Math.abs(existingHour - shiftStartHour);
      return hourDiff > 8 && Math.abs(differenceInDays(s.startTime, shift.startTime)) <= 2;
    });

    if (irregularPattern) {
      score -= 15;
      evidence.push(this.createEvidence(
        'pattern',
        'Schedule Irregularity',
        'Large variation in shift times - affects sleep patterns',
        'negative',
        0.6
      ));
    }

    score = Math.max(0, score);
    const reasoning = score >= 70
      ? 'Good work-life balance maintained'
      : 'Work-life balance concerns identified';

    return this.createScoringComponent(
      'Work-Life Balance',
      score,
      100,
      this.persona.weights.workLifeBalance,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateWorkloadFairness(
    userId: string,
    newShift: ShiftData,
    context: DecisionContext
  ): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    // Calculate average hours across all employees
    const employeeHours: Map<string, number> = new Map();

    for (const shift of context.existingShifts) {
      const hours = employeeHours.get(shift.userId) || 0;
      employeeHours.set(shift.userId, hours + this.calculateShiftHours(shift));
    }

    // Add the new shift hours for this user
    const currentUserHours = (employeeHours.get(userId) || 0) + this.calculateShiftHours(newShift);
    employeeHours.set(userId, currentUserHours);

    // Calculate average and standard deviation
    const allHours = Array.from(employeeHours.values());
    const avgHours = allHours.reduce((a, b) => a + b, 0) / allHours.length;
    const variance = allHours.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) / allHours.length;
    const stdDev = Math.sqrt(variance);

    // Score based on how far this employee's hours deviate from average
    const deviation = currentUserHours - avgHours;
    const deviationMultiple = stdDev > 0 ? deviation / stdDev : 0;

    let score: number;

    if (deviationMultiple > 2) {
      score = 30;
      evidence.push(this.createEvidence(
        'calculation',
        'Hours Distribution',
        `${currentUserHours.toFixed(1)}h vs team avg ${avgHours.toFixed(1)}h - significantly overloaded`,
        'negative',
        1.0,
        currentUserHours
      ));
    } else if (deviationMultiple > 1) {
      score = 60;
      evidence.push(this.createEvidence(
        'calculation',
        'Hours Distribution',
        `${currentUserHours.toFixed(1)}h vs team avg ${avgHours.toFixed(1)}h - above average workload`,
        'neutral',
        0.7,
        currentUserHours
      ));
    } else if (deviationMultiple < -1) {
      score = 90;
      evidence.push(this.createEvidence(
        'calculation',
        'Hours Distribution',
        `${currentUserHours.toFixed(1)}h vs team avg ${avgHours.toFixed(1)}h - below average workload`,
        'positive',
        0.8,
        currentUserHours
      ));
    } else {
      score = 85;
      evidence.push(this.createEvidence(
        'calculation',
        'Hours Distribution',
        `${currentUserHours.toFixed(1)}h vs team avg ${avgHours.toFixed(1)}h - fair distribution`,
        'positive',
        0.9,
        currentUserHours
      ));
    }

    const reasoning = score >= 70
      ? `Fair workload: ${currentUserHours.toFixed(1)}h is reasonable vs team avg ${avgHours.toFixed(1)}h`
      : `Workload concern: ${currentUserHours.toFixed(1)}h exceeds team avg ${avgHours.toFixed(1)}h`;

    return this.createScoringComponent(
      'Workload Fairness',
      score,
      100,
      this.persona.weights.workloadFairness,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateScheduleStability(shift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 100;

    // Check for last-minute scheduling (less than 14 days notice)
    const daysNotice = differenceInDays(shift.startTime, new Date());

    if (daysNotice < 14) {
      score -= Math.max(0, (14 - daysNotice) * 3);
      evidence.push(this.createEvidence(
        'data',
        'Notice Period',
        `Only ${daysNotice} days notice (14 days recommended by law)`,
        daysNotice < 7 ? 'negative' : 'neutral',
        0.8,
        daysNotice
      ));
    } else {
      evidence.push(this.createEvidence(
        'data',
        'Notice Period',
        `${daysNotice} days notice - adequate time to plan`,
        'positive',
        0.6,
        daysNotice
      ));
    }

    // Check for consistency in shift patterns
    const thisShiftStartHour = shift.startTime.getHours();
    const recentShiftHours = existingShifts
      .slice(-5)
      .map(s => s.startTime.getHours());

    if (recentShiftHours.length > 0) {
      const avgRecentHour = recentShiftHours.reduce((a, b) => a + b, 0) / recentShiftHours.length;
      const hourVariation = Math.abs(thisShiftStartHour - avgRecentHour);

      if (hourVariation > 6) {
        score -= 20;
        evidence.push(this.createEvidence(
          'pattern',
          'Shift Timing Consistency',
          `Significant variation from recent pattern (${hourVariation.toFixed(0)}h difference)`,
          'negative',
          0.6,
          hourVariation
        ));
      } else {
        evidence.push(this.createEvidence(
          'pattern',
          'Shift Timing Consistency',
          'Consistent with recent shift patterns',
          'positive',
          0.5
        ));
      }
    }

    score = Math.max(0, score);
    const reasoning = score >= 70
      ? 'Schedule provides good predictability for employee'
      : 'Schedule stability concerns - may impact personal planning';

    return this.createScoringComponent(
      'Schedule Stability',
      score,
      100,
      this.persona.weights.scheduleStability,
      evidence,
      reasoning,
      true
    );
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private countConsecutiveWorkDays(newShift: ShiftData, existingShifts: ShiftData[]): number {
    const shiftDates = new Set(
      [...existingShifts, newShift]
        .filter(s => s.userId === newShift.userId)
        .map(s => format(s.startTime, 'yyyy-MM-dd'))
    );

    let maxConsecutive = 1;
    let current = 1;
    const sortedDates = Array.from(shiftDates).sort();

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const daysDiff = differenceInDays(currDate, prevDate);

      if (daysDiff === 1) {
        current++;
        maxConsecutive = Math.max(maxConsecutive, current);
      } else {
        current = 1;
      }
    }

    return maxConsecutive;
  }

  // ===========================================================================
  // Schedule and Swap Evaluation
  // ===========================================================================

  private evaluateScheduleForEmployees(
    proposal: ScheduleProposal,
    context: DecisionContext
  ): ScoringComponent[] {
    const allComponents: ScoringComponent[] = [];

    // Group assignments by user
    const userAssignments: Map<string, ShiftData[]> = new Map();
    for (const assignment of proposal.assignments) {
      const existing = userAssignments.get(assignment.userId) || [];
      existing.push(assignment.shift);
      userAssignments.set(assignment.userId, existing);
    }

    // Evaluate each user's schedule
    for (const [userId, shifts] of userAssignments) {
      for (const shift of shifts) {
        const otherShifts = shifts.filter(s => s !== shift);
        const shiftProposal: ShiftProposal = {
          type: 'shift_assignment',
          userId,
          shift,
          isNew: true,
        };

        const modifiedContext: DecisionContext = {
          ...context,
          existingShifts: [...context.existingShifts, ...otherShifts],
        };

        allComponents.push(...this.evaluateShiftForEmployee(shiftProposal, modifiedContext));
      }
    }

    return allComponents;
  }

  private evaluateSwapForEmployees(
    proposal: SwapProposal,
    context: DecisionContext
  ): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const evidence: EvidenceReference[] = [];

    // Check if swap is employee-initiated (positive for autonomy)
    evidence.push(this.createEvidence(
      'data',
      'Employee Initiative',
      `Swap requested by employee: "${proposal.reason}"`,
      'positive',
      0.8,
      proposal.reason
    ));

    // Evaluate impact on both employees
    const requesterPrefs = context.employeePreferences.find(p => p.userId === proposal.requestingUserId);
    const targetPrefs = context.employeePreferences.find(p => p.userId === proposal.targetUserId);

    // Check requester's preference for new shift
    const requesterMatch = this.evaluatePreferenceMatch(proposal.shiftToReceive, requesterPrefs);
    const targetMatch = this.evaluatePreferenceMatch(proposal.shiftToSwap, targetPrefs);

    evidence.push(this.createEvidence(
      'calculation',
      'Requester Fit',
      `Requester preference match: ${requesterMatch}%`,
      requesterMatch >= 70 ? 'positive' : 'neutral',
      0.6,
      requesterMatch
    ));

    evidence.push(this.createEvidence(
      'calculation',
      'Target Fit',
      `Target preference match: ${targetMatch}%`,
      targetMatch >= 70 ? 'positive' : 'neutral',
      0.6,
      targetMatch
    ));

    const avgMatch = (requesterMatch + targetMatch) / 2;
    const score = Math.round(avgMatch);

    components.push(this.createScoringComponent(
      'Swap Preference Match',
      score,
      100,
      1.0,
      evidence,
      `Swap benefits: Requester ${requesterMatch}%, Target ${targetMatch}%`,
      true
    ));

    return components;
  }

  private evaluatePreferenceMatch(shift: ShiftData, prefs: EmployeePreferenceData | undefined): number {
    if (!prefs) return 70;

    let score = 70;
    const dayName = this.getDayName(shift.startTime);

    if (prefs.preferredDays.includes(dayName)) score += 15;
    if (prefs.avoidDays.includes(dayName)) score -= 30;

    const hour = shift.startTime.getHours();
    if (prefs.preferMorning && hour >= 6 && hour < 12) score += 10;
    if (prefs.preferEvening && hour >= 12 && hour < 20) score += 10;
    if (prefs.preferNight && (hour >= 20 || hour < 6)) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  // ===========================================================================
  // Debate Response
  // ===========================================================================

  async respondToDebate(
    context: DecisionContext,
    otherDecisions: AgentDecision[],
    debateTopic: string
  ): Promise<{
    response: string;
    changedPosition: boolean;
    newRecommendation?: RecommendationType;
    newConfidence?: number;
  }> {
    const complianceDecision = otherDecisions.find(d => d.agentRole === 'compliance');
    const costDecision = otherDecisions.find(d => d.agentRole === 'cost_optimizer');
    const opsDecision = otherDecisions.find(d => d.agentRole === 'operations');

    // Compliance violations are non-negotiable
    if (complianceDecision?.recommendation === 'reject') {
      return {
        response: `${this.persona.name}: I support the compliance rejection. Employee welfare includes legal protections.`,
        changedPosition: true,
        newRecommendation: 'reject',
        newConfidence: 95,
      };
    }

    // If operations desperately needs coverage, be flexible
    if (opsDecision?.recommendation === 'approve' && opsDecision.confidence > 85) {
      const hasMinorConcerns = this.evaluate(context).then(d => d.score >= 60);
      if (await hasMinorConcerns) {
        return {
          response: `${this.persona.name}: I understand operational needs. I can support this with conditions to protect employee welfare.`,
          changedPosition: true,
          newRecommendation: 'approve_with_conditions',
          newConfidence: 70,
        };
      }
    }

    // Stand firm on significant welfare concerns
    return {
      response: `${this.persona.name}: Employee wellbeing remains my priority. Cost savings and operational efficiency should not come at the expense of worker welfare.`,
      changedPosition: false,
    };
  }
}
