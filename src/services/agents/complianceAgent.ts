// Compliance Agent - Norwegian Labor Law Expert (Arbeidsmiljøloven)
// This agent ensures all scheduling decisions comply with Norwegian labor law
// It has the highest weight in consensus decisions due to legal requirements

import { BaseAgent, EvidenceReference, ScoringComponent } from './baseAgent';
import {
  AgentPersona,
  AgentDecision,
  DecisionContext,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
} from '../../types/consensus';
import { ShiftData, ComplianceConfig } from '../../types';
import { differenceInHours, startOfWeek, endOfWeek, isWithinInterval, addDays } from 'date-fns';

export class ComplianceAgent extends BaseAgent {
  constructor(config: ComplianceConfig) {
    super(config);
  }

  protected definePersona(): AgentPersona {
    return {
      role: 'compliance',
      name: 'Compliance Guardian',
      description: 'Norwegian Labor Law Expert specializing in Arbeidsmiljøloven compliance',
      expertise: [
        'Arbeidsmiljøloven (Working Environment Act)',
        'Rest period requirements (11h daily, 35h weekly)',
        'Working hours limits (9h daily, 40h weekly)',
        'Overtime regulations and limits',
        '14-day publication rule',
        'Employee representative consultation',
      ],
      priorities: [
        'Legal compliance is non-negotiable',
        'Employee health and safety',
        'Preventing burnout through rest requirements',
        'Audit trail for Arbeidstilsynet inspections',
      ],
      weights: {
        dailyRest: 0.25,
        weeklyRest: 0.20,
        dailyHours: 0.20,
        weeklyHours: 0.20,
        overtimeLimits: 0.15,
      },
    };
  }

  async evaluate(context: DecisionContext): Promise<AgentDecision> {
    const scoringComponents = await this.getScoringComponents(context);

    // Calculate weighted score
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

    // Gather reasoning, concerns, and suggestions
    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];

    let hasCriticalConcerns = false;

    for (const component of scoringComponents) {
      if (component.score < component.maxScore * 0.5) {
        concerns.push(component.reasoning);
        if (component.name === 'Daily Rest Period' || component.name === 'Weekly Rest Period') {
          hasCriticalConcerns = true;
        }
      } else {
        reasoning.push(component.reasoning);
      }

      // Add evidence-based suggestions
      const negativeEvidence = component.evidence.filter(e => e.impact === 'negative');
      for (const evidence of negativeEvidence) {
        if (evidence.type === 'rule') {
          suggestions.push(`Review ${evidence.source}: ${evidence.description}`);
        }
      }
    }

    const { recommendation, confidence } = this.determineRecommendation(
      finalScore,
      hasCriticalConcerns,
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
      components.push(...await this.evaluateShiftAssignment(proposal, context));
    } else if (context.proposal.type === 'schedule_creation') {
      const proposal = context.proposal as ScheduleProposal;
      components.push(...await this.evaluateScheduleCreation(proposal, context));
    } else if (context.proposal.type === 'shift_swap') {
      const proposal = context.proposal as SwapProposal;
      components.push(...await this.evaluateShiftSwap(proposal, context));
    }

