// Base Agent Class for Multi-Agent Consensus System
// Provides common functionality for all specialized agents

import {
  AgentRole,
  AgentPersona,
  AgentDecision,
  DecisionContext,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
  OptimizationProposal,
  DebateRound,
} from '../../types/consensus';
import { ShiftData, ComplianceConfig } from '../../types';
import { differenceInHours, differenceInMinutes, format, getDay, isWithinInterval } from 'date-fns';

// =============================================================================
// Evidence Reference - Transparent reasoning for users
// =============================================================================

export interface EvidenceReference {
  type: 'rule' | 'data' | 'calculation' | 'preference' | 'pattern' | 'risk';
  source: string;
  description: string;
  value?: string | number;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number; // How much this affects the score
}

export interface ScoringComponent {
  name: string;
  score: number; // 0-100
  maxScore: number;
  weight: number; // 0-1
  evidence: EvidenceReference[];
  reasoning: string;
  userEditable: boolean; // Can the user override this?
}

// =============================================================================
// Abstract Base Agent
// =============================================================================

export abstract class BaseAgent {
  protected persona: AgentPersona;
  protected config: ComplianceConfig;

  constructor(config: ComplianceConfig) {
    this.config = config;
    this.persona = this.definePersona();
  }

  // Each agent must define its persona
  protected abstract definePersona(): AgentPersona;

  // Each agent must implement its evaluation logic
  abstract evaluate(context: DecisionContext): Promise<AgentDecision>;

  // Each agent must provide transparent scoring components
  abstract getScoringComponents(context: DecisionContext): Promise<ScoringComponent[]>;

  // For the debate phase - agents respond to other agents' decisions
  async respondToDebate(
    context: DecisionContext,
    _otherDecisions: AgentDecision[],
    _debateTopic: string
  ): Promise<{
    response: string;
    changedPosition: boolean;
    newRecommendation?: RecommendationType;
    newConfidence?: number;
  }> {
    // Default implementation - can be overridden by specific agents
    return {
      response: `${this.persona.name} maintains original position`,
      changedPosition: false,
    };
  }

  // Get the agent's persona for display
  getPersona(): AgentPersona {
    return this.persona;
  }

  // ==========================================================================
  // Common Helper Methods for All Agents
  // ==========================================================================

  protected calculateShiftHours(shift: ShiftData): number {
    const totalMinutes = differenceInMinutes(shift.endTime, shift.startTime);
    const workingMinutes = totalMinutes - shift.breakMinutes;
    return workingMinutes / 60;
  }

  protected getRestHoursBetweenShifts(shift1: ShiftData, shift2: ShiftData): number {
    const earlier = shift1.endTime < shift2.startTime ? shift1 : shift2;
    const later = earlier === shift1 ? shift2 : shift1;
    return differenceInHours(later.startTime, earlier.endTime);
  }

  protected isWeekend(date: Date): boolean {
    const day = getDay(date);
    return day === 0 || day === 6;
  }

  protected formatShiftTime(shift: ShiftData): string {
    return `${format(shift.startTime, 'EEE MMM d, HH:mm')} - ${format(shift.endTime, 'HH:mm')}`;
  }

  protected getDayName(date: Date): string {
    return format(date, 'EEEE');
  }

  protected calculateTotalWeeklyHours(shifts: ShiftData[], userId: string): number {
    return shifts
      .filter(s => s.userId === userId)
      .reduce((total, shift) => total + this.calculateShiftHours(shift), 0);
  }

  protected findOverlappingShifts(newShift: ShiftData, existingShifts: ShiftData[]): ShiftData[] {
    return existingShifts.filter(existing => {
      if (existing.userId !== newShift.userId) return false;
      return (
        isWithinInterval(newShift.startTime, { start: existing.startTime, end: existing.endTime }) ||
        isWithinInterval(newShift.endTime, { start: existing.startTime, end: existing.endTime }) ||
        isWithinInterval(existing.startTime, { start: newShift.startTime, end: newShift.endTime })
      );
    });
  }

  // ==========================================================================
  // Decision Building Helpers
  // ==========================================================================

  protected buildDecision(params: {
    recommendation: RecommendationType;
    confidence: number;
    score: number;
    scoreBreakdown: Record<string, number>;
    reasoning: string[];
    concerns: string[];
    suggestions: string[];
  }): AgentDecision {
    return {
      agentRole: this.persona.role,
      agentName: this.persona.name,
      recommendation: params.recommendation,
      confidence: Math.min(100, Math.max(0, params.confidence)),
      score: Math.min(100, Math.max(0, params.score)),
      scoreBreakdown: params.scoreBreakdown,
      reasoning: params.reasoning,
      concerns: params.concerns,
      suggestions: params.suggestions,
      evaluatedAt: new Date(),
    };
  }

  protected createEvidence(
    type: EvidenceReference['type'],
    source: string,
    description: string,
    impact: EvidenceReference['impact'],
    weight: number,
    value?: string | number
  ): EvidenceReference {
    return { type, source, description, value, impact, weight };
  }

  protected createScoringComponent(
    name: string,
    score: number,
    maxScore: number,
    weight: number,
    evidence: EvidenceReference[],
    reasoning: string,
    userEditable: boolean = false
  ): ScoringComponent {
    return { name, score, maxScore, weight, evidence, reasoning, userEditable };
  }

  // ==========================================================================
  // Recommendation Determination
  // ==========================================================================

  protected determineRecommendation(
    score: number,
    hasCriticalConcerns: boolean,
    hasModerateWarnings: boolean
  ): { recommendation: RecommendationType; confidence: number } {
    if (hasCriticalConcerns) {
      return { recommendation: 'reject', confidence: 90 };
    }

    if (score >= 80) {
      return {
        recommendation: hasModerateWarnings ? 'approve_with_conditions' : 'approve',
        confidence: score,
      };
    }

    if (score >= 60) {
      return { recommendation: 'approve_with_conditions', confidence: score };
    }

    if (score >= 40) {
      return { recommendation: 'needs_modification', confidence: 70 };
    }

    return { recommendation: 'reject', confidence: 80 };
  }
}
