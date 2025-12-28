# Norwegian Labor Law Compliance Guide

## Overview

This system is built to comply with Norwegian Working Environment Act (Arbeidsmiljøloven). This document explains how the system enforces compliance.

## Legal Requirements

### 1. The 14-Day Rule (§ 10-2, § 10-6)

**Requirement:** Rosters must be made available to employees at least 14 days before they start.

**Implementation:**
- When publishing a roster, the system calculates days until the roster period starts
- If publishing less than 14 days before start, the roster is flagged as `isLatePublication: true`
- A compliance warning is logged in the audit trail
- Managers are warned before confirming publication

**Code Location:** `src/services/publishValidator.ts`

**Example:**
```typescript
// Roster starts January 15, 2024
// Must be published by January 1, 2024
// Publishing on January 3 = VIOLATION (flagged and logged)
```

### 2. Daily Rest Period (§ 10-8)

**Requirement:** Employees must have at least 11 hours of continuous rest within each 24-hour period.

**Implementation:**
- When adding a shift, the system checks rest time before and after the shift
- Calculates hours between end of previous shift and start of new shift
- Calculates hours between end of new shift and start of next shift
- Violations are flagged on the shift record and returned in API response

**Code Location:** `src/services/restPeriodValidator.ts`

**Example:**
```typescript
// Previous shift ends: 22:00
// New shift starts: 06:00
// Rest period: 8 hours (VIOLATION - minimum 11 required)
```

### 3. Weekly Rest Period (§ 10-8)

**Requirement:** Employees must have at least 35 hours of continuous rest within each 7-day period.

**Implementation:**
- System checks rolling 7-day windows throughout the roster period
- Finds the longest continuous rest period in each window
- Flags violations if longest rest is less than 35 hours

**Code Location:** `src/services/restPeriodValidator.ts`

**Example:**
```typescript
// Week with shifts: Mon 08-16, Tue 08-16, Wed 08-16, Thu 08-16, Fri 08-16, Sat 08-16
// Longest rest: 40 hours (Sat 16:00 to Mon 08:00) ✓ COMPLIANT
```

### 4. Daily Working Hours (§ 10-4)

**Requirement:** Normal working hours limited to 9 hours per 24-hour period.

**Implementation:**
- Calculates shift duration minus breaks
- Checks if single shift exceeds 9 hours
- Checks total hours in 24-hour period
- Flags violations on shift record

**Code Location:** `src/services/workingHoursValidator.ts`

**Example:**
```typescript
// Shift: 08:00 - 18:00 with 30 min break
// Working hours: 9.5 hours (VIOLATION - maximum 9)
```

### 5. Weekly Working Hours (§ 10-4)

**Requirement:** Normal working hours limited to 40 hours per 7-day period (38 or 36 for shift work).

**Implementation:**
- Calculates total hours in rolling 7-day window
- Configurable limit (default 40 hours)
- Flags violations

**Code Location:** `src/services/workingHoursValidator.ts`

### 6. Overtime Limits (§ 10-6)

**Requirements:**
- Maximum 10 hours overtime per week
- Maximum 25 hours overtime per 4 weeks
- Maximum 200 hours overtime per year

**Implementation:**
- Tracks hours beyond normal daily limit as overtime
- Validates against weekly, 4-week, and yearly caps
- Separate validation methods for each period

**Code Location:** `src/services/workingHoursValidator.ts`

### 7. Audit Trail

**Requirement:** Must maintain records showing planned and actual hours worked for inspection by Arbeidstilsynet.

**Implementation:**
- All roster operations logged to `AuditLog` table
- Minimum 2-year retention period (configurable)
- Includes:
  - What action was performed
  - Who performed it
  - When it was performed
  - Detailed change information
- One-click export for inspections

**Code Location:** `src/services/auditLogger.ts`

**Data Stored:**
- Roster creation, publication, modification
- Shift creation, modification, deletion
- Late publication events
- Compliance violations
- User access logs

### 8. Employee Rights & Accessibility

**Requirement:** Rosters must be readily available to employees.

**Implementation:**
- Employee portal API (`/api/employee/*`)
- Employees can view:
  - Their own shifts
  - Published rosters
  - Notifications about changes
