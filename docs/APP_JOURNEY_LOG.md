# MindFlow - App Journey & Release Log

This document is the single source of truth for the evolution of the MindFlow application. Every version bump, feature rollout, architectural enhancement, and critical bug fix is chronologically documented here with exact **Indian Standard Time (IST)** timestamps to provide complete visibility into the app's journey for all existing and incoming developers.

---

## 📌 Team Ritual & Governance Policy

> ### ⚠️ MANDATORY WORKFLOW RITUAL FOR ALL TEAM MEMBERS & AI AGENTS
> Every developer (human or AI pair programmer) working on this repository **MUST** follow this ritual without exception:
>
> 1. **Trigger**: Whenever a version bump is performed in `package.json` (or `android/app/build.gradle`).
> 2. **Logging Destination**: Prepend the new release entry immediately below the `---` divider in this file (`docs/APP_JOURNEY_LOG.md`).
> 3. **Required Entry Fields**:
>    - **Version Tag**: `## [vX.Y.Z] - DD MMMM YYYY, HH:MM AM/PM IST`
>    - **Executive Summary**: A concise 1-2 sentence overview of the release purpose.
>    - **Work Breakdown**: Grouped under `### ✨ Features Added`, `### 🐛 Bug Fixes`, `### ⚡ Performance & Refactoring`, or `### 🔒 Security & Architecture`.
>    - **Impacted Scope**: Mention core modules or paths modified (e.g., `src/features/quiz/`, `src/lib/navigation/`).
> 4. **STRICT ZERO-SENSITIVITY POLICY**:
>    - **NEVER** log API keys, access tokens, secrets, service passwords, internal database URLs, or real user identifiers.
>    - Keep all descriptions high-level, architectural, and educational for developers.
> 5. **Cross-Platform Awareness**:
>    - MindFlow is both a PWA on GitHub Pages (`<HashRouter>`) and an Android app via Capacitor. Keep logs mindful of both targets.

---

## 🚀 App Journey Changelog

## [v1.0.291] - 03 November 2026, 11:20 AM IST

### Executive Summary
Restructured Dashboard curriculum architecture: renamed the ambiguous "Subjects" group to "GK / GS Subjects", established a dedicated "English & Vocabulary" hub section (Concept A with 3 core pillars + interactive vocab game pills), and repurposed the vacated Quick Actions tile to "Mistake Notebook" for instant error revision.

### ✨ Features & UI/UX Improvements
- **GK / GS Subjects Renaming (`src/features/dashboard/components/SubjectStrip.tsx`)**:
  - Renamed the header title to `GK / GS Subjects` to accurately reflect its General Studies content (History, Polity, Geography, Economics, Science, Static GK).
- **Dedicated English & Vocabulary Section (`src/features/dashboard/components/EnglishSection.tsx`)**:
  - Created a dedicated `rounded-2xl` container card housing English as a first-class subject hub.
  - Built 3 core pillar cards: **Synonyms & Antonyms** (`/english?tab=vocabsynonyms`), **One Word Substitution** (`/english?tab=vocabows`), and **Idioms & Phrases** (`/english?tab=vocabidiom`).
  - Added an interactive micro-game booster bar for instant practice: **The Imposter Trap**, **Tap & Connect**, and **Speed Match**.
  - Added header action `Open Hub →` linking directly to the full English Hub (`/english`).
- **Mistake Notebook in Quick Actions (`src/features/dashboard/constants/sscDashboardConfig.ts`, `QuickActionsGrid.tsx`, `DashboardPage.tsx`)**:
  - Replaced the vacated English tile in Quick Actions with `Mistake Notebook` (`RotateCcw` icon, amber theme) linking directly to Attempted Quizzes and error solutions (`/quiz/library?tab=attempted`).

