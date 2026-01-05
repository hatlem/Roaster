import { SchedulingAgent, AgentDecision } from "../multiAgentConsensusService";

interface ScheduleProposal {
  shifts: Array<{
    employeeId: string;
    hourlyRate: number;
    estimatedCost: number;
    date: string;
    startTime: string;
    endTime: string;
  }>;
  metrics: {
    totalCost: number;
    overtimeHours: number;
    shiftCount: number;
  };
  priorityMode: string;
}

export class CostOptimizationAgent implements SchedulingAgent {
  role = "cost_optimization";
  name = "Cost Optimization Agent";

  async evaluate(proposal: unknown): Promise<AgentDecision> {
    const schedule = proposal as ScheduleProposal;
    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];
    const scoreBreakdown: Record<string, number> = {};

    const totalCost = schedule.metrics?.totalCost ?? 0;
    const overtimeHours = schedule.metrics?.overtimeHours ?? 0;
    const shiftCount = schedule.metrics?.shiftCount ?? 0;
    const priorityMode = schedule.priorityMode ?? "LOWEST_COST";

    // Calculate average hourly cost
    const shifts = schedule.shifts ?? [];
    const totalHours = shifts.reduce((sum, s) => {
      const [startH] = s.startTime.split(":").map(Number);
      const [endH] = s.endTime.split(":").map(Number);
      return sum + (endH - startH);
    }, 0);
    const avgHourlyCost = totalHours > 0 ? totalCost / totalHours : 0;

    // Benchmark: Norwegian average hourly rate is ~250-350 NOK
    const costEfficiencyScore =
      avgHourlyCost <= 280 ? 100 : avgHourlyCost <= 320 ? 85 : avgHourlyCost <= 380 ? 70 : 50;
    scoreBreakdown["cost_efficiency"] = costEfficiencyScore;

    if (avgHourlyCost <= 280) {
      reasoning.push(`Excellent cost efficiency at ${Math.round(avgHourlyCost)} NOK/hour average`);
    } else if (avgHourlyCost <= 320) {
      reasoning.push(`Good cost efficiency at ${Math.round(avgHourlyCost)} NOK/hour average`);
    } else {
      concerns.push(`High average hourly cost of ${Math.round(avgHourlyCost)} NOK/hour`);
    }

    // Overtime cost analysis
    const overtimePremium = 1.4; // 40% premium per Norwegian law
    const estimatedOvertimeCost = overtimeHours * avgHourlyCost * (overtimePremium - 1);
    const overtimePercent = totalCost > 0 ? (estimatedOvertimeCost / totalCost) * 100 : 0;

    const overtimeScore =
      overtimePercent <= 5 ? 100 : overtimePercent <= 10 ? 80 : overtimePercent <= 20 ? 60 : 40;
    scoreBreakdown["overtime_cost"] = overtimeScore;

    if (overtimePercent > 10) {
      concerns.push(
        `Overtime represents ${Math.round(overtimePercent)}% of total labor cost`
      );
      suggestions.push("Consider hiring additional staff or redistributing hours");
    } else {
      reasoning.push("Overtime costs are well controlled");
    }

    // Coverage efficiency (shifts per day)
    const uniqueDates = new Set(shifts.map((s) => s.date)).size;
    const shiftsPerDay = uniqueDates > 0 ? shiftCount / uniqueDates : 0;
    const coverageScore = shiftsPerDay >= 3 ? 100 : shiftsPerDay >= 2 ? 80 : 60;
    scoreBreakdown["coverage_efficiency"] = coverageScore;

    if (shiftsPerDay >= 3) {
      reasoning.push("Good shift coverage across the schedule period");
    } else {
      concerns.push("Low shift density may indicate understaffing");
    }

    // Rate distribution analysis
    const rates = shifts.map((s) => s.hourlyRate);
    const minRate = Math.min(...rates, 0);
    const maxRate = Math.max(...rates, 0);
    const rateSpread = maxRate > 0 ? (maxRate - minRate) / maxRate : 0;

    const rateBalanceScore = rateSpread <= 0.3 ? 100 : rateSpread <= 0.5 ? 80 : 60;
    scoreBreakdown["rate_balance"] = rateBalanceScore;

    if (rateSpread > 0.5) {
      concerns.push("Large wage disparity in scheduled employees");
      suggestions.push("Balance shifts between high and low rate employees");
    }

    // Priority mode adjustment
    let modeBonus = 0;
    if (priorityMode === "LOWEST_COST") {
      if (costEfficiencyScore >= 85) {
        modeBonus = 10;
        reasoning.push("Schedule optimized well for cost priority mode");
      }
    }

    // Calculate final score
    const weights = {
      cost_efficiency: 0.35,
      overtime_cost: 0.25,
      coverage_efficiency: 0.25,
      rate_balance: 0.15,
    };

    const baseScore = Object.entries(weights).reduce(
      (sum, [key, weight]) => sum + (scoreBreakdown[key] ?? 0) * weight,
      0
    );
    const finalScore = Math.min(100, Math.round(baseScore + modeBonus));

    // Determine recommendation
    let recommendation: AgentDecision["recommendation"];
    if (finalScore >= 80) {
      recommendation = "approve";
      reasoning.push("Schedule is cost-effective and sustainable");
    } else if (finalScore >= 65) {
      recommendation = "approve_with_conditions";
      suggestions.push("Consider cost optimizations before finalizing");
    } else if (finalScore >= 50) {
      recommendation = "needs_modification";
      concerns.push("Schedule has significant cost inefficiencies");
    } else {
      recommendation = "reject";
      concerns.push("Schedule is not cost-effective");
    }

    return {
      agentRole: this.role,
      agentName: this.name,
      recommendation,
      confidence: Math.min(90, finalScore + 5),
      score: finalScore,
      reasoning,
      concerns,
      suggestions,
      scoreBreakdown,
    };
  }
}
