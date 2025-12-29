// Example usage of AI Shift Suggestions Service
// This file demonstrates how to use the various methods

import { AIShiftSuggestionService, ShiftRequirement } from './aiShiftSuggestionService';
import { addDays, addHours, setHours } from 'date-fns';

// Initialize the service
const aiService = new AIShiftSuggestionService();

// ============================================================================
// Example 1: Calculate fit score for an employee and shift
// ============================================================================
async function exampleCalculateFitScore() {
  const userId = 'employee-uuid-here';
  const rosterId = 'roster-uuid-here';

  const shift: ShiftRequirement = {
    startTime: setHours(new Date(), 9), // 9 AM today
    endTime: setHours(new Date(), 17), // 5 PM today
    breakMinutes: 30,
    department: 'Kitchen',
  };

  const fitResult = await aiService.calculateFitScore(userId, shift, rosterId);

  console.log('Fit Score:', fitResult.score); // 0-100
  console.log('Breakdown:', fitResult.breakdown);
  console.log('Reasons:', fitResult.reasons);
  console.log('Warnings:', fitResult.warnings);

  // Example output:
  // Fit Score: 78
  // Breakdown: {
  //   preferenceScore: 25,
  //   complianceScore: 30,
  //   historicalScore: 15,
  //   availabilityScore: 10,
  //   costScore: 8
  // }
  // Reasons: [
  //   'Prefers Monday',
  //   'Prefers morning shifts',
  //   'Compliant with rest period requirements',
  //   'Has worked 5 similar shifts',
  //   'Fully available'
  // ]
}

// ============================================================================
// Example 2: Suggest employees for shifts
// ============================================================================
async function exampleSuggestShiftAssignments() {
  const rosterId = 'roster-uuid-here';

  // Define shift requirements
  const shifts: ShiftRequirement[] = [
    {
      startTime: setHours(new Date(), 9),
      endTime: setHours(new Date(), 17),
      breakMinutes: 30,
      department: 'Kitchen',
    },
    {
      startTime: setHours(addDays(new Date(), 1), 9),
      endTime: setHours(addDays(new Date(), 1), 17),
      breakMinutes: 30,
      department: 'Service',
    },
  ];

  const suggestions = await aiService.suggestShiftAssignments(rosterId, shifts);

  suggestions.forEach((suggestion, index) => {
    console.log(`\nShift ${index + 1}:`);
    console.log('Best match:', suggestion.bestMatch);
    console.log('All candidates:', suggestion.suggestions.length);

    // Show top 3 candidates
    suggestion.suggestions.slice(0, 3).forEach((candidate, i) => {
      console.log(`  ${i + 1}. ${candidate.user?.firstName} ${candidate.user?.lastName}`);
      console.log(`     Score: ${candidate.fitScore}`);
      console.log(`     Cost: NOK ${candidate.estimatedCost.toFixed(2)}`);
      console.log(`     Status: ${candidate.complianceStatus}`);
    });
  });

  // Example output:
  // Shift 1:
  // Best match: { userId: '...', fitScore: 85, ... }
  // All candidates: 12
  //   1. John Doe
  //      Score: 85
  //      Cost: NOK 1350.00
  //      Status: compliant
  //   2. Jane Smith
  //      Score: 78
  //      Cost: NOK 1400.00
  //      Status: compliant
}

// ============================================================================
// Example 3: Auto-schedule a full roster
// ============================================================================
async function exampleAutoSchedule() {
  const rosterId = 'roster-uuid-here';

  // Create a week's worth of shifts
  const requirements: ShiftRequirement[] = [];
  const today = new Date();

  for (let day = 0; day < 7; day++) {
    const date = addDays(today, day);

    // Morning shift
    requirements.push({
      startTime: setHours(date, 8),
      endTime: setHours(date, 16),
      breakMinutes: 30,
      department: 'Kitchen',
    });

    // Evening shift
    requirements.push({
      startTime: setHours(date, 16),
      endTime: addHours(setHours(date, 16), 8),
      breakMinutes: 30,
      department: 'Service',
    });
  }

  const result = await aiService.autoSchedule(rosterId, requirements);

  console.log('Auto-Schedule Results:');
  console.log('Scheduled shifts:', result.scheduledShifts.length);
  console.log('Unscheduled shifts:', result.unscheduledShifts.length);
  console.log('Total estimated cost: NOK', result.totalCost.toFixed(2));
  console.log('\nCompliance Summary:');
  console.log('  Compliant:', result.complianceSummary.compliantShifts);
  console.log('  Warnings:', result.complianceSummary.warningShifts);
  console.log('  Violations:', result.complianceSummary.violationShifts);
  console.log('\nSuggestions:');
  result.suggestions.forEach(s => console.log('  -', s));

  // Example output:
  // Auto-Schedule Results:
  // Scheduled shifts: 13
  // Unscheduled shifts: 1
  // Total estimated cost: NOK 17550.00
  //
  // Compliance Summary:
  //   Compliant: 11
  //   Warnings: 2
  //   Violations: 0
  //
  // Suggestions:
  //   - Unable to schedule shift on Jan 15, 2024 at 4:00 PM: All candidates have compliance violations
  //   - Employee abc-123 assigned 6 shifts - consider load balancing
}

