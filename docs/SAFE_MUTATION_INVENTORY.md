# Phase 2B: Safe Mutation Inventory

## Overview
This inventory categorizes all write operations (Mutations) inside the `quiz` domain, identifying which ones are safe to abstract into `@tanstack/react-query` and which must remain deferred to avoid session lifecyle breakages.

## 1. Allowed Scope (Near-Zero Risk Extractions)
These operations interact with flat rows in Supabase and do not trigger cascading background syncs or affect the active exam session state machine.

| Mutation | Current Location | Operation | React Query Hook Target |
| :--- | :--- | :--- | :--- |
| **Delete Saved Quiz** | `SavedQuizzesList.tsx` | UPDATE `saved_quizzes` (soft delete) | `useDeleteSavedQuiz()` |
| **Rename Saved Quiz** | `SavedQuizzesList.tsx` | UPDATE `saved_quizzes` (name change) | `useRenameSavedQuiz()` |
| **Delete History** | `AttemptedQuizzesList.tsx` | UPDATE `saved_quizzes` (soft delete) | `useDeleteQuizHistory()` |
| **Rename History** | `AttemptedQuizzesList.tsx` | UPDATE `saved_quizzes` (name change) | `useRenameQuizHistory()` |

*Note: For the scope of Phase 2B, History Deletion and Rename currently utilize the `saved_quizzes` table fallback mechanism historically established. Both targets will invalidate the respective `quizKeys.saved()` or `quizKeys.attempted()` cache.*

## 2. Deferred Scope (High Risk - Prohibited)
These operations must **NOT** be extracted into React Query hooks yet, as they are deeply bound to `IndexedDB`, `useQuizSessionStore`, or the engine's real-time grading logic.

| Mutation | Current Location | Reason for Deferral |
| :--- | :--- | :--- |
| `submit_quiz_session` RPC | `useQuiz.ts` | Controls exam finality, score locking, and session destruction. |
| `clone_shared_quiz` RPC | `ShareGatekeeper.tsx` | Duplicates vast amounts of relational data across users; touches active session routing. |
| Quiz Initialization INSERT | `QuizConfig.tsx` | Requires orchestrating `bridge_saved_quiz_questions` mapping arrays and immediate navigation routing. |
| AI Tutor Edge Function | `AiExplanationButton.tsx`| Streams LLM responses; decoupled from standard React Query caching logic. |
| AI Tutor Feedback Vote | `AiExplanationButton.tsx`| Tied directly to the transient AI state UI. |
