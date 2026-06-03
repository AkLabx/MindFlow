# Quiz Session Architecture Audit

## 1. Complete Lifecycle of a Quiz Session

1. **Creation:**
   - A user selects quiz parameters in `QuizConfig.tsx`.
   - `QuizConfig` directly creates a record in `saved_quizzes` via `useCreateQuizSession()` mutation (Wave 2) and bridges the questions.
   - It updates `useQuizSessionStore` manually and navigates to `/quiz/:id`.
2. **Hydration (The Fragile Edge):**
   - The route `/quiz/:id` renders `QuizSessionGuard.tsx`.
   - The Guard checks if `useQuizSessionStore` has the quiz. If not, it fetches from the API layer (`useQuizSession`).
   - It also checks `IndexedDB` (`lib/db.ts`) for any `in_progress` locally cached state and merges it.
   - It pushes the hydrated state directly back into the `useQuizSessionStore`.
3. **Persistence (The Competing Masters):**
   - As the user answers questions, `useQuiz.ts` intercepts actions (like `nextQuestion`) and fires a debounced `flushSync()`.
   - `flushSync()` saves the complete quiz state into IndexedDB.
   - Concurrently, a background sync service (`flushToCloud` inside the Zustand store) attempts to push this JSON blob up to Supabase.
4. **Completion:**
   - The user clicks "Submit". `useQuiz.ts` calls `submitSessionResults()`.
   - The hook calculates scores, sets the status to `finalizing`, and calls the Supabase RPC `submit_quiz_session`.
   - The RPC creates a `quiz_history` row, calculates accuracy, updates bookmarks, and **hard deletes** the active `saved_quizzes` row (cleaning up the active session).
5. **Result Generation:**
   - The user is navigated to `/quiz/:id/result`.
   - `ResultGuard.tsx` takes over. It attempts to read the `useQuizSessionStore`. If empty, it queries `useQuizResult()`.

## 2. The Interaction Map

```text
React Component (e.g. NextButton)
       |
       v
useQuiz.ts (The Controller Hook)
       |--> [Debounced Save] --> IndexedDB (lib/db.ts)
       |
       v
useQuizSessionStore.ts (The Zustand State)
       |
       |--> [Background Sync] --> Supabase (JSONB payload)
```
- **QuizSessionGuard & ResultGuard** sit above the UI, fighting with `useQuizSessionStore` to inject data on load.

## 3. Risks Identified

### A. Competing Sources of Truth
The architecture has three distinct memory locations trying to represent the same quiz:
1. The Zustand Store (`useQuizSessionStore`)
2. The IndexedDB Cache (`db.getInProgressQuiz`)
3. The Supabase Cloud JSONB payload (`saved_quizzes.state_payload`)

### B. Hydration Races
Because the Guards run inside `useEffect` and `IndexedDB` is asynchronous, a user on a slow device could render the quiz UI with an empty Zustand store for a split second before the Guard successfully pushes the hydrated data back into Zustand.

### C. Duplicated Controller Logic
The `useQuizSessionStore.ts` file defines actions like `startQuiz`, `answerQuestion`, and `restartQuiz`. But `useQuiz.ts` defines its own wrapper over `submitSessionResults` that calculates grades. This splits business logic arbitrarily between a global store and a React hook.

### D. The RPC Hard-Delete Concurrency Risk
When `submit_quiz_session` RPC is called, it deletes the `saved_quizzes` row. If `ResultGuard` renders too quickly and checks the API layer before the `quiz_history` row propagates to read-replicas, the user sees a "Quiz Not Found" error.

## 4. Proposed Modernization Strategy

The current architecture is a hybrid of "Local-First" (IndexedDB) and "Server-Authoritative" (RPC calculations).

**Target Model: React Query + Zustand (Stateless Persistence)**
We should eventually strip IndexedDB out of the core quiz loop for standard connections, using it *only* for the PWA Service Worker offline queue.

### Risk-Ranked Modernization Plan

1. **Low Risk: Decouple the Controller from the Store**
   - Move all grading logic out of `useQuiz.ts` into pure utility functions (`engine/grading.ts`).
2. **Medium Risk: Extract the RPC Mutator**
   - Extract `submit_quiz_session` from `useQuiz.ts` into `features/quiz/api/mutations.ts` (This is Wave 3 of our API abstraction).
3. **High Risk: Single Source Hydration**
   - Delete `QuizSessionGuard`. Let the React Query API hook (`useQuizSession`) fetch the data, and pass it down as props to the Quiz Engine, dropping the need to globally mutate `useQuizSessionStore` on mount.

## Conclusion
Your instinct is correct. The Session Architecture is incredibly fragile because it attempts to sync IndexedDB, Zustand, and Supabase concurrently during a live exam.

**Recommendation:** Do NOT execute Wave 2 or Wave 3 mutations right now. The API Abstraction Layer (Wave 1) is complete. We should halt structural refactoring here, let the dust settle, and approach the Session Architecture as an entirely separate project phase later.
