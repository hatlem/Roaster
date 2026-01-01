// Cost Optimization Agent - Budget Analyst
// This agent focuses on minimizing labor costs while maintaining service quality
// It evaluates overtime costs, hourly rates, and budget efficiency

import { BaseAgent, EvidenceReference, ScoringComponent } from './baseAgent';
import {
  AgentPersona,
  AgentDecision,
  DecisionContext,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
  OptimizationProposal,
} from '../../types/consensus';
import { ShiftData, ComplianceConfig } from '../../types';
import { startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

export class CostOptimizationAgent extends BaseAgent {
  private overtimePremium: number = 1.4; // Norwegian minimum: 40% extra
  private defaultHourlyRate: number = 200; // Default NOK/hour

  constructor(config: ComplianceConfig, overtimePremium?: number) {
    super(config);
    if (overtimePremium) {
      this.overtimePremium = overtimePremium;
    }
  }

  protected definePersona(): AgentPersona {
    return {
      role: 'cost_optimizer',
      name: 'Budget Analyst',
      description: 'Labor cost optimization specialist focused on efficient resource allocation',
      expertise: [
        'Labor cost calculation and forecasting',
        'Overtime cost analysis',
        'Budget variance tracking',
        'Cost-per-shift optimization',
        'Seasonal staffing efficiency',
        'Payroll integration',
      ],
      priorities: [
        'Minimize unnecessary overtime costs',
        'Optimal employee-shift matching for cost efficiency',
        'Stay within labor budget',
        'Balance cost with quality of service',
      ],
      weights: {
        overtimeCost: 0.35,
        regularCost: 0.25,
        budgetCompliance: 0.25,
        efficiency: 0.15,
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

    let hasHighCostConcerns = false;

    for (const component of scoringComponents) {
      if (component.score < component.maxScore * 0.5) {
        concerns.push(component.reasoning);
        if (component.name === 'Overtime Cost Impact') {
          hasHighCostConcerns = true;
        }
      } else {
        reasoning.push(component.reasoning);
      }

      // Generate cost-saving suggestions
      const negativeEvidence = component.evidence.filter(e => e.impact === 'negative');
      for (const evidence of negativeEvidence) {
        if (evidence.type === 'calculation' && evidence.value) {
          suggestions.push(`Consider: ${evidence.description}`);
        }
      }
    }

    const { recommendation, confidence } = this.determineRecommendation(
      finalScore,
      hasHighCostConcerns,
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
      components.push(...this.evaluateShiftCost(proposal, context));
    } else if (context.proposal.type === 'schedule_creation') {
      const proposal = context.proposal as ScheduleProposal;
      components.push(...this.evaluateScheduleCost(proposal, context));
    } else if (context.proposal.type === 'shift_swap') {
      const proposal = context.proposal as SwapProposal;
      components.push(...this.evaluateSwapCost(proposal, context));
    } else if (context.proposal.type === 'schedule_optimization') {
      const proposal = context.proposal as OptimizationProposal;
      components.push(...this.evaluateOptimizationSavings(proposal, context));
    }

    return components;
  }

  // ===========================================================================
  // Cost Calculation Helpers
  // ===========================================================================

  private calculateShiftCost(shift: ShiftData, weeklyHoursBeforeShift: number): {
    regularCost: number;
    overtimeCost: number;
    totalCost: number;
    regularHours: number;
    overtimeHours: number;
  } {
    const shiftHours = this.calculateShiftHours(shift);
    const hourlyRate = this.defaultHourlyRate;

    // Calculate how many hours of this shift are overtime
    const hoursUntilOvertime = Math.max(0, this.config.maxWeeklyHours - weeklyHoursBeforeShift);
    const regularHours = Math.min(shiftHours, hoursUntilOvertime);
    const overtimeHours = Math.max(0, shiftHours - hoursUntilOvertime);

    const regularCost = regularHours * hourlyRate;
    const overtimeCost = overtimeHours * hourlyRate * this.overtimePremium;

    return {
      regularCost,
      overtimeCost,
      totalCost: regularCost + overtimeCost,
      regularHours,
      overtimeHours,
    };
  }

  private getWeeklyHoursForUser(userId: string, beforeShift: ShiftData, existingShifts: ShiftData[]): number {
    const weekStart = startOfWeek(beforeShift.startTime, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(beforeShift.startTime, { weekStartsOn: 1 });

    return existingShifts
      .filter(s =>
        s.userId === userId &&
        isWithinInterval(s.startTime, { start: weekStart, end: weekEnd }) &&
        s.startTime < beforeShift.startTime
      )
      .reduce((total, s) => total + this.calculateShiftHours(s), 0);
  }

  // ===========================================================================
  // Shift Assignment Cost Evaluation
  // ===========================================================================

  private evaluateShiftCost(proposal: ShiftProposal, context: DecisionContext): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const { shift, userId } = proposal;

    const weeklyHoursBefore = this.getWeeklyHoursForUser(userId, shift, context.existingShifts);
    const costBreakdown = this.calculateShiftCost(shift, weeklyHoursBefore);

    // 1. Overtime Cost Impact
    components.push(this.evaluateOvertimeCost(costBreakdown, weeklyHoursBefore));

    // 2. Regular Cost Assessment
    components.push(this.evaluateRegularCost(costBreakdown));

    // 3. Budget Compliance (if budget provided)
    if (context.laborBudget) {
      components.push(this.evaluateBudgetCompliance(costBreakdown.totalCost, context));
    }

    // 4. Cost Efficiency Score
    components.push(this.evaluateCostEfficiency(costBreakdown));

    return components;
  }

  private evaluateOvertimeCost(
    costBreakdown: ReturnType<typeof this.calculateShiftCost>,
    weeklyHoursBefore: number
  ): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'rule',
      'Overtime Premium Rate',
      `Overtime costs ${((this.overtimePremium - 1) * 100).toFixed(0)}% more than regular hours`,
      'neutral',
      1.0,
      `${this.overtimePremium}x regular rate`
    ));

    let score = 100;
    let reasoning = '';

    if (costBreakdown.overtimeHours > 0) {
      // Penalize based on overtime proportion
      const overtimeRatio = costBreakdown.overtimeHours / (costBreakdown.regularHours + costBreakdown.overtimeHours);
      score = Math.max(0, 100 - (overtimeRatio * 100));

      evidence.push(this.createEvidence(
        'calculation',
        'Overtime Analysis',
        `${costBreakdown.overtimeHours.toFixed(1)}h overtime (${(overtimeRatio * 100).toFixed(0)}% of shift)`,
        'negative',
        0.8,
        costBreakdown.overtimeCost
      ));

      evidence.push(this.createEvidence(
        'data',
        'Weekly Hours Context',
        `Employee had ${weeklyHoursBefore.toFixed(1)}h before this shift`,
        'neutral',
        0.5,
        weeklyHoursBefore
      ));

      reasoning = `Cost concern: ${costBreakdown.overtimeHours.toFixed(1)}h overtime at NOK ${costBreakdown.overtimeCost.toFixed(2)} (${(overtimeRatio * 100).toFixed(0)}% of shift)`;
    } else {
      evidence.push(this.createEvidence(
        'calculation',
        'Overtime Analysis',
        'No overtime hours in this shift',
        'positive',
        1.0,
        0
      ));
      reasoning = 'Efficient: No overtime costs for this assignment';
    }

    return this.createScoringComponent(
      'Overtime Cost Impact',
      score,
      100,
      this.persona.weights.overtimeCost,
      evidence,
      reasoning,
      true // User can accept higher cost if needed
    );
  }

  private evaluateRegularCost(costBreakdown: ReturnType<typeof this.calculateShiftCost>): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'data',
      'Hourly Rate',
      `Base rate: NOK ${this.defaultHourlyRate}/hour`,
      'neutral',
      1.0,
      this.defaultHourlyRate
    ));

    evidence.push(this.createEvidence(
      'calculation',
      'Regular Hours Cost',
      `${costBreakdown.regularHours.toFixed(1)}h × NOK ${this.defaultHourlyRate} = NOK ${costBreakdown.regularCost.toFixed(2)}`,
      'neutral',
      1.0,
      costBreakdown.regularCost
    ));

    // Regular costs are generally acceptable, score based on efficiency
    const score = 85; // Base score for regular cost
    const reasoning = `Regular cost: NOK ${costBreakdown.regularCost.toFixed(2)} for ${costBreakdown.regularHours.toFixed(1)} hours`;

    return this.createScoringComponent(
      'Regular Cost',
      score,
      100,
      this.persona.weights.regularCost,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateBudgetCompliance(shiftCost: number, context: DecisionContext): ScoringComponent {
    const evidence: EvidenceReference[] = [];
    const budget = context.laborBudget || 0;

    evidence.push(this.createEvidence(
      'data',
      'Labor Budget',
      `Weekly budget: NOK ${budget.toFixed(2)}`,
      'neutral',
      1.0,
      budget
    ));

    // Calculate current spending from existing shifts
    const currentSpending = context.existingShifts.reduce((total, shift) => {
      const hours = this.calculateShiftHours(shift);
      return total + (hours * this.defaultHourlyRate);
    }, 0);

    const projectedTotal = currentSpending + shiftCost;
    const budgetUtilization = (projectedTotal / budget) * 100;

    let score: number;
    let reasoning: string;

    if (budgetUtilization <= 90) {
      score = 100;
      evidence.push(this.createEvidence(
        'calculation',
        'Budget Utilization',
        `${budgetUtilization.toFixed(1)}% of budget used`,
        'positive',
        1.0,
        budgetUtilization
      ));
      reasoning = `Within budget: ${budgetUtilization.toFixed(1)}% utilized (NOK ${projectedTotal.toFixed(2)} of NOK ${budget.toFixed(2)})`;
    } else if (budgetUtilization <= 100) {
      score = 70;
      evidence.push(this.createEvidence(
        'calculation',
        'Budget Utilization',
        `${budgetUtilization.toFixed(1)}% of budget used - approaching limit`,
        'neutral',
        0.7,
        budgetUtilization
      ));
      reasoning = `Near budget limit: ${budgetUtilization.toFixed(1)}% utilized`;
    } else {
      score = Math.max(0, 50 - (budgetUtilization - 100));
      evidence.push(this.createEvidence(
        'calculation',
        'Budget Utilization',
        `${budgetUtilization.toFixed(1)}% of budget - OVER BUDGET`,
        'negative',
        1.0,
        budgetUtilization
      ));
      reasoning = `Budget exceeded: ${budgetUtilization.toFixed(1)}% (NOK ${(projectedTotal - budget).toFixed(2)} over)`;
    }

    return this.createScoringComponent(
      'Budget Compliance',
      score,
      100,
      this.persona.weights.budgetCompliance,
      evidence,
      reasoning,
      true
    );
  }

  private evaluateCostEfficiency(costBreakdown: ReturnType<typeof this.calculateShiftCost>): ScoringComponent {
    const evidence: EvidenceReference[] = [];

    const effectiveHourlyRate = costBreakdown.totalCost / (costBreakdown.regularHours + costBreakdown.overtimeHours);
    const efficiencyRatio = this.defaultHourlyRate / effectiveHourlyRate;

    evidence.push(this.createEvidence(
      'calculation',
      'Effective Rate',
      `Effective hourly rate: NOK ${effectiveHourlyRate.toFixed(2)}`,
      efficiencyRatio >= 0.9 ? 'positive' : 'negative',
      1.0,
      effectiveHourlyRate
    ));

    const score = Math.round(efficiencyRatio * 100);
    const reasoning = `Cost efficiency: ${(efficiencyRatio * 100).toFixed(0)}% (effective rate NOK ${effectiveHourlyRate.toFixed(2)} vs base NOK ${this.defaultHourlyRate})`;

    return this.createScoringComponent(
      'Cost Efficiency',
      score,
      100,
      this.persona.weights.efficiency,
      evidence,
      reasoning,
      true
    );
  }

  // ===========================================================================
  // Schedule Cost Evaluation
  // ===========================================================================

  private evaluateScheduleCost(proposal: ScheduleProposal, context: DecisionContext): ScoringComponent[] {
    const components: ScoringComponent[] = [];
    const evidence: EvidenceReference[] = [];

    let totalCost = 0;
    let totalOvertimeCost = 0;
    let totalRegularCost = 0;

    // Calculate total cost for all assignments
    for (const assignment of proposal.assignments) {
      const weeklyHours = this.getWeeklyHoursForUser(
        assignment.userId,
        assignment.shift,
        [...context.existingShifts, ...proposal.assignments.map(a => a.shift)]
      );
      const costBreakdown = this.calculateShiftCost(assignment.shift, weeklyHours);
      totalCost += costBreakdown.totalCost;
      totalOvertimeCost += costBreakdown.overtimeCost;
      totalRegularCost += costBreakdown.regularCost;
    }

    evidence.push(this.createEvidence(
      'calculation',
      'Total Schedule Cost',
      `Total: NOK ${totalCost.toFixed(2)} (Regular: NOK ${totalRegularCost.toFixed(2)}, Overtime: NOK ${totalOvertimeCost.toFixed(2)})`,
      totalOvertimeCost > totalRegularCost * 0.2 ? 'negative' : 'positive',
      1.0,
      totalCost
    ));

    const overtimeRatio = totalOvertimeCost / totalCost;
    const score = Math.round((1 - overtimeRatio) * 100);

    components.push(this.createScoringComponent(
      'Schedule Total Cost',
      score,
      100,
      1.0,
      evidence,
      `Schedule cost: NOK ${totalCost.toFixed(2)} (${(overtimeRatio * 100).toFixed(1)}% overtime)`,
      true
    ));

    return components;
  }

  // ===========================================================================
  // Swap Cost Evaluation
  // ===========================================================================

  private evaluateSwapCost(proposal: SwapProposal, context: DecisionContext): ScoringComponent[] {
    const evidence: EvidenceReference[] = [];

    // Calculate cost difference between current and proposed swap
    const requesterWeeklyHours = this.getWeeklyHoursForUser(
      proposal.requestingUserId,
      proposal.shiftToReceive,
      context.existingShifts
    );
    const targetWeeklyHours = this.getWeeklyHoursForUser(
      proposal.targetUserId,
      proposal.shiftToSwap,
      context.existingShifts
    );

    const requesterNewCost = this.calculateShiftCost(proposal.shiftToReceive, requesterWeeklyHours);
    const targetNewCost = this.calculateShiftCost(proposal.shiftToSwap, targetWeeklyHours);

    const requesterOldCost = this.calculateShiftCost(proposal.shiftToSwap, requesterWeeklyHours);
    const targetOldCost = this.calculateShiftCost(proposal.shiftToReceive, targetWeeklyHours);

    const costBefore = requesterOldCost.totalCost + targetOldCost.totalCost;
    const costAfter = requesterNewCost.totalCost + targetNewCost.totalCost;
    const costDifference = costAfter - costBefore;

    let score: number;
    let reasoning: string;

    if (costDifference <= 0) {
      score = 100;
      evidence.push(this.createEvidence(
        'calculation',
        'Cost Impact',
        `Swap saves NOK ${Math.abs(costDifference).toFixed(2)}`,
        'positive',
        1.0,
        costDifference
      ));
      reasoning = `Cost-efficient: Swap saves NOK ${Math.abs(costDifference).toFixed(2)}`;
    } else {
      score = Math.max(0, 100 - (costDifference / costBefore) * 100);
      evidence.push(this.createEvidence(
        'calculation',
        'Cost Impact',
        `Swap increases cost by NOK ${costDifference.toFixed(2)}`,
        'negative',
        0.8,
        costDifference
      ));
      reasoning = `Cost increase: Swap adds NOK ${costDifference.toFixed(2)} to labor costs`;
    }

    return [this.createScoringComponent(
      'Swap Cost Impact',
      score,
      100,
      1.0,
      evidence,
      reasoning,
      true
    )];
  }

  // ===========================================================================
  // Optimization Savings Evaluation
  // ===========================================================================

  private evaluateOptimizationSavings(
    proposal: OptimizationProposal,
    _context: DecisionContext
  ): ScoringComponent[] {
    const evidence: EvidenceReference[] = [];

    evidence.push(this.createEvidence(
      'calculation',
      'Expected Savings',
      `Optimization would save NOK ${proposal.expectedSavings.toFixed(2)}`,
      proposal.expectedSavings > 0 ? 'positive' : 'negative',
      1.0,
      proposal.expectedSavings
    ));

    const score = proposal.expectedSavings > 0 ? Math.min(100, 50 + proposal.expectedSavings / 10) : 30;
    const reasoning = proposal.expectedSavings > 0
      ? `Recommended: Expected savings of NOK ${proposal.expectedSavings.toFixed(2)}`
      : `Not recommended: No cost savings identified`;

    return [this.createScoringComponent(
      'Optimization Savings',
      score,
      100,
      1.0,
      evidence,
      reasoning,
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
    // Check if compliance agent rejected
    const complianceDecision = otherDecisions.find(d => d.agentRole === 'compliance');
    const employeeDecision = otherDecisions.find(d => d.agentRole === 'employee_advocate');

    if (complianceDecision?.recommendation === 'reject') {
      return {
        response: `${this.persona.name}: I defer to Compliance Guardian on legal matters. Cost savings cannot justify labor law violations.`,
        changedPosition: true,
        newRecommendation: 'reject',
        newConfidence: 90,
      };
    }

    // Consider employee welfare in debate
    if (employeeDecision?.recommendation === 'reject' && employeeDecision.concerns.length > 0) {
      return {
        response: `${this.persona.name}: While cost is a factor, I acknowledge the employee welfare concerns raised. Perhaps a modified approach could balance both cost efficiency and employee needs.`,
        changedPosition: true,
        newRecommendation: 'approve_with_conditions',
        newConfidence: 70,
      };
    }

    return {
      response: `${this.persona.name}: My cost analysis stands. The financial impact should be considered alongside other factors.`,
      changedPosition: false,
    };
  }
}
