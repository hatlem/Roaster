import { prisma } from "@/lib/db";
import { ConsensusDecisionType, ConsensusStatus } from "@prisma/client";
import { ComplianceAgent } from "./agents/complianceAgent";
import { CostOptimizationAgent } from "./agents/costOptimizationAgent";
import { EmployeeAdvocateAgent } from "./agents/employeeAdvocateAgent";
import { OperationsAgent } from "./agents/operationsAgent";

// Types
export interface ConsensusRequest {
  type: ConsensusDecisionType;
  rosterId?: string;
  proposal: unknown;
  requestedBy: string;
}

export interface AgentDecision {
  agentRole: string;
  agentName: string;
  recommendation: "approve" | "approve_with_conditions" | "reject" | "needs_modification";
  confidence: number; // 0-100
  score: number; // 0-100
  reasoning: string[];
  concerns: string[];
  suggestions: string[];
  scoreBreakdown: Record<string, number>;
}

export interface ConsensusResult {
  decisionId: string;
  status: ConsensusStatus;
  finalDecision: "approve" | "reject" | "escalate";
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
  consensusScore: number;
  confidenceLevel: number;
  summary: string;
  keyReasons: string[];
  remainingConcerns: string[];
  conditions: string[];
  agentDecisions: AgentDecision[];
}

// Agent interface
export interface SchedulingAgent {
  role: string;
  name: string;
  evaluate(proposal: unknown): Promise<AgentDecision>;
}

// Initialize agents
const agents: SchedulingAgent[] = [
  new ComplianceAgent(),
  new CostOptimizationAgent(),
  new EmployeeAdvocateAgent(),
  new OperationsAgent(),
];

// Evaluate proposal with all agents
export async function evaluateWithConsensus(
  request: ConsensusRequest
): Promise<ConsensusResult> {
  const startTime = Date.now();

  // Get all agent decisions in parallel
  const decisions = await Promise.all(
    agents.map((agent) => agent.evaluate(request.proposal))
  );

  // Calculate consensus
  const { status, finalDecision, votesFor, votesAgainst, abstentions } =
    calculateConsensusStatus(decisions);

  // Calculate overall scores
  const consensusScore = Math.round(
    decisions.reduce((sum, d) => sum + d.score, 0) / decisions.length
  );
  const confidenceLevel = Math.round(
    decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length
  );

  // Generate summary
  const summary = generateSummary(decisions, finalDecision);
  const keyReasons = extractKeyReasons(decisions);
  const remainingConcerns = extractConcerns(decisions);
  const conditions = extractConditions(decisions);

  // Calculate retention date (2 years per Norwegian law)
  const retainUntil = new Date();
  retainUntil.setFullYear(retainUntil.getFullYear() + 2);

  // Store decision in database
  const decision = await prisma.consensusDecision.create({
    data: {
      decisionType: request.type,
      rosterId: request.rosterId,
      proposal: request.proposal as object,
      consensusStatus: status,
      finalDecision,
      votesFor,
      votesAgainst,
      abstentions,
      consensusScore,
      confidenceLevel,
      agentDecisions: decisions as object[],
      summary,
      keyReasons,
      remainingConcerns,
      conditions,
      requestedBy: request.requestedBy,
      evaluationDurationMs: Date.now() - startTime,
      retainUntil,
    },
  });

  // Store individual agent evaluations
  await prisma.agentEvaluation.createMany({
    data: decisions.map((d) => ({
      consensusId: decision.id,
      agentRole: d.agentRole,
      agentName: d.agentName,
      recommendation: d.recommendation,
      confidence: d.confidence,
      score: d.score,
      scoreBreakdown: d.scoreBreakdown as object,
      reasoning: d.reasoning,
      concerns: d.concerns,
      suggestions: d.suggestions,
      scoringComponents: d.scoreBreakdown as object,
    })),
  });

  return {
    decisionId: decision.id,
    status,
    finalDecision,
    votesFor,
    votesAgainst,
    abstentions,
    consensusScore,
    confidenceLevel,
    summary,
    keyReasons,
    remainingConcerns,
    conditions,
    agentDecisions: decisions,
  };
}

