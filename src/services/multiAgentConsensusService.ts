// Multi-Agent Consensus Service - The Orchestrator
// Coordinates multiple AI agents to reach consensus on scheduling decisions
// Provides transparent, editable decision breakdown for users

import { PrismaClient, User, Shift, EmployeePreference } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import {
  ConsensusConfig,
  ConsensusResult,
  ConsensusRequest,
  ConsensusResponse,
  ConsensusStatus,
  DecisionContext,
  DecisionType,
  AgentDecision,
  DebateRound,
  RecommendationType,
  ShiftProposal,
  ScheduleProposal,
  SwapProposal,
  OptimizationProposal,
  EmployeePreferenceData,
  DEFAULT_CONSENSUS_CONFIG,
} from '../types/consensus';
import { ShiftData, ComplianceConfig } from '../types';
import { getComplianceConfig } from '../config/compliance';
import {
  BaseAgent,
  ScoringComponent,
  ComplianceAgent,
  CostOptimizationAgent,
  EmployeeAdvocateAgent,
  OperationsAgent,
} from './agents';

const prisma = new PrismaClient();

// =============================================================================
// Transparent Decision Breakdown for User Review
// =============================================================================

export interface TransparentDecision {
  id: string;
  decisionType: DecisionType;
  proposal: ShiftProposal | ScheduleProposal | SwapProposal | OptimizationProposal;

  // Agent-by-agent breakdown (user can review each)
  agentEvaluations: AgentEvaluation[];

  // Consensus result
  consensusResult: ConsensusResult;

  // User-editable components
  editableComponents: EditableComponent[];

  // Summary for quick review
  summary: DecisionSummary;

  // Metadata
  createdAt: Date;
  status: 'pending_review' | 'approved' | 'modified' | 'rejected';
}

export interface AgentEvaluation {
  agentRole: string;
  agentName: string;
  recommendation: RecommendationType;
  confidence: number;
  score: number;

  // Detailed scoring breakdown
  scoringComponents: ScoringComponent[];

  // Natural language explanations
  reasoning: string[];
  concerns: string[];
  suggestions: string[];

  // User can approve or override each agent's assessment
  userOverride?: {
    approved: boolean;
    overrideRecommendation?: RecommendationType;
    overrideReason?: string;
  };
}

export interface EditableComponent {
  id: string;
  agentRole: string;
  componentName: string;
  originalScore: number;
  currentScore: number;
  maxScore: number;
  reasoning: string;
  evidenceReferences: string[];
  isEditable: boolean;
  userModified: boolean;
  userReason?: string;
}

export interface DecisionSummary {
  headline: string;
  recommendation: 'approve' | 'reject' | 'needs_review';
  confidenceLevel: 'high' | 'medium' | 'low';
  keyPoints: string[];
  mainConcerns: string[];
  quickActions: QuickAction[];
}

export interface QuickAction {
  label: string;
  action: 'approve' | 'reject' | 'modify' | 'request_alternative';
  description: string;
}

// =============================================================================
// Multi-Agent Consensus Service
// =============================================================================

export class MultiAgentConsensusService {
  private config: ConsensusConfig;
  private complianceConfig: ComplianceConfig;
  private agents: BaseAgent[];

  constructor(config?: Partial<ConsensusConfig>) {
    this.config = { ...DEFAULT_CONSENSUS_CONFIG, ...config };
    this.complianceConfig = getComplianceConfig();

    // Initialize all agents
    this.agents = [
      new ComplianceAgent(this.complianceConfig),
      new CostOptimizationAgent(this.complianceConfig),
      new EmployeeAdvocateAgent(this.complianceConfig),
      new OperationsAgent(this.complianceConfig),
    ];
  }

  // ===========================================================================
  // Main Entry Point - Get Consensus Decision
  // ===========================================================================