// ============================================================================
// Example 4: Optimize existing schedule
// ============================================================================
async function exampleOptimizeSchedule() {
  const rosterId = 'roster-uuid-here';

  const optimizations = await aiService.optimizeExistingSchedule(rosterId);

  console.log(`Found ${optimizations.length} optimization opportunities:\n`);

  optimizations.forEach((opt, index) => {
    console.log(`${index + 1}. ${opt.type.toUpperCase()}: ${opt.description}`);
    console.log(`   Savings: NOK ${opt.savings.toFixed(2)}`);
    console.log(`   Difficulty: ${opt.implementationDifficulty}`);
    console.log(`   Compliance impact: ${opt.complianceImpact}`);
    console.log(`   Affected shifts: ${opt.affectedShifts.length}`);
    console.log('');
  });

  // Example output:
  // Found 5 optimization opportunities:
  //
  // 1. REASSIGN: Reassign shift from John Doe to Jane Smith
  //    Savings: NOK 150.00
  //    Difficulty: easy
  //    Compliance impact: improves
  //    Affected shifts: 1
  //
  // 2. SWAP: Swap shifts between Alice and Bob to better match preferences
  //    Savings: NOK 0.00
  //    Difficulty: medium
  //    Compliance impact: neutral
  //    Affected shifts: 2
}

// ============================================================================
// Example 5: Predict employee availability
// ============================================================================
async function examplePredictAvailability() {
  const userId = 'employee-uuid-here';

  const predictions = await aiService.predictAvailability(userId, {
    start: new Date(),
    end: addDays(new Date(), 14), // Next 2 weeks
  });

  console.log('Availability Predictions:\n');

  predictions.forEach(pred => {
    const date = pred.date.toLocaleDateString();
    const available = pred.predictedAvailable ? 'AVAILABLE' : 'UNAVAILABLE';
    const confidence = `${pred.confidence}%`;

    console.log(`${date}: ${available} (${confidence} confidence)`);
    pred.reasoning.forEach(reason => console.log(`  - ${reason}`));
  });

  // Example output:
  // Availability Predictions:
  //
  // 1/15/2024: AVAILABLE (75% confidence)
  //   - Historically works on Monday (8 times)
  //   - Prefers Monday
  //   - Recently scheduled on Mondays
  //   - Weekday - typically higher availability
  //
  // 1/16/2024: UNAVAILABLE (95% confidence)
  //   - Marked as unavailable: Vacation
}

// ============================================================================
// Example 6: Using fit scores to make scheduling decisions
// ============================================================================
async function exampleSmartScheduling() {
  const rosterId = 'roster-uuid-here';
  const candidates = ['user-1', 'user-2', 'user-3'];

  const shift: ShiftRequirement = {
    startTime: setHours(new Date(), 9),
    endTime: setHours(new Date(), 17),
    breakMinutes: 30,
    department: 'Kitchen',
  };

  // Calculate fit scores for all candidates
  const scores = await Promise.all(
    candidates.map(async userId => {
      const result = await aiService.calculateFitScore(userId, shift, rosterId);
      return { userId, ...result };
    })
  );

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  console.log('Candidate Rankings:\n');
  scores.forEach((candidate, index) => {
    console.log(`${index + 1}. Employee ${candidate.userId}`);
    console.log(`   Score: ${candidate.score}/100`);
    console.log(`   Strengths:`);
    candidate.reasons.slice(0, 3).forEach(r => console.log(`     + ${r}`));

    if (candidate.warnings.length > 0) {
      console.log(`   Warnings:`);
      candidate.warnings.forEach(w => console.log(`     ! ${w}`));
    }
    console.log('');
  });

  // Select the best candidate with no violations
  const bestCandidate = scores.find(s => s.warnings.length === 0) || scores[0];
  console.log(`Recommended: Employee ${bestCandidate.userId} (Score: ${bestCandidate.score})`);
}

// ============================================================================
// Example 7: Integration with RosterService
// ============================================================================
async function exampleIntegrationWithRosterService() {
  const rosterId = 'roster-uuid-here';

  // Step 1: Generate schedule recommendations
  const shifts: ShiftRequirement[] = [
    {
      startTime: setHours(new Date(), 9),
      endTime: setHours(new Date(), 17),
      breakMinutes: 30,
      department: 'Kitchen',
    },
  ];

  const suggestions = await aiService.suggestShiftAssignments(rosterId, shifts);

  // Step 2: Use the suggestions to create actual shifts
  // (This would integrate with RosterService.addShift)
  for (const suggestion of suggestions) {
    if (suggestion.bestMatch && suggestion.bestMatch.complianceStatus !== 'violation') {
      console.log(`Would create shift for ${suggestion.bestMatch.user?.firstName}`);
      console.log(`  Fit score: ${suggestion.bestMatch.fitScore}`);
      console.log(`  Estimated cost: NOK ${suggestion.bestMatch.estimatedCost.toFixed(2)}`);

      // Example integration:
      // await rosterService.addShift(
      //   rosterId,
      //   suggestion.bestMatch.userId,
      //   suggestion.shift.startTime,
      //   suggestion.shift.endTime,
      //   suggestion.shift.breakMinutes,
      //   suggestion.shift.department,
      //   suggestion.shift.location,
      //   `AI suggested - fit score: ${suggestion.bestMatch.fitScore}`,
      //   'manager-id',
      //   'manager@example.com'
      // );
    }
  }
}

// Export examples for reference
export {
  exampleCalculateFitScore,
  exampleSuggestShiftAssignments,
  exampleAutoSchedule,
  exampleOptimizeSchedule,
  examplePredictAvailability,
  exampleSmartScheduling,
  exampleIntegrationWithRosterService,
};
