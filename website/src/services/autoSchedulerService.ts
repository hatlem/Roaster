import { prisma } from "@/lib/db";
import { SchedulePriorityMode } from "@prisma/client";
import { evaluateWithConsensus } from "./consensus/multiAgentConsensusService";

// Types for the scheduling algorithm
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  hourlyRate: number;
  preferences: EmployeePreferences | null;
  unavailableDates: Date[];
}

interface EmployeePreferences {
  preferredDays: string[];
  avoidDays: string[];
  preferMorning: boolean;
  preferEvening: boolean;
  preferNight: boolean;
  maxHoursPerWeek: number | null;
  minHoursPerWeek: number | null;
}

interface ShiftRequirement {
  date: Date;
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  department?: string;
  requiredCount: number;
}

interface ProposedShift {
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  department?: string;
  hourlyRate: number;
  estimatedCost: number;
  preferenceScore: number;
  complianceScore: number;
}

interface ScheduleMetrics {
  totalCost: number;
  coverageScore: number; // 0-100
  preferenceScore: number; // 0-100
  complianceScore: number; // 0-100
  overtimeHours: number;
  shiftCount: number;
}

interface AutoScheduleResult {
  shifts: ProposedShift[];
  metrics: ScheduleMetrics;
  warnings: string[];
}

// Get available employees for a roster period
async function getAvailableEmployees(
  organizationId: string,
  startDate: Date,
  endDate: Date
): Promise<Employee[]> {
  const users = await prisma.user.findMany({
    where: {
      organizationId,
      isActive: true,
      role: { in: ["EMPLOYEE", "MANAGER"] },
    },
    include: {
      preferences: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
      timeOffRequests: {
        where: {
          status: "APPROVED",
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
      },
    },
  });

  return users.map((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : 250, // Default NOK rate
    preferences: user.preferences[0]
      ? {
          preferredDays: user.preferences[0].preferredDays,
          avoidDays: user.preferences[0].avoidDays,
          preferMorning: user.preferences[0].preferMorning,
          preferEvening: user.preferences[0].preferEvening,
          preferNight: user.preferences[0].preferNight,
          maxHoursPerWeek: user.preferences[0].maxHoursPerWeek,
          minHoursPerWeek: user.preferences[0].minHoursPerWeek,
        }
      : null,
    unavailableDates: user.timeOffRequests.flatMap((req) =>
      getDateRange(req.startDate, req.endDate)
    ),
  }));
}