### Impacted Scope
- `src/features/dashboard/components/SubjectStrip.tsx`
- `src/features/dashboard/components/EnglishSection.tsx`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/features/dashboard/constants/sscDashboardConfig.ts`
- `src/features/dashboard/index.ts`
- `src/pages/DashboardPage.tsx`
- `package.json`

## [v1.0.290] - 03 November 2026, 09:25 AM IST

### Executive Summary
Redesigned the Dashboard visual hierarchy with rounded-corner section containers and crisp boundary distinction for all buttons and interactive cards across light and dark modes. Solved low-contrast washed-out card boundaries by enclosing each section (Hero Strip, Subjects, Quick Actions, Suggested Drill, Your Progress, Important for SSC) within its own visible container card with refined borders, subtle elevation, and distinct inner button states.

### ✨ Visual Polish & UI/UX Improvements
- **Section-Level Container Architecture (`src/features/dashboard/components/`, `src/pages/DashboardPage.tsx`)**:
  - Enclosed each dashboard section (`SubjectStrip`, `QuickActionsGrid`, `ImportantForSscStrip`, `SuggestedDrillCard`, `UserProgressCard`, and `DashboardGreeting`) inside rounded-corner rectangular container cards (`rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md`).
  - Integrated section headers and "View All" actions cleanly within each container card header.
  - Adjusted dashboard tier spacing to `space-y-3 sm:space-y-4` for a clean, cohesive visual cadence.
- **Crisp Button & Inner Card Boundaries**:
  - Replaced low-contrast `border-slate-100` with high-clarity `border-slate-200/90 dark:border-slate-700/70` and subtle `bg-slate-50/80 dark:bg-slate-800/60` background fills on all subject chips, quick action buttons, greeting quick-actions, and SSC cards.
  - Enhanced hover states with crisp border accents (`hover:border-indigo-300 dark:hover:border-indigo-600/70`) and active micro-scaling.
  - Standardized badge and chip boundaries across `SuggestedDrillCard` and `ImportantForSscStrip`.

### Impacted Scope
- `src/features/dashboard/components/DashboardGreeting.tsx`
- `src/features/dashboard/components/SubjectStrip.tsx`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/features/dashboard/components/SuggestedDrillCard.tsx`
- `src/features/dashboard/components/UserProgressCard.tsx`
- `src/features/dashboard/components/ImportantForSscStrip.tsx`
- `src/pages/DashboardPage.tsx`
- `package.json`

## [v1.0.289] - 03 November 2026, 08:45 AM IST

### Executive Summary
Permanently resolved PostgreSQL `57014` statement timeout errors, connection pool exhaustion (`PGRST003`), and infinite loading spinners across the Quiz Library (`Created Quizzes` & `Attempted Quizzes`) and Dashboard. Re-architected database schema, query patterns, background sync pipeline, and tab lifecycle, reducing live query latency by 95.7% (from 8-10s+ down to ~14ms).

### ⚡ Performance & Database Architecture
- **Saved Quizzes Payload Sanitization (`supabase/migrations/20261103000000_optimize_quiz_library_performance.sql`)**:
  - Sanitized `saved_quizzes.state`: Stripped nested `activeQuestions` JSON array from remote database storage, dropping TOAST storage and single-row sizes from ~2MB down to ~10KB.
  - Created composite covering index `idx_saved_quizzes_library` on `(user_id, status, created_at DESC) WHERE (deleted_at IS NULL)` for sub-15ms index-only scans.
  - Added foreign key covering index `idx_bridge_saved_quiz_questions_question_id` on `bridge_saved_quiz_questions(question_id)` eliminating sequential scans during cascading lookups.
  - Optimized RLS policies for `saved_quizzes` and `bridge_saved_quiz_questions` to use InitPlan execution `((SELECT auth.uid()) = user_id)`.
- **PostgREST Embedded Aggregation (`src/features/quiz/components/SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`)**:
  - Replaced wildcard `select('*')` and thousands of bridge rows with embedded count syntax `bridge_saved_quiz_questions(count)` and precise column projection (`id, name, created_at, mode, status, filters, state`).
  - Moved status filtering from JavaScript memory into PostgreSQL queries (`.neq('status', 'result')` and `.eq('status', 'result')`), leveraging the composite index.