- Mobile-friendly JSON API for app integration
- Real-time notifications for changes

**Code Location:** `src/routes/employee.routes.ts`

### 9. Discussion & Cooperation (§ 10-2)

**Requirement:** Rosters should be discussed with employee representatives (tillitsvalgte).

**Implementation:**
- Draft mode for roster creation
- "Send for Review" workflow
- Representatives can:
  - Review rosters before publication
  - Add comments
  - Approve rosters
- Role-based access control (REPRESENTATIVE role)

**Code Location:** `src/services/rosterService.ts`

**Workflow:**
1. Manager creates roster (DRAFT status)
2. Manager sends for review (IN_REVIEW status)
3. Representative reviews and approves
4. Manager publishes (PUBLISHED status)

### 10. Change Management

**Requirement:** Changes after publication should be justified and documented.

**Implementation:**
- Special endpoint for modifying published shifts
- Requires change reason (enum):
  - `SICK_LEAVE`
  - `EMERGENCY`
  - `EMPLOYEE_REQUEST`
  - `OPERATIONAL_NEED`
  - `CORRECTION`
  - `OTHER`
- Requires descriptive notes
- Stores original shift times
- Logs all changes
- Notifies affected employee

**Code Location:** `src/services/rosterService.ts:modifyPublishedShift`

## Compliance Reports

### Arbeidstilsynet Export

Generate comprehensive reports for labor inspections:

```bash
GET /api/rosters/organization/:orgId/compliance-report?startDate=2022-01-01&endDate=2024-01-31
```

**Report includes:**
- All employees who worked in the period
- Planned vs actual hours
- Overtime hours
- All compliance violations
- Late publication events
- Per-employee shift details

**Export formats:**
- JSON (detailed, machine-readable)
- CSV (simplified, Excel-compatible)

### Report Retention

Reports are stored in the database with:
- Generation timestamp
- Who generated the report
- Full report data as JSON
- Retention period compliance

## Configuration

Compliance parameters can be configured via environment variables:

```bash
# Default values (per Norwegian law)
ROSTER_PUBLISH_DEADLINE_DAYS=14
MIN_DAILY_REST_HOURS=11
MIN_WEEKLY_REST_HOURS=35
MAX_DAILY_WORK_HOURS=9
MAX_WEEKLY_WORK_HOURS=40
AUDIT_RETENTION_YEARS=2
```

Adjust for your organization's collective agreements or industry-specific rules.

## Violation Handling

### During Shift Creation

When a violation is detected:
1. Shift is still created (manager may have valid exception)
2. Violation flags are set on the shift record
3. API response includes detailed violation messages
4. Warning displayed to manager
5. Violation logged in audit trail

### Before Publication

System warns if:
- Any shifts have violations
- Publication is late (violates 14-day rule)
- But allows publication (manager decision)

### Reporting

All violations are:
- Visible in roster compliance summary
- Included in Arbeidstilsynet reports
- Logged for audit trail
- Flagged for review

## Best Practices

1. **Always publish 14+ days early**
   - Plan rosters well in advance
   - Use draft mode for planning
   - Get representative approval early

2. **Review violation warnings**
   - Don't ignore violations
   - Verify exceptions are valid
   - Document reasons for exceptions

3. **Use change management properly**
   - Always provide reason for post-publication changes
   - Notify employees immediately
   - Document in change notes

4. **Regular compliance checks**
   - Generate monthly compliance reports
   - Review violation trends
   - Address systematic issues

5. **Employee communication**
   - Ensure employees can access schedules
   - Respond to preference requests
   - Keep notification system active

## Penalties for Non-Compliance

While this system helps maintain compliance, responsibility remains with the employer. Norwegian labor authorities can:

- Issue warnings
- Impose fines
- Order operational changes
- In serious cases, criminal charges

**This system provides tools for compliance but does not guarantee it.**
Always consult legal counsel for specific situations.

## Support for Inspections

When Arbeidstilsynet requests documentation:

1. Generate compliance report for requested period
2. Export as CSV for easy review
3. Include audit logs if requested
4. Provide system configuration evidence

The system is designed to make inspections straightforward and stress-free.