  async getConsensus(request: ConsensusRequest): Promise<ConsensusResponse> {
    const startTime = Date.now();

    try {
      // Build decision context
      const context = await this.buildDecisionContext(request);

      // Phase 1: Independent Evaluation
      const agentDecisions = await this.runIndependentEvaluations(context);

      // Phase 2: Cross-Evaluation (Debate)
      const debateRounds = this.config.enableCrossEvaluation
        ? await this.runDebatePhase(context, agentDecisions)
        : [];

      // Phase 3: Voting and Consensus
      const consensusResult = this.calculateConsensus(
        agentDecisions,
        debateRounds,
        Date.now() - startTime
      );

      // Generate audit entry
      const auditId = await this.logConsensusDecision(request, consensusResult);

      return {
        success: true,
        result: consensusResult,
        auditId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during consensus',
      };
    }
  }

  // ===========================================================================
  // Get Transparent Decision for User Review
  // ===========================================================================

  async getTransparentDecision(request: ConsensusRequest): Promise<TransparentDecision> {
    const context = await this.buildDecisionContext(request);

    // Run evaluations and collect detailed scoring
    const agentEvaluations: AgentEvaluation[] = [];
    const editableComponents: EditableComponent[] = [];

    for (const agent of this.agents) {
      const decision = await agent.evaluate(context);
      const scoringComponents = await agent.getScoringComponents(context);

      agentEvaluations.push({
        agentRole: decision.agentRole,
        agentName: decision.agentName,
        recommendation: decision.recommendation,
        confidence: decision.confidence,
        score: decision.score,
        scoringComponents,
        reasoning: decision.reasoning,
        concerns: decision.concerns,
        suggestions: decision.suggestions,
      });

      // Create editable components from scoring breakdown
      for (const component of scoringComponents) {
        editableComponents.push({
          id: uuidv4(),
          agentRole: decision.agentRole,
          componentName: component.name,
          originalScore: component.score,
          currentScore: component.score,
          maxScore: component.maxScore,
          reasoning: component.reasoning,
          evidenceReferences: component.evidence.map(e => `${e.source}: ${e.description}`),
          isEditable: component.userEditable,
          userModified: false,
        });
      }
    }

    // Get consensus result
    const debateRounds = this.config.enableCrossEvaluation
      ? await this.runDebatePhase(context, agentEvaluations.map(ae => ({
          agentRole: ae.agentRole as any,
          agentName: ae.agentName,
          recommendation: ae.recommendation,
          confidence: ae.confidence,
          score: ae.score,
          scoreBreakdown: ae.scoringComponents.reduce((acc, sc) => {
            acc[sc.name] = sc.score;
            return acc;
          }, {} as Record<string, number>),
          reasoning: ae.reasoning,
          concerns: ae.concerns,
          suggestions: ae.suggestions,
          evaluatedAt: new Date(),
        })))
      : [];

    const consensusResult = this.calculateConsensus(
      agentEvaluations.map(ae => ({
        agentRole: ae.agentRole as any,
        agentName: ae.agentName,
        recommendation: ae.recommendation,
        confidence: ae.confidence,
        score: ae.score,
        scoreBreakdown: {},
        reasoning: ae.reasoning,
        concerns: ae.concerns,
        suggestions: ae.suggestions,
        evaluatedAt: new Date(),
      })),
      debateRounds,
      0
    );

    // Generate summary
    const summary = this.generateDecisionSummary(agentEvaluations, consensusResult);

    return {
      id: uuidv4(),
      decisionType: request.decisionType,
      proposal: request.proposal,
      agentEvaluations,
      consensusResult,
      editableComponents,
      summary,
      createdAt: new Date(),
      status: 'pending_review',
    };
  }

  // ===========================================================================
  // Apply User Edits and Recalculate
  // ===========================================================================

