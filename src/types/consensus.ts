// Multi-Agent Consensus System Types
// Implements orchestrated decision-making with multiple AI agents

import { ShiftData, ComplianceConfig } from './index';

// =============================================================================
// Agent Role Definitions
// =============================================================================

export type AgentRole =
  | 'compliance'        // Enforces Norwegian labor law (Arbeidsmiljøloven)
  | 'cost_optimizer'    // Minimizes labor costs and overtime
  | 'employee_advocate' // Considers employee wellbeing and preferences
  | 'operations';       // Ensures operational coverage and efficiency

export interface AgentPersona {
  role: AgentRole;
  name: string;
  description: string;
  expertise: string[];
  priorities: string[];
  weights: Record<string, number>;
}

// =============================================================================
// Decision Context - What agents evaluate
// =============================================================================

export interface DecisionContext {
  type: DecisionType;
  rosterId?: string;
  shiftId?: string;
  userId?: string;

  // The proposal being evaluated
  proposal: ShiftProposal | ScheduleProposal | SwapProposal | OptimizationProposal;

  // Background data for evaluation
  existingShifts: ShiftData[];
  employeePreferences: EmployeePreferenceData[];
  complianceConfig: ComplianceConfig;
  laborBudget?: number;

  // Additional context
  metadata?: Record<string, unknown>;
}

export type DecisionType =
  | 'shift_assignment'
  | 'schedule_creation'
  | 'shift_swap'
  | 'schedule_optimization'
  | 'conflict_resolution'
  | 'compliance_override';

// =============================================================================
// Proposal Types - What can be evaluated
// =============================================================================

export interface ShiftProposal {
  type: 'shift_assignment';
  userId: string;
  shift: ShiftData;
  isNew: boolean;
  replacesPreviousAssignment?: string;
}

export interface ScheduleProposal {
  type: 'schedule_creation';
  assignments: Array<{
    userId: string;
    shift: ShiftData;
  }>;
  coverageGoals: CoverageGoal[];
}

export interface SwapProposal {
  type: 'shift_swap';
  requestingUserId: string;
  targetUserId: string;
  shiftToSwap: ShiftData;
  shiftToReceive: ShiftData;
  reason: string;
}

export interface OptimizationProposal {
  type: 'schedule_optimization';
  changes: Array<{
    shiftId: string;
    currentUserId: string;
    proposedUserId: string;
    reason: string;
  }>;
  expectedSavings: number;
  affectsCompliance: boolean;
}

export interface CoverageGoal {
  timeSlot: { start: Date; end: Date };
  minimumEmployees: number;
  preferredEmployees: number;
  requiredSkills?: string[];
  department?: string;
}

export interface EmployeePreferenceData {
  userId: string;
  preferredDays: string[];
  avoidDays: string[];
  preferMorning: boolean;
  preferEvening: boolean;
  preferNight: boolean;
  maxHoursPerWeek?: number;
  minHoursPerWeek?: number;
  unavailableFrom?: Date;
  unavailableTo?: Date;
  unavailableReason?: string;
}

// =============================================================================
// Agent Decision Output
// =============================================================================

export type RecommendationType = 'approve' | 'approve_with_conditions' | 'reject' | 'needs_modification';

export interface AgentDecision {
  agentRole: AgentRole;
  agentName: string;

  // The verdict
  recommendation: RecommendationType;
  confidence: number; // 0-100

  // Detailed analysis
  score: number; // 0-100 overall score
  scoreBreakdown: Record<string, number>;

  // Reasoning
  reasoning: string[];
  concerns: string[];
  suggestions: string[];

  // For cross-evaluation in debate phase
  agreesWithPreviousDecisions?: boolean;
  disagreementPoints?: string[];
  revisedRecommendation?: RecommendationType;

  // Timestamp
  evaluatedAt: Date;
}

// =============================================================================
// Consensus Result
// =============================================================================

export type ConsensusStatus =
  | 'unanimous_approve'
  | 'majority_approve'
  | 'unanimous_reject'
  | 'majority_reject'
  | 'deadlock'
  | 'escalate';

export interface ConsensusResult {
  // Final outcome
  status: ConsensusStatus;
  finalDecision: 'approve' | 'reject' | 'escalate';

  // Voting summary
  votesFor: number;
  votesAgainst: number;
  abstentions: number;

  // Agent decisions
  agentDecisions: AgentDecision[];

  // Debate rounds (if any)
  debateRounds: DebateRound[];
  totalRounds: number;

  // Consensus quality
  consensusScore: number; // 0-100, how aligned agents are
  confidenceLevel: number; // 0-100, average confidence

  // Final summary
  summary: string;
  keyReasons: string[];
  remainingConcerns: string[];
  conditions?: string[];

  // Metadata
  decisionType: DecisionType;
  evaluatedAt: Date;
  evaluationDurationMs: number;
}

export interface DebateRound {
  roundNumber: number;
  topic: string;
  agentResponses: Array<{
    agentRole: AgentRole;
    response: string;
    changedPosition: boolean;
    newRecommendation?: RecommendationType;
  }>;
  consensusReached: boolean;
  resolutionSummary?: string;
}

// =============================================================================
// Orchestrator Configuration
// =============================================================================

export interface ConsensusConfig {
  // Voting rules
  requireUnanimous: boolean;
  majorityThreshold: number; // e.g., 0.66 for 2/3 majority

  // Debate settings
  maxDebateRounds: number;
  enableCrossEvaluation: boolean;

  // Agent weights (role importance multipliers)
  agentWeights: Record<AgentRole, number>;

  // Escalation rules
  escalateOnDeadlock: boolean;
  escalateOnLowConfidence: boolean;
  minimumConfidenceThreshold: number;

  // Decision type specific overrides
  decisionTypeOverrides?: Partial<Record<DecisionType, Partial<ConsensusConfig>>>;
}

export const DEFAULT_CONSENSUS_CONFIG: ConsensusConfig = {
  requireUnanimous: false,
  majorityThreshold: 0.66, // 2/3 majority (3 out of 4 agents)
  maxDebateRounds: 3,
  enableCrossEvaluation: true,
  agentWeights: {
    compliance: 1.5,      // Compliance has highest weight (legal requirements)
    cost_optimizer: 1.0,
    employee_advocate: 1.2, // Employee wellbeing is important
    operations: 1.0,
  },
  escalateOnDeadlock: true,
  escalateOnLowConfidence: true,
  minimumConfidenceThreshold: 60,
};

// =============================================================================
// Audit Trail
// =============================================================================

export interface ConsensusAuditEntry {
  id: string;

  // What was decided
  decisionType: DecisionType;
  proposalSummary: string;

  // The result
  result: ConsensusResult;

  // Context
  rosterId?: string;
  shiftId?: string;
  userId?: string;
  requestedBy?: string;

  // Timing
  createdAt: Date;

  // For compliance retention
  retainUntil: Date;
}

// =============================================================================
// Request/Response Types for API
// =============================================================================

export interface ConsensusRequest {
  decisionType: DecisionType;
  proposal: ShiftProposal | ScheduleProposal | SwapProposal | OptimizationProposal;
  rosterId?: string;
  config?: Partial<ConsensusConfig>;
  requestedBy: string;
}

export interface ConsensusResponse {
  success: boolean;
  result?: ConsensusResult;
  error?: string;
  auditId?: string;
}
