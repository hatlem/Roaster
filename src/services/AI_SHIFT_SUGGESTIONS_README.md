# AI Shift Suggestions Service

## Overview

The AI Shift Suggestions Service provides intelligent, rule-based scheduling recommendations that consider employee preferences, compliance constraints, historical patterns, skills, and labor costs. This service helps managers create optimal schedules while maintaining compliance with Norwegian labor laws.

**Location:** `/home/user/Roaster/src/services/aiShiftSuggestionService.ts`

## Key Features

### 1. Multi-Factor Scoring System
The service calculates a comprehensive fit score (0-100) for each employee-shift combination based on:

- **Preference Score (30%)**: Employee's day/time preferences and availability
- **Compliance Score (30%)**: Rest periods and working hours compliance
- **Historical Score (20%)**: Past work patterns and consistency
- **Availability Score (10%)**: Current availability and conflicts
- **Cost Score (10%)**: Labor cost optimization and overtime avoidance

### 2. Smart Scheduling Algorithms
- Suggests best employees for each shift based on fit scores
- Automatically generates full schedules with optimal assignments
- Identifies optimization opportunities in existing schedules
- Predicts employee availability using historical patterns

### 3. Compliance-First Approach
- Integrates with `RestPeriodValidator` for 11-hour daily rest and 35-hour weekly rest
- Uses `WorkingHoursValidator` for daily/weekly limits and overtime tracking
- Leverages `LaborCostCalculator` for cost-effective scheduling
- Flags violations, warnings, and compliance status for each suggestion

## Core Methods

### `calculateFitScore(userId, shift, rosterId?)`
Calculate how well an employee fits a specific shift.

**Returns:**
```typescript
{
  score: number;              // 0-100
  breakdown: {
    preferenceScore: number;  // 0-30
    complianceScore: number;  // 0-30
    historicalScore: number;  // 0-20
    availabilityScore: number; // 0-10
    costScore: number;        // 0-10
  };
  reasons: string[];          // Why this score was given
  warnings: string[];         // Compliance warnings
}
```

**Use Cases:**
- Evaluate if an employee is suitable for a shift
- Compare multiple candidates for the same shift
- Understand why certain employees are better fits

### `suggestShiftAssignments(rosterId, shifts)`
Get ranked employee suggestions for each shift.

**Parameters:**
- `rosterId`: The roster ID
- `shifts`: Array of shift requirements

**Returns:**
```typescript
{
  shift: ShiftRequirement;
  suggestions: EmployeeSuggestion[];  // Sorted by fit score
  bestMatch?: EmployeeSuggestion;     // Highest scoring compliant option
}[]
```

**Use Cases:**
- Get candidate lists for manual assignment
- Review multiple options before scheduling
- Understand trade-offs between candidates

### `autoSchedule(rosterId, requirements)`
Automatically generate a complete schedule.

**Parameters:**
- `rosterId`: The roster ID
- `requirements`: Array of all shifts to schedule

**Returns:**
```typescript
{
  scheduledShifts: Array<{
    requirement: ShiftRequirement;
    assignedUser: string;
    fitScore: number;
    estimatedCost: number;
  }>;
  unscheduledShifts: Array<{
    requirement: ShiftRequirement;
    reason: string;
  }>;
  totalCost: number;
  complianceSummary: {
    compliantShifts: number;
    warningShifts: number;
    violationShifts: number;
  };
  suggestions: string[];  // Actionable recommendations
}
```

**Use Cases:**
- Quickly generate a weekly or monthly schedule
- Get initial schedule draft for review
- Ensure fair distribution of shifts

### `optimizeExistingSchedule(rosterId)`
Find opportunities to improve an existing schedule.

**Returns:**
```typescript
{
  type: 'swap' | 'split' | 'merge' | 'reassign' | 'cost_reduction';
  description: string;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  affectedShifts: string[];
  suggestedChanges: Array<{
    shiftId: string;
    currentUserId?: string;
    suggestedUserId?: string;
    reason: string;
  }>;
  complianceImpact: 'improves' | 'neutral' | 'worsens';
  implementationDifficulty: 'easy' | 'medium' | 'hard';
}[]
```

