// Consensus-Enhanced Scheduler
// Integrates the Multi-Agent Consensus System with the existing AIShiftSuggestionService
// Provides enhanced scheduling with transparent, reviewable decisions

import { PrismaClient } from '@prisma/client';
import {
  AIShiftSuggestionService,
  ShiftRequirement,
  EmployeeSuggestion,
  ScheduleSuggestion,
  AutoScheduleResult,
} from './aiShiftSuggestionService';
import {
  MultiAgentConsensusService,
  TransparentDecision,
  consensusService,
} from './multiAgentConsensusService';
import { ShiftProposal, ScheduleProposal, ConsensusResult } from '../types/consensus';
import { ShiftData } from '../types';

const prisma = new PrismaClient();

// =============================================================================
// Enhanced Suggestion with Consensus
// =============================================================================

export interface EnhancedEmployeeSuggestion extends EmployeeSuggestion {
  consensusDecision?: TransparentDecision;
  agentBreakdown?: {
    compliance: { score: number; recommendation: string };
    cost: { score: number; recommendation: string };
    employee: { score: number; recommendation: string };
    operations: { score: number; recommendation: string };
  };
}

export interface EnhancedScheduleSuggestion extends ScheduleSuggestion {
  topSuggestions: EnhancedEmployeeSuggestion[];
  consensusRecommendation?: 'approve' | 'reject' | 'needs_review';
}

export interface ConsensusAutoScheduleResult extends AutoScheduleResult {
  consensusDecisions: TransparentDecision[];
  overallConsensusScore: number;
  requiresHumanReview: boolean;
  reviewRequiredFor: string[];
}

// =============================================================================
// Consensus-Enhanced Scheduler Service
// =============================================================================

export class ConsensusEnhancedScheduler {
  private aiService: AIShiftSuggestionService;
  private consensusService: MultiAgentConsensusService;

  constructor() {
    this.aiService = new AIShiftSuggestionService();
    this.consensusService = new MultiAgentConsensusService();
  }

  // ===========================================================================
  // Enhanced Shift Suggestions with Consensus
  // ===========================================================================

  /**
   * Get shift suggestions enhanced with multi-agent consensus
   * Each suggestion includes transparent agent evaluations
   */
  async suggestShiftAssignmentsWithConsensus(
    rosterId: string,
    shifts: ShiftRequirement[],
    options: {
      topN?: number; // Number of top suggestions to evaluate with consensus
      includeFullDecisions?: boolean; // Include full transparent decisions
    } = {}
  ): Promise<EnhancedScheduleSuggestion[]> {
    const topN = options.topN || 3;

    // Get base suggestions from AI service
    const baseSuggestions = await this.aiService.suggestShiftAssignments(rosterId, shifts);

    // Enhance top suggestions with consensus
    const enhancedSuggestions: EnhancedScheduleSuggestion[] = [];

    for (const suggestion of baseSuggestions) {
      const topSuggestions: EnhancedEmployeeSuggestion[] = [];

      // Evaluate top N candidates with consensus
      for (const candidate of suggestion.suggestions.slice(0, topN)) {
        const enhanced = await this.evaluateCandidateWithConsensus(
          rosterId,
          candidate,
          suggestion.shift,
          options.includeFullDecisions
        );
        topSuggestions.push(enhanced);
      }

      // Determine overall recommendation based on best match
      const bestMatch = topSuggestions[0];
      let consensusRecommendation: 'approve' | 'reject' | 'needs_review' = 'needs_review';

      if (bestMatch?.consensusDecision) {
        const decision = bestMatch.consensusDecision.consensusResult.finalDecision;
        consensusRecommendation = decision === 'escalate' ? 'needs_review' : decision;
      }

      enhancedSuggestions.push({
        ...suggestion,
        topSuggestions,
        consensusRecommendation,
      });
    }

    return enhancedSuggestions;
  }

