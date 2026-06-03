# Phase 2A.2: Quiz API Migration Plan

## Overview
This plan dictates the safe extraction of direct Supabase calls from the `features/quiz` UI components and legacy hooks into a strictly typed `@tanstack/react-query` API layer located at `features/quiz/api/`.

To guarantee absolute stability, the extraction is divided into three scope-locked waves based on risk level.

---

## The Migration Matrix

### Wave 1: Pure READ Operations (Low Risk)
These operations only fetch data to display to the user. Extracting them first establishes the React Query architecture without risking core quiz functionality.

| Current File | Database Operation | Target Abstraction | React Query Key |
| :--- | :--- | :--- | :--- |
| `SavedQuizzesList.tsx` | READ `saved_quizzes` | `useSavedQuizzes()` | `['quiz', 'saved']` |
| `AttemptedQuizzesList.tsx`| READ `quiz_history` | `useQuizHistory()` | `['quiz', 'history']` |
| `QuizSessionGuard.tsx` | READ `saved_quizzes` | `useQuizSession(id)` | `['quiz', 'session', id]` |
| `ResultGuard.tsx` | READ `quiz_history` | `useQuizResult(id)` | `['quiz', 'result', id]` |
| `usePerformanceAnalytics.ts`| RPC `get_user_performance_metrics`| `usePerformanceMetrics()`| `['quiz', 'analytics', 'metrics']` |

### Wave 2: Mutations (Medium Risk)
These operations insert or update non-critical records (like saving a quiz to the library or renaming it).

| Current File | Database Operation | Target Abstraction |
| :--- | :--- | :--- |
| `SavedQuizzesList.tsx` | UPDATE `saved_quizzes` (Soft Delete) | `useDeleteSavedQuiz()` |
| `SavedQuizzesList.tsx` | UPDATE `saved_quizzes` (Rename) | `useRenameSavedQuiz()` |
| `AttemptedQuizzesList.tsx`| UPDATE `saved_quizzes` (Soft Delete) | `useDeleteHistory()` |
| `AttemptedQuizzesList.tsx`| UPDATE `saved_quizzes` (Rename) | `useRenameHistory()` |
| `QuizConfig.tsx` | INSERT `saved_quizzes`, `bridge_*` | `useCreateQuizSession()`|
| `usePerformanceAnalytics.ts`| RPC `reset_user_analytics` | `useResetMetrics()` |

### Wave 3: Core Engine & Session Flow (High Risk)
These operations govern the active quiz state, answering questions, interacting with the AI Tutor, or finalizing exam submissions.

| Current File | Database Operation | Target Abstraction | Risk Reason |
| :--- | :--- | :--- | :--- |
| `useQuiz.ts` | RPC `submit_quiz_session` | `useSubmitQuiz()` | Governs score calculation and exam finality |
| `ShareGatekeeper.tsx` | RPC `clone_shared_quiz` | `useCloneQuiz()` | Dictates multi-user database duplication |
| `AiExplanationButton.tsx` | RPC `vote_explanation` | `useVoteExplanation()`| Interacts with LLM feedback loops |
| `AiExplanationButton.tsx` | Edge Function `ask-ai-tutor` | `useAiTutor()` | Streaming serverless function |

---

## Target Architecture

```text
src/features/quiz/api/
├── queries.ts      // Contains all Wave 1 READ hooks
├── mutations.ts    // Contains all Wave 2 & 3 WRITE hooks
└── queryKeys.ts    // Centralized constant object for cache invalidation
```

## Execution Rules for Next PR
1. **Scope Lock:** The very next PR must *strictly* contain **Wave 1** migrations only.
2. **No UI Changes:** Do not alter the visual design of the components.
3. **Cache Invalidation:** Ensure that mutations (when eventually implemented) correctly invalidate the specific `queryKeys` established in Wave 1.
