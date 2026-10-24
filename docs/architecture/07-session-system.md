# 7. Session System (Learning Lifecycle)

## Overview
The Learning Session (Quiz) system is the most critical user-facing architecture in MindFlow. It relies on a strict Offline-First design, utilizing a multi-layered persistence strategy (Memory -> IndexedDB -> Supabase) to guarantee that user progress is never lost during network transitions.

## Architecture & Components
- **Central Orchestrator:** `src/features/quiz/services/quizCreationService.ts` handles creation, state initialization, and persistence. UI components **must not** manually construct or persist quiz objects.
- **State Machine:** Governed by `useQuizSessionStore` (Zustand).
- **Engine Plugins:** `src/features/quiz/engine/` manages different question types (e.g., `mcqPlugin`).

## Complete Lifecycle

### 1. Creation & Initialization
1. User requests a new quiz.
2. `quizCreationService` generates a UUID and constructs the initial state payload (`activeQuestions`, `filters`, `quizId`, `quizTimeRemaining`, `remainingTimes`).
3. **CRITICAL:** The service immediately seeds this fully initialized object into local IndexedDB (`db.saveQuiz`). Omitting fields causes silent fallback failures in `QuizSessionGuard` during hydration.
4. The service attempts to sync the creation to Supabase `saved_quizzes`.

### 2. Hydration & Resumption
1. User navigates to an active quiz URL.
2. `QuizSessionGuard` intercepts the route.
3. It reads IndexedDB to find the session.
4. If found, it populates `useQuizSessionStore` and renders the quiz UI.
5. If missing from IndexedDB, it attempts to fetch from Supabase, seed IndexedDB, and then render.

### 3. Active Session (Timer & Progress)
- **State Updates:** As the user answers questions, `quizReducer.ts` updates the in-memory Zustand state.
- **Auto-Save (Layer 1):** Changes are synchronously written to IndexedDB (`db.updateQuizProgress`). Mutations are upsert-safe.
- **Auto-Save (Layer 2):** A debounced background worker syncs the changes to Supabase (`quizProgressService.ts`). Crucially, this uses the Supabase JS client, avoiding raw `fetch` to bypass 64KB memory limits during page unloads.

### 4. Recovery After Interruption
- If the browser crashes, the latest state exists in IndexedDB. Upon returning to the app, `QuizSessionGuard` reads the local cache, automatically resuming exactly where the user left off, including remaining time.
- If the user switches devices, the app fetches the latest state from Supabase `saved_quizzes` (using `created_at` to find the most recent, since `updated_at` does not exist).

### 5. Completion & Submission
1. User finishes the quiz or the timer expires.
2. `useQuizSessionStore` marks the local state as complete.
3. The frontend calls the Supabase RPC `submit_quiz_session_rpc`.
4. The RPC atomically calculates final scores, updates `saved_quizzes`, and inserts a record into `quiz_history`.
5. Local IndexedDB is updated to reflect the submitted state, moving it from active to history caches.

*Evidence:* `quizCreationService.ts`, memory guidelines, `QuizSessionGuard.tsx`.
*Confidence:* Confirmed.