  /**
   * Evaluate a single candidate with multi-agent consensus
   */
  private async evaluateCandidateWithConsensus(
    rosterId: string,
    candidate: EmployeeSuggestion,
    shift: ShiftRequirement,
    includeFullDecision: boolean = false
  ): Promise<EnhancedEmployeeSuggestion> {
    const shiftData: ShiftData = {
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakMinutes: shift.breakMinutes,
      userId: candidate.userId,
    };

    const proposal: ShiftProposal = {
      type: 'shift_assignment',
      userId: candidate.userId,
      shift: shiftData,
      isNew: true,
    };

    try {
      const transparentDecision = await this.consensusService.getTransparentDecision({
        decisionType: 'shift_assignment',
        proposal,
        rosterId,
        requestedBy: 'system',
      });

      // Extract agent breakdown
      const agentBreakdown = {
        compliance: this.extractAgentSummary(transparentDecision, 'compliance'),
        cost: this.extractAgentSummary(transparentDecision, 'cost_optimizer'),
        employee: this.extractAgentSummary(transparentDecision, 'employee_advocate'),
        operations: this.extractAgentSummary(transparentDecision, 'operations'),
      };

      return {
        ...candidate,
        consensusDecision: includeFullDecision ? transparentDecision : undefined,
        agentBreakdown,
      };
    } catch (error) {
      // If consensus fails, return original candidate without enhancement
      console.error('Consensus evaluation failed:', error);
      return candidate;
    }
  }

  private extractAgentSummary(
    decision: TransparentDecision,
    agentRole: string
  ): { score: number; recommendation: string } {
    const agent = decision.agentEvaluations.find(e => e.agentRole === agentRole);
    if (!agent) {
      return { score: 0, recommendation: 'unknown' };
    }
    return {
      score: agent.score,
      recommendation: agent.recommendation,
    };
  }

  // ===========================================================================
  // Auto-Schedule with Consensus
  // ===========================================================================

  /**
   * Automatically generate a schedule with multi-agent consensus
   * Each assignment is evaluated by all agents before final recommendation
   */
  async autoScheduleWithConsensus(
    rosterId: string,
    requirements: ShiftRequirement[]
  ): Promise<ConsensusAutoScheduleResult> {
    // Get base auto-schedule result
    const baseResult = await this.aiService.autoSchedule(rosterId, requirements);

    // Evaluate each scheduled shift with consensus
    const consensusDecisions: TransparentDecision[] = [];
    const reviewRequiredFor: string[] = [];
    let totalScore = 0;

    for (const scheduledShift of baseResult.scheduledShifts) {
      const shiftData: ShiftData = {
        startTime: scheduledShift.requirement.startTime,
        endTime: scheduledShift.requirement.endTime,
        breakMinutes: scheduledShift.requirement.breakMinutes,
        userId: scheduledShift.assignedUser,
      };

      const proposal: ShiftProposal = {
        type: 'shift_assignment',
        userId: scheduledShift.assignedUser,
        shift: shiftData,
        isNew: true,
      };

      try {
        const decision = await this.consensusService.getTransparentDecision({
          decisionType: 'shift_assignment',
          proposal,
          rosterId,
          requestedBy: 'system',
        });

        consensusDecisions.push(decision);
        totalScore += decision.consensusResult.consensusScore;

        // Flag shifts requiring human review
        if (
          decision.consensusResult.finalDecision === 'escalate' ||
          decision.consensusResult.confidenceLevel < 60
        ) {
          reviewRequiredFor.push(
            `${scheduledShift.assignedUser} on ${scheduledShift.requirement.startTime.toISOString()}`
          );
        }
      } catch (error) {
        console.error('Consensus evaluation failed for shift:', error);
      }
    }

    const overallConsensusScore =
      consensusDecisions.length > 0
        ? Math.round(totalScore / consensusDecisions.length)
        : 0;

    return {
      ...baseResult,
      consensusDecisions,
      overallConsensusScore,
      requiresHumanReview: reviewRequiredFor.length > 0,
      reviewRequiredFor,
    };
  }

  // ===========================================================================
  // Batch Consensus Evaluation
  // ===========================================================================

