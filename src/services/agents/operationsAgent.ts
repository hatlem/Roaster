// Operations Agent - Coverage and Efficiency Expert
// This agent ensures scheduling decisions meet operational requirements
// It focuses on coverage goals, skill matching, and operational efficiency

import { BaseAgent, EvidenceReference, ScoringComponent } from './baseAgent';
import {
  AgentPersona,
  AgentDecision,
  DecisionContext,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
  CoverageGoal,
} from '../../types/consensus';
import { ShiftData, ComplianceConfig } from '../../types';
import { isWithinInterval, format, differenceInHours } from 'date-fns';

export class OperationsAgent extends BaseAgent {
  constructor(config: ComplianceConfig) {
    super(config);
  }

  protected definePersona(): AgentPersona {
    return {
      role: 'operations',
      name: 'Operations Expert',
      description: 'Operational efficiency specialist ensuring adequate coverage and service quality',
      expertise: [
        'Staff coverage analysis',
        'Skill-shift matching',
        'Peak hour management',
        'Department coordination',
        'Service level optimization',
        'Operational continuity',
      ],
      priorities: [
        'Ensure adequate staff coverage',
        'Match skills to shift requirements',
        'Maintain service quality',
        'Balance workload across departments',
        'Minimize coverage gaps',
      ],
      weights: {
        coverage: 0.35,
        skillMatch: 0.25,
        efficiency: 0.25,
        continuity: 0.15,
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

    let hasOperationalConcerns = false;

    for (const component of scoringComponents) {
      if (component.score < component.maxScore * 0.5) {
        concerns.push(component.reasoning);
        if (component.name === 'Coverage Analysis') {
          hasOperationalConcerns = true;
        }
      } else {
        reasoning.push(component.reasoning);
      }

      // Generate operational suggestions
      const negativeEvidence = component.evidence.filter(e => e.impact === 'negative');
      for (const evidence of negativeEvidence) {
        suggestions.push(`Operational consideration: ${evidence.description}`);
      }
    }

    const { recommendation, confidence } = this.determineRecommendation(
      finalScore,
      hasOperationalConcerns,
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
      components.push(...this.evaluateShiftOperations(proposal, context));
    } else if (context.proposal.type === 'schedule_creation') {
      const proposal = context.proposal as ScheduleProposal;
      components.push(...this.evaluateScheduleOperations(proposal, context));
    } else if (context.proposal.type === 'shift_swap') {
      const proposal = context.proposal as SwapProposal;
      components.push(...this.evaluateSwapOperations(proposal, context));
    }

    return components;
  }

  // ===========================================================================
  // Shift Assignment Operations Evaluation
  // ===========================================================================

  private evaluateShiftOperations(
    proposal: ShiftProposal,
    context: DecisionContext
  ): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const { shift } = proposal;

    // 1. Coverage Impact
    components.push(this.evaluateCoverageImpact(shift, context));

    // 2. Skill Matching (if skills data available)
    components.push(this.evaluateSkillMatch(proposal, context));

    // 3. Operational Efficiency
    components.push(this.evaluateOperationalEfficiency(shift, context));

    // 4. Coverage Continuity
    components.push(this.evaluateCoverageContinuity(shift, context));

    return components;
  }

  private evaluateCoverageImpact(shift: ShiftData, context: DecisionContext): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    // Count existing coverage during this shift's time slot
    const overlappingShifts = context.existingShifts.filter(existing =>
      this.shiftsOverlap(shift, existing)
    );

    const currentCoverage = overlappingShifts.length;
    const newCoverage = currentCoverage + 1;

    // Determine if this is peak time (simplified - can be enhanced with actual data)
    const shiftHour = shift.startTime.getHours();
    const isPeakHour = (shiftHour >= 11 && shiftHour <= 14) || (shiftHour >= 17 && shiftHour <= 20);
    const isWeekendDay = this.isWeekend(shift.startTime);

    // Recommended coverage levels (simplified)
    const recommendedCoverage = isPeakHour ? 3 : 2;
    const coverageRatio = newCoverage / recommendedCoverage;

    let score: number;
    let reasoning: string;

    if (currentCoverage === 0) {
      // This shift fills a gap
      score = 100;
      evidence.push(this.createEvidence(
        'calculation',
        'Coverage Gap',
        'This assignment fills an uncovered time slot',
        'positive',
        1.0,
        'Gap filled'
      ));
      reasoning = 'Critical: This shift fills a coverage gap';
    } else if (coverageRatio >= 1.5) {
      // Potential overstaffing
      score = 60;
      evidence.push(this.createEvidence(
        'calculation',
        'Coverage Level',
        `${newCoverage} staff when ${recommendedCoverage} recommended - potential overstaffing`,
        'neutral',
        0.6,
        newCoverage
      ));
      reasoning = `Note: ${newCoverage} staff during this slot may be more than needed`;
    } else if (coverageRatio >= 1) {
      // Good coverage
      score = 90;
      evidence.push(this.createEvidence(
        'calculation',
        'Coverage Level',
        `${newCoverage} staff meets recommended coverage of ${recommendedCoverage}`,
        'positive',
        0.9,
        newCoverage
      ));
      reasoning = `Good coverage: ${newCoverage} staff meets operational needs`;
    } else {
      // Still understaffed
      score = 80;
      evidence.push(this.createEvidence(
        'calculation',
        'Coverage Level',
        `${newCoverage} staff - still below recommended ${recommendedCoverage}`,
        'positive',
        0.7,
        newCoverage
      ));
      reasoning = `Helps: Improves coverage to ${newCoverage} (${recommendedCoverage} recommended)`;
    }

    // Add context about peak/weekend
    if (isPeakHour) {
      evidence.push(this.createEvidence(
        'pattern',
        'Peak Hours',
        'Shift is during peak business hours',
        currentCoverage < recommendedCoverage ? 'positive' : 'neutral',
        0.5,
        `${format(shift.startTime, 'HH:mm')} - ${format(shift.endTime, 'HH:mm')}`
      ));
    }

    if (isWeekendDay) {
      evidence.push(this.createEvidence(
        'pattern',
        'Weekend Coverage',
        'Weekend shift - may have different coverage needs',
        'neutral',
        0.4,
        this.getDayName(shift.startTime)
      ));
    }

    return this.createScoringComponent(
      'Coverage Analysis',
      score,
      100,
      this.persona.weights.coverage,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateSkillMatch(proposal: ShiftProposal, context: DecisionContext): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    // In a real implementation, you would check employee skills against shift requirements
    // For now, we'll use a simplified evaluation based on department/role matching

    const shift = proposal.shift;
    const userId = proposal.userId;

    // Check if employee has worked similar shifts before (pattern-based skill inference)
    const similarPastShifts = context.existingShifts.filter(s =>
      s.userId === userId &&
      Math.abs(s.startTime.getHours() - shift.startTime.getHours()) <= 2
    );

    let score: number;
    let reasoning: string;

    if (similarPastShifts.length >= 3) {
      score = 90;
      evidence.push(this.createEvidence(
        'pattern',
        'Experience',
        `Employee has ${similarPastShifts.length} similar shifts in history`,
        'positive',
        0.9,
        similarPastShifts.length
      ));
      reasoning = `Experienced: ${similarPastShifts.length} similar shifts worked previously`;
    } else if (similarPastShifts.length > 0) {
      score = 75;
      evidence.push(this.createEvidence(
        'pattern',
        'Experience',
        `Employee has ${similarPastShifts.length} similar shifts - some experience`,
        'neutral',
        0.6,
        similarPastShifts.length
      ));
      reasoning = `Some experience: ${similarPastShifts.length} similar shifts worked`;
    } else {
      score = 60;
      evidence.push(this.createEvidence(
        'pattern',
        'Experience',
        'No record of similar shifts - may need support',
        'neutral',
        0.5,
        0
      ));
      reasoning = 'New assignment type for this employee - consider training/support';
    }

    return this.createScoringComponent(
      'Skill Match',
      score,
      100,
      this.persona.weights.skillMatch,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateOperationalEfficiency(shift: ShiftData, context: DecisionContext): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 85; // Base efficiency score

    const shiftHours = this.calculateShiftHours(shift);

    // Evaluate shift length efficiency
    if (shiftHours < 4) {
      score -= 20;
      evidence.push(this.createEvidence(
        'calculation',
        'Shift Length',
        `Short shift (${shiftHours.toFixed(1)}h) - less efficient`,
        'negative',
        0.6,
        shiftHours
      ));
    } else if (shiftHours > 8) {
      score -= 10;
      evidence.push(this.createEvidence(
        'calculation',
        'Shift Length',
        `Long shift (${shiftHours.toFixed(1)}h) - may impact productivity`,
        'neutral',
        0.4,
        shiftHours
      ));
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Shift Length',
        `Optimal shift length: ${shiftHours.toFixed(1)}h`,
        'positive',
        0.7,
        shiftHours
      ));
    }

    // Check for handoff efficiency (gap between shifts)
    const shiftsEndingNearStart = context.existingShifts.filter(existing => {
      const gap = differenceInHours(shift.startTime, existing.endTime);
      return gap >= 0 && gap < 1;
    });

    if (shiftsEndingNearStart.length > 0) {
      score += 10;
      evidence.push(this.createEvidence(
        'pattern',
        'Handoff',
        'Good overlap/handoff with previous shift',
        'positive',
        0.5,
        shiftsEndingNearStart.length
      ));
    }

    const reasoning = score >= 80
      ? 'Operationally efficient shift structure'
      : 'Some efficiency concerns with shift structure';

    return this.createScoringComponent(
      'Operational Efficiency',
      score,
      100,
      this.persona.weights.efficiency,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateCoverageContinuity(shift: ShiftData, context: DecisionContext): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    let score = 85;

    // Check if this creates any coverage gaps before or after
    const shiftsBeforeEnd = context.existingShifts.filter(s =>
      differenceInHours(shift.startTime, s.endTime) <= 2 &&
      differenceInHours(shift.startTime, s.endTime) > 0
    );

    const shiftsAfterStart = context.existingShifts.filter(s =>
      differenceInHours(s.startTime, shift.endTime) <= 2 &&
      differenceInHours(s.startTime, shift.endTime) > 0
    );

    if (shiftsBeforeEnd.length === 0) {
      // Check if this is business start or creates a gap
      const shiftHour = shift.startTime.getHours();
      if (shiftHour > 8 && shiftHour < 20) {
        score -= 15;
        evidence.push(this.createEvidence(
          'risk',
          'Coverage Gap Before',
          'No coverage immediately before this shift',
          'negative',
          0.6,
          'Gap before'
        ));
      }
    } else {
      evidence.push(this.createEvidence(
        'pattern',
        'Coverage Continuity',
        'Good coverage continuity with previous shifts',
        'positive',
        0.7,
        shiftsBeforeEnd.length
      ));
    }

    if (shiftsAfterStart.length === 0) {
      const endHour = shift.endTime.getHours();
      if (endHour > 8 && endHour < 20) {
        score -= 15;
        evidence.push(this.createEvidence(
          'risk',
          'Coverage Gap After',
          'No coverage immediately after this shift',
          'negative',
          0.6,
          'Gap after'
        ));
      }
    }

    const reasoning = score >= 80
      ? 'Good coverage continuity maintained'
      : 'Potential coverage gaps around this shift';

    return this.createScoringComponent(
      'Coverage Continuity',
      score,
      100,
      this.persona.weights.continuity,
      evidence,
      reasoning,
      true
    );
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private shiftsOverlap(shift1: ShiftData, shift2: ShiftData): boolean {
    return (
      isWithinInterval(shift1.startTime, { start: shift2.startTime, end: shift2.endTime }) ||
      isWithinInterval(shift1.endTime, { start: shift2.startTime, end: shift2.endTime }) ||
      isWithinInterval(shift2.startTime, { start: shift1.startTime, end: shift1.endTime })
    );
  }

  // ===========================================================================
  // Schedule Operations Evaluation
  // ===========================================================================

  private evaluateScheduleOperations(
    proposal: ScheduleProposal,
    context: DecisionContext
  ): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const evidence: EvidenceReference[] = [];

    // Evaluate overall coverage across all goals
    let totalGoalsMet = 0;
    let totalGoals = proposal.coverageGoals.length;

    for (const goal of proposal.coverageGoals) {
      const coverage = this.calculateCoverageForGoal(goal, proposal.assignments);
      if (coverage >= goal.minimumEmployees) {
        totalGoalsMet++;
        evidence.push(this.createEvidence(
          'calculation',
          'Coverage Goal',
          `${format(goal.timeSlot.start, 'EEE HH:mm')}: ${coverage}/${goal.minimumEmployees} required met`,
          'positive',
          0.8,
          coverage
        ));
      } else {
        evidence.push(this.createEvidence(
          'calculation',
          'Coverage Goal',
          `${format(goal.timeSlot.start, 'EEE HH:mm')}: ${coverage}/${goal.minimumEmployees} required - UNDERSTAFFED`,
          'negative',
          1.0,
          coverage
        ));
      }
    }

    const goalScore = totalGoals > 0 ? (totalGoalsMet / totalGoals) * 100 : 80;

    components.push(this.createScoringComponent(
      'Coverage Goals',
      Math.round(goalScore),
      100,
      1.0,
      evidence,
      `${totalGoalsMet}/${totalGoals} coverage goals met`,
      true
    ));

    return components;
  }

  private calculateCoverageForGoal(
    goal: CoverageGoal,
    assignments: Array<{ userId: string; shift: ShiftData }>
  ): number {
    return assignments.filter(a =>
      isWithinInterval(goal.timeSlot.start, { start: a.shift.startTime, end: a.shift.endTime }) ||
      isWithinInterval(goal.timeSlot.end, { start: a.shift.startTime, end: a.shift.endTime })
    ).length;
  }

  // ===========================================================================
  // Swap Operations Evaluation
  // ===========================================================================

  private evaluateSwapOperations(proposal: SwapProposal, context: DecisionContext): ScoringComponent[] {
    const evidence: EvidenceReference[] = [];

    // Check if swap maintains coverage
    const affectedTimeSlot = {
      start: proposal.shiftToSwap.startTime < proposal.shiftToReceive.startTime
        ? proposal.shiftToSwap.startTime
        : proposal.shiftToReceive.startTime,
      end: proposal.shiftToSwap.endTime > proposal.shiftToReceive.endTime
        ? proposal.shiftToSwap.endTime
        : proposal.shiftToReceive.endTime,
    };

    const currentCoverage = context.existingShifts.filter(s =>
      isWithinInterval(s.startTime, affectedTimeSlot) ||
      isWithinInterval(s.endTime, affectedTimeSlot)
    ).length;

    // Swap maintains same coverage level
    let score = 85;
    evidence.push(this.createEvidence(
      'calculation',
      'Coverage Maintained',
      'Swap maintains current coverage levels',
      'positive',
      0.9,
      currentCoverage
    ));

    // Check skill continuity
    evidence.push(this.createEvidence(
      'pattern',
      'Skill Continuity',
      'Both employees should have equivalent capabilities',
      'neutral',
      0.6
    ));

    return [this.createScoringComponent(
      'Swap Operations Impact',
      score,
      100,
      1.0,
      evidence,
      'Swap maintains operational coverage',
      true
    )];
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
    const employeeDecision = otherDecisions.find(d => d.agentRole === 'employee_advocate');
    const costDecision = otherDecisions.find(d => d.agentRole === 'cost_optimizer');

    // Always respect compliance
    if (complianceDecision?.recommendation === 'reject') {
      return {
        response: `${this.persona.name}: Operations must work within legal constraints. I support the compliance decision.`,
        changedPosition: true,
        newRecommendation: 'reject',
        newConfidence: 90,
      };
    }

    // If there's a coverage gap, push for approval despite other concerns
    const myConcerns = await this.evaluate(context);
    const hasCoverageGap = myConcerns.reasoning.some(r => r.toLowerCase().includes('gap'));

    if (hasCoverageGap) {
      if (employeeDecision?.recommendation === 'reject') {
        return {
          response: `${this.persona.name}: I understand the employee welfare concerns, but we have a coverage gap. Can we find a compromise that fills the gap while addressing those concerns?`,
          changedPosition: false,
        };
      }

      if (costDecision?.recommendation === 'reject') {
        return {
          response: `${this.persona.name}: The cost concerns are noted, but leaving gaps in coverage could cost more in the long run through lost business or service quality issues.`,
          changedPosition: false,
        };
      }
    }

    // Be flexible when no critical operational needs
    if (!hasCoverageGap && (employeeDecision?.score || 0) < 50) {
      return {
        response: `${this.persona.name}: Since coverage is adequate, I can support prioritizing employee welfare in this case.`,
        changedPosition: true,
        newRecommendation: employeeDecision?.recommendation || 'approve_with_conditions',
        newConfidence: 75,
      };
    }

    return {
      response: `${this.persona.name}: My operational assessment stands - we need to ensure adequate coverage and service quality.`,
      changedPosition: false,
    };
  }
}
