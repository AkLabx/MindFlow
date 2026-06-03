# Quiz Domain Ownership Map

This document outlines the strict ownership boundaries within the `features/quiz` architecture to prevent business logic leakage.

## 1. Grading & Score Calculation
**Primary Owner:** `useQuiz.ts` (Specifically the `submitSessionResults` wrapper function).
**Secondary Owner:** `useQuizSessionStore.ts` (`answerQuestion` calculates running tally).
*State of Ownership:* Fractured. The store calculates running scores, but the hook calculates the final history record and subject-specific analytics.

## 2. Persistence (Local & Cloud)
**Primary Owner:** `useQuizSessionStore.ts` (Cloud Persistence via `flushToCloud`) & `useQuiz.ts` (Local Persistence via `flushSync` -> `IndexedDB`).
*State of Ownership:* Split. The Zustand store manages the background cloud sync, while the React Hook manages the local IndexedDB debounced saves.

## 3. Hydration
**Primary Owner:** The Route Guards (`QuizSessionGuard.tsx` & `ResultGuard.tsx`).
*State of Ownership:* Centralized but heavy. The guards are solely responsible for pulling data from the `api/` layer and `IndexedDB`, merging it, and injecting it into the Zustand store before rendering the UI.

## 4. Synchronization (Offline/Online Queue)
**Primary Owner:** `lib/syncService.ts` and `stores/useSyncStore.ts`.
*State of Ownership:* Centralized globally. The quiz domain relies on the global sync service to handle offline mutation queues.

## 5. Result Generation
**Primary Owner:** Supabase RPC (`submit_quiz_session`).
*State of Ownership:* Server-Authoritative. The client submits raw answers, but the server calculates accuracy and creates the final `quiz_history` read-only object.

## 6. Analytics
**Primary Owner:** `services/analyticsService.ts` & Supabase RPC (`get_user_performance_metrics`).
*State of Ownership:* Centralized. The UI (`PerformanceAnalytics.tsx`) purely reads from the React Query hooks mapped to these RPCs.