  /**
   * Evaluate multiple shift proposals at once
   * Useful for reviewing an entire schedule
   */
  async batchEvaluateWithConsensus(
    rosterId: string,
    proposals: Array<{ userId: string; shift: ShiftData }>
  ): Promise<{
    decisions: TransparentDecision[];
    summary: {
      totalProposals: number;
      approved: number;
      rejected: number;
      needsReview: number;
      averageScore: number;
    };
  }> {
    const decisions: TransparentDecision[] = [];

    for (const proposal of proposals) {
      const shiftProposal: ShiftProposal = {
        type: 'shift_assignment',
        userId: proposal.userId,
        shift: proposal.shift,
        isNew: true,
      };

      try {
        const decision = await this.consensusService.getTransparentDecision({
          decisionType: 'shift_assignment',
          proposal: shiftProposal,
          rosterId,
          requestedBy: 'system',
        });
        decisions.push(decision);
      } catch (error) {
        console.error('Batch evaluation failed for proposal:', error);
      }
    }

    // Calculate summary
    const approved = decisions.filter(
      d => d.consensusResult.finalDecision === 'approve'
    ).length;
    const rejected = decisions.filter(
      d => d.consensusResult.finalDecision === 'reject'
    ).length;
    const needsReview = decisions.filter(
      d => d.consensusResult.finalDecision === 'escalate'
    ).length;
    const averageScore =
      decisions.length > 0
        ? Math.round(
            decisions.reduce((sum, d) => sum + d.consensusResult.consensusScore, 0) /
              decisions.length
          )
        : 0;

    return {
      decisions,
      summary: {
        totalProposals: proposals.length,
        approved,
        rejected,
        needsReview,
        averageScore,
      },
    };
  }

  // ===========================================================================
  // Schedule Optimization with Consensus
  // ===========================================================================

  /**
   * Get optimization suggestions with consensus evaluation
   * Each suggestion is evaluated by agents before recommendation
   */
  async optimizeWithConsensus(
    rosterId: string
  ): Promise<{
    optimizations: Array<{
      original: Awaited<ReturnType<typeof this.aiService.optimizeExistingSchedule>>[0];
      consensusApproved: boolean;
      consensusScore: number;
      agentConcerns: string[];
    }>;
    summary: {
      totalSuggestions: number;
      approved: number;
      rejected: number;
      potentialSavings: number;
    };
  }> {
    // Get optimization suggestions from AI service
    const optimizations = await this.aiService.optimizeExistingSchedule(rosterId);

    const evaluatedOptimizations = [];
    let approvedCount = 0;
    let totalSavings = 0;

    for (const optimization of optimizations) {
      // For each suggested change, evaluate with consensus
      const concerns: string[] = [];
      let consensusApproved = true;
      let avgScore = 0;

      for (const change of optimization.suggestedChanges) {
        // Get the shift details (would need to fetch from DB in real implementation)
        // For now, create a basic evaluation
        const result = await this.consensusService.getConsensus({
          decisionType: 'schedule_optimization',
          proposal: {
            type: 'schedule_optimization',
            changes: [change],
            expectedSavings: optimization.savings,
            affectsCompliance: optimization.complianceImpact === 'worsens',
          },
          rosterId,
          requestedBy: 'system',
        });

        if (result.success && result.result) {
          avgScore += result.result.consensusScore;
          if (result.result.finalDecision === 'reject') {
            consensusApproved = false;
            concerns.push(...result.result.remainingConcerns);
          }
        }
      }

      avgScore = optimization.suggestedChanges.length > 0
        ? Math.round(avgScore / optimization.suggestedChanges.length)
        : 0;

      if (consensusApproved) {
        approvedCount++;
        totalSavings += optimization.savings;
      }

      evaluatedOptimizations.push({
        original: optimization,
        consensusApproved,
        consensusScore: avgScore,
        agentConcerns: concerns,
      });
    }

    return {
      optimizations: evaluatedOptimizations,
      summary: {
        totalSuggestions: optimizations.length,
        approved: approvedCount,
        rejected: optimizations.length - approvedCount,
        potentialSavings: totalSavings,
      },
    };
  }
}

// Export singleton instance
export const consensusEnhancedScheduler = new ConsensusEnhancedScheduler();
