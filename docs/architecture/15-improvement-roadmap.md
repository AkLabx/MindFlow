# 15. Improvement Roadmap

## Overview
This roadmap prioritizes architectural improvements based on impact versus effort, categorized into Quick Wins, Short-Term, Medium-Term, and Long-Term phases.

---

## 1. Quick Wins (Under 1 Day)
*High Impact, Low Effort*

1. **Add `updated_at` to `saved_quizzes`:**
   - **Action:** Create a Supabase migration to add an `updated_at` timestamp with a trigger.
   - **Impact:** Eliminates reliance on `created_at` or JSON parsing to find recently paused quizzes.
2. **Standardize NPM Scripts:**
   - **Action:** Update `package.json` to include `"test": "vitest --run"` and `"typecheck": "tsc --noEmit"`.
   - **Impact:** Improves DX and standardizes CI/CD pipelines.
3. **Zustand Selector Audit:**
   - **Action:** Review `ActiveQuizLayout.tsx` and `AppLayout.tsx` to ensure they use strict Zustand selectors (`useQuizSessionStore(state => state.property)`) rather than subscribing to the entire store.
   - **Impact:** Instantly reduces excessive React re-renders caused by the quiz timer.

---

## 2. Short-Term (1 Week)
*High Impact, Medium Effort*

1. **Web Worker for Delta Sync Hydration:**
   - **Action:** Move the IndexedDB read/write logic for `get_filtered_quiz_metadata` into a dedicated Web Worker.
   - **Impact:** Prevents the main thread from blocking during app bootstrap on mobile devices with large vocab caches.
2. **Database Indexing Audit:**
   - **Action:** Analyze slow queries in the Supabase dashboard and add B-Tree indexes to foreign keys (`user_id`) in `quiz_history`, `analytics_events`, and `user_synonym_interactions`.
   - **Impact:** Reduces latency for history and dashboard loads.

---

## 3. Medium-Term (1 Month)
*Medium Impact, High Effort*

1. **Storage Provider Abstraction:**
   - **Action:** Refactor `useQuizSessionStore` and `quizCreationService` to depend on an `IStorageProvider` interface rather than hardcoding `db.saveQuiz`.
   - **Impact:** Decouples business logic from IndexedDB, making unit testing easier and allowing alternative storage mechanisms (e.g., SQLite via Capacitor plugin).
2. **Server-Side Scoring for Competitive Tests:**
   - **Action:** Modify `submit_quiz_session_rpc` to optionally re-calculate scores on the backend for "Mock Tests".
   - **Impact:** Secures competitive features against client-side spoofing.

---

## 4. Long-Term (Architectural Shifts)
*High Impact, Very High Effort*

1. **Separate Admin Bundle:**
   - **Action:** Split `src/features/admin/` into a separate Vite project or utilize a monorepo setup (e.g., Turborepo).
   - **Impact:** Reduces the JavaScript payload for regular users and entirely airgaps administrative APIs from the consumer client.
2. **Supabase SDK Upgrade (Remove Auth Mutex Patch):**
   - **Action:** Monitor Supabase releases for a fix to the `gotrue-js` mutex deadlocks. Once resolved, upgrade the SDK and remove the 8-second `Promise.race` monkey-patch in `src/lib/supabase.ts`.
   - **Impact:** Removes brittle runtime stabilization code.
