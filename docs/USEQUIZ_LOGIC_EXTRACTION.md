# `useQuiz.ts` Logic Extraction Audit

## Current State of `useQuiz.ts`
The hook is currently a massive Controller that orchestrates UI state, IndexedDB persistence, Analytics tracking, and Server RPC submissions.

## Extractable Pure Business Logic
The `submitSessionResults` function inside `useQuiz.ts` contains 120+ lines of pure grading logic that has no dependency on React or hooks.

### 1. Subject Analytics Aggregation
```typescript
const subjectStats: Record<string, SubjectStats> = {};
let totalCorrect = 0;
let totalIncorrect = 0;
let totalSkipped = 0;
// Loops through questions, tallies up correctly answered questions per subject.
```
*Recommendation:* Move to `features/quiz/engine/grading.ts` as `export const calculateSubjectStats = (questions, answers) => ...`

### 2. Time Tracking Aggregation
```typescript
let totalTimeSpent = 0;
Object.values(results.timeTaken).forEach(time => { totalTimeSpent += time; });
```
*Recommendation:* Move to `features/quiz/engine/grading.ts`.

### 3. Final Payload Construction
```typescript
const historyRecord = { ... };
const stateWithoutQuestions = { ...state, questions: [] };
```
*Recommendation:* Move to a mapper utility `features/quiz/utils/payloadMappers.ts`.

## Why this matters?
Right now, you cannot unit test the grading logic because it is locked inside a React Hook that requires a DOM, Zustand context, and Supabase client. Extracting it to pure functions will make the engine 100% testable.
