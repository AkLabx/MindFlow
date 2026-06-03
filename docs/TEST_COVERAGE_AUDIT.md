# Test Coverage Audit

## Current Coverage Map
The codebase currently contains only **4 test files**:
1. `useJSONDownloader.spec.ts`
2. `QuizOption.test.tsx`
3. `useTextToSpeech.test.tsx`
4. `quizReducer.test.ts`

**Total Coverage Status:** Negligible (< 1%).

## Critical User Flows Lacking Tests (Risk Ranked)

### 1. The Quiz Engine & Grading (Severity: CRITICAL)
- **Flow:** Answering questions, calculating scores, aggregating subject statistics, determining overall accuracy, and constructing history payloads.
- **Risk:** A single mathematical bug in `features/quiz/engine/grading.ts` or `useQuiz.ts` will permanently corrupt user history, analytics, and leaderboard metrics globally.

### 2. Authentication & Session Lifecycles (Severity: HIGH)
- **Flow:** User login, OAuth routing, token refreshing, and silent re-authentication on PWA re-awakening.
- **Risk:** If `AuthContext` fails silently or deadlocks during a token refresh, the user is permanently locked out of the app.

### 3. PWA Offline Sync (`syncService.ts`) (Severity: HIGH)
- **Flow:** Storing quiz progress, bookmarks, and interactions in IndexedDB while offline, and automatically flushing them to Supabase via background queues when the connection restores.
- **Risk:** Sync race conditions or improperly structured UPSERT payloads will result in permanent data loss for students who finish quizzes on unstable mobile connections.

### 4. Database Access Layer (`features/*/api/`) (Severity: HIGH)
- **Flow:** React Query hooks ensuring that raw Supabase queries correctly parse Row Level Security (RLS) rules and return expected shapes.
- **Risk:** Frontend updates that misalign with Postgres table schemas will fail silently at runtime rather than build time without integration tests.

### 5. Social & Community Feeds (Severity: MEDIUM)
- **Flow:** Liking reels, creating comments, updating follower counts, and navigating chat rooms.
- **Risk:** High visibility bugs, but data corruption here is less critical than exam scores.
