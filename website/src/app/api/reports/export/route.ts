import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireRole, requireTier } from "@/lib/api-utils"
import { audit } from "@/lib/audit"

const VALID_TYPES = ["compliance", "hours", "overtime", "costs", "attendance", "audit"] as const
type ReportType = (typeof VALID_TYPES)[number]

const VALID_FORMATS = ["csv", "pdf"] as const
type ExportFormat = (typeof VALID_FORMATS)[number]

function escapeCsv(value: unknown): string {
  const str = String(value ?? "")
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toCsvRow(values: unknown[]): string {
  return values.map(escapeCsv).join(",")
}

function buildCsvResponse(headers: string[], rows: unknown[][], type: string): NextResponse {
  const lines = [toCsvRow(headers), ...rows.map((row) => toCsvRow(row))]
  const csv = lines.join("\n")
  const date = new Date().toISOString().split("T")[0]

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="report-${type}-${date}.csv"`,
    },
  })
}

async function generateComplianceReport(orgId: string) {
  const rosters = await prisma.roster.findMany({
    where: { organizationId: orgId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      publishedAt: true,
      isLatePublication: true,
      createdAt: true,
    },
  })

  const headers = [
    "Roster Name",
    "Status",
    "Start Date",
    "End Date",
    "Published At",
    "Days Notice",
    "14-Day Compliant",
    "Late Publication Flag",
  ]

  const rows = rosters.map((roster) => {
    const startDate = new Date(roster.startDate)
    const publishedAt = roster.publishedAt ? new Date(roster.publishedAt) : null
    const daysNotice = publishedAt
      ? Math.floor((startDate.getTime() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
      : null
    const isCompliant = daysNotice === null || daysNotice >= 14

    return [
      roster.name,
      roster.status,
      roster.startDate.toISOString().split("T")[0],
      roster.endDate.toISOString().split("T")[0],
      publishedAt ? publishedAt.toISOString().split("T")[0] : "Not Published",
      daysNotice ?? "N/A",
      isCompliant ? "Yes" : "No",
      roster.isLatePublication ? "Yes" : "No",
    ]
  })

  return buildCsvResponse(headers, rows, "compliance")
}

async function generateHoursReport(orgId: string, startDate?: Date, endDate?: Date) {
  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = startDate
  if (endDate) dateFilter.lte = endDate

  const shifts = await prisma.shift.findMany({
    where: {
      roster: { organizationId: orgId },
      ...(startDate || endDate ? { startTime: dateFilter } : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, employeeNumber: true } },
    },
    orderBy: { startTime: "asc" },
    take: 5000,
  })

  // Group by employee
  const byEmployee = new Map<
    string,
    { name: string; email: string; employeeNumber: string | null; totalHours: number; shiftCount: number; overtimeHours: number }
  >()

  for (const shift of shifts) {
    const key = shift.userId
    const existing = byEmployee.get(key) ?? {
      name: `${shift.user.firstName} ${shift.user.lastName}`.trim(),
      email: shift.user.email,
      employeeNumber: shift.user.employeeNumber,
      totalHours: 0,
      shiftCount: 0,
      overtimeHours: 0,
    }

    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60) - shift.breakMinutes / 60
    existing.totalHours += hours
    existing.shiftCount += 1
    if (shift.isOvertime) existing.overtimeHours += hours

    byEmployee.set(key, existing)
  }

  const headers = ["Employee", "Email", "Employee Number", "Total Hours", "Shift Count", "Overtime Hours"]

  const rows = Array.from(byEmployee.values()).map((emp) => [
    emp.name,
    emp.email,
    emp.employeeNumber ?? "",
    emp.totalHours.toFixed(2),
    emp.shiftCount,
    emp.overtimeHours.toFixed(2),
  ])

  return buildCsvResponse(headers, rows, "hours")
}

async function generateOvertimeReport(orgId: string, startDate?: Date, endDate?: Date) {
  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = startDate
  if (endDate) dateFilter.lte = endDate

  const shifts = await prisma.shift.findMany({
    where: {
      roster: { organizationId: orgId },
      isOvertime: true,
      ...(startDate || endDate ? { startTime: dateFilter } : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, employeeNumber: true } },
    },
    orderBy: { startTime: "asc" },
    take: 5000,
  })

  const byEmployee = new Map<
    string,
    { name: string; email: string; employeeNumber: string | null; overtimeHours: number; shiftCount: number }
  >()

  for (const shift of shifts) {
    const key = shift.userId
    const existing = byEmployee.get(key) ?? {
      name: `${shift.user.firstName} ${shift.user.lastName}`.trim(),
      email: shift.user.email,
      employeeNumber: shift.user.employeeNumber,
      overtimeHours: 0,
      shiftCount: 0,
    }

    const hours = (shift.endTime.getTime() - shift.startTime.getTime()) / (1000 * 60 * 60) - shift.breakMinutes / 60
    existing.overtimeHours += hours
    existing.shiftCount += 1

    byEmployee.set(key, existing)
  }

  const headers = ["Employee", "Email", "Employee Number", "Overtime Hours", "Overtime Shift Count"]

  const rows = Array.from(byEmployee.values()).map((emp) => [
    emp.name,
    emp.email,
    emp.employeeNumber ?? "",
    emp.overtimeHours.toFixed(2),
    emp.shiftCount,
  ])

  return buildCsvResponse(headers, rows, "overtime")
}

async function generateCostsReport(orgId: string, startDate?: Date, endDate?: Date) {
  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = startDate
  if (endDate) dateFilter.lte = endDate

  const costs = await prisma.laborCost.findMany({
    where: {
      roster: { organizationId: orgId },
      ...(startDate || endDate ? { periodStart: dateFilter } : {}),
    },
    orderBy: { periodStart: "asc" },
    take: 1000,
  })

  const headers = [
    "Period",
    "Period Start",
    "Period End",
    "Budgeted Hours",
    "Budgeted Cost",
    "Scheduled Hours",
    "Scheduled Cost",
    "Scheduled Regular Cost",
    "Scheduled Overtime Cost",
    "Actual Hours",
    "Actual Cost",
    "Variance",
    "Variance %",
  ]

  const rows = costs.map((cost) => [
    cost.period,
    cost.periodStart.toISOString().split("T")[0],
    cost.periodEnd.toISOString().split("T")[0],
    cost.budgetedHours.toString(),
    cost.budgetedCost.toString(),
    cost.scheduledHours.toString(),
    cost.scheduledCost.toString(),
    cost.scheduledRegularCost.toString(),
    cost.scheduledOvertimeCost.toString(),
    cost.actualHours?.toString() ?? "",
    cost.actualCost?.toString() ?? "",
    cost.variance?.toString() ?? "",
    cost.variancePercent ? `${cost.variancePercent}%` : "",
  ])

  return buildCsvResponse(headers, rows, "costs")
}

async function generateAttendanceReport(orgId: string, startDate?: Date, endDate?: Date) {
  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = startDate
  if (endDate) dateFilter.lte = endDate

  const records = await prisma.actualHours.findMany({
    where: {
      user: { organizationId: orgId },
      ...(startDate || endDate ? { date: dateFilter } : {}),
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true, employeeNumber: true } },
    },
    orderBy: { date: "asc" },
    take: 5000,
  })

  const headers = [
    "Employee",
    "Email",
    "Employee Number",
    "Date",
    "Clock In",
    "Clock Out",
    "Break (min)",
    "Total Hours",
    "Is Overtime",
    "Overtime Hours",
    "Approved By",
  ]

  const rows = records.map((r) => [
    `${r.user.firstName} ${r.user.lastName}`.trim(),
    r.user.email,
    r.user.employeeNumber ?? "",
    r.date.toISOString().split("T")[0],
    r.clockIn.toISOString(),
    r.clockOut?.toISOString() ?? "",
    r.breakMinutes,
    r.totalHours.toFixed(2),
    r.isOvertime ? "Yes" : "No",
    r.overtimeHours.toFixed(2),
    r.approvedBy ?? "",
  ])

  return buildCsvResponse(headers, rows, "attendance")
}

async function generateAuditReport(orgId: string, startDate?: Date, endDate?: Date) {
  const dateFilter: Record<string, unknown> = {}
  if (startDate) dateFilter.gte = startDate
  if (endDate) dateFilter.lte = endDate

  // Get all user IDs in the org to filter audit logs
  const orgUsers = await prisma.user.findMany({
    where: { organizationId: orgId },
    select: { id: true },
  })
  const orgUserIds = orgUsers.map((u) => u.id)

  const logs = await prisma.auditLog.findMany({
    where: {
      userId: { in: orgUserIds },
      ...(startDate || endDate ? { timestamp: dateFilter } : {}),
    },
    orderBy: { timestamp: "desc" },
    take: 5000,
  })

  const headers = ["Timestamp", "User Email", "Action", "Entity Type", "Entity ID", "Details", "IP Address"]

  const rows = logs.map((log) => [
    log.timestamp.toISOString(),
    log.userEmail ?? "",
    log.action,
    log.entityType,
    log.entityId,
    log.details ? JSON.stringify(log.details) : "",
    log.ipAddress ?? "",
  ])

  return buildCsvResponse(headers, rows, "audit")
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireRole(["ADMIN", "MANAGER"])

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { organization: true },
    })
    const orgId = user?.organization?.id
    if (!orgId) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Check CSV export tier access
    await requireTier(orgId, "csv_export")

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") as ReportType | null
    const format = searchParams.get("format") as ExportFormat | null
    const startDateStr = searchParams.get("startDate")
    const endDateStr = searchParams.get("endDate")

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }
    if (!format || !VALID_FORMATS.includes(format)) {
      return NextResponse.json({ error: "Invalid format" }, { status: 400 })
    }

    const startDate = startDateStr ? new Date(startDateStr) : undefined
    const endDate = endDateStr ? new Date(endDateStr) : undefined

    audit.export(session.user.id, 'report', { type, format, startDate: startDateStr, endDate: endDateStr }, orgId)

    switch (type) {
      case "compliance":
        return generateComplianceReport(orgId)
      case "hours":
        return generateHoursReport(orgId, startDate, endDate)
      case "overtime":
        return generateOvertimeReport(orgId, startDate, endDate)
      case "costs":
        return generateCostsReport(orgId, startDate, endDate)
      case "attendance":
        return generateAttendanceReport(orgId, startDate, endDate)
      case "audit":
        return generateAuditReport(orgId, startDate, endDate)
      default:
        return NextResponse.json({ error: "Unknown report type" }, { status: 400 })
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (error instanceof Error && error.message === "TierLimited") {
      return NextResponse.json({ error: "Upgrade your plan to access this feature" }, { status: 403 })
    }
    console.error("[reports/export] Error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