// Get date range helper
function getDateRange(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Generate shift requirements for a roster period
function generateShiftRequirements(
  startDate: Date,
  endDate: Date,
  employeeCount: number
): ShiftRequirement[] {
  const requirements: ShiftRequirement[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Standard shift patterns
    // Morning shift: 07:00-15:00
    requirements.push({
      date: new Date(current),
      startTime: "07:00",
      endTime: "15:00",
      requiredCount: isWeekend
        ? Math.ceil(employeeCount * 0.3)
        : Math.ceil(employeeCount * 0.4),
    });

    // Day shift: 09:00-17:00
    requirements.push({
      date: new Date(current),
      startTime: "09:00",
      endTime: "17:00",
      requiredCount: isWeekend
        ? Math.ceil(employeeCount * 0.3)
        : Math.ceil(employeeCount * 0.5),
    });

    // Evening shift: 15:00-23:00
    requirements.push({
      date: new Date(current),
      startTime: "15:00",
      endTime: "23:00",
      requiredCount: isWeekend
        ? Math.ceil(employeeCount * 0.4)
        : Math.ceil(employeeCount * 0.3),
    });

    current.setDate(current.getDate() + 1);
  }

  return requirements;
}

// Calculate shift hours
function calculateShiftHours(startTime: string, endTime: string): number {
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let hours = endH - startH + (endM - startM) / 60;
  if (hours < 0) hours += 24; // Handle overnight shifts
  return hours;
}

// Calculate preference score for an employee-shift assignment
function calculatePreferenceScore(
  employee: Employee,
  requirement: ShiftRequirement
): number {
  if (!employee.preferences) return 50; // Neutral score if no preferences

  const prefs = employee.preferences;
  const dayName = requirement.date.toLocaleDateString("en-US", {
    weekday: "long",
  });
  const startHour = parseInt(requirement.startTime.split(":")[0]);

  let score = 50; // Start neutral

  // Day preferences
  if (prefs.preferredDays.includes(dayName)) score += 20;
  if (prefs.avoidDays.includes(dayName)) score -= 30;

  // Time preferences
  const isMorning = startHour < 12;
  const isEvening = startHour >= 15;
  const isNight = startHour >= 22 || startHour < 6;

  if (isMorning && prefs.preferMorning) score += 15;
  if (isEvening && prefs.preferEvening) score += 15;
  if (isNight && prefs.preferNight) score += 15;

  // Penalize against preferences
  if (isMorning && !prefs.preferMorning && prefs.preferEvening) score -= 10;
  if (isEvening && !prefs.preferEvening && prefs.preferMorning) score -= 10;

  return Math.max(0, Math.min(100, score));
}

// Check compliance for a shift assignment
function checkCompliance(
  employee: Employee,
  requirement: ShiftRequirement,
  existingShifts: ProposedShift[]
): { score: number; violations: string[] } {
  const violations: string[] = [];
  let score = 100;

  const dateStr = requirement.date.toISOString().split("T")[0];

  // Check if employee is unavailable
  const isUnavailable = employee.unavailableDates.some(
    (d) => d.toISOString().split("T")[0] === dateStr
  );
  if (isUnavailable) {
    violations.push("Employee is on approved time off");
    score -= 100;
    return { score: 0, violations };
  }

  // Get employee's shifts for this week
  const weekStart = new Date(requirement.date);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const weekShifts = existingShifts.filter((s) => {
    const shiftDate = new Date(s.date);
    return (
      s.employeeId === employee.id &&
      shiftDate >= weekStart &&
      shiftDate <= weekEnd
    );
  });

  // Calculate weekly hours
  const weeklyHours = weekShifts.reduce((sum, s) => {
    return sum + calculateShiftHours(s.startTime, s.endTime);
  }, 0);

  const newShiftHours = calculateShiftHours(
    requirement.startTime,
    requirement.endTime
  );

  // Norwegian law: Max 40 hours/week normal, max 9 hours/day
  if (weeklyHours + newShiftHours > 40) {
    violations.push("Weekly hours would exceed 40 hours");
    score -= 20;
  }

  if (newShiftHours > 9) {
    violations.push("Shift exceeds 9 hours");
    score -= 15;
  }

  // Check rest period (11 hours between shifts)
  const sameDayShifts = existingShifts.filter(
    (s) => s.employeeId === employee.id && s.date === dateStr
  );

  for (const shift of sameDayShifts) {
    const existingEnd = parseInt(shift.endTime.split(":")[0]);
    const newStart = parseInt(requirement.startTime.split(":")[0]);
    const restHours =
      newStart > existingEnd ? newStart - existingEnd : existingEnd - newStart;

    if (restHours < 11 && restHours > 0) {
      violations.push("Less than 11 hours rest between shifts");
      score -= 30;
    }
  }

  return { score: Math.max(0, score), violations };
}

// Main scheduling algorithm
async function generateSchedule(
  employees: Employee[],
  requirements: ShiftRequirement[],
  priorityMode: SchedulePriorityMode
): Promise<AutoScheduleResult> {
  const proposedShifts: ProposedShift[] = [];
  const warnings: string[] = [];
  const employeeHours: Map<string, number> = new Map();

  // Initialize employee hours
  employees.forEach((e) => employeeHours.set(e.id, 0));

  // Sort employees based on priority mode
  const sortEmployees = (
    emps: Employee[],
    requirement: ShiftRequirement
  ): Employee[] => {
    return [...emps].sort((a, b) => {
      const aHours = employeeHours.get(a.id) || 0;
      const bHours = employeeHours.get(b.id) || 0;
      const aPrefs = calculatePreferenceScore(a, requirement);
      const bPrefs = calculatePreferenceScore(b, requirement);

      switch (priorityMode) {
        case "LOWEST_COST":
          // Prefer lower hourly rates, avoid overtime
          if (aHours >= 40 && bHours < 40) return 1;
          if (bHours >= 40 && aHours < 40) return -1;
          return a.hourlyRate - b.hourlyRate;

        case "EQUAL_HOURS":
          // Prefer employees with fewer hours
          return aHours - bHours;

        case "PREFERENCE_BASED":
          // Prefer employees with higher preference scores
          return bPrefs - aPrefs;

        default:
          return 0;
      }
    });
  };

  // Process each requirement
  for (const requirement of requirements) {
    const dateStr = requirement.date.toISOString().split("T")[0];
    let assigned = 0;

    // Sort employees for this requirement
    const sortedEmployees = sortEmployees(employees, requirement);

    for (const employee of sortedEmployees) {
      if (assigned >= requirement.requiredCount) break;

      // Check compliance
      const compliance = checkCompliance(
        employee,
        requirement,
        proposedShifts
      );
      if (compliance.score === 0) continue;

      // Calculate scores
      const preferenceScore = calculatePreferenceScore(employee, requirement);
      const shiftHours = calculateShiftHours(
        requirement.startTime,
        requirement.endTime
      );
      const currentHours = employeeHours.get(employee.id) || 0;
      const isOvertime = currentHours + shiftHours > 40;
      const estimatedCost =
        shiftHours * employee.hourlyRate * (isOvertime ? 1.4 : 1);

      // Create proposed shift
      proposedShifts.push({
        employeeId: employee.id,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        date: dateStr,
        startTime: requirement.startTime,
        endTime: requirement.endTime,
        department: requirement.department,
        hourlyRate: employee.hourlyRate,
        estimatedCost,
        preferenceScore,
        complianceScore: compliance.score,
      });

      // Update tracking
      employeeHours.set(employee.id, currentHours + shiftHours);
      assigned++;

      // Record warnings
      compliance.violations.forEach((v) =>
        warnings.push(`${employee.firstName}: ${v}`)
      );
    }

    // Warn if under-staffed
    if (assigned < requirement.requiredCount) {
      warnings.push(
        `Under-staffed on ${dateStr} ${requirement.startTime}-${requirement.endTime}: need ${requirement.requiredCount}, assigned ${assigned}`
      );
    }
  }

  // Calculate metrics
  const totalCost = proposedShifts.reduce((sum, s) => sum + s.estimatedCost, 0);
  const avgPreference =
    proposedShifts.reduce((sum, s) => sum + s.preferenceScore, 0) /
    (proposedShifts.length || 1);
  const avgCompliance =
    proposedShifts.reduce((sum, s) => sum + s.complianceScore, 0) /
    (proposedShifts.length || 1);
  const totalRequiredShifts = requirements.reduce(
    (sum, r) => sum + r.requiredCount,
    0
  );
  const coverageScore = Math.min(
    100,
    (proposedShifts.length / totalRequiredShifts) * 100
  );
  const overtimeHours = Array.from(employeeHours.values()).reduce(
    (sum, h) => sum + Math.max(0, h - 40),
    0
  );

  return {
    shifts: proposedShifts,
    metrics: {
      totalCost,
      coverageScore,
      preferenceScore: avgPreference,
      complianceScore: avgCompliance,
      overtimeHours,
      shiftCount: proposedShifts.length,
    },
    warnings,
  };
}

// Create auto-schedule job
export async function createAutoScheduleJob(
  rosterId: string,
  priorityMode: SchedulePriorityMode,
  requestedBy: string
): Promise<string> {
  // Get roster details
  const roster = await prisma.roster.findUnique({
    where: { id: rosterId },
    include: { organization: true },
  });

  if (!roster) {
    throw new Error("Roster not found");
  }

  // Create job record
  const job = await prisma.autoScheduleJob.create({
    data: {
      rosterId,
      organizationId: roster.organizationId,
      priorityMode,
      status: "PENDING",
      requestedBy,
    },
  });

  // Process asynchronously (in a real app, this would be a background job)
  processAutoScheduleJob(job.id).catch(console.error);

  return job.id;
}

// Process auto-schedule job
async function processAutoScheduleJob(jobId: string): Promise<void> {
  try {
    // Update status to processing
    await prisma.autoScheduleJob.update({
      where: { id: jobId },
      data: { status: "PROCESSING" },
    });

    // Get job details
    const job = await prisma.autoScheduleJob.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    // Get roster
    const roster = await prisma.roster.findUnique({
      where: { id: job.rosterId },
    });

    if (!roster) {
      throw new Error("Roster not found");
    }

    // Get available employees
    const employees = await getAvailableEmployees(
      job.organizationId,
      roster.startDate,
      roster.endDate
    );

    if (employees.length === 0) {
      throw new Error("No available employees found");
    }

    // Generate shift requirements
    const requirements = generateShiftRequirements(
      roster.startDate,
      roster.endDate,
      employees.length
    );

    // Generate schedule
    const result = await generateSchedule(
      employees,
      requirements,
      job.priorityMode
    );

    // Evaluate with consensus system
    const consensusResult = await evaluateWithConsensus({
      type: "SCHEDULE_CREATION",
      rosterId: job.rosterId,
      proposal: {
        shifts: result.shifts,
        metrics: result.metrics,
        priorityMode: job.priorityMode,
      },
      requestedBy: job.requestedBy,
    });

    // Update job with results
    await prisma.autoScheduleJob.update({
      where: { id: jobId },
      data: {
        status: "COMPLETED",
        generatedShifts: result.shifts as object[],
        metrics: result.metrics as object,
        consensusDecisionId: consensusResult.decisionId,
        consensusScore: consensusResult.consensusScore,
      },
    });
  } catch (error) {
    console.error("Auto-schedule job failed:", error);
    await prisma.autoScheduleJob.update({
      where: { id: jobId },
      data: {
        status: "FAILED",
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        failedAt: new Date(),
      },
    });
  }
}

// Get job status
export async function getAutoScheduleJob(jobId: string) {
  return prisma.autoScheduleJob.findUnique({
    where: { id: jobId },
  });
}

// Apply generated schedule to roster
export async function applyAutoSchedule(
  jobId: string,
  appliedBy: string
): Promise<void> {
  const job = await prisma.autoScheduleJob.findUnique({
    where: { id: jobId },
  });

  if (!job || job.status !== "COMPLETED") {
    throw new Error("Job not found or not completed");
  }

  const shifts = job.generatedShifts as unknown as ProposedShift[];

  // Create shifts in database
  await prisma.$transaction(
    shifts.map((shift) =>
      prisma.shift.create({
        data: {
          rosterId: job.rosterId,
          userId: shift.employeeId,
          startTime: new Date(`${shift.date}T${shift.startTime}:00`),
          endTime: new Date(`${shift.date}T${shift.endTime}:00`),
          department: shift.department,
          hourlyRate: shift.hourlyRate,
          laborCost: shift.estimatedCost,
        },
      })
    )
  );

  // Update job status
  await prisma.autoScheduleJob.update({
    where: { id: jobId },
    data: {
      status: "APPLIED",
      appliedBy,
      appliedAt: new Date(),
    },
  });
}

// Reject generated schedule
export async function rejectAutoSchedule(
  jobId: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  await prisma.autoScheduleJob.update({
    where: { id: jobId },
    data: {
      status: "REJECTED",
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason,
    },
  });
}
