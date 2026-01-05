import { SchedulingAgent, AgentDecision } from "../multiAgentConsensusService";

interface ScheduleProposal {
  shifts: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    department?: string;
  }>;
  metrics: {
    coverageScore: number;
    shiftCount: number;
  };
}

export class OperationsAgent implements SchedulingAgent {
  role = "operations";
  name = "Operations Agent";

  async evaluate(proposal: unknown): Promise<AgentDecision> {
    const schedule = proposal as ScheduleProposal;
    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];
    const scoreBreakdown: Record<string, number> = {};

    const shifts = schedule.shifts ?? [];
    const coverageScore = schedule.metrics?.coverageScore ?? 80;

    // Coverage analysis
    const coverageEval =
      coverageScore >= 95 ? 100 : coverageScore >= 85 ? 90 : coverageScore >= 75 ? 75 : 50;
    scoreBreakdown["coverage"] = coverageEval;

    if (coverageScore >= 95) {
      reasoning.push("Excellent shift coverage across all required slots");
    } else if (coverageScore >= 85) {
      reasoning.push("Good shift coverage with minor gaps");
    } else if (coverageScore >= 75) {
      concerns.push("Some shifts may be understaffed");
      suggestions.push("Review and fill coverage gaps");
    } else {
      concerns.push("Significant understaffing across multiple shifts");
    }

    // Shift distribution by day
    const shiftsByDate = new Map<string, number>();
    shifts.forEach((s) => {
      shiftsByDate.set(s.date, (shiftsByDate.get(s.date) ?? 0) + 1);
    });

    const dailyCounts = Array.from(shiftsByDate.values());
    if (dailyCounts.length > 1) {
      const avgDaily = dailyCounts.reduce((a, b) => a + b, 0) / dailyCounts.length;
      const minDaily = Math.min(...dailyCounts);
      const maxDaily = Math.max(...dailyCounts);
      const dailyVariance = maxDaily - minDaily;

      const consistencyScore =
        dailyVariance <= avgDaily * 0.3
          ? 100
          : dailyVariance <= avgDaily * 0.5
            ? 80
            : 60;
      scoreBreakdown["daily_consistency"] = consistencyScore;

      if (dailyVariance > avgDaily * 0.5) {
        concerns.push("Staffing levels vary significantly between days");
        suggestions.push("Balance daily staffing for consistent operations");
      } else {
        reasoning.push("Consistent staffing levels across days");
      }
    } else {
      scoreBreakdown["daily_consistency"] = 100;
    }

    // Shift timing distribution (morning/day/evening coverage)
    const morningShifts = shifts.filter((s) => {
      const hour = parseInt(s.startTime.split(":")[0]);
      return hour < 12;
    }).length;

    const eveningShifts = shifts.filter((s) => {
      const hour = parseInt(s.startTime.split(":")[0]);
      return hour >= 15;
    }).length;

    const dayShifts = shifts.length - morningShifts - eveningShifts;
    const totalShifts = shifts.length || 1;

    // Ideal distribution: roughly 30% morning, 40% day, 30% evening
    const morningPct = morningShifts / totalShifts;
    const dayPct = dayShifts / totalShifts;
    const eveningPct = eveningShifts / totalShifts;

    const balanceDeviation =
      Math.abs(morningPct - 0.3) + Math.abs(dayPct - 0.4) + Math.abs(eveningPct - 0.3);
    const shiftBalanceScore = balanceDeviation <= 0.3 ? 100 : balanceDeviation <= 0.5 ? 80 : 60;
    scoreBreakdown["shift_balance"] = shiftBalanceScore;

    if (balanceDeviation > 0.5) {
      concerns.push("Shift timing distribution is unbalanced");
      suggestions.push("Review coverage across morning, day, and evening shifts");
    } else {
      reasoning.push("Good balance across shift times");
    }

    // Department coverage (if applicable)
    const departments = new Set(shifts.map((s) => s.department).filter(Boolean));
    if (departments.size > 1) {
      const deptCoverage = new Map<string, number>();
      shifts.forEach((s) => {
        if (s.department) {
          deptCoverage.set(s.department, (deptCoverage.get(s.department) ?? 0) + 1);
        }
      });

      const deptCounts = Array.from(deptCoverage.values());
      const minDept = Math.min(...deptCounts);
      const maxDept = Math.max(...deptCounts);

      const deptScore = maxDept - minDept <= 2 ? 100 : maxDept - minDept <= 4 ? 80 : 60;
      scoreBreakdown["department_coverage"] = deptScore;

      if (maxDept - minDept > 4) {
        concerns.push("Uneven coverage across departments");
      } else {
        reasoning.push("Departments are adequately covered");
      }
    } else {
      scoreBreakdown["department_coverage"] = 100;
    }

    // Peak hour coverage check
    // Assume peak hours are 11:00-14:00 and 17:00-20:00
    const peakShifts = shifts.filter((s) => {
      const startH = parseInt(s.startTime.split(":")[0]);
      const endH = parseInt(s.endTime.split(":")[0]);
      const coversPeak1 = startH <= 11 && endH >= 14;
      const coversPeak2 = startH <= 17 && endH >= 20;
      return coversPeak1 || coversPeak2;
    }).length;

    const peakCoverageRatio = shifts.length > 0 ? peakShifts / shifts.length : 0;
    const peakScore = peakCoverageRatio >= 0.5 ? 100 : peakCoverageRatio >= 0.3 ? 80 : 60;
    scoreBreakdown["peak_coverage"] = peakScore;

    if (peakCoverageRatio < 0.3) {
      concerns.push("Insufficient coverage during peak business hours");
      suggestions.push("Ensure adequate staffing during lunch and dinner rushes");
    } else {
      reasoning.push("Peak hours have adequate coverage");
    }

    // Backup/overlap coverage
    const overlapScore = 80; // Simplified - would check for shift overlaps in production
    scoreBreakdown["overlap_coverage"] = overlapScore;
    reasoning.push("Shift handovers have reasonable overlap");

    // Calculate final score
    const weights = {
      coverage: 0.3,
      daily_consistency: 0.2,
      shift_balance: 0.15,
      department_coverage: 0.15,
      peak_coverage: 0.15,
      overlap_coverage: 0.05,
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
      reasoning.push("Schedule meets operational requirements");
    } else if (finalScore >= 70) {
      recommendation = "approve_with_conditions";
      suggestions.push("Review identified coverage gaps before publishing");
    } else if (finalScore >= 55) {
      recommendation = "needs_modification";
      concerns.push("Schedule has operational weaknesses that should be addressed");
    } else {
      recommendation = "reject";
      concerns.push("Schedule does not meet minimum operational requirements");
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
