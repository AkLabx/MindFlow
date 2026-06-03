# Test Plan: Quiz Grading Engine

## Overview
This plan outlines the required unit test coverage for the pure business logic extracted during the Stabilization Sprint, specifically targeting `features/quiz/engine/grading.ts` and `features/quiz/utils/payloadMappers.ts`.

## 1. Targets & Pure Functions

### A. `calculateSessionGrades` (`grading.ts`)
Calculates total correct, skipped, time spent, overall accuracy, and subject-specific statistics.

**Edge Cases to Test:**
- **Zero Questions:** Handles empty `activeQuestions` arrays without dividing by zero (NaN) in accuracy calculations.
- **Missing Subjects:** Questions without a `subject` or `classification.subject` fall back to the "Unknown" bucket correctly.
- **Partial Answers:** Calculates skipped questions accurately when the `answers` record is missing keys.
- **Time Fallbacks:** Properly reads from `fallbackTimeTaken` if a question ID does not exist in the primary `timeTaken` record.
- **Accuracy Rounding:** Ensures decimals are rounded correctly (e.g., 66.6% to 67%).

### B. `buildHistoryRecord` (`payloadMappers.ts`)
Constructs the immutable `quiz_history` object for RPC submission.

**Edge Cases to Test:**
- **UUID Generation:** Ensures a valid v4 UUID is generated for the record.
- **Time Conversion:** Validates that millisecond timestamps from the grading engine are correctly converted into decimal seconds (`totalTimeSpent / 1000`).
- **Difficulty String Mapping:** Ensures array inputs or raw string inputs are safely passed through.

### C. `buildFinalStatePayload` (`payloadMappers.ts`)
Strips large data objects out of the runtime state to build the lightweight JSONB payload.

**Edge Cases to Test:**
- **Data Pruning:** Verifies that the `questions` array is completely stripped from the returned object.
- **State Preservation:** Ensures that `markedForReview`, `bookmarks`, and `hiddenOptions` (50/50 state) remain intact.