- **Single-Row Dashboard Optimization (`src/pages/DashboardPage.tsx`)**:
  - Replaced table scan that downloaded all user quizzes with an indexed `.neq('status', 'result').limit(1)` query, reducing Dashboard load overhead to <10ms.

### 🐛 Bug Fixes & Sync Pipeline Resilience
- **Eliminated Login Query Storm (`src/lib/syncService.ts`)**:
  - Removed dead-code question collection routine that gathered all question IDs across user quizzes, chunked into 46 batches, and executed 46 concurrent PostgREST requests into an empty loop.
- **Infinite Loader Resolution (`src/lib/syncService.ts`, `SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`)**:
  - Moved `processEventQueue(userId)` inside `try/finally` in `syncOnLogin` and added a 10-second safety watchdog on `isSyncing` to guarantee unlocked state across network drops.
  - Removed raw `if (loading || isSyncing) return <SynapticLoader />` that intercepted UI renders before `<QueryStateHandler>`, ensuring error states and retry buttons render reliably.
  - Removed redundant query cache invalidations on component mount.
- **Quiz Creation Hardening (`src/features/quiz/services/quizCreationService.ts`)**:
  - Stripped `activeQuestions` from remote state payloads on initial quiz creation to prevent database bloat while maintaining full state in local IndexedDB.

### 🎨 UI/UX & Responsive Experience
- **Conditional Tab Mounting (`src/features/quiz/components/QuizLibrary.tsx`)**:
  - Replaced dual concurrent DOM tab mounting (`display: none`) with conditional mounting wrapped in `AnimatePresence mode="wait"`, ensuring only the active tab queries the database and transitions smoothly.
- **Glassmorphic Skeleton States (`src/features/quiz/components/QuizLibrarySkeleton.tsx`)**:
  - Introduced responsive skeleton card components matching list and grid layouts for zero layout shift during loading.
  - Enabled non-blocking background synchronization: users with cached data see their library instantly without blocking spinners.

## [v1.0.288] - 01 November 2026, 10:46 AM IST

### Executive Summary
Re-architected the Subject & Topic navigation pipeline to eliminate twin redundant REST queries with a high-performance PostgreSQL taxonomy summary RPC (~15ms, 1.5 KB payload), introduced intelligent 3-tier caching (RAM -> IndexedDB -> Server RPC), and eliminated cold-start blocking via zero-block Just-In-Time (JIT) subtopic question preparation for mobile and fast-tapping users.

### ⚡ Performance & Refactoring
- **Postgres Taxonomy Aggregation RPC (`supabase/migrations/20261101000000_subject_topics_summary_rpc.sql`)**:
  - Implemented `get_subject_topics_summary(p_subject)` returning nested `{ topic: { total, subtopics: { [subTopic]: count } } }` directly from PostgreSQL in ~15ms.
  - Reduced network payload from ~200 KB (over 4,200 raw JSON objects across twin calls) to ~1.5 KB.
  - Added partial index `idx_questions_subject_taxonomy` on `(subject, topic, "subTopic") WHERE deleted_at IS NULL` for lightning-fast aggregation scans.
  - Created targeted subtopic metadata RPC `get_subtopic_quiz_metadata(p_subject, p_topic, p_subtopic)` to fetch lightweight question taxonomy for single subtopics on demand.
- **3-Tier Unified Subject Service (`src/features/dashboard/services/subjectService.ts`)**:
  - Implemented `fetchSubjectTaxonomy` with local-first priority: checks IndexedDB `quiz_metadata_cache` first (0ms offline), falling back to `get_subject_topics_summary` server RPC on cold start.
  - Implemented `fetchSubtopicMetadata` for JIT targeted subtopic hydration, caching returned items into IndexedDB for subsequent offline use.
  - Re-routed legacy `fetchSubjectTopics` and `fetchSubjectTopicCounts` adapters to share the unified taxonomy result, preventing duplicate network requests.
