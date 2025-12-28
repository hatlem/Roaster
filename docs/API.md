# API Documentation

## Overview

The Roster SaaS API provides endpoints for managing rosters, shifts, and employee schedules while ensuring compliance with Norwegian labor laws (Arbeidsmiljøloven).

## Authentication

All API endpoints (except `/api/auth/login` and `/api/auth/register`) require JWT authentication.

Include the token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

## Base URL

```
http://localhost:3000/api
```

## Endpoints

### Authentication

#### POST /auth/login
Authenticate user and receive JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "EMPLOYEE"
  }
}
```

#### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "employeeNumber": "EMP001",
  "department": "Operations"
}
```

### Roster Management (MANAGER/ADMIN only)

#### POST /rosters
Create a new roster.

**Request:**
```json
{
  "organizationId": "org-uuid",
  "name": "January 2024 Schedule",
  "startDate": "2024-01-01T00:00:00Z",
  "endDate": "2024-01-31T23:59:59Z"
}
```

**Response:**
```json
{
  "roster": {
    "id": "roster-uuid",
    "name": "January 2024 Schedule",
    "status": "DRAFT",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-01-31T23:59:59Z"
  }
}
```

#### GET /rosters/:id
Get roster with validation status.

**Response:**
```json
{
  "roster": {
    "id": "uuid",
    "name": "January 2024",
    "status": "PUBLISHED",
    "shifts": [...],
    "organization": {...}
  },
  "complianceSummary": {
    "totalShifts": 120,
    "shiftsWithViolations": 2,
    "changedShifts": 3,
    "publishStatus": "Published On Time",
    "isLatePublication": false
  }
}
```

#### POST /rosters/:id/shifts
Add a shift to a roster with automatic compliance validation.

**Request:**
```json
{
  "userId": "employee-uuid",
  "startTime": "2024-01-15T08:00:00Z",
  "endTime": "2024-01-15T16:00:00Z",
  "breakMinutes": 30,
  "department": "Operations",
  "location": "Oslo",
  "notes": "Morning shift"
}
```

**Response:**
```json
{
  "shift": {
    "id": "shift-uuid",
    "startTime": "2024-01-15T08:00:00Z",
    "endTime": "2024-01-15T16:00:00Z",
    "violatesRestPeriod": false,
    "violatesDailyLimit": false,
    "violatesWeeklyLimit": false
  },
  "validation": {
    "isValid": true,
    "violations": [],
    "warnings": []
  }
}
```

If there are violations, the response will include detailed violation messages:

**Response (with violations):**
```json
{
  "shift": {...},
  "validation": {
    "isValid": false,
    "violations": [
      "Insufficient daily rest: 8 hours between shifts (minimum 11 hours required)",
      "Weekly hours exceed limit: 42.5 hours (maximum 40 hours)"
    ],
    "warnings": [
      "This shift has compliance violations. Review and approve before publishing."
    ]
  }
}
```

#### POST /rosters/:id/publish
Publish a roster (implements 14-day rule).

**Response:**
```json
{
  "roster": {
    "id": "uuid",
    "status": "PUBLISHED",
    "publishedAt": "2023-12-15T10:00:00Z",
    "isLatePublication": false
  },
  "validation": {
    "isValid": true,
    "violations": [],
    "warnings": []
  }
}
```

**Response (late publication):**
```json
{
  "roster": {...},
  "validation": {
    "isValid": false,
    "violations": ["Roster published after 14-day deadline"],
    "warnings": [
      "COMPLIANCE WARNING: Publishing 3 days late. The roster should have been published by 2023-12-12. This violates the 14-day rule (Arbeidsmiljøloven § 10-2)."
    ]
  }
}
```

#### POST /rosters/:id/review
Send roster for review by employee representative.

#### POST /rosters/:id/approve
Approve roster (REPRESENTATIVE only).

**Request:**
```json
{
  "comments": "Approved with no concerns"
}
```

#### PATCH /rosters/shifts/:id
Modify a published shift (requires reason).

**Request:**
```json
{
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T17:00:00Z",
  "reason": "OPERATIONAL_NEED",
  "changeNotes": "Customer request for later start"
}
```

### Compliance Reports

#### GET /rosters/organization/:orgId/compliance-report
Generate compliance report for Arbeidstilsynet.

**Query Parameters:**
- `startDate`: ISO 8601 date (required)
- `endDate`: ISO 8601 date (required)

**Response:**
```json
{
  "reportId": "report-uuid",
  "report": {
    "generatedAt": "2024-01-31T10:00:00Z",
    "periodStart": "2022-01-01",
    "periodEnd": "2024-01-31",
    "organizationName": "Example AS",
    "organizationNumber": "123456789",
    "employees": [
      {
        "userId": "uuid",
        "employeeName": "John Doe",
        "employeeNumber": "EMP001",
        "totalPlannedHours": 1680,
        "totalActualHours": 1690,
        "totalOvertimeHours": 45,
        "violations": [...]
      }
    ],
    "summary": {
      "totalEmployees": 25,
      "totalPlannedHours": 42000,
      "totalActualHours": 42250,
      "totalViolations": 3,
      "latePublications": 1
    }
  }
}
```

#### GET /rosters/organization/:orgId/compliance-report/export
Export compliance report as CSV or JSON.

**Query Parameters:**
- `startDate`: ISO 8601 date (required)
- `endDate`: ISO 8601 date (required)
- `format`: `csv` or `json` (default: `json`)

**Response:** File download

### Employee Portal

#### GET /employee/shifts
Get employee's own shifts.

**Query Parameters:**
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

#### GET /employee/rosters
Get published rosters that include the employee.

#### GET /employee/preferences
Get employee's scheduling preferences.

#### POST /employee/preferences
Create or update scheduling preferences.

**Request:**
```json
{
  "preferredDays": ["Monday", "Tuesday", "Wednesday"],
  "avoidDays": ["Sunday"],
  "preferMorning": true,
  "preferEvening": false,
  "preferNight": false,
  "maxHoursPerWeek": 37.5,
  "unavailableFrom": "2024-02-15T00:00:00Z",
  "unavailableTo": "2024-02-20T23:59:59Z",
  "unavailableReason": "Vacation"
}
```

#### GET /employee/notifications
Get unread notifications.

#### POST /employee/notifications/:id/read
Mark notification as read.

#### POST /employee/notifications/read-all
Mark all notifications as read.

#### GET /employee/hours-summary
Get summary of hours worked.

**Query Parameters:**
- `startDate`: ISO 8601 date (optional)
- `endDate`: ISO 8601 date (optional)

## Error Responses

All endpoints may return error responses in this format:

```json
{
  "error": "Error message",
  "details": [...]
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

## Compliance Features

### Automatic Validation

Every shift creation is automatically validated against:
- **11-hour daily rest requirement**
- **35-hour weekly rest requirement**
- **9-hour daily work limit**
- **40-hour weekly work limit**
- **Overtime limits** (10h/week, 25h/4weeks, 200h/year)

### 14-Day Rule

When publishing a roster, the system automatically:
1. Calculates days until roster starts
2. Checks if publication is at least 14 days before start
3. Flags late publications
4. Logs the publication event for audit

### Audit Trail

All roster operations are logged with:
- Action type
- User who performed the action
- Timestamp
- Detailed change information
- Retention period (2+ years as required by law)
