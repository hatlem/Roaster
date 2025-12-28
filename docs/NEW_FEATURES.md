# New Features Documentation

## Overview

This document describes all new features added to transform the Roster SaaS from production-ready to industry-leading competitive positioning.

## Table of Contents

1. [Internationalization (i18n)](#internationalization)
2. [Visual Compliance Indicators](#visual-compliance-indicators)
3. [Labor Cost Tracking](#labor-cost-tracking)
4. [Shift Marketplace](#shift-marketplace)
5. [Time-Off Requests](#time-off-requests)
6. [Dashboard & Analytics](#dashboard-analytics)
7. [Mobile App](#mobile-app)
8. [Enhanced Database Schema](#enhanced-database-schema)

---

## 1. Internationalization (i18n)

**Location:** `src/utils/i18n.ts`

### Features
- Full Norwegian (Bokmål) and English support
- Translation function with type safety
- Norwegian date/time formatting (24-hour clock, DD.MM.YYYY)
- Currency formatting (NOK)

### Usage

```typescript
import { t, formatDate, formatCurrency } from '../utils/i18n';

// Get translation
const title = t('no', 'roster.title'); // "Vaktplan"

// Format date (Norwegian style)
const date = formatDate(new Date(), 'no'); // "31.01.2024"

// Format currency
const cost = formatCurrency(5000, 'no'); // "kr 5 000,00"
```

### Available Translations
- **Common**: cancel, save, delete, edit, create, close, yes, no
- **Auth**: login, logout, register, email, password
- **Roster**: title, create, publish, draft, published, shifts
- **Compliance**: violation, warning, compliant, rest period violations
- **Employee**: employees, schedule, preferences, notifications

### Adding New Translations

1. Add to `norwegianTranslations` and `englishTranslations` in `i18n.ts`
2. Update `Translations` interface for type safety
3. Use `t(locale, 'key.path')` to access

---

## 2. Visual Compliance Indicators

**Location:** `src/services/visualComplianceGenerator.ts`, `src/types/index.enhanced.ts`

### Features
- Color-coded status indicators (green/yellow/red)
- Severity levels (low, medium, high, critical)
- Quick-fix suggestions
- Icon recommendations for UI

### Status Types
- **Compliant** (green): All rules satisfied
- **Warning** (yellow): Close to limits, needs attention
- **Violation** (red): Rule broken, action required

### Usage

```typescript
import { VisualComplianceGenerator } from '../services/visualComplianceGenerator';

// For rest period violations
const indicator = VisualComplianceGenerator.forRestPeriodViolation(violation);
// Returns:
// {
//   status: 'violation',
//   color: 'red',
//   icon: 'error',
//   message: 'Insufficient daily rest: 8 hours...',
//   severity: 'critical',
//   quickFixes: [
//     { action: 'add_rest_time', description: 'Add 3 hours rest...', ... }
//   ]
// }

// For roster summary
const summary = VisualComplianceGenerator.forRosterSummary({
  totalShifts: 100,
  shiftsWithViolations: 2,
  shiftsWithWarnings: 5,
  isLatePublication: false
});
```

### Quick Fix Suggestions
Automatically generated suggestions to resolve violations:
- Add rest time
- Reduce shift duration
- Redistribute hours
- Reschedule shift
- Acknowledge violation

### Integration Points
- API responses include `visualIndicator` field
- Frontend can use colors/icons directly
- Tooltips show detailed messages
- Quick-fix buttons trigger suggested actions

---

## 3. Labor Cost Tracking

**Location:** `src/services/laborCostCalculator.ts`

### Features
- Hourly rate tracking per employee
- Overtime premium calculation (40% Norwegian minimum)
- Budget vs. actual variance
- Department-level cost breakdown

### Usage

```typescript
import { LaborCostCalculator } from '../services/laborCostCalculator';

const calculator = new LaborCostCalculator(config);

// Calculate shift cost
const cost = calculator.calculateShiftCost({
  startTime: new Date('2024-01-15T08:00:00Z'),
  endTime: new Date('2024-01-15T17:00:00Z'),
  breakMinutes: 30,
  userId: 'user-id',
  hourlyRate: 200, // NOK
});

// Returns:
// {
//   hourlyRate: 200,
//   totalHours: 8.5,
//   regularHours: 8.5,
//   overtimeHours: 0,
//   totalCost: 1700,
//   regularCost: 1700,
//   overtimeCost: 0,
//   overtimeMultiplier: 1.4
// }
```

### Features
- **Regular vs. Overtime Split**: Automatically calculates based on daily limits
- **Premium Calculation**: 40% minimum as per Norwegian law
- **Aggregation**: Calculate total cost for multiple shifts
- **Variance Analysis**: Budget vs. actual with percentage

### Database Schema Addition
```prisma
model LaborCost {
  budgetedHours
  budgetedCost
  scheduledHours
  scheduledCost
  actualHours
  actualCost
  variance
  variancePercent
  departmentBreakdown (JSON)
}
```

---

## 4. Shift Marketplace

**Location:** `src/services/shiftMarketplaceService.ts`, `src/routes/marketplace.routes.ts`

### Features
- Post available shifts
- Employee browsing and claiming
- Manager approval workflow
- Eligibility filters
- Real-time status tracking

### API Endpoints

#### POST /api/marketplace/shifts
Post a shift to marketplace

```json
{
  "shiftId": "uuid",
  "availableUntil": "2024-01-15T12:00:00Z",
  "reason": "Personal conflict",
  "eligibleRoles": ["Server", "Bartender"],
  "eligibleUserIds": ["user-1", "user-2"]
}
```

#### GET /api/marketplace/shifts
Get available shifts

Response includes:
- Shift details (time, location, department)
- Original assignee
- Eligibility status
- Time remaining to claim

#### POST /api/marketplace/shifts/:id/claim
Claim a shift

Automatic checks:
- Eligibility (role, specific users)
- Deadline not passed
- Shift still available

#### POST /api/marketplace/shifts/:id/approve
Approve shift claim (manager only)

Actions:
- Updates shift assignment
- Notifies both employees
- Logs to audit trail

### Workflow

1. **Employee posts shift** → Status: AVAILABLE
2. **Other employee claims** → Status: CLAIMED
3. **Manager approves** → Status: APPROVED, shift reassigned
4. **Alternative**: Manager rejects → Status: AVAILABLE again

### Database Schema
```prisma
model ShiftMarketplaceListing {
  shiftId
  postedBy
  availableUntil
  reason
  eligibleRoles
  eligibleUserIds
  claimedBy
  claimedAt
  status (AVAILABLE, CLAIMED, APPROVED, REJECTED)
  approvedBy
  approvedAt
}
```

---

## 5. Time-Off Requests

**Location:** `src/services/timeOffService.ts`, `src/routes/timeoff.routes.ts`

### Features
- Multiple time-off types (vacation, sick, personal, parental)
- Accrual balance tracking
- Working days calculation (excludes weekends)
- Approval workflow
- Automatic balance deduction

### Time-Off Types
- VACATION
- SICK_LEAVE
- PERSONAL
- PARENTAL
- BEREAVEMENT
- UNPAID
- OTHER

### API Endpoints

#### POST /api/timeoff/requests
Submit time-off request

```json
{
  "type": "VACATION",
  "startDate": "2024-02-15T00:00:00Z",
  "endDate": "2024-02-20T23:59:59Z",
  "reason": "Family vacation",
  "attachment": "https://example.com/doctors-note.pdf"
}
```

Automatic calculations:
- Working days (excludes weekends)
- Balance check (sufficient accrual)
- Overlapping requests validation

#### GET /api/timeoff/requests
Get user's requests

```json
{
  "requests": [
    {
      "id": "uuid",
      "type": "VACATION",
      "startDate": "2024-02-15",
      "totalDays": 5,
      "status": "PENDING",
      "reason": "Family vacation"
    }
  ]
}
```

#### POST /api/timeoff/requests/:id/approve
Approve/reject request (manager only)

```json
{
  "approve": true,
  "rejectionReason": "Insufficient coverage" // if approve=false
}
```

Actions on approval:
- Deduct from accrual balance
- Update request status
- Notify employee
- Log to audit

#### GET /api/timeoff/balance
Get accrual balances

```json
{
  "balances": [
    {
      "type": "VACATION",
      "year": 2024,
      "earnedDays": 25,  // Norwegian standard: 5 weeks
      "usedDays": 10,
      "remainingDays": 15,
      "carryOverDays": 0,
      "annualEntitlement": 25
    }
  ]
}
```

### Norwegian Standards
- **Vacation**: 25 days/year (5 weeks)
- **Sick Leave**: Tracked separately, no limit
- **Parental Leave**: Per government guidelines

### Database Schema
```prisma
model TimeOffRequest {
  userId
  type
  startDate
  endDate
  totalDays (calculated)
  status (PENDING, APPROVED, REJECTED)
  approvedBy
  deductedFrom (accrual type)
  deductedDays
}

model AccrualBalance {
  userId
  type (VACATION, SICK_LEAVE, etc.)
  year
  earnedDays
  usedDays
  remainingDays
  annualEntitlement
  carryOverDays
}
```

---

## 6. Dashboard & Analytics

**Location:** `src/services/dashboardService.ts`, `src/routes/dashboard.routes.ts`

### Features
- Real-time KPIs and metrics
- Week-over-week comparison
- Labor cost analysis
- Compliance rate tracking
- Attendance monitoring
- Overtime tracking

### API Endpoints

#### GET /api/dashboard/metrics
Get comprehensive metrics

Query parameters:
- `organizationId` (required)
- `startDate` (required)
- `endDate` (required)

Response:
```json
{
  "metrics": {
    "period": {
      "start": "2024-01-01T00:00:00Z",
      "end": "2024-01-31T23:59:59Z"
    },
    "labor": {
      "budgetedHours": 1000,
      "scheduledHours": 1050,
      "actualHours": 1080,
      "budgetedCost": 200000,
      "scheduledCost": 210000,
      "actualCost": 216000,
      "variance": 16000,
      "variancePercentage": 8.0
    },
    "compliance": {
      "totalShifts": 250,
      "compliantShifts": 240,
      "shiftsWithWarnings": 8,
      "shiftsWithViolations": 2,
      "complianceRate": 96.0,
      "latePublications": 1
    },
    "attendance": {
      "totalShifts": 250,
      "completedShifts": 245,
      "missedShifts": 5,
      "lateShifts": 3,
      "attendanceRate": 98.0
    },
    "overtime": {
      "totalOvertimeHours": 120,
      "overtimeCost": 33600,
      "employeesWithOvertime": 15,
      "averageOvertimePerEmployee": 8.0
    }
  }
}
```

#### GET /api/dashboard/weekly-comparison
Week-over-week comparison

```json
{
  "comparison": {
    "thisWeek": { /* metrics */ },
    "lastWeek": { /* metrics */ },
    "changes": {
      "laborCost": 5000,        // +5000 NOK
      "complianceRate": -2.5,   // -2.5%
      "attendanceRate": 1.0,    // +1.0%
      "overtimeHours": -10      // -10 hours
    }
  }
}
```

#### GET /api/dashboard/summary
Quick homepage summary

```json
{
  "summary": {
    "currentWeek": {
      "complianceRate": 96.0,
      "laborCost": 50000,
      "budgetVariance": 8.0,
      "attendanceRate": 98.0
    },
    "alerts": {
      "violations": 2,
      "latePublications": 0,
      "overBudget": true
    }
  }
}
```

### Metric Types
- **Labor**: Budget vs. actual analysis
- **Compliance**: Violation tracking
- **Attendance**: Show-up rate, missed shifts
- **Overtime**: Hours and cost tracking

---

## 7. Mobile App

**Location:** `mobile/`

### Features
- React Native (iOS + Android)
- Push notifications
- Offline support
- Biometric authentication
- Norwegian + English

### Key Screens
1. **Login**: Email/password with biometric option
2. **Schedule**: Calendar view with color-coded compliance
3. **Shift Details**: Time, location, compliance status
4. **Marketplace**: Browse and claim available shifts
5. **Time-Off**: Submit requests, view balances
6. **Notifications**: Real-time updates
7. **Profile**: Settings, preferences, language

### Push Notifications
- New roster published
- Shift changed
- Shift swap request
- Time-off approved/rejected
- Upcoming shift reminder (1 hour before)
- Marketplace shift available

### API Integration

```typescript
import api from './services/api';

// Login
const { token, user } = await api.login(email, password);

// Get schedule
const shifts = await api.getMyShifts(startDate, endDate);

// Claim shift
await api.claimShift(listingId);

// Submit time-off
await api.submitTimeOffRequest({
  type: 'VACATION',
  startDate: '2024-02-15',
  endDate: '2024-02-20',
  reason: 'Family vacation'
});
```

### Setup

```bash
cd mobile
npm install
npm run ios     # iOS
npm run android # Android
```

See `mobile/README.md` for full documentation.

---

## 8. Enhanced Database Schema

**Location:** `prisma/schema.enhanced.prisma`

### New Models

#### Location
Multi-location support for chains
- Organization can have multiple locations
- Each location has own budget and settings
- Users assigned to specific location

#### ShiftMarketplaceListing
Shift availability posting
- Links to shift
- Posted by user
- Claim status tracking
- Eligibility rules

#### ShiftSwapRequest
Peer-to-peer shift swaps
- Requester and target
- Optional offered shift in exchange
- Approval workflow

#### TimeOffRequest
Time-off management
- Multiple types
- Working days calculation
- Approval workflow
- Accrual deduction tracking

#### AccrualBalance
Vacation/sick time tracking
- Per user, per type, per year
- Earned, used, remaining
- Carry-over support
- Norwegian standards (25 days vacation)

#### LaborCost
Cost tracking and budgeting
- Budgeted vs. scheduled vs. actual
- Regular and overtime split
- Variance analysis
- Department breakdown

#### DashboardMetric
Pre-calculated metrics for performance
- Different metric types
- Time period indexed
- JSON flexible data storage

### Schema Updates to Existing Models

**User additions:**
- `hourlyRate`: For labor cost calculation
- `locationId`: Multi-location support
- Relations to new models

**Shift additions:**
- `hourlyRate`: Override user's rate if needed
- `laborCost`: Calculated field
- Relation to marketplace listing

**Organization additions:**
- `laborBudgetPerWeek`: Budget tracking
- `overtimePremium`: Configurable (default 1.4 = 40%)
- Relation to locations

---

## Migration Guide

### From MVP to Full Features

1. **Run Enhanced Schema Migration**
```bash
# Review schema
cat prisma/schema.enhanced.prisma

# Create migration (when ready)
npx prisma migrate dev --name add_competitive_features
```

2. **Update Environment Variables**
```bash
# No new required variables
# Optional: Configure labor budgets per organization
```

3. **Update Frontend**
```typescript
// Use new visual indicators
const indicator = response.data.validation.visualIndicator;
<Badge color={indicator.color}>{indicator.message}</Badge>

// Display labor costs
<Text>Scheduled Cost: {formatCurrency(roster.laborCost)}</Text>

// Show marketplace
<ShiftMarketplace listings={availableShifts} />
```

4. **Enable Mobile App**
```bash
cd mobile
npm install
# Configure push notifications
# Update API_URL in src/services/api.ts
npm run ios  # or android
```

### Testing New Features

```bash
# Run tests
npm test

# Test specific features
npm test -- --testNamePattern="marketplace"
npm test -- --testNamePattern="timeoff"
npm test -- --testNamePattern="labor cost"
```

### Rollout Strategy

**Phase 1: Backend (Week 1)**
- Deploy enhanced API
- Run database migrations
- Test with Postman/API client

**Phase 2: Dashboard (Week 2)**
- Update admin UI with new metrics
- Add marketplace management
- Time-off approval interface

**Phase 3: Employee Portal (Week 3)**
- Add marketplace claiming
- Time-off request form
- Enhanced schedule view with colors

**Phase 4: Mobile (Week 4)**
- Beta test mobile app
- Configure push notifications
- Gather feedback

---

## API Summary

### New Endpoints

**Marketplace:**
- `POST /api/marketplace/shifts` - Post shift
- `GET /api/marketplace/shifts` - Browse shifts
- `POST /api/marketplace/shifts/:id/claim` - Claim shift
- `POST /api/marketplace/shifts/:id/approve` - Approve claim

**Time-Off:**
- `POST /api/timeoff/requests` - Submit request
- `GET /api/timeoff/requests` - Get user's requests
- `GET /api/timeoff/requests/pending` - Pending (manager)
- `POST /api/timeoff/requests/:id/approve` - Approve/reject
- `GET /api/timeoff/balance` - Get balances
- `GET /api/timeoff/balance/:type` - Get specific balance

**Dashboard:**
- `GET /api/dashboard/metrics` - Full metrics
- `GET /api/dashboard/weekly-comparison` - Week-over-week
- `GET /api/dashboard/summary` - Quick summary

### Enhanced Existing Endpoints

All shift/roster responses now include:
- `visualIndicator`: Color-coded compliance status
- `laborCost`: Calculated costs
- Enhanced validation with quick-fixes

---

## Performance Considerations

### Caching Strategy
- Dashboard metrics cached for 5 minutes
- Marketplace listings cached per user
- Accrual balances cached until changed

### Database Indexes
All new tables include proper indexes:
- User lookups
- Date range queries
- Status filtering
- Organization filtering

### Mobile Optimization
- Offline-first architecture
- Local caching of schedule
- Background sync
- Push notification delivery

---

## Security Considerations

### Authorization
- Marketplace: Employee can only claim eligible shifts
- Time-Off: Manager approval required
- Dashboard: Manager/Admin only
- Mobile: JWT with refresh tokens

### Data Privacy
- Users see only own time-off/marketplace activity
- Managers see only their organization's data
- Audit logging for all sensitive actions
- GDPR-compliant data handling

---

## Support

For questions about new features:
- See API documentation: `docs/API.md`
- Review code examples in services
- Check mobile app README: `mobile/README.md`
- Open GitHub issue for bugs

## Changelog

See `CHANGELOG.md` for version history and feature releases.