- **Subject Hub Prefetching (`src/features/dashboard/pages/subject/SubjectHubPage.tsx`)**:
  - Added background prefetching of subject taxonomy on mount of `SubjectHubPage` using `queryClient.prefetchQuery`, ensuring data is already hot in memory before the user taps "Topic-wise Practice".

### 📱 Mobile UX & Resilient Fallbacks
- **Zero-Block JIT Subtopic Preparation (`src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`, `src/features/dashboard/components/subject/QuizStartBottomSheet.tsx`)**:
  - Eliminated the blocking error toast ("Please wait, syncing quiz data...") for cold-cache and fast-tapping visitors.
  - Added eager JIT subtopic metadata fetching as the bottom sheet animates into view.
  - Added graceful fallback to targeted subtopic metadata fetching upon tapping "Start Quiz", allowing users on slow networks or cold starts to start practicing in ~150ms without waiting for other subjects' metadata.
  - Extended TanStack Query caching for subject taxonomy (`staleTime: 30 mins`, `gcTime: 24 hours`) to provide instantaneous 0ms re-entry for returning users and prevent skeleton layout jank.

---

## [v1.0.287] - 31 October 2026, 05:37 PM IST

### Executive Summary
Fixed addressing discrepancy in Dashboard greeting where user was addressed by raw email prefix (`mindflow`) instead of their configured display/full name (`Guest User`). Created a canonical, tested user display name resolution utility with graceful fallbacks.

### 🐛 Bug Fixes & UX Harmonization
- **Canonical User Display Name Resolver (`src/utils/user.ts`)**:
  - Implemented `getUserDisplayName` with multi-tier priority resolution: `profile.full_name` -> `user.user_metadata.full_name` -> `user.user_metadata.name` -> `user.user_metadata.display_name` -> `profile.username` -> `user.user_metadata.username` -> `user.user_metadata.given_name` -> email prefix -> fallback (`Aspirant`).
  - Added unit test suite (`src/utils/user.test.ts`) covering all resolution tiers, empty/whitespace edge cases, and fallback behavior.
- **Dashboard Greeting Addressing (`src/features/dashboard/components/DashboardGreeting.tsx`, `src/pages/DashboardPage.tsx`)**:
  - Switched from flawed `user?.user_metadata?.first_name` (which never exists in Supabase auth) to `getUserDisplayName(profile, user, 'Aspirant')`.
  - Fed canonical `profile` from `useAuth()` into `DashboardGreeting` to dynamically address users by their chosen profile name.
- **Global Name Consistency (`src/features/dashboard/components/DashboardHeader.tsx`, `src/features/auth/components/ProfilePage.tsx`, `src/layouts/SidePanel.tsx`)**:
  - Unified user name display across DashboardHeader, Profile page, and SidePanel using `getUserDisplayName`.

---

## [v1.0.286] - 31 October 2026, 04:48 PM IST

### Executive Summary
Unified the Dashboard Greeting and Action Cards into a single compact Hero Strip (Option B) and reduced inter-section vertical gaps globally (Option D), reclaiming ~80px of dead viewport space and elevating core quiz action entry points above the fold.