**Use Cases:**
- Reduce labor costs while maintaining compliance
- Improve employee satisfaction by matching preferences
- Fix compliance violations in published schedules
- Balance workload across employees

### `predictAvailability(userId, dateRange)`
Predict when an employee is likely to be available.

**Parameters:**
- `userId`: Employee ID
- `dateRange`: { start: Date, end: Date }

**Returns:**
```typescript
{
  userId: string;
  date: Date;
  predictedAvailable: boolean;
  confidence: number;  // 0-100
  factors: {
    historicalPattern: number;
    preferences: number;
    recentSchedule: number;
    dayOfWeek: number;
  };
  reasoning: string[];
}[]
```

**Use Cases:**
- Plan future schedules
- Identify coverage gaps
- Proactively address staffing needs

## Scoring Algorithm Details

### Preference Score (0-30 points)

**Day Preferences (+10/-10 points)**
- +10 if shift is on a preferred day
- -10 if shift is on an avoided day
- 0 if neutral

**Time Preferences (+5 points)**
- +5 for morning shifts (6AM-12PM) if preferMorning
- +5 for evening shifts (12PM-8PM) if preferEvening
- +5 for night shifts (8PM-6AM) if preferNight

**Unavailability (0 points)**
- Score drops to 0 if employee marked unavailable

### Compliance Score (0-30 points)

**Rest Period Compliance (15 points)**
- Full 15 points if no rest period violations
- 0 points if violations exist
- Checks both daily (11 hours) and weekly (35 hours) rest

**Working Hours Compliance (15 points)**
- Full 15 points if within daily/weekly limits
- 0 points if violations exist
- Considers both regular and overtime limits

### Historical Score (0-20 points)

**Pattern Matching**
- Analyzes last 4 weeks of actual hours worked
- Finds shifts on same day of week and similar time
- Higher score for shifts matching historical patterns
- Considers average hours worked on similar shifts

**Calculation:**
```
similarity = 1 - min(|shiftHours - avgHistoricalHours| / shiftHours, 1)
score = similarity * 20
```

### Availability Score (0-10 points)

**Conflict Checking**
- 0 points if overlapping shifts exist
- 0 points if approved time-off exists
- 5 points if pending time-off exists
- 10 points if fully available

### Cost Score (0-10 points)

**Overtime Avoidance**
- 0 points if shift would trigger overtime
- 2-5 points if close to weekly limit (80-100%)
- 5-10 points if well below limit (<80%)

**Weekly Load Balance**
- Considers total weekly hours including this shift
- Prefers employees with lighter weekly loads

## Integration Guide

### With RosterService

```typescript
import { RosterService } from './rosterService';
import { AIShiftSuggestionService } from './aiShiftSuggestionService';

const rosterService = new RosterService();
const aiService = new AIShiftSuggestionService();

// 1. Get suggestions
const suggestions = await aiService.suggestShiftAssignments(rosterId, [shiftReq]);

// 2. Use best match to create shift
const bestMatch = suggestions[0].bestMatch;
if (bestMatch && bestMatch.complianceStatus !== 'violation') {
  await rosterService.addShift(
    rosterId,
    bestMatch.userId,
    shift.startTime,
    shift.endTime,
    shift.breakMinutes,
    shift.department,
    shift.location,
    `AI suggested - fit: ${bestMatch.fitScore}`,
    managerId,
    managerEmail
  );
}
```

### With Dashboard/Analytics

```typescript
// Analyze schedule quality
const roster = await prisma.roster.findUnique({
  where: { id: rosterId },
  include: { shifts: true },
});

// Calculate average fit score
const fitScores = await Promise.all(
  roster.shifts.map(shift =>
    aiService.calculateFitScore(shift.userId, shift)
  )
);

const avgFitScore = fitScores.reduce((sum, f) => sum + f.score, 0) / fitScores.length;
console.log(`Average schedule quality: ${avgFitScore}/100`);
```

