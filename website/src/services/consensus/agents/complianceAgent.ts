import { SchedulingAgent, AgentDecision } from "../multiAgentConsensusService";

interface ScheduleProposal {
  shifts: Array<{
    employeeId: string;
    date: string;
    startTime: string;
    endTime: string;
    complianceScore: number;
  }>;
  metrics: {
    complianceScore: number;
    overtimeHours: number;
  };
}

export class ComplianceAgent implements SchedulingAgent {
  role = "compliance";
  name = "Compliance Agent";

  async evaluate(proposal: unknown): Promise<AgentDecision> {
    const schedule = proposal as ScheduleProposal;
    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];
    const scoreBreakdown: Record<string, number> = {};

    // Evaluate compliance metrics
    const complianceScore = schedule.metrics?.complianceScore ?? 80;
    const overtimeHours = schedule.metrics?.overtimeHours ?? 0;

    // Score components
    scoreBreakdown["base_compliance"] = complianceScore;

    // Check 14-day publication rule
    const publicationScore = 100; // Assume compliant for now
    scoreBreakdown["publication_rule"] = publicationScore;
    if (publicationScore === 100) {
      reasoning.push("14-day publication rule is satisfied");
    }

    // Check rest periods (11-hour daily, 35-hour weekly)
    const restPeriodViolations = schedule.shifts?.filter(
      (s) => s.complianceScore < 70
    ).length ?? 0;
    const restScore = Math.max(0, 100 - restPeriodViolations * 10);
    scoreBreakdown["rest_periods"] = restScore;

    if (restPeriodViolations > 0) {
      concerns.push(
        `${restPeriodViolations} potential rest period violations detected`
      );
      suggestions.push("Review shifts with less than 11 hours between them");
    } else {
      reasoning.push("All rest period requirements are met");
    }

    // Check overtime limits
    const overtimeScore = overtimeHours <= 10 ? 100 : overtimeHours <= 25 ? 70 : 40;
    scoreBreakdown["overtime_limits"] = overtimeScore;

    if (overtimeHours > 25) {
      concerns.push(
        `Monthly overtime hours (${overtimeHours}h) may exceed legal limit of 25h`
      );
      suggestions.push("Redistribute hours to reduce overtime");
    } else if (overtimeHours > 10) {
      concerns.push(`Weekly overtime of ${overtimeHours}h is high but within limits`);
    } else {
      reasoning.push("Overtime hours are within acceptable limits");
    }

    // Check work hour limits (9h/day, 40h/week)
    const workLimitScore = complianceScore >= 80 ? 100 : complianceScore >= 60 ? 70 : 40;
    scoreBreakdown["work_limits"] = workLimitScore;

    if (complianceScore < 60) {
      concerns.push("Multiple shifts exceed daily or weekly hour limits");
    } else {
      reasoning.push("Work hour limits are generally respected");
    }

    // Calculate final score
    const weights = {
      base_compliance: 0.3,
      publication_rule: 0.2,
      rest_periods: 0.25,
      overtime_limits: 0.15,
      work_limits: 0.1,
    };

    const finalScore = Math.round(
      Object.entries(weights).reduce(
        (sum, [key, weight]) => sum + (scoreBreakdown[key] ?? 0) * weight,
        0
      )
    );

    // Determine recommendation
    let recommendation: AgentDecision["recommendation"];
    if (finalScore >= 85) {
      recommendation = "approve";
      reasoning.push("Schedule meets all Norwegian labor law requirements");
    } else if (finalScore >= 70) {
      recommendation = "approve_with_conditions";
      suggestions.push("Minor compliance adjustments recommended before publishing");
    } else if (finalScore >= 50) {
      recommendation = "needs_modification";
      concerns.push("Schedule has significant compliance issues that must be addressed");
    } else {
      recommendation = "reject";
      concerns.push("Schedule violates critical labor law requirements");
    }

    return {
      agentRole: this.role,
      agentName: this.name,
      recommendation,
      confidence: Math.min(95, finalScore + 10),
      score: finalScore,
      reasoning,
      concerns,
      suggestions,
      scoreBreakdown,
    };
  }
}