### ✨ UI/UX Modernization & Whitespace Optimization
- **Unified Hero Strip (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Integrated user greeting (`Good Afternoon, Aspirant 👋`) and the 4 action buttons (Today's Plan, Bookmarks, Resume Quiz, Quiz History) into a single translucent card container with backdrop blur and subtle border accent.
  - Streamlined action button layout with compact icons, tighter text margins, and micro-interaction active press states (`active:scale-95`).
- **Global Dashboard Spacing Consolidation (`src/pages/DashboardPage.tsx`)**:
  - Reduced outer container top padding (`-mt-4 pt-4` -> `-mt-4 pt-2`) and inner content offset (`pt-3 sm:pt-5` -> `pt-1 sm:pt-2`).
  - Tightened vertical rhythm across all dashboard sections (`space-y-4` -> `space-y-2.5`), ensuring Quick Actions (Mock Test, Custom Quiz) remain readily visible on mobile viewports without excessive scrolling.

---

## [v1.0.285] - 31 October 2026, 04:18 PM IST

### Executive Summary
Resolved recurring background sync red alert popups ("Background sync failed. Retrying automatically...") by strictly scoping the 15-second heartbeat reconciliation timer, route transitions, and auto-retry rules to active quiz sessions.

### 🐛 Bug Fixes & Resilience
- **Quiz Periodic Sync Heartbeat Scoping (`src/features/quiz/hooks/useQuiz.ts`)**:
  - Restructured the 15-second periodic reconciliation timer, `beforeunload`, and `visibilitychange` window event listeners to only fire when actively inside an unpaused quiz route (`window.location.hash.includes('/quiz/session/') && currentState.status === 'quiz' && !currentState.isPaused && currentState.quizId`).
  - Stopped periodic sync cycles from executing when users pause quizzes or navigate back to the Dashboard or other routes.
- **Sync Queue & Error Toast Hardening (`src/features/quiz/stores/useQuizSessionStore.ts`)**:
  - Guarded `enqueueCloudSync('periodic_reconciliation')` to automatically no-op if called outside active quiz session routes or during paused states.
  - Eliminated repetitive `queryClient.invalidateQueries({ queryKey: ['latest-paused-quiz'] })` calls during routine 15s heartbeats, preventing continuous background Supabase queries.
  - Suppressed alarmist red error toast notifications for non-critical background periodic sync sweeps while preserving notifications for explicit user pause/complete actions.
  - Updated `goHome()` to explicitly clear `quizId: undefined` so navigation to the Dashboard terminates lingering quiz references.
- **Idempotent Retry Policy (`src/lib/fetchWithTimeout.ts`)**:
  - Updated `isSafeToRetry` to allow safe, exponential backoff retries for idempotent `PATCH` calls to `/rest/v1/saved_quizzes`, gracefully recovering from transient network drops or token refreshes without throwing error toasts.

---

## [v1.0.284] - 31 October 2026, 03:56 PM IST

### Executive Summary
Fixed critical database type mismatch error (`invalid input syntax for type uuid: "HIS14"`) affecting the Bookmarks view and state synchronization when handling questions with legacy alphanumeric identifiers.

### 🐛 Bug Fixes & System Hardening
- **Question Hydration by ID (`src/features/quiz/services/questionService.ts`)**:
  - Implemented smart ID partitioning via `UUID_REGEX` to isolate standard UUIDs from legacy alphanumeric identifiers (such as `"HIS14"`, `"BIO1"`).
  - Queried Supabase `questions` table using `.in('id', ...)` for UUIDs and `.in('v1_id', ...)` for legacy IDs, eliminating Postgres type casting errors (Postgres error `22P02`).
  - Wrapped batch queries in safe async executors to prevent unhandled promise rejections.
- **Bookmarks Page Resilience (`src/pages/BookmarksPage.tsx`)**:
  - Enhanced `useQuery` query function with error logging and graceful fallback.
  - Upgraded bookmark removal to delete both `question.id` (UUID) and `question.v1_id` from local IndexedDB and Supabase backend.
  - Enhanced "Reset Bookmarks" action to cleanly wipe bookmarks from both local IndexedDB and remote `user_bookmarks` table.
- **Background Sync Service (`src/lib/syncService.ts` & `src/features/quiz/stores/useBookmarkStore.ts`)**:
  - Updated `removeBookmark` API to accept and purge both `questionId` and optional `v1Id`.
  - Upgraded remote bookmark hydration to track both `id` and `v1_id`, preventing duplicate hydrations and redundant push events.
  - Hardened store bookmark toggle logic to check and filter both standard UUIDs and legacy IDs.

---

## [v1.0.283] - 31 October 2026, 12:16 PM IST

### Executive Summary
Major release introducing the **Today's Plan (Daily SSC Exam Prep Engine)**, comprehensive Dashboard experience enhancements, streamlined state synchronization, and core Navigation and Session Recovery hardening.

### ✨ Features Added
- **Today's Plan Module (`src/features/todays-plan/`)**:
  - **Dual-Track Prep System**: Seamless switching between **GK Exam Drill** and **English Vocab Booster**.
  - **Intelligent Scheduling Engine (`todaysPlanAlgorithm.ts`)**:
    - **Mistake Vault Integration**: Automatically flags and surfaces previously failed questions for high-priority retention drills.
    - **Spaced Retention Repetition**: Implements structured interval spacing (1-day, 3-day, 7-day, 14-day, 30-day intervals) to solidify memory.
    - **Chapters of 25**: Sequential syllabus progression curating focused 25-question topic batches.
  - **Adaptive Daily Hero Card**: 1-click drill launch (`TodaysPlanHeroCard.tsx`), real-time completion tracking, and animated skeleton loaders.
  - **Interactive Vocab Booster**: Flashcard-style vocabulary mastery cards with contextual examples and definitions.
- **Dashboard Experience Overhaul**:
  - **Live Dynamic Greeting & Stats (`DashboardGreeting.tsx`)**: Shows real-time bookmark counts synced between IndexedDB and Supabase, time-based dynamic greetings, and quick-action shortcuts.
  - **SSC Subject Strip (`SubjectStrip.tsx`)**: Highlighting primary exam subjects with progress indicators and instant subject drill launches.
  - **Targeted Exam Topics (`ImportantForSscStrip.tsx`)**: Quick-access tags for frequently tested topics and high-yield concepts.
  - **Suggested Drills & User Progress Cards**: Refined metrics and drill recommendations based on user practice patterns.

### 🐛 Bug Fixes & System Hardening
- **Navigation Flow Stabilization (`NavigationManager.tsx`)**:
  - Resolved history stack corruption and race conditions during fast tab switches on mobile and Capacitor Android.
  - Enhanced route-guard transitions and ensured smooth deep-linking without URL hash collisions.
- **Session Recovery & Bootstrap (`RecoveryManager.ts`, `useAppBootstrap.ts`)**:
  - Hardened guest session recovery logic against transient token refresh failures.
  - Preserved the mandatory OAuth hash interception guardrail (`window.location.hash` parsing) for GitHub Pages hosting.
- **Optimistic State Management (`useBookmarkStore.ts`, `useQuizSessionStore.ts`)**:
  - Enabled immediate optimistic UI updates for bookmarks and quiz states with resilient background synchronization to IndexedDB and cloud.
- **Provider Refactoring (`src/providers/AppProvider.tsx`, `src/lib/queryClient.ts`)**:
  - Extracted TanStack QueryClient into a clean dedicated module (`queryClient.ts`), reducing unnecessary render cycles in the core app tree.

---

## [v1.0.277] - 27 October 2026, 03:10 PM IST

### Executive Summary
Messaging and chat stability update resolving auto-scrolling issues in active discussion rooms.

### 🐛 Bug Fixes & Improvements
- **Chat Scrolling (`src/features/community/`)**:
  - Integrated React Virtuoso `followOutput` to ensure the chat window automatically follows new incoming messages smoothly.
  - Simplified scroll event handlers to prevent jitter on high-frequency message streams.

---

## [v1.0.276] - 27 October 2026, 01:03 PM IST

### Executive Summary
UI consistency update adding full Dark Mode compatibility to community message rooms.

### 🐛 Bug Fixes & Improvements
- **Theme Polish**:
  - Normalized Tailwind CSS dark mode classes (`dark:bg-slate-900`, `dark:text-slate-100`) across `ActiveChatRoom` and community message threads.
  - Resolved background-text contrast issues on dark themes for user message bubbles.

---

## [v1.0.275] - 27 October 2026, 09:39 AM IST

### Executive Summary
Mobile typing experience overhaul in chat inputs.

### ✨ Features Added & Improvements
- **Auto-Expanding Chat Bar**: Replaced single-line input with an auto-expanding textarea in `ChatInputBar.tsx`, allowing multi-line drafting without obstructing keyboard viewports.

---

## [v1.6 (6) - Android Release] - 25 October 2026, 04:57 PM IST

### Executive Summary
Production build release for Google Play Store packaging the latest PWA improvements into Capacitor Android.

### ⚡ Build & Platform Updates
- **Android Configuration (`android/app/build.gradle`)**:
  - Bumped `versionCode` to `6` and `versionName` to `1.6`.
  - Verified splash screen and deep-link handling for Android 14+ devices.

---

## [v1.0.273] - 26 October 2026, 08:51 PM IST

### Executive Summary
Layout fixes for mobile chat viewport and message rendering hierarchies.

### 🐛 Bug Fixes
- **Mobile Chat Layout**: Restored clean flexbox hierarchies and resolved message rendering overflow issues on narrow viewports.

---

## [v1.0.272] - 26 October 2026, 05:37 PM IST

### Executive Summary
Mobile edge-to-edge layout adaptation for immersive chat rooms.

### ⚡ Refactoring & Improvements
- **Edge-to-Edge UI**:
  - Removed restrictive `fixed inset-0` constraints from `MainLayout` on chat routes.
  - Allowed active chat room viewports to utilize full device display width while preserving `max-w-3xl` constraints on desktop screens.

---

## [v1.0.271] - 26 October 2026, 09:42 AM IST

### ✨ Features Added
- **Message Action Menu**: Implemented an accessible long-press context menu on chat messages supporting copy, quote, and report actions.

---

## [v1.0.270] - 26 October 2026, 07:49 AM IST

### ⚡ Architecture
- **URL-Driven Chat Routes**: Extracted `ActiveChatRoom` component and transitioned messaging views to URL parameters (`#/community/chat/:roomId`), enabling direct navigation and browser back/forward support.

---

## [v1.0.269] - 26 October 2026, 07:23 AM IST

### 🐛 Bug Fixes
- **Viewport Occlusion**: Corrected keyboard pop-up occlusions in `ActiveChatRoom` on mobile web browsers.

---

## [v1.0.268] - 25 October 2026, 12:21 AM IST

### ⚡ Architecture
- **Dedicated Headers**: Standardized header components and layout containers across secondary application pages.

---

## [v1.0.267] - 25 October 2026, 06:31 PM IST

### ⚡ UI Optimization
- **Header Route Visibility**: Dynamic suppression of the global navigation header on focused views (quizzes, active study rooms) to maximize reading screen real estate.

---

## [v1.0.266] - 25 October 2026, 04:10 PM IST

### 🐛 Bug Fixes
- **Auth Session Loops**: Resolved infinite session expired refresh loops for guest aspirants navigating between offline and online states.

---

## [v1.0.265] - 24 October 2026, 04:36 PM IST

### 🔒 Reliability
- **Stale-Session Recovery**: Completed full implementation of the session recovery manager for seamless user re-authentication without loss of quiz progress.

---

## [v1.0.264] - 24 October 2026, 02:33 PM IST

### ✨ UI Polish
- **Interactive Feedback**: Added clear "Coming Soon" modal feedback for in-development dashboard action tiles.

---

## [v1.0.263] - 24 October 2026, 11:23 AM IST

### 🔒 Reliability & Architecture
- **Global Session Recovery Architecture**: Laid foundational recovery routines to detect invalidated auth tokens and gracefully guide users through re-auth.

---

## [v1.0.262] - 24 October 2026, 09:27 AM IST

### 📚 Documentation
- **Architecture Mapping**: Generated comprehensive repository and directory maps in `/docs` to guide feature modularization.