### As API Endpoint

```typescript
// routes/ai-suggestions.routes.ts
import express from 'express';
import { AIShiftSuggestionService } from '../services/aiShiftSuggestionService';

const router = express.Router();
const aiService = new AIShiftSuggestionService();

router.post('/rosters/:rosterId/suggestions', async (req, res) => {
  const { rosterId } = req.params;
  const { shifts } = req.body;

  const suggestions = await aiService.suggestShiftAssignments(rosterId, shifts);
  res.json(suggestions);
});

router.post('/rosters/:rosterId/auto-schedule', async (req, res) => {
  const { rosterId } = req.params;
  const { requirements } = req.body;

  const result = await aiService.autoSchedule(rosterId, requirements);
  res.json(result);
});

router.get('/rosters/:rosterId/optimizations', async (req, res) => {
  const { rosterId } = req.params;

  const optimizations = await aiService.optimizeExistingSchedule(rosterId);
  res.json(optimizations);
});
```

## Performance Considerations

### Database Queries
- Service makes multiple database queries per calculation
- Consider caching employee data for batch operations
- Use database indexes on userId, startTime, and rosterId

### Optimization for Large Teams
```typescript
// For large teams (100+ employees), consider batching:
const employeeBatches = chunkArray(employees, 20);
for (const batch of employeeBatches) {
  const scores = await Promise.all(
    batch.map(emp => aiService.calculateFitScore(emp.id, shift))
  );
  // Process scores
}
```

### Caching Strategy
```typescript
// Cache employee preferences and historical data
const cache = new Map<string, EmployeeData>();

// Refresh cache periodically or on updates
async function getCachedEmployeeData(userId: string) {
  if (!cache.has(userId)) {
    const data = await fetchEmployeeData(userId);
    cache.set(userId, data);
  }
  return cache.get(userId);
}
```

## Testing Examples

```typescript
describe('AIShiftSuggestionService', () => {
  it('should prefer employees with matching day preferences', async () => {
    const result = await aiService.calculateFitScore(userId, mondayShift);
    expect(result.reasons).toContain('Prefers Monday');
    expect(result.breakdown.preferenceScore).toBeGreaterThan(20);
  });

  it('should penalize shifts causing compliance violations', async () => {
    const result = await aiService.calculateFitScore(userId, violatingShift);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.breakdown.complianceScore).toBeLessThan(30);
  });

  it('should auto-schedule without violations when possible', async () => {
    const result = await aiService.autoSchedule(rosterId, requirements);
    expect(result.complianceSummary.violationShifts).toBe(0);
  });
});
```

## Future Enhancements

### Potential Additions
1. **Machine Learning Integration**: Replace rule-based scoring with ML models trained on historical data
2. **Skills Matching**: Add certification and skill-based requirements
3. **Team Composition**: Consider team dynamics and preferred co-workers
4. **Shift Templates**: Support for recurring shift patterns
5. **Multi-Objective Optimization**: Balance cost, satisfaction, and compliance with weights
6. **Real-time Updates**: WebSocket notifications for schedule changes
7. **Employee Feedback Loop**: Learn from employee swap requests and preferences
8. **Demand Forecasting**: Predict staffing needs based on historical patterns

### Extensibility Points
```typescript
// Custom scoring factors
interface CustomScoringFactor {
  name: string;
  weight: number;
  calculate: (employee: User, shift: Shift) => number;
}

// Plugin system for additional constraints
interface SchedulingConstraint {
  validate: (shift: Shift, employee: User) => boolean;
  priority: number;
}
```

## Dependencies

- `@prisma/client`: Database access for employees, shifts, preferences, and historical data
- `date-fns`: Date manipulation for time-based calculations
- `laborCostCalculator`: Labor cost estimation with overtime premiums
- `restPeriodValidator`: Norwegian labor law rest period validation
- `workingHoursValidator`: Daily/weekly hours and overtime limit validation

## License

MIT - Part of the Roaster SaaS application