    return components;
  }

  // ===========================================================================
  // Shift Assignment Evaluation
  // ===========================================================================

  private async evaluateShiftAssignment(
    proposal: ShiftProposal,
    context: DecisionContext
  ): Promise<ScoringComponent[]> {
    const components: ScoringComponent[] = [];
    const { shift, userId } = proposal;
    const userShifts = context.existingShifts.filter(s => s.userId === userId);

    // 1. Daily Rest Period Check (11 hours minimum)
    components.push(this.checkDailyRestPeriod(shift, userShifts));

    // 2. Weekly Rest Period Check (35 hours minimum)
    components.push(this.checkWeeklyRestPeriod(shift, userShifts));

    // 3. Daily Working Hours Check (9 hours maximum)
    components.push(this.checkDailyWorkingHours(shift, userShifts));

    // 4. Weekly Working Hours Check (40 hours maximum)
    components.push(this.checkWeeklyWorkingHours(shift, userShifts));

    // 5. Overtime Limits Check
    components.push(this.checkOvertimeLimits(shift, userShifts));

    return components;
  }

  private checkDailyRestPeriod(newShift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 100;
    let reasoning = '';

    // Reference to the law
    evidence.push(this.createEvidence(
      'rule',
      'Arbeidsmiljøloven § 10-8(1)',
      `Minimum 11 hours continuous rest between shifts`,
      'neutral',
      1.0,
      `${this.config.minDailyRest} hours required`
    ));

    // Check rest periods with existing shifts
    for (const existing of existingShifts) {
      const restHours = this.getRestHoursBetweenShifts(newShift, existing);

      if (restHours > 0 && restHours < this.config.minDailyRest) {
        score = 0;
        evidence.push(this.createEvidence(
          'calculation',
          `Rest period calculation`,
          `Only ${restHours.toFixed(1)} hours rest between shifts`,
          'negative',
          1.0,
          restHours
        ));
        reasoning = `VIOLATION: Only ${restHours.toFixed(1)}h rest between shifts (requires ${this.config.minDailyRest}h per Arbeidsmiljøloven § 10-8)`;
        break;
      } else if (restHours >= this.config.minDailyRest) {
        evidence.push(this.createEvidence(
          'calculation',
          'Rest period calculation',
          `${restHours.toFixed(1)} hours rest between shifts`,
          'positive',
          0.5,
          restHours
        ));
      }
    }

    if (score === 100) {
      reasoning = `Compliant: All rest periods meet the ${this.config.minDailyRest}h minimum requirement`;
    }

    return this.createScoringComponent(
      'Daily Rest Period',
      score,
      100,
      this.persona.weights.dailyRest,
      evidence,
      reasoning,
      false // Not user editable - legal requirement
    );
  }

  private checkWeeklyRestPeriod(newShift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'rule',
      'Arbeidsmiljøloven § 10-8(2)',
      `Minimum 35 hours continuous rest per week`,
      'neutral',
      1.0,
      `${this.config.minWeeklyRest} hours required`
    ));

    // Get the week containing the new shift
    const weekStart = startOfWeek(newShift.startTime, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(newShift.startTime, { weekStartsOn: 1 });

    // Get all shifts in the same week including the new one
    const weekShifts = [
      ...existingShifts.filter(s =>
        isWithinInterval(s.startTime, { start: weekStart, end: weekEnd })
      ),
      newShift,
    ].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Find the longest rest period in the week
    let longestRest = 0;
    for (let i = 0; i < weekShifts.length; i++) {
      const currentEnd = weekShifts[i].endTime;
      const nextStart = weekShifts[i + 1]?.startTime || weekEnd;
      const restHours = differenceInHours(nextStart, currentEnd);
      longestRest = Math.max(longestRest, restHours);
    }

    let score = 100;
    let reasoning = '';

    if (longestRest < this.config.minWeeklyRest) {
      score = 0;
      evidence.push(this.createEvidence(
        'calculation',
        'Weekly rest calculation',
        `Longest continuous rest: ${longestRest.toFixed(1)} hours`,
        'negative',
        1.0,
        longestRest
      ));
      reasoning = `VIOLATION: Longest rest period is ${longestRest.toFixed(1)}h (requires ${this.config.minWeeklyRest}h continuous per Arbeidsmiljøloven § 10-8)`;
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Weekly rest calculation',
        `Longest continuous rest: ${longestRest.toFixed(1)} hours`,
        'positive',
        1.0,
        longestRest
      ));
      reasoning = `Compliant: ${longestRest.toFixed(1)}h continuous rest available (${this.config.minWeeklyRest}h required)`;
    }

    return this.createScoringComponent(
      'Weekly Rest Period',
      score,
      100,
      this.persona.weights.weeklyRest,
      evidence,
      reasoning,
      false
    );
  }

  private checkDailyWorkingHours(newShift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'rule',
      'Arbeidsmiljøloven § 10-4(1)',
      `Maximum 9 hours per day`,
      'neutral',
      1.0,
      `${this.config.maxDailyHours} hours limit`
    ));

    const shiftHours = this.calculateShiftHours(newShift);
    const sameDayShifts = existingShifts.filter(s =>
      s.startTime.toDateString() === newShift.startTime.toDateString()
    );

    const totalDailyHours = sameDayShifts.reduce(
      (total, s) => total + this.calculateShiftHours(s),
      shiftHours
    );

    let score = 100;
    let reasoning = '';

    if (totalDailyHours > this.config.maxDailyHours) {
      score = Math.max(0, 100 - ((totalDailyHours - this.config.maxDailyHours) / this.config.maxDailyHours) * 100);
      evidence.push(this.createEvidence(
        'calculation',
        'Daily hours calculation',
        `Total daily hours: ${totalDailyHours.toFixed(1)}h`,
        'negative',
        1.0,
        totalDailyHours
      ));
      reasoning = `WARNING: ${totalDailyHours.toFixed(1)}h total work on this day exceeds ${this.config.maxDailyHours}h limit`;
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Daily hours calculation',
        `Total daily hours: ${totalDailyHours.toFixed(1)}h (within limit)`,
        'positive',
        1.0,
        totalDailyHours
      ));
      reasoning = `Compliant: ${totalDailyHours.toFixed(1)}h total work (limit: ${this.config.maxDailyHours}h)`;
    }

    return this.createScoringComponent(
      'Daily Working Hours',
      score,
      100,
      this.persona.weights.dailyHours,
      evidence,
      reasoning,
      false
    );
  }

  private checkWeeklyWorkingHours(newShift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'rule',
      'Arbeidsmiljøloven § 10-4(4)',
      `Maximum 40 hours per week`,
      'neutral',
      1.0,
      `${this.config.maxWeeklyHours} hours limit`
    ));

    const weekStart = startOfWeek(newShift.startTime, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(newShift.startTime, { weekStartsOn: 1 });

    const weekShifts = existingShifts.filter(s =>
      isWithinInterval(s.startTime, { start: weekStart, end: weekEnd }) &&
      s.userId === newShift.userId
    );

    const existingHours = weekShifts.reduce((total, s) => total + this.calculateShiftHours(s), 0);
    const newShiftHours = this.calculateShiftHours(newShift);
    const totalWeeklyHours = existingHours + newShiftHours;

    let score = 100;
    let reasoning = '';

    if (totalWeeklyHours > this.config.maxWeeklyHours) {
      score = Math.max(0, 100 - ((totalWeeklyHours - this.config.maxWeeklyHours) / this.config.maxWeeklyHours) * 100);
      evidence.push(this.createEvidence(
        'calculation',
        'Weekly hours calculation',
        `Total weekly hours: ${totalWeeklyHours.toFixed(1)}h`,
        'negative',
        1.0,
        totalWeeklyHours
      ));
      reasoning = `WARNING: ${totalWeeklyHours.toFixed(1)}h this week exceeds ${this.config.maxWeeklyHours}h limit`;
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Weekly hours calculation',
        `Total weekly hours: ${totalWeeklyHours.toFixed(1)}h`,
        'positive',
        1.0,
        totalWeeklyHours
      ));
      reasoning = `Compliant: ${totalWeeklyHours.toFixed(1)}h this week (limit: ${this.config.maxWeeklyHours}h)`;
    }

    return this.createScoringComponent(
      'Weekly Working Hours',
      score,
      100,
      this.persona.weights.weeklyHours,
      evidence,
      reasoning,
      false
    );
  }

  private checkOvertimeLimits(newShift: ShiftData, existingShifts: ShiftData[]): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'rule',
      'Arbeidsmiljøloven § 10-6(4)',
      `Overtime limits: 10h/week, 25h/4weeks, 200h/year`,
      'neutral',
      1.0,
      'Multiple overtime limits apply'
    ));

    // Calculate if this shift would create overtime
    const weekStart = startOfWeek(newShift.startTime, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(newShift.startTime, { weekStartsOn: 1 });

    const weekShifts = existingShifts.filter(s =>
      isWithinInterval(s.startTime, { start: weekStart, end: weekEnd }) &&
      s.userId === newShift.userId
    );

    const totalWeeklyHours = weekShifts.reduce(
      (total, s) => total + this.calculateShiftHours(s),
      this.calculateShiftHours(newShift)
    );

    const potentialOvertime = Math.max(0, totalWeeklyHours - this.config.maxWeeklyHours);

    let score = 100;
    let reasoning = '';

    if (potentialOvertime > 0) {
      if (potentialOvertime > this.config.maxOvertimePerWeek) {
        score = 20;
        evidence.push(this.createEvidence(
          'calculation',
          'Overtime calculation',
          `${potentialOvertime.toFixed(1)}h overtime exceeds weekly limit`,
          'negative',
          1.0,
          potentialOvertime
        ));
        reasoning = `WARNING: ${potentialOvertime.toFixed(1)}h overtime exceeds ${this.config.maxOvertimePerWeek}h weekly limit`;
      } else {
        score = 70;
        evidence.push(this.createEvidence(
          'calculation',
          'Overtime calculation',
          `${potentialOvertime.toFixed(1)}h overtime within weekly limit`,
          'neutral',
          0.5,
          potentialOvertime
        ));
        reasoning = `Note: ${potentialOvertime.toFixed(1)}h overtime (within ${this.config.maxOvertimePerWeek}h weekly limit)`;
      }
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Overtime calculation',
        'No overtime hours',
        'positive',
        1.0,
        0
      ));
      reasoning = 'Compliant: No overtime hours';
    }

    return this.createScoringComponent(
      'Overtime Limits',
      score,
      100,
      this.persona.weights.overtimeLimits,
      evidence,
      reasoning,
      false
    );
  }

  // ===========================================================================
  // Schedule Creation Evaluation
  // ===========================================================================

  private async evaluateScheduleCreation(
    proposal: ScheduleProposal,
    context: DecisionContext
  ): Promise<ScoringComponent[]> {
    const allComponents: ScoringComponent[] = [];

    // Evaluate each assignment
    for (const assignment of proposal.assignments) {
      const shiftProposal: ShiftProposal = {
        type: 'shift_assignment',
        userId: assignment.userId,
        shift: assignment.shift,
        isNew: true,
      };

      // Get existing shifts plus previously evaluated assignments
      const previousAssignments = proposal.assignments
        .slice(0, proposal.assignments.indexOf(assignment))
        .filter(a => a.userId === assignment.userId)
        .map(a => a.shift);

      const modifiedContext: DecisionContext = {
        ...context,
        existingShifts: [...context.existingShifts, ...previousAssignments],
      };

      const shiftComponents = await this.evaluateShiftAssignment(shiftProposal, modifiedContext);
      allComponents.push(...shiftComponents);
    }

    return allComponents;
  }

  // ===========================================================================
  // Shift Swap Evaluation
  // ===========================================================================

  private async evaluateShiftSwap(
    proposal: SwapProposal,
    context: DecisionContext
  ): Promise<ScoringComponent[]> {
    const components: ScoringComponent[] = [];

    // Evaluate compliance for requester taking the new shift
    const requesterShifts = context.existingShifts.filter(s => s.userId === proposal.requestingUserId);
    const requesterWithSwap = requesterShifts
      .filter(s => s.id !== proposal.shiftToSwap.id)
      .concat([proposal.shiftToReceive]);

    // Evaluate compliance for target taking the swapped shift
    const targetShifts = context.existingShifts.filter(s => s.userId === proposal.targetUserId);
    const targetWithSwap = targetShifts
      .filter(s => s.id !== proposal.shiftToReceive.id)
      .concat([proposal.shiftToSwap]);

    // Check requester's new schedule
    components.push(...await this.evaluateShiftAssignment(
      {
        type: 'shift_assignment',
        userId: proposal.requestingUserId,
        shift: proposal.shiftToReceive,
        isNew: false,
      },
      { ...context, existingShifts: requesterWithSwap }
    ));

    // Check target's new schedule
    components.push(...await this.evaluateShiftAssignment(
      {
        type: 'shift_assignment',
        userId: proposal.targetUserId,
        shift: proposal.shiftToSwap,
        isNew: false,
      },
      { ...context, existingShifts: targetWithSwap }
    ));

    return components;
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
    // Compliance agent rarely changes position on legal matters
    const hasRejection = otherDecisions.some(d => d.recommendation === 'reject');

    if (debateTopic.toLowerCase().includes('exception') || debateTopic.toLowerCase().includes('override')) {
      return {
        response: `${this.persona.name}: Legal compliance requirements under Arbeidsmiljøloven cannot be overridden. Rest periods and working hour limits are non-negotiable for employee health and safety.`,
        changedPosition: false,
      };
    }

    if (hasRejection) {
      // Other agents agree there's a problem
      return {
        response: `${this.persona.name}: Other agents have identified concerns. I maintain my compliance assessment. Legal requirements must be met regardless of other factors.`,
        changedPosition: false,
      };
    }

    return {
      response: `${this.persona.name}: I acknowledge the other perspectives but maintain that compliance is the foundation of any scheduling decision.`,
      changedPosition: false,
    };
  }
}