  async applyUserEdits(
    decision: TransparentDecision,
    edits: Array<{
      componentId: string;
      newScore: number;
      reason: string;
    }>
  ): Promise<TransparentDecision> {
    // Apply edits to components
    for (const edit of edits) {
      const component = decision.editableComponents.find(c => c.id === edit.componentId);
      if (component && component.isEditable) {
        component.currentScore = Math.min(component.maxScore, Math.max(0, edit.newScore));
        component.userModified = true;
        component.userReason = edit.reason;
      }
    }

    // Recalculate agent scores based on edits
    for (const evaluation of decision.agentEvaluations) {
      const agentComponents = decision.editableComponents.filter(
        c => c.agentRole === evaluation.agentRole
      );

      // Recalculate weighted score
      let totalWeight = 0;
      let weightedSum = 0;

      for (const sc of evaluation.scoringComponents) {
        const edited = agentComponents.find(c => c.componentName === sc.name);
        const score = edited ? edited.currentScore : sc.score;
        weightedSum += (score / sc.maxScore) * sc.weight * 100;
        totalWeight += sc.weight;
      }

      evaluation.score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : evaluation.score;
    }

    // Recalculate consensus
    const updatedConsensus = this.calculateConsensus(
      decision.agentEvaluations.map(ae => ({
        agentRole: ae.agentRole as any,
        agentName: ae.agentName,
        recommendation: ae.recommendation,
        confidence: ae.confidence,
        score: ae.score,
        scoreBreakdown: {},
        reasoning: ae.reasoning,
        concerns: ae.concerns,
        suggestions: ae.suggestions,
        evaluatedAt: new Date(),
      })),
      decision.consensusResult.debateRounds,
      0
    );

    decision.consensusResult = updatedConsensus;
    decision.summary = this.generateDecisionSummary(decision.agentEvaluations, updatedConsensus);
    decision.status = 'modified';

    return decision;
  }

  // ===========================================================================
  // Private Methods - Context Building
  // ===========================================================================

  private async buildDecisionContext(request: ConsensusRequest): Promise<DecisionContext> {
    const existingShifts = await this.getExistingShifts(request.rosterId);
    const preferences = await this.getEmployeePreferences(request.rosterId);

    return {
      type: request.decisionType,
      rosterId: request.rosterId,
      proposal: request.proposal,
      existingShifts,
      employeePreferences: preferences,
      complianceConfig: this.complianceConfig,
      laborBudget: await this.getLaborBudget(request.rosterId),
    };
  }

  private async getExistingShifts(rosterId?: string): Promise<ShiftData[]> {
    if (!rosterId) return [];

    const shifts = await prisma.shift.findMany({
      where: { rosterId },
    });

    return shifts.map(s => ({
      id: s.id,
      startTime: s.startTime,
      endTime: s.endTime,
      breakMinutes: s.breakMinutes,
      userId: s.userId,
    }));
  }

