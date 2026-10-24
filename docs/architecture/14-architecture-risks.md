# 14. Architecture Risks

## Overview
The following architectural risks have been identified through static analysis and evaluation of system constraints. They are ranked by severity.

## 1. Critical Risks

### Cache Invalidation Complexity & UI Blocking
- **Risk:** The application relies heavily on IndexedDB to cache massive amounts of vocab and quiz metadata. Reading, parsing, and merging thousands of delta-sync records on the main thread during app bootstrap can cause severe UI stuttering or completely lock the browser on low-end mobile devices.
- **Mitigation:** Move IndexedDB hydration and merging operations to a Web Worker.

### Quiz State Component Coupling
- **Risk:** `useQuizSessionStore` manages the central, rapidly changing state of an active quiz (including a ticking timer). If parent components unnecessarily subscribe to this entire store, it triggers massive React tree re-renders every second, leading to extreme battery drain and lag on mobile.
- **Mitigation:** Enforce strict Zustand selector usage (e.g., `useQuizSessionStore(state => state.timeRemaining)`).

## 2. High Risks

### Auth Mutex Deadlocks
- **Risk:** The Supabase `gotrue-js` mutex bug is currently mitigated by a hardcoded 8-second timeout monkey-patch. If the internal library structure changes, this patch could fail, causing the app to freeze permanently for users with spotty internet connections.
- **Mitigation:** Upgrade to the latest Supabase SDKs once the upstream issue is resolved, or migrate to a custom session manager that bypasses the queue.

### Unbounded Array/JSON Growth in Database
- **Risk:** Storing highly nested telemetry or massive arrays in single columns (like `ai_metadata`) can degrade database performance if not properly pruned or partitioned.
- **Mitigation:** Implement a chronological pruning cron job for old logs and telemetry data, moving them to cold storage (e.g., S3/Supabase Storage) after 30 days.

## 3. Medium Risks

### Client-Side Trust in Quiz Scoring
- **Risk:** The offline-first architecture calculates quiz scores and timers locally. Malicious actors could spoof `submit_quiz_session_rpc` payloads to falsify perfect scores.
- **Mitigation:** Acceptable for personal learning, but if competitive Mock Tests (with leaderboards) are introduced, the backend MUST re-evaluate the answers against the elapsed time.

### N+1 Queries & Missing Indexes
- **Risk:** The `saved_quizzes` table lacks an `updated_at` column. As the dataset grows, querying for recently modified or paused quizzes by parsing JSON or scanning `created_at` will become a bottleneck.
- **Mitigation:** Add an `updated_at` column with an automatic Postgres trigger to `saved_quizzes`. Ensure indexes exist on frequently joined foreign keys.

## 4. Low Risks

### Mixed Admin/Consumer Bundle
- **Risk:** Admin UI components (Content Studio) are bundled with the main application. While protected by policies, they unnecessarily increase the JavaScript payload size for regular users.
- **Mitigation:** Utilize Vite's multi-page setup or completely separate repositories for administrative tooling.
