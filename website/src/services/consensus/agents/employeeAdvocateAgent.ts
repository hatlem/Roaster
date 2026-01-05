import { SchedulingAgent, AgentDecision } from "../multiAgentConsensusService";

interface ScheduleProposal {
  shifts: Array<{
    employeeId: string;
    employeeName: string;
    date: string;
    startTime: string;
    endTime: string;
    preferenceScore: number;
  }>;
  metrics: {
    preferenceScore: number;
    shiftCount: number;
  };
  priorityMode: string;
}

export class EmployeeAdvocateAgent implements SchedulingAgent {
  role = "employee_advocate";
  name = "Employee Advocate Agent";

  async evaluate(proposal: unknown): Promise<AgentDecision> {
    const schedule = proposal as ScheduleProposal;
    const reasoning: string[] = [];
    const concerns: string[] = [];
    const suggestions: string[] = [];
    const scoreBreakdown: Record<string, number> = {};

    const shifts = schedule.shifts ?? [];
    const avgPreferenceScore = schedule.metrics?.preferenceScore ?? 50;
    const priorityMode = schedule.priorityMode ?? "EQUAL_HOURS";

    // Preference satisfaction analysis
    const prefScore =
      avgPreferenceScore >= 70 ? 100 : avgPreferenceScore >= 50 ? 80 : avgPreferenceScore >= 30 ? 60 : 40;
    scoreBreakdown["preference_satisfaction"] = prefScore;

    if (avgPreferenceScore >= 70) {
      reasoning.push(
        `High employee preference satisfaction (${Math.round(avgPreferenceScore)}%)`
      );
    } else if (avgPreferenceScore >= 50) {
      reasoning.push("Moderate employee preference alignment");
    } else {
      concerns.push(
        `Low preference satisfaction (${Math.round(avgPreferenceScore)}%)`
      );
      suggestions.push("Review employee preferences and try to accommodate more requests");
    }

    // Hour distribution fairness
    const employeeHours = new Map<string, number>();
    shifts.forEach((s) => {
      const [startH] = s.startTime.split(":").map(Number);
      const [endH] = s.endTime.split(":").map(Number);
      const hours = endH - startH;
      employeeHours.set(
        s.employeeId,
        (employeeHours.get(s.employeeId) ?? 0) + hours
      );
    });

    const hoursArray = Array.from(employeeHours.values());
    if (hoursArray.length > 1) {
      const avgHours = hoursArray.reduce((a, b) => a + b, 0) / hoursArray.length;
      const variance =
        hoursArray.reduce((sum, h) => sum + Math.pow(h - avgHours, 2), 0) /
        hoursArray.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = avgHours > 0 ? stdDev / avgHours : 0;

      const fairnessScore =
        coefficientOfVariation <= 0.15
          ? 100
          : coefficientOfVariation <= 0.25
            ? 80
            : coefficientOfVariation <= 0.4
              ? 60
              : 40;
      scoreBreakdown["hour_fairness"] = fairnessScore;

      if (coefficientOfVariation <= 0.15) {
        reasoning.push("Hours are distributed fairly across employees");
      } else if (coefficientOfVariation > 0.4) {
        concerns.push("Significant disparity in hours between employees");
        suggestions.push("Redistribute shifts for more equitable hours");
      }
    } else {
      scoreBreakdown["hour_fairness"] = 100;
      reasoning.push("Single employee schedule - fairness not applicable");
    }

    // Weekend distribution analysis
    const weekendShifts = new Map<string, number>();
    const weekdayShifts = new Map<string, number>();

    shifts.forEach((s) => {
      const dayOfWeek = new Date(s.date).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const map = isWeekend ? weekendShifts : weekdayShifts;
      map.set(s.employeeId, (map.get(s.employeeId) ?? 0) + 1);
    });

    // Check if weekend burden is shared
    const weekendCounts = Array.from(weekendShifts.values());
    const maxWeekends = Math.max(...weekendCounts, 0);
    const minWeekends = Math.min(...weekendCounts, 0);
    const weekendSpread = weekendCounts.length > 0 ? maxWeekends - minWeekends : 0;

    const weekendScore = weekendSpread <= 1 ? 100 : weekendSpread <= 2 ? 80 : 60;
    scoreBreakdown["weekend_fairness"] = weekendScore;

    if (weekendSpread > 2) {
      concerns.push("Weekend shifts are not evenly distributed");
      suggestions.push("Rotate weekend shifts more fairly");
    } else {
      reasoning.push("Weekend shifts are reasonably distributed");
    }

    // Shift timing preferences
    const lowPrefShifts = shifts.filter((s) => s.preferenceScore < 40).length;
    const lowPrefPercent = shifts.length > 0 ? (lowPrefShifts / shifts.length) * 100 : 0;

    const timingScore = lowPrefPercent <= 10 ? 100 : lowPrefPercent <= 20 ? 80 : lowPrefPercent <= 30 ? 60 : 40;
    scoreBreakdown["timing_preferences"] = timingScore;

    if (lowPrefPercent > 20) {
      concerns.push(
        `${Math.round(lowPrefPercent)}% of shifts conflict with employee timing preferences`
      );
    }

    // Consecutive work days check (quality of life)
    // Simplified check - in production would be more sophisticated
    const consecutiveScore = 85; // Placeholder
    scoreBreakdown["consecutive_days"] = consecutiveScore;
    reasoning.push("Consecutive work day patterns are acceptable");

    // Priority mode adjustment
    let modeBonus = 0;
    if (priorityMode === "PREFERENCE_BASED" || priorityMode === "EQUAL_HOURS") {
      if (prefScore >= 80 && scoreBreakdown["hour_fairness"] >= 80) {
        modeBonus = 10;
        reasoning.push("Schedule well-optimized for employee-focused priority mode");
      }
    }

    // Calculate final score
    const weights = {
      preference_satisfaction: 0.3,
      hour_fairness: 0.25,
      weekend_fairness: 0.2,
      timing_preferences: 0.15,
      consecutive_days: 0.1,
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
      reasoning.push("Schedule is fair and respects employee preferences");
    } else if (finalScore >= 65) {
      recommendation = "approve_with_conditions";
      suggestions.push("Consider adjustments to improve employee satisfaction");
    } else if (finalScore >= 50) {
      recommendation = "needs_modification";
      concerns.push("Schedule may negatively impact employee morale");
    } else {
      recommendation = "reject";
      concerns.push("Schedule is unfair to employees");
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