  private async getEmployeePreferences(rosterId?: string): Promise<EmployeePreferenceData[]> {
    if (!rosterId) return [];

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        shifts: {
          include: {
            user: {
              include: {
                preferences: true,
              },
            },
          },
        },
      },
    });

    if (!roster) return [];

    const userIds = new Set(roster.shifts.map(s => s.userId));
    const preferences: EmployeePreferenceData[] = [];

    for (const shift of roster.shifts) {
      if (shift.user.preferences[0]) {
        const pref = shift.user.preferences[0];
        preferences.push({
          userId: shift.userId,
          preferredDays: pref.preferredDays,
          avoidDays: pref.avoidDays,
          preferMorning: pref.preferMorning,
          preferEvening: pref.preferEvening,
          preferNight: pref.preferNight,
          maxHoursPerWeek: pref.maxHoursPerWeek || undefined,
          minHoursPerWeek: pref.minHoursPerWeek || undefined,
          unavailableFrom: pref.unavailableFrom || undefined,
          unavailableTo: pref.unavailableTo || undefined,
          unavailableReason: pref.unavailableReason || undefined,
        });
      }
    }

    return preferences;
  }

  private async getLaborBudget(rosterId?: string): Promise<number | undefined> {
    if (!rosterId) return undefined;

    const roster = await prisma.roster.findUnique({
      where: { id: rosterId },
      include: {
        organization: true,
        location: true,
      },
    });

    if (!roster) return undefined;

    return roster.location?.laborBudgetPerWeek?.toNumber() ||
           roster.organization.laborBudgetPerWeek?.toNumber() ||
           undefined;
  }

  // ===========================================================================
  // Private Methods - Evaluation Phases
  // ===========================================================================

  private async runIndependentEvaluations(context: DecisionContext): Promise<AgentDecision[]> {
    // Run all agents in parallel
    const evaluationPromises = this.agents.map(agent => agent.evaluate(context));
    return Promise.all(evaluationPromises);
  }

  private async runDebatePhase(
    context: DecisionContext,
    initialDecisions: AgentDecision[]
  ): Promise<DebateRound[]> {
    const debateRounds: DebateRound[] = [];
    let currentDecisions = [...initialDecisions];

    // Identify disagreements
    const recommendations = new Set(currentDecisions.map(d => d.recommendation));

    if (recommendations.size <= 1) {
      // All agents agree - no debate needed
      return [];
    }

    for (let round = 1; round <= this.config.maxDebateRounds; round++) {
      const debateTopic = this.identifyDebateTopic(currentDecisions, round);

      const agentResponses: DebateRound['agentResponses'] = [];

      for (let i = 0; i < this.agents.length; i++) {
        const agent = this.agents[i];
        const otherDecisions = currentDecisions.filter((_, idx) => idx !== i);

        const response = await agent.respondToDebate(context, otherDecisions, debateTopic);

        agentResponses.push({
          agentRole: currentDecisions[i].agentRole,
          response: response.response,
          changedPosition: response.changedPosition,
          newRecommendation: response.newRecommendation,
        });

        // Update decision if position changed
        if (response.changedPosition && response.newRecommendation) {
          currentDecisions[i] = {
            ...currentDecisions[i],
            recommendation: response.newRecommendation,
            confidence: response.newConfidence || currentDecisions[i].confidence,
            agreesWithPreviousDecisions: true,
            revisedRecommendation: response.newRecommendation,
          };
        }
      }

      // Check if consensus reached
      const newRecommendations = new Set(currentDecisions.map(d => d.recommendation));
      const consensusReached = newRecommendations.size === 1 ||
        this.checkMajorityReached(currentDecisions);

      debateRounds.push({
        roundNumber: round,
        topic: debateTopic,
        agentResponses,
        consensusReached,
        resolutionSummary: consensusReached
          ? `Consensus reached in round ${round}`
          : undefined,
      });

      if (consensusReached) break;
    }

    return debateRounds;
  }

  private identifyDebateTopic(decisions: AgentDecision[], round: number): string {
    // Find the main point of disagreement
    const approvers = decisions.filter(d =>
      d.recommendation === 'approve' || d.recommendation === 'approve_with_conditions'
    );
    const rejecters = decisions.filter(d => d.recommendation === 'reject');

    if (approvers.length > 0 && rejecters.length > 0) {
      const mainConcerns = rejecters.flatMap(d => d.concerns);
      return `Round ${round}: Addressing concerns - ${mainConcerns[0] || 'general disagreement'}`;
    }

    return `Round ${round}: Reaching alignment on recommendation`;
  }

  private checkMajorityReached(decisions: AgentDecision[]): boolean {
    const approveVotes = decisions.filter(d =>
      d.recommendation === 'approve' || d.recommendation === 'approve_with_conditions'
    ).length;

    const rejectVotes = decisions.filter(d => d.recommendation === 'reject').length;

    const totalVotes = decisions.length;
    const majorityThreshold = Math.ceil(totalVotes * this.config.majorityThreshold);

    return approveVotes >= majorityThreshold || rejectVotes >= majorityThreshold;
  }

  // ===========================================================================
  // Private Methods - Consensus Calculation
  // ===========================================================================

  private calculateConsensus(
    decisions: AgentDecision[],
    debateRounds: DebateRound[],
    durationMs: number
  ): ConsensusResult {
    // Count votes with weights
    let weightedApprove = 0;
    let weightedReject = 0;
    let totalWeight = 0;

    for (const decision of decisions) {
      const weight = this.config.agentWeights[decision.agentRole] || 1;
      totalWeight += weight;

      if (decision.recommendation === 'approve' || decision.recommendation === 'approve_with_conditions') {
        weightedApprove += weight;
      } else if (decision.recommendation === 'reject') {
        weightedReject += weight;
      }
    }

    // Determine consensus status
    const approveRatio = weightedApprove / totalWeight;
    const rejectRatio = weightedReject / totalWeight;

    let status: ConsensusStatus;
    let finalDecision: 'approve' | 'reject' | 'escalate';

    if (approveRatio === 1) {
      status = 'unanimous_approve';
      finalDecision = 'approve';
    } else if (rejectRatio === 1) {
      status = 'unanimous_reject';
      finalDecision = 'reject';
    } else if (approveRatio >= this.config.majorityThreshold) {
      status = 'majority_approve';
      finalDecision = 'approve';
    } else if (rejectRatio >= this.config.majorityThreshold) {
      status = 'majority_reject';
      finalDecision = 'reject';
    } else {
      // Deadlock
      status = this.config.escalateOnDeadlock ? 'escalate' : 'deadlock';
      finalDecision = 'escalate';
    }

    // Check confidence threshold
    const avgConfidence = decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length;
    if (avgConfidence < this.config.minimumConfidenceThreshold && this.config.escalateOnLowConfidence) {
      status = 'escalate';
      finalDecision = 'escalate';
    }

    // Calculate consensus quality score
    const consensusScore = this.calculateConsensusScore(decisions);

    // Collect key reasons and concerns
    const keyReasons = decisions
      .filter(d => d.recommendation !== 'reject')
      .flatMap(d => d.reasoning)
      .slice(0, 5);

    const remainingConcerns = decisions
      .flatMap(d => d.concerns)
      .slice(0, 5);

    const conditions = decisions
      .filter(d => d.recommendation === 'approve_with_conditions')
      .flatMap(d => d.suggestions)
      .slice(0, 3);

    // Generate summary
    const summary = this.generateConsensusSummary(status, finalDecision, decisions);

    return {
      status,
      finalDecision,
      votesFor: decisions.filter(d =>
        d.recommendation === 'approve' || d.recommendation === 'approve_with_conditions'
      ).length,
      votesAgainst: decisions.filter(d => d.recommendation === 'reject').length,
      abstentions: decisions.filter(d => d.recommendation === 'needs_modification').length,
      agentDecisions: decisions,
      debateRounds,
      totalRounds: debateRounds.length,
      consensusScore,
      confidenceLevel: avgConfidence,
      summary,
      keyReasons,
      remainingConcerns,
      conditions: conditions.length > 0 ? conditions : undefined,
      decisionType: 'shift_assignment', // Will be set from context
      evaluatedAt: new Date(),
      evaluationDurationMs: durationMs,
    };
  }

  private calculateConsensusScore(decisions: AgentDecision[]): number {
    // Score based on how aligned agents are
    const recommendations = decisions.map(d => d.recommendation);
    const uniqueRecommendations = new Set(recommendations);

    if (uniqueRecommendations.size === 1) {
      return 100; // Perfect consensus
    }

    // Partial consensus score based on clustering
    const groups: Record<string, number> = {};
    for (const rec of recommendations) {
      groups[rec] = (groups[rec] || 0) + 1;
    }

    const maxGroup = Math.max(...Object.values(groups));
    return Math.round((maxGroup / decisions.length) * 100);
  }

  private generateConsensusSummary(
    status: ConsensusStatus,
    finalDecision: 'approve' | 'reject' | 'escalate',
    decisions: AgentDecision[]
  ): string {
    const agentNames = decisions.map(d => d.agentName);

    switch (status) {
      case 'unanimous_approve':
        return `All agents (${agentNames.join(', ')}) unanimously recommend approval.`;
      case 'unanimous_reject':
        return `All agents (${agentNames.join(', ')}) unanimously recommend rejection.`;
      case 'majority_approve':
        const approvers = decisions
          .filter(d => d.recommendation === 'approve' || d.recommendation === 'approve_with_conditions')
          .map(d => d.agentName);
        return `Majority approval: ${approvers.join(', ')} recommend proceeding.`;
      case 'majority_reject':
        const rejecters = decisions
          .filter(d => d.recommendation === 'reject')
          .map(d => d.agentName);
        return `Majority rejection: ${rejecters.join(', ')} have significant concerns.`;
      case 'deadlock':
        return 'Agents could not reach consensus. Human review required.';
      case 'escalate':
        return 'Decision escalated for human review due to low confidence or deadlock.';
      default:
        return 'Consensus evaluation complete.';
    }
  }

  private generateDecisionSummary(
    evaluations: AgentEvaluation[],
    consensus: ConsensusResult
  ): DecisionSummary {
    const avgScore = evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length;

    let headline: string;
    let recommendation: 'approve' | 'reject' | 'needs_review';
    let confidenceLevel: 'high' | 'medium' | 'low';

    if (consensus.finalDecision === 'approve') {
      headline = `Recommended: ${consensus.votesFor}/${evaluations.length} agents approve`;
      recommendation = 'approve';
    } else if (consensus.finalDecision === 'reject') {
      headline = `Not Recommended: ${consensus.votesAgainst}/${evaluations.length} agents have concerns`;
      recommendation = 'reject';
    } else {
      headline = 'Requires Review: Agents could not reach consensus';
      recommendation = 'needs_review';
    }

    if (consensus.confidenceLevel >= 80) {
      confidenceLevel = 'high';
    } else if (consensus.confidenceLevel >= 60) {
      confidenceLevel = 'medium';
    } else {
      confidenceLevel = 'low';
    }

    const keyPoints = evaluations
      .flatMap(e => e.reasoning)
      .slice(0, 4);

    const mainConcerns = evaluations
      .flatMap(e => e.concerns)
      .slice(0, 4);

    const quickActions: QuickAction[] = [
      {
        label: 'Approve as is',
        action: 'approve',
        description: 'Accept the current proposal without changes',
      },
      {
        label: 'Reject',
        action: 'reject',
        description: 'Reject the proposal and request alternatives',
      },
      {
        label: 'Modify',
        action: 'modify',
        description: 'Edit individual components and recalculate',
      },
    ];

    if (recommendation === 'reject' || mainConcerns.length > 0) {
      quickActions.push({
        label: 'Request Alternative',
        action: 'request_alternative',
        description: 'Ask for a different proposal that addresses concerns',
      });
    }

    return {
      headline,
      recommendation,
      confidenceLevel,
      keyPoints,
      mainConcerns,
      quickActions,
    };
  }

  // ===========================================================================
  // Private Methods - Audit Logging
  // ===========================================================================

  private async logConsensusDecision(
    request: ConsensusRequest,
    result: ConsensusResult
  ): Promise<string> {
    const auditId = uuidv4();

    await prisma.auditLog.create({
      data: {
        id: auditId,
        action: 'CONSENSUS_DECISION',
        entityType: 'ConsensusDecision',
        entityId: auditId,
        userId: request.requestedBy,
        details: {
          decisionType: request.decisionType,
          proposal: request.proposal,
          result: {
            status: result.status,
            finalDecision: result.finalDecision,
            votesFor: result.votesFor,
            votesAgainst: result.votesAgainst,
            consensusScore: result.consensusScore,
            confidenceLevel: result.confidenceLevel,
          },
          agentSummaries: result.agentDecisions.map(d => ({
            role: d.agentRole,
            recommendation: d.recommendation,
            score: d.score,
          })),
        },
        rosterId: request.rosterId,
        retainUntil: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years
      },
    });

    return auditId;
  }
}

// Export singleton instance
export const consensusService = new MultiAgentConsensusService();