// Calculate consensus status from agent decisions
function calculateConsensusStatus(decisions: AgentDecision[]): {
  status: ConsensusStatus;
  finalDecision: "approve" | "reject" | "escalate";
  votesFor: number;
  votesAgainst: number;
  abstentions: number;
} {
  let votesFor = 0;
  let votesAgainst = 0;
  let abstentions = 0;

  for (const decision of decisions) {
    if (
      decision.recommendation === "approve" ||
      decision.recommendation === "approve_with_conditions"
    ) {
      votesFor++;
    } else if (decision.recommendation === "reject") {
      votesAgainst++;
    } else {
      abstentions++;
    }
  }

  const total = decisions.length;
  let status: ConsensusStatus;
  let finalDecision: "approve" | "reject" | "escalate";

  if (votesFor === total) {
    status = "UNANIMOUS_APPROVE";
    finalDecision = "approve";
  } else if (votesAgainst === total) {
    status = "UNANIMOUS_REJECT";
    finalDecision = "reject";
  } else if (votesFor > votesAgainst) {
    status = "MAJORITY_APPROVE";
    finalDecision = "approve";
  } else if (votesAgainst > votesFor) {
    status = "MAJORITY_REJECT";
    finalDecision = "reject";
  } else {
    status = "DEADLOCK";
    finalDecision = "escalate";
  }

  return { status, finalDecision, votesFor, votesAgainst, abstentions };
}

// Generate human-readable summary
function generateSummary(
  decisions: AgentDecision[],
  finalDecision: string
): string {
  const avgScore = Math.round(
    decisions.reduce((sum, d) => sum + d.score, 0) / decisions.length
  );

  if (finalDecision === "approve") {
    if (avgScore >= 80) {
      return "All agents agree this is a strong schedule with excellent compliance and fairness.";
    } else if (avgScore >= 60) {
      return "The schedule is acceptable with some minor concerns noted by agents.";
    } else {
      return "The schedule is marginally approved but agents have significant concerns.";
    }
  } else if (finalDecision === "reject") {
    return "The schedule does not meet minimum standards and should be revised.";
  } else {
    return "Agents are divided on this schedule. Manager review is required.";
  }
}

// Extract key reasons from agent decisions
function extractKeyReasons(decisions: AgentDecision[]): string[] {
  const reasons: string[] = [];

  for (const decision of decisions) {
    if (decision.score >= 70) {
      reasons.push(
        ...decision.reasoning.slice(0, 2).map((r) => `${decision.agentName}: ${r}`)
      );
    }
  }

  return reasons.slice(0, 5);
}

// Extract remaining concerns
function extractConcerns(decisions: AgentDecision[]): string[] {
  const concerns: string[] = [];

  for (const decision of decisions) {
    concerns.push(
      ...decision.concerns.map((c) => `${decision.agentName}: ${c}`)
    );
  }

  return concerns.slice(0, 5);
}

// Extract conditions from approve_with_conditions decisions
function extractConditions(decisions: AgentDecision[]): string[] {
  const conditions: string[] = [];

  for (const decision of decisions) {
    if (decision.recommendation === "approve_with_conditions") {
      conditions.push(
        ...decision.suggestions.map((s) => `${decision.agentName}: ${s}`)
      );
    }
  }

  return conditions;
}

// Get consensus decision by ID
export async function getConsensusDecision(decisionId: string) {
  return prisma.consensusDecision.findUnique({
    where: { id: decisionId },
    include: {
      agentEvaluations: true,
    },
  });
}

// Update user decision on a consensus
export async function updateUserDecision(
  decisionId: string,
  userId: string,
  action: "approve" | "modify" | "reject",
  reason?: string,
  edits?: unknown
) {
  const statusMap = {
    approve: "APPROVED",
    modify: "MODIFIED",
    reject: "REJECTED",
  } as const;

  return prisma.consensusDecision.update({
    where: { id: decisionId },
    data: {
      userStatus: statusMap[action],
      userDecisionBy: userId,
      userDecisionAt: new Date(),
      userReason: reason,
      userEdits: edits as object,
    },
  });
}
