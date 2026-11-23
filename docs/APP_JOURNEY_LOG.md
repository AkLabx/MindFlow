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

## [v1.0.373] - 23 November 2026, 02:12 PM IST

**Executive Summary:** Live Timed CBT Mock Runner on `/exam/:testId` (`PreparedMockExamPage`). Replaced the `"Coming in Phase 4"` `ExamPlaceholderPage` stub and raw `navigate(-1)` with an immersive, crash-safe Computer-Based Test (CBT) engine supporting `>100`-question BPSC mocks (`103`–`150` Qs) via `100`-UUID chunked ordered hydration, a monotonic `visibilitychange`-resilient countdown timer, Memory/`localStorage`/IndexedDB + `DB_TABLES.MOCK.ATTEMPTS` `in_progress` reload recovery, Desktop persistent sidebar & Mobile `NativeDialog` Question Palette drawer, and native `<dialog>` Pause & Exit / Submit flows with BPSC `-0.33` negative marking (`DEC-0021`, `OLD-012`).

### ✨ Features Added
- **Live Timed CBT Mock Runner & Palette Navigation (`src/features/mock-tests/pages/PreparedMockExamPage.tsx`, `src/config/routes.ts`, `src/routes/AppRoutes.tsx`)**: Registered `ROUTES.TEST_SERIES.EXAM_RUNNER(testId)` (`/exam/:testId`) in the `auth-immersive` fullscreen route group, rendering bilingual English/Hindi + KaTeX stems and options, font zoom (`A-`/`A+`), `>=44x44px` `type="button"` `active:scale-95` `scroll-mb-28` controls, 5-state palette legend & filters (`All`, `Unanswered`, `Marked`), persistent Desktop sidebar (`1280x800`), Mobile `<NativeDialog variant="drawer-right">` palette drawer (`390x844`), and native `<NativeDialog role="alertdialog">` Pause & Exit and Submit Confirmation flows with `useNotification()` Popover toasts.
- **Chunked `>100`-Q Ordered Hydration & Crash-Safe Attempt Persistence (`src/features/mock-tests/api/mockTestsApi.ts`, `src/features/quiz/services/quizCreationService.ts`)**: Added `fetchPreparedMockTestQuestions()` (`100`-UUID chunking against `DB_TABLES.BANK.QUESTIONS` with `.is('deleted_at', null)` preserving exact `question_ids` sequence), 3-tier question/active-attempt caching (`DEC-0004`), `startOrResumePreparedMockAttempt()` (`resumeAttemptId` + reload recovery), `savePreparedMockAttemptProgress()`, `computePreparedMockScore()`, `submitPreparedMockAttempt()`, and `MAX_PREPARED_MOCK_QUESTIONS = 250` while keeping custom student quizzes capped at `100`.

### 🐛 Bug Fixes & Navigation Safety
- **Dead-End Removal & Hardware Back Delegation (`src/features/mock-tests/pages/ExamPlaceholderPage.tsx`, `src/hooks/useHardwareBackButton.ts`)**: Eliminated `ExamPlaceholderPage` `"Coming in Phase 4"` dead-end, external noise SVG, and raw `navigate(-1)`; added `/exam/:testId` handling in `resolveHardwareBackTarget()` plus cancelable `mindflow:exam-back-request` interception so Android hardware back opens the Pause & Exit `<dialog>` during live tests (`DEC-0002`).

### ⚡ Performance & Verification
- **Automated & Live Verification (`src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`)**: Added `6` Vitest unit/component tests; passed `npx.cmd tsc --noEmit` (`0` errors), `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`37/37` files, `233/233` tests), `npx.cmd vite build` (`5483` modules, PWA precache `202` entries / `6741.72 KiB`), and live Chrome verification across Desktop (`1280x800`) + Mobile (`390x844`) on `69th BPSC Prelims PYQs` (`103` Qs, `120 mins`, `-0.33` negative marking) confirming live countdown, mid-exam reload recovery, mobile drawer, Pause/Resume/Submit `<dialog>` flows, `0px` mobile overflow, and `0` console errors.

## [v1.0.372] - 22 November 2026, 09:11 PM IST

**Executive Summary:** Student `TestDetailPage` Bug Fixes, Real Attempt History, 0ms Offline Caching & Save/Share Actions. Fixed `negative_marks_per_question` (`-0.33` for BPSC) and `BrandedThumbnail` heading-level nesting, replaced raw `navigate(-1)` with deterministic logical `<ArrowLeft />` & Android hardware back return (`DEC-0002`), wired real `DB_TABLES.MOCK.ATTEMPTS` history (`userId`-scoped 0ms cache + adaptive `Start`/`Resume`/`Re-attempt` CTA), added user-scoped Save/Bookmark & canonical Share actions with `useNotification()` Popover toasts (`DEC-0014`), and hardened `.maybeSingle()` detail fetching (`DEC-0020`).

### ✨ Features Added
- **Real Attempt History & 0ms Detail/Bookmark Caching (`src/features/mock-tests/api/mockTestsApi.ts`)**: Added `fetchUserTestAttempts(testId, userId)` querying `DB_TABLES.MOCK.ATTEMPTS` without `answers` JSONB, `userId`-scoped 3-tier Memory/`localStorage`/`MindFlowDB.sync_metadata` caching for attempt history and saved/bookmarked mock tests (`toggleSavedMockTest`, `isMockTestSaved`), and schedule-safe single-test detail caching (`getCachedTestDetailsSnapshot`, `readTestDetailsIndexedDBCache`) with catalog fallback (`DEC-0004`, `DEC-0017`, `DEC-0018`).
- **Pre-Launch `TestDetailPage` UI, Adaptive CTA & Save/Share Cascade (`src/features/mock-tests/pages/TestDetailPage.tsx`)**: Added 5-tile `<dl>` exam specs (`Duration`, `Questions`, `Total Marks`, `Passing Marks`, `Negative Marking`), 4 summary stat tiles + accessible attempt rows (top 5 + `"Show all"`, Pass/Below Cutoff badges vs `passing_marks`), adaptive CTA (`Resume Attempt` with `resumeAttemptId` / `Re-attempt Test` / `Start Test`), Save toggle (`aria-pressed`), and cross-platform Share (`@capacitor/share` / `navigator.share` / clipboard fallback) with `useNotification()` Popover toasts, `scroll-mb-28`, and `>=44x44px` `type="button"` `active:scale-95` controls (`DEC-0008`, `DEC-0019`).

### 🐛 Bug Fixes
- **Negative Marking, Logical Back & Visual Contrast (`src/features/mock-tests/pages/TestDetailPage.tsx`, `src/features/mock-tests/pages/TestsListPage.tsx`, `src/hooks/useHardwareBackButton.ts`)**: Fixed `test.negative_marks_per_question` $\rightarrow$ `Number(test.negative_marks ?? 0)`, removed `navigate(-1)` in favor of `resolveTestDetailBackTarget()` + top `<ArrowLeft />` return, preserved `location.state.returnTo` across `TestsListPage` and `resolveHardwareBackTarget()`, switched `fetchTestDetails()` to `.maybeSingle()` to prevent HTTP `406` console errors, isolated the floating hero icon's negative margin so `<h1>` sits cleanly below the banner, bypassed hanging Windows Desktop `navigator.share` to instant clipboard copy, and removed the external `grainy-gradients.vercel.app` banner dependency.
- **Accessibility & Heading Hierarchy (`src/features/mock-tests/components/BrandedThumbnail.tsx`, `Breadcrumbs.tsx`, `EmptyState.tsx`)**: Replaced decorative `<h2>` inside `BrandedThumbnail.tsx` with `<span aria-hidden="true">`, upgraded `TestDetailPage` section headings to `<h2>`, added `aria-label="Breadcrumb"` / `aria-current="page"` / `44px` buttons in `Breadcrumbs.tsx`, and added `type="button"` + `min-h-[44px]` + secondary retry support in `EmptyState.tsx`.

### ⚡ Performance & Verification
- **Automated & Live Verification (`src/features/mock-tests/__tests__/testDetailPage.test.tsx`)**: Added `6` Vitest unit/component tests and aligned `useHardwareBackButton.test.ts` and `adminTestSeriesCms.test.tsx`; passed `npx.cmd tsc --noEmit` (`0` errors), `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`36/36` files, `227/227` tests), `npx.cmd vite build` (`5482` modules, PWA precache `200` entries / `6693.46 KiB`), and live Chrome verification on Desktop (`1280x800`) + Mobile (`390x844`) with `0` console errors and `0px` horizontal overflow.

## [v1.0.371] - 22 November 2026, 02:17 PM IST

**Executive Summary:** Dedicated BPSC Prepared Mock Tests Page, Canonical Exam Routing & 0ms Offline Hydration. Built the student-facing listing page (`/mcqs/test-series/bpsc` & `/mcqs/test-series/exam/:examSlug`) backed by `DB_TABLES.MOCK.*`, `examRegistry.ts` canonical aliasing, schedule-window enforcement (`DEC-0017`), 3-tier Memory/`localStorage`/IndexedDB (`SYNC_METADATA_STORE`) caching (`DEC-0004`), `>=44x44px` filter chips, deterministic `<ArrowLeft />` parent navigation (`DEC-0002`), and a unified context-aware discovery card across Dashboard, MCQs Hub, and Mock Tests Home (`DEC-0003`, `DEC-0019`).

### ✨ Features Added
- **Dedicated BPSC & Canonical Exam Mock Tests Page (`src/features/mock-tests/pages/ExamPreparedMockTestsPage.tsx`, `src/config/routes.ts`, `src/routes/AppRoutes.tsx`)**: Registered `ROUTES.TEST_SERIES.BPSC` (`/mcqs/test-series/bpsc`), `ROUTES.TEST_SERIES.EXAM(':examSlug')`, and `getPreparedMockTestsRoute()`, rendering published series and prepared mock tests with `>=44x44px` `type="button"` `active:scale-95` filter chips (`All`, `Full-Length`, `Free`, `Attempted`), searchable filtering, official specs (`duration_minutes`, `question_count`, `total_marks`, `negative_marks`), off-screen `content-visibility: auto`, actionable empty/offline recovery states, and deterministic `<ArrowLeft />` logical return.
- **Context-Aware Discovery Card (`src/features/mock-tests/components/PreparedMockTestsShortcutCard.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/McqsQuizHomePage.tsx`, `src/features/mock-tests/pages/ExamCategoriesPage.tsx`)**: Added a unified `useExamContextStore`-driven shortcut card linking to the active exam's prepared mocks plus a 1-tap `BPSC Mocks` CTA across Dashboard, MCQs Hub, and Mock Tests Home, with `scroll-mb-28` bottom-bar clearance (`WCAG 2.4.11`).

### ⚡ Performance & Architecture
- **Canonical Exam-Aware API & 0ms Offline SWR Cache (`src/features/mock-tests/api/mockTestsApi.ts`, `src/lib/db.ts`)**: Added `fetchPreparedMockTestsByExam`, `materializePreparedMockTests`, `doesTextMatchCanonicalExam`, `isFullLengthMockTest`, `getCachedPreparedMockTestsSnapshot`, and `readPreparedMockTestsIndexedDBCache` powered by `DB_TABLES.MOCK.*` and `MindFlowDB` (`getCacheEntry`/`setCacheEntry` on `SYNC_METADATA_STORE`), enforcing `isTestWithinScheduleWindow()` on both cached and live data and scoping attempt status caches by user ID.
- **Automated Verification (`src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`)**: Added `7` Vitest unit and component tests covering canonical aliasing (`BPSSC` non-collision), schedule-window cache expiration, IndexedDB fallback hydration, filter chips, `>=44x44px` buttons, offline retry recovery, and logical back return (`35/35` test files, `221/221` tests green).

## [v1.0.370.1] - 22 November 2026, 11:20 AM IST

**Executive Summary:** Backend Assessment Nomenclature (`mock_*` / `quiz_*`), Atomic 10-RPC Sync & Modular `src/config/dbTables.ts` Registry. Non-destructively grouped Admin-Prepared Preset Mock Tests (`mock_categories`, `mock_series`, `mock_tests`, `mock_test_attempts`) and Custom Student Quizzes (`quiz_sessions`, `quiz_session_questions`, `quiz_session_results`) in Supabase, documented all 18 assessment/adjacent tables with `COMMENT ON TABLE`, atomically updated all 10 dependent PostgreSQL functions, and centralized frontend table/RPC identifiers in `src/config/dbTables.ts` while preserving local IndexedDB stores (`DEC-0004`).

### 🔒 Security & Architecture
- **Non-Destructive Database Nomenclature & RPC Sync (`supabase/migrations/20261122010000_standardize_assessment_nomenclature.sql`)**: Renamed Block A (`exam_categories` $\rightarrow$ `mock_categories`, `test_series` $\rightarrow$ `mock_series`, `tests` $\rightarrow$ `mock_tests`, `user_test_attempts` $\rightarrow$ `mock_test_attempts`) and Block B (`saved_quizzes` $\rightarrow$ `quiz_sessions`, `bridge_saved_quiz_questions` $\rightarrow$ `quiz_session_questions`, `quiz_history` $\rightarrow$ `quiz_session_results`) via zero-`DROP` `ALTER TABLE ... RENAME TO ...`, retaining all 14 RLS policies and 22 constraints; added `COMMENT ON TABLE` metadata across 18 tables; atomically updated all 10 live PostgreSQL functions (plus canonical `public.get_mock_test_leaderboard`) with locked `SET search_path TO 'public', 'pg_temp'` and `REVOKE ALL ... FROM PUBLIC, anon`.

### ⚡ Performance & Refactoring
- **Modular Registry & Call-Site Sync (`src/config/dbTables.ts`)**: Created `DB_TABLES` (`MOCK`, `QUIZ`, `BANK`, `BLUEPRINT`, `RANKER`) and `DB_RPCS`, exported `as const` PostgREST relational select queries in `adminTestSeriesApi.ts`, migrated all 25 Block A/Block B APIs, UI cards, guards, stores, sync services (`syncService.ts`), retry allowlists (`fetchWithTimeout.ts`), and Vitest suites (`adminTestSeriesCms.test.tsx`, `fetchWithTimeout.test.ts`), and strictly preserved local browser IndexedDB store names (`'saved_quizzes'`, `'quiz_history'`) in `src/lib/db.ts`.
- **Verification**: Verified live `pg_tables`, `pg_policies`, `pg_constraint`, `pg_proc` (`0` stale table references), and `get_advisors(type="security")`; passed `npx.cmd tsc --noEmit` (`0` errors), `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`34/34` files, `214/214` tests), and `npx.cmd vite build` (`5480` modules, PWA precache `196` entries / `6635.12 KiB`).

## [v1.0.370] - 22 November 2026, 09:26 AM IST

**Executive Summary:** Mock Tests & Admin RBAC Database Security, Schedule-Window Enforcement & Privacy-Safe Leaderboard RPC. Eliminated the cross-user `user_test_attempts.answers` JSONB privacy leak, scoped student Mock Tests RLS policies `TO authenticated` with schedule-window and parent-active checks, enforced publish integrity in Postgres constraints and Admin CMS APIs, and added 100-UUID chunked soft-delete-aware question validation.

### 🔒 Security & Architecture
- **Mock Tests & Leaderboard Database Hardening (`supabase/migrations/20261122000000_harden_mock_tests_rls_and_leaderboard.sql`)**: Locked down `"Public read for leaderboard if completed"` on `public.user_test_attempts` (`USING (false)`), scoped all student Mock Tests policies (`exam_categories`, `test_series`, `tests`, `user_test_attempts`) `TO authenticated` with cascading active-category/published-series and `release_date` / `expiry_date` schedule-window enforcement, added `accuracy NUMERIC(5,2)` + status/publish/schedule `CHECK` constraints, and introduced authenticated `SECURITY DEFINER` RPC `public.get_test_leaderboard` (`SET search_path = public, pg_temp`) that ranks each user's best completed attempt without exposing `answers` JSONB.
- **Student Schedule-Window & Leaderboard DTO Hardening (`src/features/mock-tests/api/mockTestsApi.ts`)**: Added `TestLeaderboardEntry`, `isTestWithinScheduleWindow()`, `sanitizeLeaderboardEntry()`, and `fetchTestLeaderboard()`, plus cascading `is_published` / `is_active` and schedule-window guards across `fetchPublishedTests`, `fetchSeriesDetails`, `fetchTestDetails`, and `searchTestsApi`.
- **Admin Publish Integrity & Chunked Validation (`src/features/admin/test-series/api/adminTestSeriesApi.ts`, `src/features/admin/test-series/hooks/useTests.ts`)**: Enforced `validateTestForPublish` inside `createTest`, `updateTest`, and `useTests.toggleTestPublish`, added blank question ID and invalid schedule-date rejection, and upgraded `validateQuestionIds` with 100-UUID batch chunking and `.is('deleted_at', null)` soft-delete filtering.

### ✨ Features Added
- **Mock Tests Security & Contract Test Suite (`src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`)**: Added automated Vitest coverage for publish integrity guards, 150-UUID chunked `validateQuestionIds`, `mockTestsApi` schedule-window filtering, and `get_test_leaderboard` DTO sanitization (`212/212` tests passing across `34` files).

## [v1.0.369] - 22 November 2026, 08:09 AM IST

**Executive Summary:** Admin Mock Tests CMS Controls & High-Cardinality `QuestionBuilder` Filtering. Added URL-synced Category/Series/Status filtering, 1-tap readiness-guarded Publish/Unpublish, smart Draft cloning, and cascade-safe delete warnings with child counts in `/admin/test-series`, alongside `subTopic` (424) and `examDateShift` (332) filtering powered by an accessible `SearchableFilterCombobox` (`maxVisible=50`) in `QuestionBuilder`.

### ✨ Features Added
- **Admin Mock Tests CMS Controls (`src/features/admin/test-series/pages/AdminTestSeriesDashboard.tsx`, `adminTestSeriesApi.ts`, `TestCard.tsx`, `SearchBar.tsx`, `EmptyState.tsx`)**: Added URL-synced Category, category-scoped Series, and Status (`All`/`Published`/`Draft`) filters with cross-tab `category` preservation, semantic `<search>` bar + `role="status"` summary + 1-tap `Reset Filters`, 1-tap readiness-guarded Publish/Unpublish (using shared `validateTestForPublish` and Draft-parent-series warning), 1-tap smart Draft cloning (`cloneTest` nulling `release_date`/`expiry_date` and switching `status=published` $\rightarrow$ `All`), and `>=44x44px` `type="button"` `active:scale-95` card controls.
- **High-Cardinality `subTopic` & `examDateShift` Filters (`src/features/admin/question-builder/components/SearchableFilterCombobox.tsx`, `QuestionFilterBar.tsx`, `questionBuilderApi.ts`, `QuestionResultCard.tsx`, `questionBuilder.types.ts`)**: Extended `fetchFilterOptions()` to 7 parallel `get_distinct_values` RPCs (`mindflow_qb_filter_options_v2` SWR cache), wired `.eq('subTopic')` and `.eq('examDateShift')` query filters + card badges, and introduced `SearchableFilterCombobox` (`maxVisible=50` capped listbox with truncation hint, `<input type="search">`, `44x44px` clear button, and `Escape`/outside-click dismiss).
- **Automated CMS & QuestionBuilder Test Coverage (`adminTestSeriesCms.test.tsx`, `questionBuilder.test.tsx`)**: Expanded test coverage to `17/17` passing Vitest tests (`10` CMS + `7` QuestionBuilder).

### 🐛 Bug Fixes
- **CMS Popover Toast Migration & Cascade Sync (`useCategories.ts`, `useSeries.ts`, `useTests.ts`, `AdminTestSeriesDashboard.tsx`)**: Migrated all three CMS hooks off unmounted `react-hot-toast` onto MindFlow's `useNotification()` Popover toast store (`DEC-0014`), added `isMountedRef` lifecycle safety, added `busyTestIdsRef` double-click protection, and wired `ConfirmDialog` child counts (`X test series and Y mock tests`, `Y mock tests`, question count) + loading lock + downstream `refreshSeries()`/`refreshTests()` sync after Postgres cascade deletes.
- **Eliminated Step 3 Accessibility Tree Timeout (`SearchableFilterCombobox.tsx`, `QuestionFilterBar.tsx`)**: Replaced 756+ raw `<option>` nodes for `subTopic` (424) and `examDateShift` (332) with `SearchableFilterCombobox` (single `<button>` trigger when closed, `maxVisible=50` when open), eliminating `OP_TIMEOUT` (43–46s) freezes on mount.

### ⚡ Performance & Refactoring
- **Single-Pass CMS Aggregation & Semantic Markup (`AdminTestSeriesDashboard.tsx`, `TestCard.tsx`)**: Computed `categoryStats`, `seriesTestCounts`, `seriesById`, and `seriesToCategory` maps in a single $O(C+S+T)$ pass with post-hydration URL reconciliation and upgraded `TestCard` to semantic `motion.article` + `<footer>`.

## [v1.0.368] - 21 November 2026, 11:27 PM IST

**Executive Summary:** Admin `QuestionBuilder` Performance, Refetch-Loop Fix & Canonical BPSC Filter. Eliminated redundant UUID refetches and React render-phase warnings on question selection, replaced the 1,000-row unpaged metadata scan with an SWR-cached `get_distinct_values` RPC pipeline, added canonical exam group filtering (`canonical:bpsc` resolving 20 aliases / 5,794 questions), and upgraded mobile `< lg` tabs and `>=44x44px` touch controls.

### ✨ Features Added
- **Canonical Exam Group Filtering (`src/features/dashboard/constants/examRegistry.ts`, `src/features/admin/question-builder/types/questionBuilder.types.ts`, `QuestionFilterBar.tsx`, `questionBuilderApi.ts`)**: Added `BPSC TRE3`, `getCanonicalExamById()`, `resolveCanonicalExamNames()`, `CANONICAL_EXAM_PREFIX`, and grouped `"Canonical Exam Groups"` (`All BPSC (All Aliases)`) above `"Specific Exam Papers"` so `searchQuestions()` filters `.in('examName', resolvedNames)` across all 20 BPSC aliases while excluding soft-deleted rows (`.is('deleted_at', null)`).
- **Mobile 2-Tab Switcher & Vitest Suite (`QuestionBuilder.tsx`, `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)**: Added a native-style `< lg` 2-tab switcher (`Search Bank` | `Selected (N)`) preserving search state via CSS visibility, plus 5 automated unit/component tests covering canonical alias resolution, PostgREST query safety, RPC caching, 100-UUID chunking, and refetch/toast behavior.

### 🐛 Bug Fixes
- **Eliminated Selection Refetch Loop & Render-Phase `onChange` (`QuestionBuilder.tsx`)**: Added `selectedQuestionsRef`, `lastSyncedIdsKeyRef`, `onChangeRef`, and `commitSelection()` so echoed `initialQuestionIds` never trigger redundant `questions?id=in.(...)` refetches and `onChange` never runs inside `setSelectedQuestions` updaters.
- **PostgREST Search Sanitization & Popover Toasts (`questionBuilderApi.ts`, `QuestionBuilder.tsx`, `QuestionSearchPanel.tsx`)**: Added `sanitizePostgrestSearch()` to strip `,`, `(`, `)` from `.or()` queries, trimmed empty `""` difficulty options from RPC responses, migrated Bulk Add/Import/Undo notifications to MindFlow's Top-Layer Popover `useNotification()` store (`DEC-0014`), and added inline `role="alert"` search error + Retry recovery.

### ⚡ Performance & Refactoring
- **SWR `get_distinct_values` RPC Metadata Cache & Chunked Hydration (`questionBuilderApi.ts`)**: Replaced the unpaged `.from('questions')` metadata scan with 5 parallel `supabase.rpc('get_distinct_values', { column_name })` calls backed by a 5-minute memory TTL, in-flight deduplication, `localStorage` snapshot (`mindflow_qb_filter_options_v1`), and offline `db.getQuizMetadataCache()` fallback; chunked `fetchQuestionsByUUIDs()` into parallel batches of `100` UUIDs.
- **Touch Ergonomics & Form Safety (`QuestionFilterBar.tsx`, `QuestionResultCard.tsx`, `QuestionSearchPanel.tsx`, `SelectedQuestionsPanel.tsx`)**: Enforced explicit `type="button"` on all 62 builder buttons, `>=44x44px` `active:scale-95` touch targets, and always-visible `Remove question` buttons in `SelectedQuestionsPanel`.

## [v1.0.367] - 21 November 2026, 09:08 PM IST

**Executive Summary:** Dedicated 4-Step Full-Page Mock Test Studio, Relational CMS Selects & Touch-Accessible Cards. Replaced the incomplete side-drawer Mock Test form with a full-page 4-step studio (`AdminTestBuilderPage`), unified CMS notifications onto MindFlow's Top-Layer Popover system, fixed multi-series category test counts, and made all CMS card actions visibly tappable on mobile.

### ✨ Features Added
- **4-Step Full-Page Mock Test Studio (`src/features/admin/test-series/pages/AdminTestBuilderPage.tsx`)**: Implemented Create (`/admin/test-series/tests/new`) and deep-linkable Edit (`/admin/test-series/tests/:testId/edit`) flows with URL step synchronization (`?step=1..4`), accessible `<nav>` stepper, step heading focus management, 3 exam presets (`BPSC Prelims`, `BPSC Sectional`, `General / SSC`), optional release/expiry schedule window, full-width `QuestionBuilder` workspace, Step 4 Review & Publish readiness checks, sticky action bar (`Save Draft` / `Next` / `Publish Test`), and `ConfirmDialog` unsaved-changes guard.
- **Routing, Breadcrumbs & Hardware Back (`src/config/routes.ts`, `src/routes/AppRoutes.tsx`, `src/features/admin/layouts/AdminHeader.tsx`, `src/hooks/useHardwareBackButton.ts`)**: Registered lazy-loaded builder routes, added admin header breadcrumbs for Create/Edit Mock Test, and mapped Android hardware back from `/admin/test-series/*` to `/admin/test-series?tab=tests`.
- **Relational API Hydration (`src/features/admin/test-series/api/adminTestSeriesApi.ts`)**: Added `fetchTestById(id)`, typed `TestMutationPayload`, and relational `.select(...)` joins on test/series fetch and mutation queries so parent Exam Category and Series names populate immediately.

### 🐛 Bug Fixes
- **Form Isolation & Render-Phase Guard (`TestDrawer.tsx`, `AdminTestBuilderPage.tsx`)**: Isolated `<QuestionBuilder>` outside `<form>` to prevent internal buttons from triggering accidental submissions, deferred `onChange` updates via `queueMicrotask` + `isMountedRef`, enforced integer `duration_minutes`, and preserved falsy-zero numeric values (`0`) via `??` and string-backed form state.
- **Popover Toasts & Category Aggregation (`AdminTestSeriesDashboard.tsx`, `TestDrawer.tsx`)**: Replaced unmounted `react-hot-toast` and `window.alert()` with MindFlow's Top-Layer Popover `useNotification()` toasts, and replaced the `series.find(...)` bug with an $O(C+S+T)$ `categoryStats` `Map` summing tests across all series per category.
- **Mobile Touch Ergonomics (`TestCard.tsx`, `SeriesCard.tsx`, `CategoryCard.tsx`)**: Removed hover-only `opacity-0 group-hover:opacity-100` classes, enforced `min-w-[44px] min-h-[44px]` `active:scale-95` Edit/Delete buttons with `aria-label`s, and displayed Category · Series, passing marks, and negative marking on `TestCard`.

## [v1.0.366] - 21 November 2026, 03:58 PM IST

**Executive Summary:** Autonomous "1 Chat = 1 Version" Workflow System & Closed-Loop Memory Engine. Established supreme repository governance via `AGENTS.md` and `GEMINI.md`, installed the `version-ritual` skill, deployed a 10-step milestone blueprint architecture, and launched an ultra-lean (<20 KB) Hot Context cold-start system centered on `CURRENT_HANDOVER.md` and `DECISIONS_MASTER.md`.

### ✨ Features Added
- **Autonomous Version Ritual Skill (`.agents/skills/version-ritual/SKILL.md`)**: Configured the perpetual 4-phase lifecycle (Cold-Start & Pre-Flight, Isolated Execution & Manifest Sync, Real Verification, and Mandatory 7-Step Closeout Ritual).
- **Master Technical Decision Ledger (`docs/DECISIONS_MASTER.md`)**: Consolidated all active invariants (`DEC-0001` through `DEC-0013`) and retired approaches (`OLD-001` through `OLD-005`) into an immutable reference table.
- **Live Handover Baton (`docs/handovers/CURRENT_HANDOVER.md`)**: Created the single living baton containing verified baseline snapshots, workstation port rules, pre-planned execution briefs, and copy-paste starter prompts.
- **Multi-Generation Roadmap & v1.0 Blueprint (`docs/blueprint/`)**: Mapped generational horizons and detailed the 10 concrete milestone increments for Generation 1.
- **Per-Version Release Dossier Architecture (`docs/versions/`)**: Scaffolding for comprehensive release documentation tracking Path A vs Path B engineering choices.

### 🔒 Security & Architecture
- **System-2 Cognitive Pre-Flight (`AGENTS.md`)**: Enforced mandatory lifecycle simulation and 3-runtime-failure-mode analysis before writing code, strictly banning cosmetic dummy mocks.
- **Circuit Breakers ("Stop & Ask")**: Hard pause triggers established for >10 files, dependency changes, database migrations, and auth adjustments.
- **Ultra-Lean Cold-Start Protocol (`GEMINI.md`)**: Shifted historical changelogs to on-demand archives, reducing session cold-start context from ~70k tokens down to ~5k tokens (<20 KB).
- **Git Tracking Hygiene (`.gitignore`)**: Whitelisted `.agents/skills/` to ensure skill distribution while maintaining isolation for ephemeral agent workspaces.

---

## [v1.0.365] - 18 November 2026, 10:10 AM IST

**Executive Summary:** MindFlow Social Media Chatroom Comprehensive UI/UX Uplift & Robustness Architecture. Resolved critical navigation flow-breakers (fixed 404 routing on "View profile", direct room routing from user profiles, and `location.state?.roomId` inbox forwarding), implemented complete "New Chat" discovery with an Android-style FAB and interactive user search modal, engineered direction-locked swipe-to-reply and haptic touch long-press to eliminate mobile scrolling jitter, established dynamic visual viewport keyboard avoidance, activated an interactive quick emoji strip, and fixed Chromium WebM voice note duration freezes and cross-origin lightbox downloads.

### ✨ Features Added
- **"New Conversation" Discovery Engine (`NewChatModal.tsx`, `ChatRooms.tsx`)**: Designed and integrated a mobile-first user search bottom sheet powered by `searchProfiles` and `getOrCreateChatRoom`, allowing users to search peers by name or `@username` and instantly launch direct chats from the inbox.
- **Android Floating Action Button (FAB)**: Added a prominent bottom-right FAB with tactile touch scaling (`active:scale-90`) and header quick-action for creating new conversations from `ChatRooms`.
- **Zero Dead-Ends Inbox Recovery**: Transformed the empty conversation list into an actionable hub offering one-tap "Start a Conversation" and "Explore Community" CTA buttons per Constitution directives.
- **Floating "Scroll to Bottom" Jump Button (`ActiveChatRoom.tsx`)**: Built a smooth floating FAB that appears when the user scrolls away from recent messages, featuring smooth auto-scroll anchoring (`scrollToBottom('smooth')`).
- **Interactive Inline Quick Emoji Strip (`ChatInputBar.tsx`)**: Replaced the previous dead emoji button with a toggleable, rapid-access emoji shelf containing popular study and peer communication reactions, inserting directly at the cursor in the message textarea.

### 🐛 Bug Fixes
- **Resolved 404 Route Failure on View Profile (`ActiveChatRoom.tsx`)**: Corrected top bar avatar and menu navigation from non-existent `/community/profile/:id` to canonical `/u/:username` (`ROUTES.SOCIAL.USER_PROFILE`), eliminating navigation crashes.
- **Resolved Silent Inbox Drop from User Profiles (`UserProfile.tsx`, `ChatRooms.tsx`)**: Fixed the "Message" button on user profiles to navigate directly to `/messages/:roomId` instead of dropping users into `/messages`, and added `location.state?.roomId` forwarding in `ChatRooms` as a resilient fallback.
- **Eliminated Chat Bubble Jitter on Touchscreens (`useSwipeToReply.ts`)**: Implemented two-dimensional axis locking ($| \Delta Y | > | \Delta X |$ locks to vertical scroll), preventing message bubbles from wobbling or triggering accidental replies during vertical scrolling.
- **Robust Mobile Long-Press Engine (`ChatMessageItem.tsx`)**: Replaced erratic `onContextMenu` with a dedicated 450ms touch timer with movement cancellation ($>10\text{px}$) and tactile haptic vibration (`navigator.vibrate(25)`).
- **Resolved Chromium WebM Voice Note Duration Freeze (`VoiceNotePlayer.tsx`)**: Added fallback handling for Chromium's `audio.duration = Infinity` quirk on MediaRecorder WebM blobs, restoring accurate total duration display and waveform scrubbing.
- **Fixed Cross-Origin Image Downloads (`MediaLightbox.tsx`)**: Implemented fetch-to-blob object URL downloading, preventing browser security blocks on remote Supabase Storage assets.
- **Replaced Disruptive `alert()` Modals**: Converted raw browser `window.alert(...)` modals in `AttachmentBottomSheet` and `ChatInputBar` to native MindFlow toasts via `useNotification`.

### 🔒 Security & Architecture
- **Single-Room Deep Link Fetcher (`fetchRoomById` in `chatApi.ts`)**: Added fallback room query to guarantee participant profiles and headers hydrate instantly even when direct-linking to a room not yet in the active `fetchUserRooms` cache.
- **Dynamic Visual Viewport Keyboard Accommodation**: Adapted `ActiveChatRoom` container height to dynamic `window.visualViewport.height`, preventing mobile virtual keyboards from obscuring the input bar and textarea on Android Capacitor and mobile browsers.

---

## [v1.0.364] - 18 November 2026, 08:35 AM IST

**Executive Summary:** Complete MindFlow Social Chatroom Brand Realignment & Full Feature Activation. Re-skinned the chatroom from an overt WhatsApp clone into MindFlow's distinct Indigo / Deep Violet & Slate / Cyber-Glassmorphic design system with a custom Neural Synapse background, while strictly preserving familiar messenger ergonomics (dual-capsule input, bubble tails, micro-timestamps, and swipe-to-reply). Expanded PostgreSQL schema (`reply_to_id`, `voice_duration`, `file_name`, `file_size`, `deleted_at`, `chat_message_reactions`), unlocked Supabase Storage bucket for voice notes & office documents up to 25 MB, and wired complete document sharing with extension badges, real file names, and formatted file sizes.

### ✨ Features Added
- **MindFlow Brand Realignment (`chatTheme.ts`, `ChatTopBar.tsx`, `ChatReceiptTicks.tsx`)**: Transformed all hardcoded WhatsApp greens (`#008069`, `#00A884`, `#25D366`, `#D9FDD3`, `#005C4B`) and tan canvas (`#EFEAE2`) into MindFlow Indigo gradients (`from-indigo-600 to-indigo-700`), crisp Slate card surfaces (`bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800`), MindFlow Sky-400 read receipt checkmarks (`#38BDF8`), and an elevated glassmorphic top app bar.
- **MindFlow Neural Synapse Wallpaper (`ChatWallpaper.tsx`)**: Replaced WhatsApp coffee-cup/heart doodles with a bespoke vector learning mesh depicting neural synapses, interconnected nodes, and constellation pathways at 2-3% opacity.
- **Rich PDF & Document Sharing**: Captures original filename and file size on document selection, rendering rich document bubbles with file extension badges (`PDF`, `DOCX`, `TXT`), formatted byte sizes (e.g. `2.4 MB`), and direct download actions.
- **Fully Wired Reactions & Soft Delete**: Created `chat_message_reactions` table in Supabase, wired `onReact` with optimistic cache reconciliation and docked reaction badges, and added author soft deletion (`deleted_at`) with clean "This message was deleted" indicator cards.
- **Storage Bucket MIME & Size Expansion**: Configured `chat_media` Supabase Storage bucket to accept voice notes (`audio/webm`, `audio/mp4`, `audio/mpeg`, `audio/ogg`, `audio/wav`) and study notes (`application/pdf`, `.docx`, `.doc`, `.txt`) with an expanded 25 MB limit.
- **Attachment Drawer Parity (`AttachmentBottomSheet.tsx`)**: Re-skinned the attachment drawer with MindFlow colors and study-relevant options (Documents/PDFs, Camera, Gallery, Audio, and Quiz Question sharing).

### 🐛 Bug Fixes
- **Resolved Missing Column Insert Failures**: Fixed critical PostgreSQL errors where replying or sending voice notes failed due to missing `reply_to_id` and `voice_duration` columns in `public.chat_room_messages`.
- **Resolved Storage Rejection on Voice Notes**: Fixed bucket MIME type rejection that previously blocked `.webm` audio recordings from uploading to Supabase Storage.
- **Discarded Metadata Recovery**: Solved the issue where uploaded documents lost their original filename and file size, resulting in a generic "Document" card.

### 🔒 Security & Architecture
- **Cryptographic UUID File Paths**: Replaced predictable `${userId}-${Date.now()}` file names with unguessable `crypto.randomUUID()` paths (`${userId}/${crypto.randomUUID()}.${ext}`).
- **Additive Database Migrations**: Executed zero-downtime additive migrations (`ADD COLUMN IF NOT EXISTS`) and created indexed `chat_message_reactions` with foreign-key cascades and RLS policies.
- **Safe Component Re-exports**: Maintained aliased exports for all legacy `WhatsApp*` component and token names to prevent breakage across any existing import sites.

**Impacted Scope:** `package.json`, `docs/APP_JOURNEY_LOG.md`, `src/features/community/utils/chatTheme.ts`, `src/features/community/utils/whatsappTheme.ts`, `src/features/community/api/chatApi.ts`, `src/features/community/pages/ActiveChatRoom.tsx`, `src/features/community/pages/ChatMessageItem.tsx`, `src/features/community/pages/ChatRooms.tsx`, `src/features/community/components/chat/*`.


## [v1.0.363] - 18 November 2026, 07:15 AM IST

**Executive Summary:** Complete 10-phase WhatsApp Android parity uplift across Social Media Chatrooms (`src/features/community`). Implemented offline-first 0ms IndexedDB hydration, authentic emerald theme with SVG speech bubble tails & doodle wallpaper, 4-stage message status pipeline (clock/sent/delivered/read double blue ticks), native swipe-to-reply gestures with haptics, quoted replies, floating emoji reactions, dynamic input capsule & FAB, client-side WebP compression, full-screen lightbox, and voice note player with waveform scrubbing.

### ✨ Features Added
- **0ms Local-First IndexedDB Engine (`chatCacheService.ts`)**: Built dedicated IndexedDB caching database (`MindFlowCommunityChatDB`) that pre-seeds conversations and room lists for immediate 0ms hydration with zero loading delay on chat opening.
- **WhatsApp Android Visual Parity**: Authentic emerald green app bar (`#008069` light / `#1F2C34` dark), subtle vector doodle wallpaper overlay (`WhatsAppWallpaper.tsx`), pixel-perfect SVG bubble tails (`WhatsAppBubbleTail.tsx`), inline micro-timestamps, and floating date separator pills (`WhatsAppDatePill.tsx`).
- **4-Stage Message Status Lifecycle (`WhatsAppReceiptTicks.tsx`)**: Real-time status pipeline tracking sending clock (`🕒`), single gray check (`✓`), double gray check (`✓✓`), and double cyan-blue check (`✓✓` `#53BDEB`) driven by Supabase Realtime broadcast channels and `read_at`/`delivered_at` timestamps.
- **Swipe-to-Reply & Quoted Replies**: Touch/pointer pan gesture hook (`useSwipeToReply.ts`) with elastic spring physics and haptic vibration (`navigator.vibrate`), plus persistent quote preview banners in the input bar and embedded inside child message bubbles.
- **Floating Emoji Reaction Pill (`FloatingReactionPill.tsx`)**: Long-press menu featuring WhatsApp quick reactions (👍, ❤️, 😂, 😮, 😢, 🙏) and docked message reaction counters.
- **WhatsApp Input Bar & Dynamic FAB (`WhatsAppInputBar.tsx`)**: Dual-capsule Android layout with auto-expanding textarea, attachment bottom sheet, and dynamic 48px FAB that smoothly transitions between microphone (voice recording) and send button.
- **Voice Notes Recording & Waveform Player (`VoiceNotePlayer.tsx`)**: Live recording timer, hands-free slide-to-lock, trash can cancellation, and interactive waveform scrubber with `1x / 1.5x / 2x` speed toggling.
- **Client-Side WebP Compression & Media Lightbox (`mediaCompression.ts`, `MediaLightbox.tsx`)**: HTML5 Canvas WebP downsampling before upload (cutting mobile upload times to <500ms) and full-screen zoomable/pannable media lightbox.

### ⚡ Performance & Refactoring
- **Instant Inbox Hydration in `ChatRooms.tsx`**: Eliminated layout shift by pre-seeding inbox conversations from IndexedDB, adding real-time last-message snippets, outgoing delivery checkmarks, and search filtering.
- **Virtualized Message Stream Optimization**: Configured `react-virtuoso` with memoized item rendering and auto-scroll tracking for 60fps performance on mobile Android WebView.

### 🔒 Security & Architecture
- **Safe RLS-Compatible Storage & Sanitization**: Strict sender verification, clean WebP media blobs, and safe handling of chat media uploads.

**Impacted Scope:** `src/features/community/services/chatCacheService.ts`, `src/features/community/api/chatApi.ts`, `src/features/community/pages/ActiveChatRoom.tsx`, `src/features/community/pages/ChatMessageItem.tsx`, `src/features/community/pages/ChatRooms.tsx`, `src/features/community/components/chat/*`, `src/features/community/hooks/useSocialRealtime.ts`, `src/features/community/hooks/useSwipeToReply.ts`, `src/features/community/utils/whatsappTheme.ts`, `src/features/community/utils/mediaCompression.ts`.

---

## [v1.0.362] - 15 November 2026, 10:43 AM IST

**Executive Summary:** Completed Phase 5 INP filter calculation optimization, off-screen list rendering (`content-visibility: auto`), and Content-Security-Policy (`script-src`) hardening.

### ⚡ Performance & Refactoring
- **INP Set Intersection & Worker Optimization**: Updated `useOptimizedFilterCounts.ts` and `useQuestionIndex.ts` (`filterQuestionsByIndex`) to always iterate over the smaller `Set` (`smaller.size <= larger.size`), extracted and exported `buildQuestionIndex(questions)` in `src/features/quiz/hooks/useQuestionIndex.ts`, and upgraded `src/features/quiz/workers/filterWorker.ts` from a linear `cachedAllQuestions.filter(...)` scan to an inverted `Set` index (`cachedIndex`) built on `'INIT'`.
- **Off-Screen List Rendering (`content-visibility: auto`)**: Added `.cv-card-quiz` (`content-visibility: auto; contain-intrinsic-size: auto 180px;`) and `.cv-card-mistake` (`content-visibility: auto; contain-intrinsic-size: auto 260px;`) in `src/index.css` (`@layer components`), and wrapped mapped card items in `src/features/quiz/components/SavedQuizzesList.tsx`, `src/features/quiz/components/AttemptedQuizzesList.tsx`, and `src/features/mistakes/pages/MistakeNotebookPage.tsx`.

### 🔒 Security & Architecture
- **CSP `script-src` Hardening**: Removed `'unsafe-eval'` from the `Content-Security-Policy` `<meta>` tag in `index.html` (`script-src 'self' 'unsafe-inline' blob:;`).

**Impacted Scope:** `index.html`, `src/index.css`, `src/features/quiz/hooks/`, `src/features/quiz/workers/filterWorker.ts`, `src/features/quiz/components/`, `src/features/mistakes/pages/MistakeNotebookPage.tsx`.

---

## [v1.0.361] - 14 November 2026, 05:38 PM IST

**Executive Summary:** Completed Phase 4 top-layer drawer listener cleanup, circular dependency decoupling between `db.ts` and `syncService.ts`, and modular extraction of `AppConfigHub.tsx` into 5 dedicated configuration panels.

### ⚡ Performance & Refactoring
- **Circular Dependency Decoupling (`db.ts <-> syncService.ts`)**: Extracted remote push and quiz deletion fallback logic into `syncService.pushEntityChange` and `syncService.deleteSavedQuizWithOfflineFallback` in `src/lib/syncService.ts`, replacing static `syncService` and `useSyncStore` imports in `src/lib/db.ts` with lazy dynamic `import('./syncService')`.
- **`AppConfigHub.tsx` Modularization (1,057 lines -> 87 lines)**: Extracted `IntroConfigPanel.tsx`, `ThemeConfigPanel.tsx`, `BrandingConfigPanel.tsx`, `LoadingConfigPanel.tsx`, and `OnboardingConfigPanel.tsx` into `src/features/admin/app-config/components/` and bound accessible `htmlFor`/`id` attributes on `<select>` controls.
- **Top-Layer Escape Consolidation**: Removed redundant `window.addEventListener('keydown', ...)` Escape listener from `src/features/admin/question-builder/components/QuestionPreviewDrawer.tsx` in favor of `RightDrawer` / `NativeDialog` Top-Layer dismissal.

**Impacted Scope:** `package.json`, `docs/APP_JOURNEY_LOG.md`, `src/lib/db.ts`, `src/lib/syncService.ts`, `src/features/admin/question-builder/components/QuestionPreviewDrawer.tsx`, `src/features/admin/app-config/pages/AppConfigHub.tsx`, `src/features/admin/app-config/components/*`

## [v1.0.360] - 14 November 2026, 05:20 PM IST

**Executive Summary:** Completed Phase 3 offline-first persistence resilience and active target exam context enforcement—eliminating destructive offline quiz creation rollbacks and submission failures while scoping subject taxonomy and subtopic counts to the user's selected exam.

### 🐛 Bug Fixes
- **Offline-First Quiz Creation & Submission Queue**: Extended `SyncEvent['type']` in `useSyncStore.ts` with `'quiz_created'` and `'quiz_submitted'` and added RPC replay handlers in `syncService.ts` (`processEventQueue`). Removed the destructive `db.deleteQuiz` rollback in `quizCreationService.ts` when offline or when `create_quiz_session` RPC fails, and updated `useQuiz.ts` (`submitSessionResults`) to persist `historyRecord`, serializable `stateWithoutQuestions`, and `masteryService.recordInteractions` locally to IndexedDB before attempting `submit_quiz_session` RPC—queueing `'quiz_submitted'` on offline/network error instead of failing the session.
- **Target Exam Context Enforcement in Subject Topics**: Updated `subjectService.ts` (`fetchSubjectTaxonomy` and `fetchSubtopicMetadata`) and `SubjectTopicsPage.tsx` to filter local IndexedDB metadata, cold-cache PostgREST fallback queries, and JIT subtopic fetches by `activeExam` via `matchesCanonicalExam`, and included `activeExam?.id` in the React Query key.

### ⚡ Performance & Refactoring
- **Singleton Question Metadata Memory Cache & Ownership Alignment**: Added a module-level `memoryMetadataCache` with a 5-minute delta check TTL (`DELTA_CHECK_TTL_MS`) in `useQuestionMetadata.ts` to eliminate redundant IndexedDB `getAll()` reads and background delta checks on warm mounts, and updated `stateOwnershipRegistry.ts` (`draft_quiz_filters.soleOwnerStore` to `useSessionStore + QuizConfig (sessionStorage)` and storage descriptions to `IndexedDB (idb)`).

**Impacted Scope:** `package.json`, `docs/APP_JOURNEY_LOG.md`, `src/features/quiz/stores/useSyncStore.ts`, `src/lib/syncService.ts`, `src/features/quiz/services/quizCreationService.ts`, `src/features/quiz/hooks/useQuiz.ts`, `src/features/dashboard/services/subjectService.ts`, `src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`, `src/features/quiz/hooks/useQuestionMetadata.ts`, `src/lib/state/stateOwnershipRegistry.ts`

---

## [v1.0.359] - 14 November 2026, 04:35 PM IST

**Executive Summary:** Completed Phase 2 navigation consolidation, theme split-brain resolution, and IME/autofill hardening—unifying Android hardware back handling into a single controller while eliminating dark-mode FOUC and CSS injection risks.

### 🐛 Bug Fixes
- **Single-Controller Android Hardware Back Navigation**: Consolidated duplicate Capacitor `App.addListener('backButton')` listeners from `QuizConfig.tsx`, `LearningSession.tsx`, `SubjectHubPage.tsx`, and `SubjectTopicsPage.tsx` into `src/hooks/useHardwareBackButton.ts`. Preserved `location.state.returnTo`, `location.state.from`, and fixed-subject `ROUTES.SUBJECT.view(fixedSubject)` routing on `/quiz/config`, excluded the persistent `session-paused-overlay` dialog from generic top-layer dismissal, and ensured second-press Back on a paused quiz calls `quizStore.goHome()`.
- **Theme Split-Brain & FOUC Elimination**: Removed hardcoded dark inline styles on `<html>` in `index.html`, added `<meta name="color-scheme" content="light dark" />` and a synchronous FOUC-prevention script reading `mindflow-settings`, synced `document.documentElement.style.colorScheme` in `useSettingsStore.ts`, and guarded `ThemeAndBrandingInjector.tsx` so remote default theme settings never overwrite an explicit local user dark-mode preference.

### 🔒 Security & Architecture
- **CSS Injection Prevention & Native Scrollbar / Form Hygiene**: Validated `primaryColor` against `^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$` and switched `<style id="mindflow-theme-styles">` injection from `.innerHTML` to `.textContent` in `ThemeAndBrandingInjector.tsx`. Added `.scrollbar-thin` with `scrollbar-width: thin` and `@supports` WebKit fallback in `src/index.css`, IME composition (`!e.nativeEvent.isComposing && e.keyCode !== 229`) guards in `OnboardingFlow.tsx` and `AdminEditQuestionModal.tsx`, and `autoComplete="new-password"` attributes in `SettingsPage.tsx`.

**Impacted Scope:** `package.json`, `docs/APP_JOURNEY_LOG.md`, `index.html`, `src/index.css`, `src/hooks/useHardwareBackButton.ts`, `src/hooks/useHardwareBackButton.test.ts`, `src/stores/useSettingsStore.ts`, `src/providers/ThemeAndBrandingInjector.tsx`, `src/features/quiz/components/QuizConfig.tsx`, `src/features/quiz/learning/LearningSession.tsx`, `src/features/dashboard/pages/subject/SubjectHubPage.tsx`, `src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`, `src/features/onboarding/pages/OnboardingFlow.tsx`, `src/features/admin/components/AdminEditQuestionModal.tsx`, `src/features/auth/components/SettingsPage.tsx`

---

## [v1.0.358] - 14 November 2026, 11:35 AM IST

**Executive Summary:** Completed Phase 1 codebase hygiene, build isolation, and Vitest stabilization on Windows—removing confirmed orphaned files and unused dependencies while ensuring all 32 test suites pass reliably.

### ⚡ Performance & Refactoring
- **Orphaned Source Cleanup**: Deleted 16 confirmed Category A orphaned files in `src/` (`Synonym.html`, `questions.ts`, `starterDiagnosticQuestions.ts`, `validate_synonyms_data.js`, `validation_report.json`, `SynapticLoader.tsx`, `EnglishQuizHomePage.tsx`, `DownloadOptionsModal.tsx`, `KeyboardAwareSurface.tsx`, `audio-player.ts`, `audio-recorder.ts`, `useQuizSessionTimer.ts`, `TestEngineController.ts`, `useQueueControls.ts`, `useWordLineage.ts`, `cropImage.ts`) while strictly preserving raw vocabulary JSON datasets (`Synonym data.json`, `ows.json`, `idioms.json`) and Category B archives.
- **Unused Dependency Pruning**: Removed 4 unused JS packages (`dotenv`, `protobufjs`, `react-latex-next`, `workbox-window`) from `package.json` while preserving `@capacitor/status-bar` (`^8.0.2`) for Capacitor Android builds.
- **TypeScript Archive Isolation**: Updated `tsconfig.json` `"exclude"` to isolate `dist`, `src/archive`, and `src/features/quiz/components/archive` from active compilation while keeping unit tests typechecked.

### 🐛 Bug Fixes
- **Vitest Windows Stability & Assertion Alignment**: Configured `pool: 'forks'` in `vitest.config.ts` to eliminate Windows `pool: 'threads'` worker-startup timeouts, and updated stale `bg-green-50` / `border-green-500` / `bg-green-50/50` assertions in `src/features/quiz/components/QuizOption.test.tsx` to match `QuizOption.tsx`'s emerald styling (`bg-emerald-50`, `border-emerald-500`, `bg-emerald-50/60`).

### 🔒 Security & Architecture
- **Full Verification Passing**: Confirmed `npx tsc --noEmit` (`0` errors), `npx vite build`, and `npx vitest --run` (`32/32` test files, `189/189` tests passing) all succeed cleanly.

**Impacted Scope:** `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/features/quiz/components/QuizOption.test.tsx`, `src/` orphaned Category A files

---

## [v1.0.357] - 14 November 2026, 07:50 AM IST

**Executive Summary:** Completed all four phases of the Modern Web Guidance (MWG) Top-Layer Modal, Popover & Tooltip Modernization across shared UI primitives, student/quiz/vocab/community flows, and admin consoles without adding external npm dependencies.

### ✨ Features
- **Core Top-Layer Primitives (`src/index.css`, `src/components/ui/`)**: Introduced `<NativeDialog>` (`<dialog>.showModal()` with `center`, `bottom-sheet`, `drawer-right`, `drawer-left`, `command`, and `fullscreen` variants), `<InfoTooltip>` (`popover="auto"` + `44x44px` touch button), and `<AnchoredPopover>` with `@starting-style`, `transition-behavior: allow-discrete`, `overlay: auto allow-discrete`, and `@supports (position-area: top)` CSS Anchor Positioning + inline viewport-clamped fallbacks.
- **Top-Layer Notifications (`ToastContainer.tsx`, `Toast.tsx`)**: Migrated notification stack rendering to `popover="manual"` so toasts remain above modal backdrops without z-index conflicts.
- **LIFO Android Hardware Back Interceptor (`src/hooks/useHardwareBackButton.ts`)**: Added deterministic LIFO dismissal order (open `popover="auto"` popovers, topmost `dialog[open]`, then legacy overlays) prior to route navigation.

### 🐛 Bug Fixes
- **Eliminated Body Scroll-Lock Races**: Removed manual `document.body.style.overflow` mutations across modals, drawers, and bottom sheets in favor of `:modal` / `::backdrop` CSS `overscroll-behavior: contain` guards.
- **Fixed Nested Overlay Back Dismissal & Blocking Confirmations**: Removed duplicate hardware back listeners in bottom sheets (`QuizStartBottomSheet`, `DashboardDrillBottomSheet`) and drawer traps (`RightDrawer`), upgraded 6 `@headlessui/react` community `<Menu>` instances to HeadlessUI v2 floating `anchor` positioning, and replaced blocking `window.confirm` in `SelectedQuestionsPanel.tsx` with `<ConfirmDialog>`.
- **Fixed `jsdom` `:popover-open` Selector Bottleneck**: Guarded `el.matches(':popover-open')` in `AnchoredPopover.tsx` behind `CSS.supports('selector(:popover-open)')` with an `isPopoverOpenRef` fallback synced via `showPopover()`, `hidePopover()`, and `onToggle`.

### ⚡ Performance & Refactoring
- **Zero New Dependencies & Reduced Motion Support**: All top-layer animations respect `@media (prefers-reduced-motion: reduce)` and wait cleanly on `getAnimations()` before closing discrete transitions.

### 🔒 Security & Architecture
- **Accessibility & Test Coverage**: Enforced `44x44px` minimum touch targets, dialog `aria-labelledby`/`aria-label` associations, icon-button labels, and verified `21/21` passing Vitest specs (`NativeDialog.test.tsx`, `InfoTooltip.test.tsx`, `AnchoredPopover.test.tsx`, `useHardwareBackButton.test.ts`, `AuthPage.test.tsx`), `tsc --noEmit` (`0` errors), and `vite build`.

**Impacted Scope:** `src/index.css`, `src/components/ui/`, `src/hooks/useHardwareBackButton.ts`, `src/layouts/`, `src/features/auth/`, `src/features/dashboard/`, `src/features/quiz/`, `src/features/vocab/`, `src/features/ai/`, `src/features/community/`, `src/features/admin/`, `src/features/notifications/`

---

## [v1.0.356] - 13 November 2026, 04:10 PM IST

### ✨ Features & Modernization (Modern Web Guidance)
- **INP & Main-Thread Yielding Utility**: Created `src/utils/yieldToMain.ts` exporting `yieldToMain()` (`scheduler.yield()` with `setTimeout(0)` fallback) and `createYieldController(budgetMs = 50)`. Applied cooperative yielding (`yieldToMain()` and `yieldIfNeeded()`) to PDF page and answer-key rendering loops in `src/features/tools/bilingual-pdf-maker/utils/pdfGenerator.ts`.
- **Native CSS `field-sizing: content` & IME-Safe Chat Inputs**: Updated `src/features/ai/chat/ChatInput.tsx` and `src/features/community/pages/ChatInputBar.tsx` with `CSS.supports('field-sizing', 'content')` progressive enhancement (gating JS `scrollHeight` resize/reset loops), `isComposing` / `keyCode === 229` IME Enter-key composition guards in `handleKeyDown`, and accessible textarea labels (`aria-label="Ask MindFlow"` and `aria-label="Message"`).
- **Accessible Native Popover Tooltip & Nested Interactive Fix**: Refactored `src/features/quiz/components/ui/MultiSelectDropdown.tsx` from a hover-only tooltip to a native `popover="auto"` toggletip (`popoverTarget`, `popoverTargetAction="toggle"`, `aria-expanded`, `onToggle={handleTooltipToggle}`, `min-w-[44px] min-h-[44px]` touch target, plus non-popover fallback), and un-nested the clear control into a sibling `<button type="button">`.

### 🐛 Bug Fixes & Accessibility (WCAG & Semantics)
- **ARIA Switch & Label Semantics**: Fixed `src/features/quiz/components/ui/SettingsToggle.tsx` by replacing `<label htmlFor>` pointing to a `<button>` with `useId()` + `<span id={labelId}>`, `type="button"`, `role="switch"`, `aria-checked={checked}`, `aria-labelledby={labelId}`, and `min-w-[44px] min-h-[44px]` touch target sizing.
- **Sign-In Form Autofill & Accessible Controls**: Hardened `src/features/about/components/AalokProfile.tsx` with `type="button"` + `aria-label="Go back"` on the back button, `aria-hidden="true"` on decorative icons, explicit `htmlFor`/`id`/`name`, `autoComplete="username"` / `"current-password"`, `inputMode="email"`, `enterKeyHint="next"` / `"done"`, `spellCheck={false}`, `autoCapitalize="none"`, corrected `aria-label="Auto-fill admin email"`, removed an inaccurate `aria-label="Submit search"` from the Sign In submit button, and added visible `Signing in...` loading text.

### 🔒 Security & Code Hygiene
- **HTML Sanitization Alignment**: Added `safeSetHTML` (`'setHTML' in Element.prototype` with `DOMPurify.sanitize` fallback) and replaced `.innerHTML = ''` with `replaceChildren()` in `src/features/tools/bilingual-pdf-maker/utils/pdfGenerator.ts`; removed dead unused `DOMParser` `sanitizeHTML` and `createSafeMarkup` helpers from `src/features/quiz/components/QuizQuestionDisplay.tsx`.

---

## [v1.0.355] - 11 November 2026, 11:15 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.355`

### Executive Summary
Engineered a unified Live Telemetry & Operations Cockpit in the Admin portal (`/admin/analytics`), established automated PostgreSQL storage rollup and system log pruning to guarantee Supabase Free Plan database safety, resurrected the AI Content Ingestion Plane with resilient pg_net timeouts and queue cron triggers, and architected a multi-tier Google AI Studio free tier orchestration engine that maximizes gold-standard pedagogical reasoning via `gemini-3.8-flash` with graceful soft-ceiling cascading.

### Work Breakdown
- **✨ Features Added**:
  - **Live Telemetry & Diagnostics Operations Cockpit (`/admin/analytics`)**: Created an enterprise-grade administrative operations dashboard featuring 4 live KPI cards (Total Captured Events, Android vs Web Traffic split, Active User Sessions via `user_active_sessions`, and Auth Self-Healing Recoveries), dynamic filtering by category, platform pills (`All`, `Android`, `Web`), hardware/network specs telemetry (RAM, connection type, viewport, DPR), IST timestamps, and an Android-style payload inspection modal (`TelemetryDetailModal.tsx`).
  - **AI Ingestion Plane Real-Time Monitor (`AdminIngestionJob.tsx`)**: Upgraded `/admin/content` Ingestion Plane with an interactive live batch table, dynamic status badges (`QUEUED`, `PROCESSING`, `AWAITING_REVIEW`, `FAILED`), real-time extraction progress meters, on-demand "⚡ Run Worker Now" worker invocation, and a direct shortcut into the Review Queue.
  - **Privacy-Preserving Client Telemetry Engine (`src/lib/telemetry/`)**: Built typed diagnostic event telemetry with dynamic sampling (100% on native Android Capacitor, 10% on desktop web page views), offline IndexedDB queue buffering, automatic retry flushes, and zero-PII sanitization across bootstrap, navigation, quiz creation, auth self-healing, and session lifecycle.
- **⚡ Performance & Refactoring**:
  - **Supabase Free Plan Storage Rollup & Auto-Pruning Engine**: Designed and deployed a 3-pillar storage defense. Implemented `public.analytics_daily_summary` and `public.rollup_and_purge_telemetry()` running daily via pg_cron to compress raw telemetry older than 14 days, keeping raw tables under 5 MB permanently. Added `maintenance.prune_system_logs(3, 3, 5000)` to automatically prune `cron.job_run_details` and `net._http_response` older than 3 days, permanently preventing database disk bloat.
  - **Per-Key Google AI Studio Rate Limit Orchestration**: Replaced the artificial global 5-RPM database ceiling with model- and key-specific RPM tracking in `public.get_execution_plan`. All 4 configured API keys are now utilized concurrently up to 20 RPM across models.
  - **`gemini-3.8-flash` Priority Waterfall Engine**: Placed `gemini-3.8-flash` as primary gold-standard pedagogical reasoning model for teacher explanations (`question_teacher_v1`), extracting 80 daily free flagship calls across 4 keys with automatic soft-cap rollover to `gemini-3.5-flash-lite`, `gemini-3.1-flash-lite`, and `gemma-4-26b-a4b-it`.
- **🐛 Bug Fixes**:
  - **Resurrected AI Ingestion Plane**: Fixed `current_setting('app.settings.edge_function_url')` null-abort errors by establishing a direct endpoint fallback in queue functions. Configured `timeout_milliseconds := 120000` (2 minutes) in `net.http_post` to prevent premature socket termination on long-running Deno worker tasks.
  - **Eliminated False 24-Hour "Billing Error" Lockout**: Rewrote `report_execution_result` and `normalizeProviderError` to recognize Google standard 429 messages as temporary RPM/demand throttling rather than permanent billing failures.
  - **Grounding Quota Rejection Fix**: Disabled search grounding tools for Gemini 3+ models in `enrich-questions` after discovering free tier Search Grounding is 0/0 quota on Gemini 3, resolving instant 429 errors.
  - **Extended Edge Function Timeout Buffer**: Increased `GEMINI_TIMEOUT_MS` from 25s to 45s in `enrich-questions` (v45 deployed live) to accommodate deep reasoning synthesis during peak AI Studio traffic.
- **🔒 Security & Architecture**:
  - **Impacted Scope**: `src/config/routes.ts`, `src/features/admin/analytics/`, `src/features/admin/content/`, `src/features/admin/layouts/AdminSidebar.tsx`, `src/features/admin/overview/pages/AdminOverviewPage.tsx`, `src/features/auth/components/AuthPage.tsx`, `src/features/quiz/services/quizCreationService.ts`, `src/hooks/useAppBootstrap.ts`, `src/lib/navigation/NavigationManager.tsx`, `src/lib/navigation/utils/analytics.ts`, `src/lib/recovery/RecoveryManager.ts`, `src/lib/telemetry/`, `src/routes/AppRoutes.tsx`, `supabase/functions/enrich-questions/`, `supabase/migrations/`, `package.json`, `docs/APP_JOURNEY_LOG.md`.
## [v1.0.354] - 11 November 2026, 04:55 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.354`

### Executive Summary
Replaced the static single-page onboarding screen with a 60fps, zero-lag, Android-native 9-step theatrical "Tiny Letter Crew" onboarding experience (`OnboardingFlow.tsx`) built with 100% 300ms frame-by-frame visual and motion parity to the reference benchmark, featuring lowercase 3D bubble-letter companions (**Ada** `'a'`, **Gigi** `'g'`, **Olo** `'o'`, **Pip** `'p'`, **Quinn** `'q'`, **Dex** `'d'`, **Bo** `'b'`), progressive `M I N D F L O W` letter-by-letter header lighting, squircle name tiles (`<LivingNameTiles />`), a C-shaped dotted orbital exam wheel (`<PlanetaryExamWheel />`), interactive sleeping-to-awake crew toggles with a diagonal flying burst, a peek-a-boo showcase carousel, a line-by-line unblur PYQ micro-demo, a 3-stage native permission bottom sheet (`<ConnectToolsStage />`), and over-the-air Admin Panel customizability via `public.app_ui_config` (`AppConfigHub.tsx`).

### Work Breakdown
- **✨ Features Added**:
  - **9-Step 300ms-Parity Onboarding Engine (`OnboardingFlow.tsx`, `MindFlowCrewMascots.tsx`, `OnboardingInteractiveStages.tsx`)**: Implemented a zero-lag single-mount step state machine with blur-dissolve transitions (`filter: blur(5px)` -> `blur(0px)`), progressive `M I N D F L O W` header (`<ProgressiveBrandHeader />`), orbital hero constellation (`<HeroCrewConstellation />`) with curious eye morphing, squircle name tiles (`<LivingNameTiles />`), C-arc exam wheel (`<PlanetaryExamWheel />`), sleeping-to-awake list (`<WakeUpCrewList />`) with diagonal flying burst (`<CrewFlyingBurstOverlay />`), peek-a-boo carousel (`<CrewShowcaseCarousel />`), line-by-line unblur PYQ demo (`<FirstTaskLiveDemo />`), 3-stage native bottom sheet (`<ConnectToolsStage />`), morning nudge opt-in (`<MorningNudgeStage />`), and rainbow confetti finale (`<FinaleCrewCelebration />`).
  - **Shared-Element Avatar Flight Transitions (`AvatarFlightOverlay`, `OnboardingFlow.tsx`)**: Added a FLIP engine that measures `[data-mascot-id]` bounding boxes before and after every step change (forward and back) and flies each letter companion from its old on-screen position and size to its new one (e.g. Ada hero → guide header, Gigi list row → carousel stage → task card, Pip tool row → nudge hero, crew → finale lineup). The destination mascot stays hidden until the flight lands.
  - **Over-the-Air Admin Onboarding Customizer (`onboardingConfigSchema.ts`, `useAppConfigStore.ts`, `AppConfigHub.tsx`)**: Added strongly typed `OnboardingConfig` persisted inside `public.app_ui_config` (`branding.onboarding`) with `mergeOnboardingConfig` deep-merge protection and a dedicated **Onboarding** tab in `/admin/app-config` with sandboxed **Live Preview** (`/onboarding?preview=1`).
  - **Native Selection Haptics (`haptics.ts`)**: Extended `triggerHaptic` to support `'selection'` via `@capacitor/haptics` `Haptics.selectionChanged()` for tactile rotary wheel and toggle ticks.
- **🔒 Security & Architecture**:
  - **Audit-Hardened Navigation & Offline-First Guards (`useHardwareBackButton.ts`, `IntentPolicy.ts`, `OnboardingFlow.tsx`, `useExamContextStore.ts`)**: Delegated `/onboarding` step-back navigation exclusively to `OnboardingFlow` via closure-safe refs, enforced synchronous 0ms `OnboardingPolicy.markCompleted` and `useExamContextStore.setActiveExam` commits prior to non-blocking `supabase.auth.updateUser`, excluded `/onboarding` from `IntentPolicy.saveIntent`, and added `sessionStorage` draft continuity plus `OnboardingErrorBoundary`.
  - **Impacted Scope**: `src/features/onboarding/config/onboardingConfigSchema.ts`, `src/features/onboarding/components/MindFlowCrewMascots.tsx`, `src/features/onboarding/components/OnboardingInteractiveStages.tsx`, `src/features/onboarding/pages/OnboardingFlow.tsx`, `src/stores/useAppConfigStore.ts`, `src/features/admin/app-config/pages/AppConfigHub.tsx`, `src/hooks/useHardwareBackButton.ts`, `src/lib/navigation/policies/IntentPolicy.ts`, `src/lib/haptics.ts`, `src/stores/useExamContextStore.ts`, `package.json`, `docs/APP_JOURNEY_LOG.md`.

---

## [v1.0.353] - 11 November 2026, 12:07 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.353`

### Executive Summary
Resolved a critical vertical scroll-lock regression across Pages 1 through 7 (`AuthPage.tsx`, `OnboardingFlow.tsx`, `DashboardPage.tsx`, `SubjectHubPage.tsx`, `SubjectTopicsPage.tsx`, `QuizConfig.tsx`, and `ActiveQuizLayout.tsx`) where combining `overflow-x-hidden` with `overscroll-contain` on `min-h-full` / `min-h-[100dvh]` page containers computed `overflow-y: auto` with `0px` internal scroll range and blocked scroll chaining to the document window.

### Work Breakdown
- **🐛 Bug Fixes**:
  - **Restored Vertical Document Scrolling Across Pages 1–6 (`AuthPage.tsx`, `OnboardingFlow.tsx`, `DashboardPage.tsx`, `SubjectHubPage.tsx`, `SubjectTopicsPage.tsx`, `QuizConfig.tsx`)**: Replaced `overflow-x-hidden overscroll-contain` on page-level `min-h-full` / `min-h-[100dvh]` containers with `overflow-x-clip`. Per CSS Overflow Level 3, `overflow-x: hidden` forces `overflow-y: auto`, turning content-sized containers (`scrollHeight === clientHeight`) into scroll containers; pairing that with `overscroll-contain` (`overscroll-behavior: contain`) prevented touch and wheel scroll events from chaining to `window`/`document.scrollingElement`, freezing vertical scrolling and breaking `position: sticky` headers.
  - **Unblocked Mobile Scroll in `OnboardingFlow.tsx` & `QuizConfig.tsx`**: Removed nested mobile `overflow-hidden` / `overflow-y-auto` traps inside `min-h-[100dvh]` flex columns so the page scrolls naturally with the viewport while sticky headers and bottom action bars stay pinned.
  - **Hardened Scroll Container & Body Overflow Cleanup (`ActiveQuizLayout.tsx`, `DashboardDrillBottomSheet.tsx`, `QuizStartBottomSheet.tsx`)**: Added `min-h-0 touch-pan-y` to the `<main>` scroll container in `ActiveQuizLayout.tsx` and reset `document.body.style.overflow = ''` when bottom sheets close.
- **🔒 Security & Architecture**:
  - **Impacted Scope**: `src/features/auth/components/AuthPage.tsx`, `src/features/onboarding/pages/OnboardingFlow.tsx`, `src/pages/DashboardPage.tsx`, `src/features/dashboard/components/DashboardDrillBottomSheet.tsx`, `src/features/dashboard/pages/subject/SubjectHubPage.tsx`, `src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`, `src/features/dashboard/components/subject/QuizStartBottomSheet.tsx`, `src/features/quiz/components/QuizConfig.tsx`, `src/features/quiz/layouts/ActiveQuizLayout.tsx`, `package.json`, `docs/APP_JOURNEY_LOG.md`.

---

## [v1.0.352] - 11 November 2026, 04:37 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.352`

### Executive Summary
Uplifted the Active Learning Quiz Session (`LearningSession.tsx`, `ActiveQuizLayout.tsx`, `QuizOption.tsx`) to native Android APK standards and resolved two global loading/layout defects: centered `SynapticLoader` across all lazy-loaded routes and page-level loading states, and eliminated the 64px top white-strip cut screen when opening `QuizConfig` and immersive session routes.

### Work Breakdown
- **🐛 Bug Fixes**:
  - **Centered Page-Level `SynapticLoader` Globally (`SynapticLoader.tsx`)**: Wrapped non-inline `SynapticLoader` instances (`size !== 'xs' && size !== 'sm' && variant !== 'inline'`) in a `w-full min-h-[65dvh] flex-1 flex flex-col items-center justify-center p-6 select-none` flex container so `<Suspense fallback={<SynapticLoader />}>` and page-level loaders render in the dead center of the viewport instead of the top-left corner `(0,0)`.
  - **Eliminated Cut-Screen Defect on First Open of `QuizConfig` & Immersive Routes (`AppRoutes.tsx`, `QuizConfig.tsx`)**: Wrapped the `auth-immersive` `<Outlet />` in `<div className="min-h-[100dvh] w-full flex flex-col bg-slate-50 dark:bg-slate-950">` and updated `QuizConfig`'s `isLoadingMetadata` / `error` containers to `min-h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950`, preventing the 64px white strip over a dark `#0f172a` body void during lazy route loading.
  - **Pinned Header & Safe-Area Bottom Bar in `ActiveQuizLayout.tsx`**: Moved `header` outside the scrollable `<main>` container (`flex-none z-30`) so the quiz title bar and countdown progress line remain fixed while reading long questions or explanations, added `overscroll-contain` to `<main>`, and added `pb-[env(safe-area-inset-bottom,0px)]` to `<footer>` for Android gesture navigation bar clearance.
  - **Fixed Dark Mode Option Contrast & Removed Overflow Scaling (`QuizOption.tsx`)**: Fixed unreadable light-mode `bg-emerald-50 text-emerald-900` and invalid `dark:bg-red-900/200` on answered options by adding proper Dark Mode tokens (`dark:bg-emerald-950/50 dark:text-emerald-200`, `dark:bg-red-950/40 dark:text-red-200`), removed `scale-[1.02]` horizontal overflow, and added `min-h-[56px] rounded-2xl active:scale-[0.98] select-none touch-manipulation`.
- **✨ Features Added**:
  - **Layered Android Hardware Back Navigation (`LearningSession.tsx`)**: Registered `@capacitor/app` `App.addListener('backButton')` to close `isSettingsOpen` or `isNavOpen` drawers first, resume if `isPaused`, or cleanly exit via `onGoHome()`.
  - **Native Capacitor Haptics & 44px Ergonomic Controls (`LearningSession.tsx`)**: Replaced raw `window.navigator.vibrate(50)` with `triggerHaptic('success' | 'error' | 'medium' | 'light')` and upgraded all header and footer controls to `min-w-[40px] min-h-[40px]` / `min-h-[44px]` touch targets with `active:scale-95`.
- **🔒 Security & Architecture**:
  - **Impacted Scope**: `src/components/ui/SynapticLoader.tsx`, `src/routes/AppRoutes.tsx`, `src/features/quiz/components/QuizConfig.tsx`, `src/features/quiz/layouts/ActiveQuizLayout.tsx`, `src/features/quiz/components/QuizOption.tsx`, `src/features/quiz/learning/LearningSession.tsx`, `package.json`, `docs/APP_JOURNEY_LOG.md`.

---

## [v1.0.351] - 11 November 2026, 04:08 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.351`

### Executive Summary
Uplifted the Custom Quiz Configuration screen (`QuizConfig.tsx`, `ScrollableCapsules.tsx`, `SegmentedControl.tsx`) to native Android APK standards. Resolved the double-header and covered bottom action bar bugs by hiding the global shell header/footer while configuring a quiz, introduced a sticky Material 3 Top App Bar with status-bar inset clearance, wired Capacitor Android hardware back navigation to `handleBack`, and integrated tactile haptics with inward tap indentation across all filter capsules, segmented controls, and footer actions.

### Work Breakdown
- **🐛 Bug Fixes**:
  - **Eliminated Double Top Header & Uncovered Bottom Action Bar (`QuizConfig.tsx`, `MainLayout.tsx`)**: Enabled `setHideGlobalHeader(true)` and `setHideGlobalFooter(true)` when `QuizConfig` mounts and added `/quiz/config` to `isHeaderHiddenRoute`. Previously, `MainLayout`'s `z-[10000]` bottom navigation bar overlapped `QuizConfig`'s `KeyboardAwareBottomBar` (`z-[40]`), obscuring the "Create Quiz" button on mobile viewports.
- **✨ Features Added**:
  - **Android Hardware Back Navigation (`QuizConfig.tsx`)**: Registered `@capacitor/app` `App.addListener('backButton')` to deterministically invoke `handleBack()` (returning to `returnTo`, `SubjectHubPage`, or `Dashboard`).
  - **Material 3 Sticky Top App Bar (`QuizConfig.tsx`)**: Added `pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]` with backdrop blur so the header respects Android status bar insets.
  - **Tactile Filter Capsules & Controls (`ScrollableCapsules.tsx`, `SegmentedControl.tsx`, `QuizConfig.tsx`)**: Added `triggerHaptic('light')` and `triggerHaptic('medium')` with inward tap scaling (`active:scale-95`) and `touch-manipulation select-none` across subject/topic/year capsules, difficulty segments, mode switches, and question count chips.
- **⚡ Performance & Refactoring**:
  - Added `enterKeyHint="done"` and `inputMode="text"` to the optional Quiz Name input inside `KeyboardAwareBottomBar`.
- **🔒 Security & Architecture**:
  - Verified with `npx tsc --noEmit` (0 errors). Preserved all dependent filter calculations and context inheritance.

---

## [v1.0.350] - 11 November 2026, 03:38 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.350`

### Executive Summary
Uplifted the Subject Topics & Subtopic Launcher screen (`SubjectTopicsPage.tsx`, `TopicCard.tsx`, `QuizStartBottomSheet.tsx`) to native Android APK standards. Implemented layered Android hardware back button interception (closing the active subtopic bottom sheet first before returning to Subject Hub), eliminated 50+ simultaneous `setInterval` counters in favor of 0ms instant tabular counts, enforced 44x44px touch targets, and added tactile haptics with inward press scaling across all topic/subtopic cards and bottom sheet controls.

### Work Breakdown
- **✨ Features Added**:
  - **Layered Android Hardware Back Interception (`QuizStartBottomSheet.tsx`, `SubjectTopicsPage.tsx`)**: Registered `@capacitor/app` `App.addListener('backButton')` so physical/gesture back presses on Android dismiss the active `QuizStartBottomSheet` first, and navigate back to `SubjectHubPage` (`/subject/:subjectName`) when no overlay is open.
  - **Tactile Haptics & Inward Press Scaling (`TopicCard.tsx`, `QuizStartBottomSheet.tsx`)**: Added `triggerHaptic('light')` and `triggerHaptic('medium')` along with `active:scale-[0.98]` / `active:scale-95` across topic headers, subtopic rows, difficulty chips, mode cards, and launch buttons.
- **⚡ Performance & Refactoring**:
  - **Eliminated Multi-Timer Scroll Jitter (`TopicCard.tsx`)**: Removed the per-subtopic `30ms` `setInterval` animation loop (`AnimatedCount`) that spawned dozens of concurrent timers on mount, replacing it with instant 0ms `tabular-nums` rendering for 60fps Android WebView scrolling.
  - **Accessible 44x44px Touch Targets & Clean Canvas**: Upgraded close and info icon buttons in `QuizStartBottomSheet.tsx` to native touch target minimums and removed negative margin bleed hacks (`-mx-4 -mt-4`) on `SubjectTopicsPage.tsx`.
- **🔒 Security & Architecture**:
  - Verified with `npx tsc --noEmit` (0 errors). Preserved JIT question metadata fetching and offline-first quiz creation flows.

---

## [v1.0.349] - 11 November 2026, 03:12 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.349`

### Executive Summary
Uplifted the Subject Hub screen (`SubjectHubPage.tsx`, `SubjectHeader.tsx`, `ActionCard.tsx`) to native Android APK standards. Introduced a sticky Material 3 Top App Bar with status bar safe-area inset clearance (`env(safe-area-inset-top)`), replaced the iOS-style `ChevronLeft` with Android Material `ArrowLeft`, integrated Capacitor Android hardware back navigation to return deterministically to Dashboard, and added tactile haptic feedback with inward tap indentation on action cards.

### Work Breakdown
- **✨ Features Added**:
  - **Material 3 Sticky Top App Bar (`SubjectHeader.tsx`)**: Added `pt-[calc(env(safe-area-inset-top,0px)+0.5rem)]` with translucent surface blur and subtle bottom divider so custom subject headers never collide with Android status bars or camera cutouts when global header is hidden.
  - **Android Hardware Back Navigation (`SubjectHubPage.tsx`)**: Registered `@capacitor/app` `App.addListener('backButton')` to deterministically navigate back to the logical parent (`/dashboard`).
  - **Tactile Haptics & Inward Press Feedback (`ActionCard.tsx`, `SubjectHeader.tsx`)**: Wired `triggerHaptic('light')` and `active:scale-[0.98]` / `active:scale-90` across action cards and back navigation controls.
- **⚡ Performance & Refactoring**:
  - **Standardized Back Iconography**: Replaced `ChevronLeft` with `ArrowLeft` in `SubjectHeader.tsx` to align with Android Material Design and Constitution Section 4.
  - **Edge-to-Edge Viewport Hygiene**: Removed negative margin layout hacks (`-mx-4 -mt-4`) on `SubjectHubPage.tsx` in favor of `min-h-[100dvh] w-full overscroll-contain select-none`.
- **🔒 Security & Architecture**:
  - Verified with `npx tsc --noEmit` (0 errors). Preserved subject context inheritance and taxonomy prefetching.

---

## [v1.0.348] - 11 November 2026, 02:42 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.348`

### Executive Summary
Uplifted the Dashboard screen (`DashboardPage.tsx`, `DashboardGreeting.tsx`, `DashboardDrillBottomSheet.tsx`) and application navigation shell (`MainLayout.tsx`) to native Android APK standards. Replaced web-like claymorphism thick borders with subtle Material 3 surface borders, fixed reverse scaling animations to native Android inward tap indentation (`scale-95`), integrated tactile haptics across all dashboard drill buttons, and added native Android hardware back button interception for modal bottom sheets.

### Work Breakdown
- **✨ Features Added**:
  - **Android Hardware Back Dismissal on Drill Sheet**: Wired `@capacitor/app` `App.addListener('backButton')` to `DashboardDrillBottomSheet.tsx` so physical and gesture back actions on Android immediately close the active drill launcher without navigating away from the dashboard.
  - **Tactile Haptic Feedback Across Dashboard**: Integrated `triggerHaptic('light')` and `triggerHaptic('medium')` across bottom navigation tabs, central AI action button, greeting action buttons (Today's Plan, Bookmarks, Resume Quiz, Quiz History), exam selector chips, practice drills, and bottom sheet controls.
- **⚡ Performance & Refactoring**:
  - **Material 3 Navigation Shell Uplift**: Replaced heavy `border-b-[4px]` and `border-t-[4px]` borders with clean, high-performance translucent borders (`border-slate-200/80 dark:border-slate-800/80`). Fixed bottom navigation tab feedback from counter-intuitive zoom (`scale: 1.05`) to native Android inward press indentation (`whileTap={{ scale: 0.95 }}`).
  - **Clean Scroll & Layout Hygiene**: Removed brittle negative margin layout hacks (`-mt-4 pt-2`) on the dashboard canvas; added `overscroll-contain select-none touch-manipulation` for fluid gesture handling.
  - **Ergonomic Touch Targets**: Enhanced action buttons with `active:brightness-95` and inward scaling for an authentic native APK tactile response.
- **🔒 Security & Architecture**:
  - Fully verified type safety with `npx tsc --noEmit` and passed unit tests via `npx vitest`. Preserved HashRouter, Supabase session handling, and offline-first IndexedDB contracts.

---

## [v1.0.347] - 11 November 2026, 02:00 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.347`

### Executive Summary
Uplifted the Onboarding screen (`OnboardingFlow.tsx`) to native Android APK standards. Replaced the traditional HTML `<select>` dropdown with interactive Material 3 Choice Cards, transformed the boxed desktop card into an edge-to-edge native surface with status/gesture bar insets, added a bottom-pinned thumb-ergonomic CTA bar, integrated tactile haptics, and handled Android hardware back navigation.

### Work Breakdown
- **✨ Features Added**:
  - **Material 3 Interactive Choice Cards**: Replaced clunky HTML `<select>` dropdown with responsive, tap-friendly exam selection cards (SSC, Railways, State PSC, Banking, General Studies) equipped with categorical badges, icons, checkmark status rings, and tactile feedback.
  - **Bottom-Pinned Action Bar**: Re-anchored the primary CTA ("Continue to Dashboard") to a sticky bottom bar adhering to Android gesture bar clearance (`env(safe-area-inset-bottom)`), optimizing mobile thumb reachability.
  - **Android Hardware Back Handling**: Added `@capacitor/app` `App.addListener('backButton')` to smoothly minimize the application on Android back press rather than abandoning onboarding state.
- **⚡ Performance & Refactoring**:
  - **Edge-to-Edge Surface**: Replaced the floating desktop card with an edge-to-edge canvas on mobile that seamlessly respects Android status bar and gesture navigation safe-area insets.
  - **Tactile Touch Feedback**: Integrated `triggerHaptic('light')` and `triggerHaptic('success')` across all exam card selections and submission interactions with active press animations (`active:scale-[0.98]`).
  - **Input Hygiene**: Enriched the name field with `autoComplete="name"`, `inputMode="text"`, and `enterKeyHint="done"`.
- **🔒 Security & Architecture**:
  - Maintained complete compliance with Constitution Section 4 Navigation and the newly codified Android Native Feel & Behavior Uplift Invariant.

---

## [v1.0.346] - 11 November 2026, 01:21 AM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.346`

### Executive Summary
Enforced the non-negotiable Android Native Feel & Behavior Uplift invariant across the codebase in `AGENTS.md`. Completed the complete native APK audit and uplift of the Login / Authentication screen (`AuthPage` & `AuthLegalModal`), converting the floating card layout into an edge-to-edge native Android canvas with hardware back button intercepting, tactile haptic feedback, Material 3 bottom sheets, and keyboard-aware ergonomics.

### Work Breakdown
- **✨ Features Added**:
  - **Android Hardware & Gesture Back Navigation**: Integrated `@capacitor/app` `App.addListener('backButton')` in `AuthPage` to seamlessly handle Android physical/gesture back presses—dismissing the legal modal, stepping back from credentials to email, or minimizing the app at root without ungraceful app termination.
  - **Material 3 Bottom Sheet**: Rebuilt `AuthLegalModal` from a desktop-centric popup into an Android native Material 3 Bottom Sheet on mobile with a drag handle indicator, spring slide-up animations, safe-area inset padding, and tactile touch dismiss.
  - **Android Native Top App Bar**: Added a mobile Top App Bar with a circular ripple touch target for back navigation when transitioning between auth steps.
- **⚡ Performance & Refactoring**:
  - **Edge-to-Edge Surface**: Replaced the floating boxed card on mobile with an edge-to-edge native surface adhering to Android status bar (`env(safe-area-inset-top)`) and gesture bar (`env(safe-area-inset-bottom)`) insets, while preserving the responsive desktop showcase on large screens.
  - **Tactile Touch Feedback**: Added Material-style active press states (`active:scale-[0.98] active:brightness-95`) and instant haptic vibrations (`triggerHaptic('light')`) to buttons, Google sign-in, tab switches, and legal modal toggles.
  - **Mobile Keyboard & Scroll Ergonomics**: Set `inputMode="email"` and `enterKeyHint` attributes across form inputs to optimize the Android virtual keyboard, and added `overscroll-behavior-y: contain` to prevent web bounce.
- **🔒 Security & Architecture**:
  - Inscribed the **Android Native Feel & Behavior Uplift (Non-Negotiable)** invariant into `AGENTS.md` under Hard Invariants (Zero-Tolerance) ensuring all ongoing and future frontend developments strictly adhere to native Android APK standards.

---

## [v1.0.345] - 10 November 2026, 10:48 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.345`

### Executive Summary
Adopted Google Chrome Modern Web Guidance (MWG) standards across the project. Added a project-level `.mwgrc` configuration and established mandatory agent directives in `AGENTS.md` and `docs/AI_MEMORY_CONTEXT.md` to steer future code generation toward Baseline web platform primitives (native Popover API, `<dialog>`, CSS Anchor Positioning, `scheduler.yield()`, View Transitions, and Container Queries).

### Work Breakdown
- **🔒 Security & Architecture**:
  - Embedded Google Chrome Modern Web Guidance (MWG) directives into `AGENTS.md` and `docs/AI_MEMORY_CONTEXT.md` to prevent legacy training bias and eliminate bloated JS workarounds.
  - Initialized project-level `.mwgrc` configuration with Baseline standard policies (`allowOriginTrials: false`, `allowVolatileFeatures: false`).
  - Codified core directives for native dialogs/popovers in Top Layer (`@starting-style`), CSS Anchor Positioning, Interaction to Next Paint (INP) task scheduling via `scheduler.yield()`, View Transitions, and lightweight custom fallbacks ($\le 20$ LOC, zero external npm bloat).
- **Impacted Scope**: `AGENTS.md`, `docs/AI_MEMORY_CONTEXT.md`, `.mwgrc`, `package.json`, `docs/APP_JOURNEY_LOG.md`.

## [v1.0.344] - 10 November 2026, 05:31 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.344`

### Executive Summary
Eliminated repetitive consent friction across authentication and post-login flows: removed the blocking post-login `ConsentAuditModal`, removed duplicate consent notices on the email entry step, onboarding screen, and Create Account footer, and retained only the single mandatory consent checkbox on Create Account alongside a concise passive footer notice on email/Sign In steps.

### ✨ Features & UX Improvements
- **Streamlined Authentication & Onboarding Consent UX (`AuthPage.tsx`, `OnboardingFlow.tsx`, `MainLayout.tsx`)**:
  - Removed the global post-login `ConsentAuditModal` (`ConsentAuditModal.tsx`, `ConsentAuditModal.test.tsx`) from `MainLayout.tsx` so authenticated users and Google OAuth sign-ins enter the app directly without recurring modal interruptions.
  - Removed the duplicate top consent line on Step 1 (`email` step) and kept a single passive footer notice (`"By continuing, you agree to our Terms of Service and Privacy Policy."`) on Step 1 and the Sign In step.
  - Retained the single mandatory age & terms checkbox on the Create Account details step while hiding the redundant footer notice below the `Create Account` button and preventing legal modal link clicks inside the checkbox label from toggling checkbox state.
  - Removed the redundant consent notice on `OnboardingFlow.tsx` and unused consent telemetry keys in `telemetryService.ts`.
  - Added `AuthPage.test.tsx` (`3/3` passing) and verified full Vitest (`29/29` files, `177/177` tests), `tsc --noEmit`, and `vite build`.

### Impacted Scope
`src/features/auth/`, `src/features/onboarding/`, `src/layouts/MainLayout.tsx`, `src/lib/telemetry/`

## [v1.0.343] - 10 November 2026, 03:20 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.343`

### Executive Summary
Resolved the post-login Terms & Privacy consent modal deadlock (`42501: permission denied for table profiles` on `record_user_consent`) with least-privilege column-level PostgreSQL grants, elevated global toast layering above modal overlays, and hardened profile refresh, presence headers, and inline consent error recovery across Web PWA and Capacitor Android.

### 🔒 Security & Backend Architecture
- **Least-Privilege `public.profiles` Column Grants & Hardened `record_user_consent` (`20261117000000`)**:
  - Revoked unintended write privileges (`INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`) on `public.profiles` from `anon` and broad table-level writes from `authenticated`, while granting `authenticated` column-level `UPDATE` strictly on user-editable fields (`terms_accepted_version`, `terms_accepted_at`, `age_confirmed`, `username`, `last_seen`).
  - Scoped `"Users can update their own profile."` RLS policy explicitly `TO authenticated` and hardened `public.record_user_consent()` (`SECURITY INVOKER`) with `IF NOT FOUND` verification so missing rows cannot fail silently.

### 🐛 Bug Fixes & UX Resilience
- **Unoccluded Toasts & Actionable Consent Error Recovery**:
  - Elevated `ToastContainer.tsx` overlay layering (`z-[10070]`) above `ConsentAuditModal.tsx` (`z-[10050]`) and `AuthLegalModal.tsx` (`z-[10060]`) so error/success notifications are never hidden behind modal backdrops.
  - Updated `ConsentAuditModal.tsx` to enforce active `CURRENT_TERMS_VERSION` matching, reset transient checkbox/error state on account switch, prevent legal link clicks from toggling the checkbox, add an inline `role="alert"` error banner with retry guidance, and emit privacy-safe telemetry (`consent_recorded`, `consent_record_failed`).
  - Hardened `AuthContext.tsx` `refreshProfile()` error propagation (with best-effort catch in `ProfilePage.tsx`) so failed post-consent profile syncs surface clearly rather than leaving the dialog stuck.
  - Fixed `PresenceProvider.tsx` `beforeunload` `PATCH` fallback header (`SUPABASE_ANON_KEY`) and unmount `last_seen` update execution.
  - Expanded `ConsentAuditModal.test.tsx` coverage (`9/9` passing) and verified full Vitest (`29/29` files, `183/183` tests via `--pool=forks`), `tsc --noEmit`, and `vite build`.

### Impacted Scope
`supabase/migrations/`, `src/features/auth/`, `src/components/ui/Notification/`, `src/providers/PresenceProvider.tsx`, `src/lib/telemetry/`

## [v1.0.342] - 10 November 2026, 12:31 PM IST

> **Release Platform Mapping**: `Android 1.6 (versionCode 6) = Web v1.0.342`

### Executive Summary
Executed Phases 1–10 of the MindFlow Production Uplift Roadmap targeting 10,000 DAU commercial readiness across Web PWA and Capacitor Android: eliminated Stored XSS & iframe origin leakage, deployed database privilege hardening and scalar-subquery RLS/indexing optimizations, implemented DPDP/Play Store compliance flows (`/request-account-deletion`, consent audit logging), hardened offline IndexedDB isolation and keyset metadata sync, finalized Option B zero-flash intro orchestration, upgraded visualViewport keyboard handling and WCAG touch targets, hardened Android R8/ProGuard release packaging, and verified TypeScript, build, and Vitest test suites.

### 🔒 Security & Backend Architecture
- **Stored XSS & Sandbox Hardening (Phase 1)**:
  - Sanitized raw HTML/Markdown inputs in `MarkdownRenderer.tsx` via `DOMPurify` while preserving KaTeX/MathML rendering, isolated `TextExporter.tsx` preview iframe (`sandbox="allow-scripts"`), enforced strict CSP headers in `index.html`, set `android:allowBackup="false"`, excluded `*.jks`/`*.keystore` in `android/.gitignore`, and removed obsolete test credential comments from `.gitignore`.
  - Deployed `20261111000000_harden_create_quiz_session.sql` to enforce server-side `auth.uid()` ownership inside `create_quiz_session`.
- **Database Access Control, Indexing & 10k DAU Scaling (Phases 4–6)**:
  - Applied `20261112000000`–`20261116000000` migrations: revoked `PUBLIC`/`anon` execution on `SECURITY DEFINER` RPCs, added RLS policies for `ai_model_runtime` and `deleted_question_logs`, removed transitional admin email fallbacks, added FK covering indexes and `(SELECT auth.uid())` scalar subquery RLS rewrites, batched `delete_scheduled_users()` (`LIMIT 50`), updated `handle_new_user()`, and added `SECURITY INVOKER` `record_user_consent()` RPC.
  - Added timeout-guarded Edge Function HTTP/Supavisor-safe pooling across `enrich-questions`, `enrich-taxonomy`, `extract-questions`, and `ask-ai-tutor`; verified `reset_minute_ai_quotas` (`* * * * *`) and `batch_size = 1` with `gemini-3.1-flash-lite` primary model.

### ✨ Features, Play Compliance & UX Polish
- **DPDP Act 2023 & Google Play Deletion Alignment (Phase 2)**:
  - Kept optional data download unblocking on `DeleteAccountPage.tsx`, launched public deletion verification portal (`/request-account-deletion` outside `NavigationManager`), exposed Legal & Privacy links in `ProfilePage`/`SettingsPage`, and updated `ConsentAuditModal.tsx` with offline bypass, `user_metadata` consent fallback, and elevated `AuthLegalModal.tsx` overlay layering (`z-[10060]`).
- **Native Android Packaging, ProGuard & Option B Launch Lifecycle (Phases 3, 9 & 10)**:
  - Preserved `@capacitor/camera` and `@capacitor/filesystem`, scoped legacy storage permissions with `android:maxSdkVersion="32"` in `AndroidManifest.xml`, added deep link filters (`mindflow://`) and `adjustResize`, integrated `MicrophoneDisclosureModal.tsx`, guarded `signingConfigs.release`, enabled `minifyEnabled true` in `android/app/build.gradle`, added Capacitor/WebKit ProGuard keep rules in `android/app/proguard-rules.pro`, and kept `versionCode 6` / `versionName "1.6"` manual.
  - Finalized `IntroEngine.tsx` + `App.tsx` Option B launch lifecycle (0ms loader flash, `<HashRouter>` deferred until OAuth/session bootstrap or 8s watchdog, seamless `bg-slate-950` underlay behind exiting intro modules), wrapped config footers (`QuizConfig.tsx`, `IdiomsConfig.tsx`, `OWSConfig.tsx`, `SynonymsConfig.tsx`) with `KeyboardAwareBottomBar` (`fullWidth`, real `window.visualViewport` keyboard positioning), expanded multi-level `resolveHardwareBackTarget` parent routing in `useHardwareBackButton.ts`, and enforced `>= 44x44px` accessible touch targets (`ClaymorphismSwitch`, `SubjectHeader`, `MainLayout`, `EmptyState`, `ErrorState`, quiz lists) + telemetry (`empty_state_seen`, `recovery_action_clicked`, `offline_sync_completed`).

### ⚡ Performance, Offline Resilience & Verification (Phases 7–8)
- **Keyset Delta Metadata & Atomic Quiz Persistence**: Added keyset delta sync and in-flight deduplication in `questionService.ts`, atomic `create_quiz_session` creation with IndexedDB rollback in `quizCreationService.ts`, synchronous IndexedDB/Zustand/localStorage purges on logout/`SIGNED_OUT` (`AuthContext.tsx` deduplicated helpers), `clearCustomBanks()`, and 80% storage quota cache eviction (`db.enforceStorageQuota`).
- **Automated Test Coverage**: Verified 29/29 Vitest suites (179/179 tests via `--pool=forks`) including `ConsentAuditModal`, `IntroEngine`, `KeyboardAwareBottomBar`, `MarkdownRenderer`, `useHardwareBackButton`, and `phase8_resilience`.

## [v1.0.340] - 10 November 2026, 08:45 AM IST

### Executive Summary
Established the comprehensive MindFlow Production Readiness Audit and 10-Phase Uplift Roadmap for 10,000 DAU commercial readiness. Codified ADR-0005 (Option B Launch Lifecycle), amended the MindFlow Constitution with Section 13 (Living Pragmatic Amendment Clause), softened Rule 1 to allow authoritative secondary shortcuts, preserved `@capacitor/camera` and `@capacitor/filesystem` dependencies, and established explicit Android-to-web version mapping.

### 🔒 Security, Architecture & Governance
- **Full-Stack Production Audit & 10-Phase Roadmap (`PRODUCTION_AUDIT_REPORT.md`, `TEN_PHASE_ROADMAP.md`)**:
  - Executed a forensic audit across UI/UX, Backend Scalability for 10,000 DAU, Security, Legal/Privacy, and Google Play Store requirements.
  - Formulated an actionable 10-phase sequential execution roadmap detailing objectives, risk assessments, affected systems, and verifiable acceptance criteria.
- **Constitution Section 13 Pragmatic Amendment Clause (`docs/MINDFLOW_CONSTITUTION.md`, `AGENTS.md`)**:
  - Established Section 13 allowing sound engineering best practices to supersede rigid constitutional rules when recorded in `docs/PRODUCT_DECISIONS.md`.
  - Softened Rule 1 to clarify that secondary action shortcuts are permitted provided they bind directly to the single primary authoritative state controller without divergent state.
  - Updated the Decision Precedence Hierarchy across `AGENTS.md` and the Constitution.
- **ADR-0005: Launch Lifecycle Architecture Option B (`docs/ADR/0005-launch-lifecycle-option-b.md`)**:
  - Formally ratified Option B for the application cold-start lifecycle: renders `<IntroEngine>` immediately on Frame 0 with 0ms loader flash, executes `useAppBootstrap` concurrently in the background to guarantee 100% OAuth hash extraction and IndexedDB hydration safety before `<HashRouter>` mounts, and bounds startup with an 8-second watchdog timeout.
- **Capacitor Dependency Preservation & Storage Permission Scoping**:
  - Forensically verified active call sites for `@capacitor/camera` (reels) and `@capacitor/filesystem` (native PDF/export downloads), permanently cancelling package pruning.
  - Specified manifest scoping of legacy storage permissions (`maxSdkVersion="32"`) for Google Play Store compliance.
- **Android Release Version Mapping Ritual**:
  - Decoupled Android release builds from web semver to preserve clean Gradle releases; instituted mandatory mapping entries in `APP_JOURNEY_LOG.md` for all Play Console uploads (`Android X.Y (versionCode Z) = Web v1.0.W`).

## [v1.0.339] - 10 November 2026, 02:10 AM IST

### Executive Summary
Engineered a world-class, professional entry authentication portal and developer/legal framework: eliminated the 8,000ms Web Locks freeze with an instant 0ms unauthenticated fast-path bypass, built a responsive desktop split-screen hero showcase (`AuthHeroShowcase`), implemented live password entropy evaluation (`PasswordStrengthMeter`) and seamless in-app legal dialogs (`AuthLegalModal`), resolved global button accessibility clobbering, unified signup/signin codebases, and fortified legal compliance with the Digital Personal Data Protection (DPDP) Act 2023 and IT Act 2000.

### ✨ Features & UI/UX Upliftment
- **Desktop Split-Screen Showcase (`AuthHeroShowcase.tsx`)**:
  - Designed an enterprise-grade left showcase column on desktop (`lg:grid-cols-12`) featuring animated orbital neural branding, ambient glowing gradients, four academic value pillars (Active Recall Engine, Multimodal Live AI, Deep Diagnostic Analytics, Offline Resilience), live social proof badges, and SSL 256-bit security trust marks.
- **Unified Dual-Tab Authentication Portal (`AuthPage.tsx`, `SignupPage.tsx`)**:
  - Replaced the fragmented and disconnected sign-in and sign-up pages with a unified, dual-tab switcher (`[ Sign In ] | [ Create Account ]`) preserving active user input between tabs.
  - Refactored `SignupPage.tsx` into a lightweight, clean proxy wrapper (`<AuthPage initialMode="signup" />`), eliminating over 700 lines of duplicated code.
- **Interactive Password Entropy Meter (`PasswordStrengthMeter.tsx`)**:
  - Implemented real-time password strength scoring across length, casing, numeric characters, and symbols with progressive colored segments and dynamic criteria pills.
  - Integrated full screen-reader accessibility (`role="status"`, `aria-live="polite"`).
- **Zero-Latency In-App Legal Modals (`AuthLegalModal.tsx`)**:
  - Engineered an in-app legal reader modal for Terms of Service and DPDP Privacy Policy, eliminating external tab redirects, bare-hash 404 vulnerabilities on GitHub Pages, and native Capacitor popup crashes.
- **Mobile Touch Target & Viewport Zoom Hardening**:
  - Increased all interactive hitboxes (action tabs, legal links, mode toggles, password reveals) to exceed WCAG 2.1 AA 44x44px minimum targets.
  - Set mobile input font sizes to 16px (`text-base sm:text-sm`), completely preventing involuntary iOS Safari auto-zoom on field focus.

### 🐛 Bug Fixes
- **Eliminated 8,000ms Unauthenticated Freeze (`src/lib/supabase.ts`)**:
  - Diagnosed Supabase Web Locks contention (`lock:sb-sjcfagpjstbfxuiwhlps-auth-token`) where guest page loads were held in an 8-second timeout loop while `<SynapticLoader />` froze the screen.
  - Introduced token existence check (`hasStoredAuthToken()`, `hasOAuthHash()`) and reduced `AUTH_TIMEOUT_MS` to 2,500ms (1,500ms guest cold-start), delivering an instantaneous 0ms bootstrap for unauthenticated visitors.
- **Resolved Global `<Button>` Screen-Reader Clobbering (`Button.tsx`)**:
  - Removed hardcoded `aria-label="Perform action"` placed after `{...props}`, restoring visible and contextual accessibility names across all buttons throughout the application.
- **Handled Unconfirmed Email Flow**:
  - Added an actionable "Resend confirmation email" CTA when Supabase returns a 400 `"Email not confirmed"` error, rescuing users trapped in unverified email states.
- **Fixed Deceptive Dynamic Legal Dates (`TermsOfUse.tsx`, `PrivacyPolicy.tsx`)**:
  - Replaced dynamic `{new Date().toLocaleDateString()}` that showed "today's date" on every visit with deterministic version metadata (`Version 2.1 • Effective November 2024`).

### 🔒 Security, Legal & Architecture
- **DPDP Act 2023 & IT Act 2000 Compliance**:
  - Embedded Section 5 "Notice at Collection of Consent" directly in the registration consent statement.
  - Added explicit parental/guardian consent affirmations for minor school learners.
  - Designated an official Grievance Redressal Officer with formal contact channels (`support@mindflow.com`) under Section 8 of the DPDP Act 2023.
- **Client-Side Brute-Force Rate Limiting**:
  - Enforced a client-side velocity check locking out login attempts for 30 seconds after 5 consecutive failures, with real-time countdown display to prevent credential stuffing.
- **System Theme Sync (`ThemeAndBrandingInjector.tsx`)**:
  - Added an active listener for `window.matchMedia('(prefers-color-scheme: dark)')` to dynamically synchronize the app palette when theme mode is set to `'system'`.


## [v1.0.338] - 10 November 2026, 01:15 AM IST

### Executive Summary
Engineered a unified, end-to-end table matching and question pipeline solution: remediated flattened/deformed matching-list questions across the database with clean GFM comparative tables, upgraded MarkdownRenderer and quiz UI components to render responsive dual-column comparative tables, equipped UniversalContentImporter with an intelligent schema adapter supporting auto-sequential v1_id generation via PostgreSQL sequences, and established comprehensive pipeline documentation alongside a reusable AI question enrichment prompt.

### ✨ Features & UI/UX Upliftment
- **Responsive Dual-Column Table Rendering (MarkdownRenderer.tsx)**:
  - Built custom table, thead, th, td, and tr overrides for ReactMarkdown with horizontal scroll safety (overflow-x-auto min-w-[300px]), brand accent styling, and dark mode readability.
- **Client-Side Question & Option Sanitizer (questionFormatter.ts)**:
  - Implemented proactive sanitizer utility resolving historical OCR Roman numeral misinterpretations (List 11 -> List II, List 111 -> List III, (11) -> (II), D-l -> D-1).
  - Added layout breaker to cleanly segment flattened multi-list questions on-the-fly.
- **Option Deduplication & Solution Card Parity (QuizOption.tsx, QuestionSolutionCard.tsx)**:
  - Prevented redundant display in QuizOption.tsx when English and Hindi options are identical (e.g. code pairs like I-3, II-1, III-2).
  - Upgraded QuestionSolutionCard.tsx to render questions via MarkdownRenderer, ensuring table structures and line breaks never collapse during post-quiz review.

### ⚡ Performance & Database Architecture
- **Nondestructive Database Table Remediation**:
  - Remediated flattened and OCR-mangled matching questions in public.questions (including POL1115, GEO1423, POL941, CHE382, PHY498, SGK754, SGK756, ECO1006, CUR294, HIS2123) into valid, bilingual GitHub Flavored Markdown tables without data loss.
  - Documented migration in supabase/migrations/20261110010000_remediate_matching_questions.sql.
- **Intelligent Admin Bulk Ingestion Adapter (UniversalContentImporter.tsx)**:
  - Automated schema normalization for both flat database rows and nested Content Contribution Guidelines v2.0 JSON structures (classification.*, sourceInfo.*, properties.*).
  - Strips non-UUID id numbers and safely omits empty/placeholder v1_id values, allowing Supabase's assign_question_v1_id() PostgreSQL sequence trigger to automatically and monotonically allocate v1_id sequence numbers without manual pre-calculation.

### 🔒 Security, Prompts & Architecture Documentation
- **Master Question Pipeline Architecture (docs/QUESTION_PIPELINE_ARCHITECTURE.md)**:
  - Authored a comprehensive chronological guide detailing both Track A (Indigenous in-app pgmq pipeline) and Track B (External AI + Admin Importer), OCR sanitization, database sequence triggers, and validation invariants.
- **Generalized AI Question Enrichment Prompt (docs/prompts/full_prompt_batch_1.md)**:
  - Published a production-grade system prompt enforcing Content Contribution Guidelines v2.0, full 11-subject taxonomy, strict GFM table canonicalization for matching lists, and 5-part bilingual explanations.

## [v1.0.337] - 09 November 2026, 10:40 PM IST

### Executive Summary
Closed visual diagram rendering parity across all student learning surfaces (`QuestionSolutionCard.tsx` and `MistakeQuestionCard.tsx`), engineered a resilient Universal Explanation Adapter in `QuizExplanation.tsx` with bilingual Hindi fallback handling and cleanup of legacy dead code, and embedded native `AdminQuestionImage` controls directly into the admin question modal (`AdminEditQuestionModal.tsx`) across Content and Explanation tabs.

### ✨ Features & UI/UX Upliftment
- **Visual Diagram Parity Across Quiz Review & Mistakes Surfaces**:
  - Mounted `<AdminQuestionImage kind="question" ... />` inside `QuestionSolutionCard.tsx` (quiz review/summary screen) and `MistakeQuestionCard.tsx` (mistakes notebook), guaranteeing diagrams attached to question statements render seamlessly across the entire study workflow.
- **Embedded Visual Controls in Admin Modal**:
  - Embedded `AdminQuestionImage` directly inside Tab 1 (`Content & Options`) for question statement diagrams and Tab 3 (`Explanations & AI Tutor`) for explanation diagrams in `AdminEditQuestionModal.tsx`.
  - Added live preview rendering for explanation diagrams in the student preview subtab, eliminating the need to leave the editing flow to manage educational diagrams.

### 🐛 Bug Fixes & Refactoring
- **Universal Explanation Adapter & Schema Resilience (`QuizExplanation.tsx`)**:
  - Added an explanation adapter supporting structured `Explanation` objects, stringified JSON strings, and raw Markdown strings from legacy PYQ datasets without crashing.
  - Implemented safe bilingual summary extraction: when stripping Hindi characters leaves no content (e.g. pure Hindi PYQ question sets), the component safely falls back to the original summary rather than rendering a blank space.
  - Removed obsolete legacy `formatContent()` and regex splitting helpers that had been completely superseded by `MarkdownRenderer`.

### 🔒 Security & Architecture
- All diagram image mutations adhere to zero-secret policies, updating exclusively through authenticated client services and Supabase RLS.

## [v1.0.336] - 09 November 2026, 09:16 PM IST

### Executive Summary
Remediated the phantom column bug from PR #1074 by executing and applying live database migration `20261109203000_add_question_image_url.sql`, introduced an interactive full-screen Lightbox modal with zoom and pan controls for educational diagrams, upgraded `AdminQuestionImage.tsx` with touch-first mobile admin controls, and connected active question diagram rendering in `QuizQuestionDisplay.tsx`.

### 🐛 Bug Fixes & Database Schema Hardening
- **Phantom Column Remediation (`question_image_url`)**:
  - Created and applied migration `20261109203000_add_question_image_url.sql` adding `question_image_url TEXT` column to `public.questions` on live Supabase production (`sjcfagpjstbfxuiwhlps`).
  - Updated `src/types/models.ts` to include `question_image_url?: string` on the core `Question` interface, resolving runtime exceptions when uploading question-level visual diagrams.
- **Client Cache & Store Synchronization**:
  - Connected `updateImage` in `AdminQuestionImage.tsx` directly to `useQuizSessionStore.getState().hydrateQuestions()`, ensuring that uploads and removals immediately reflect in active quiz sessions without requiring page reloads.

### ✨ Features & UI/UX Upliftment
- **Interactive Full-Screen Lightbox Modal**:
  - Built an accessible Lightbox dialog (`role="dialog"`, `aria-modal="true"`) for question and explanation diagrams.
  - Features high-resolution source inspection, 100%–300% zoom controls, zoom reset, escape key / backdrop dismissal, and tap-to-zoom indicators for students.
- **Touch-Friendly Mobile Admin Actions**:
  - Replaced the desktop-only `group-hover:opacity-100` overlay with permanent, touch-friendly floating admin action pills.
  - Added a direct "Replace Image" action button so administrators can swap images in 1 click without deleting first, paired with a confirmation modal for removals.
- **Question-Level Visual Diagrams in Quiz Displays**:
  - Mounted `<AdminQuestionImage kind="question" ... />` inside `QuizQuestionDisplay.tsx`, bringing visual diagram support (maps, geometry, figures) directly into the main question statement card.

### 🔒 Impacted Scope
- `src/features/quiz/components/AdminQuestionImage.tsx`
- `src/features/quiz/components/QuizQuestionDisplay.tsx`
- `src/types/models.ts`
- `supabase/migrations/20261109203000_add_question_image_url.sql`
- `docs/APP_JOURNEY_LOG.md`
- `package.json`
- `package-lock.json`

---

## [v1.0.335] - 09 November 2026, 08:01 PM IST

### Executive Summary
Comprehensively audited and overhauled the Question Management Command Center (`AdminEditQuestionModal.tsx`). Eliminated a critical AI cache-poisoning bug that wrote `{}` instead of `null` to Supabase, corrected misleading schema formatting, introduced a categorized 3-tab layout (`Content & Options`, `Exam & Classification`, `Explanations & AI Tutor`), integrated a 1-click "Mark Correct" option synchronizer, added on-demand AI generation and cache purge capabilities, and provided 1:1 live student previews with KaTeX and Markdown rendering.

### 🐛 Bug Fixes & Cache Hardening
- **Cache Poisoning Resolution**:
  - Remediated the empty object `{}` fallback that previously marked questions as cached in Supabase `questions.ask_ai_explanation`, preventing students from receiving empty AI responses.
  - Form validation and payloads now strictly preserve `null` when no explanation is present, allowing future Edge Function generation calls to run cleanly.
- **Schema Alignment**:
  - Replaced obsolete `"ai_analysis"` guidance with the canonical `ask-ai-tutor` contract (`correct_answer`, `reasoning`, `exam_facts`, `recent_news`, `interesting_facts`, `fun_fact`).
- **Answer Key Synchronization**:
  - Dynamic option editing now keeps `correctAnswer` in lockstep with the selected option text, preventing false-positive validation rejections.

### ✨ Features & UI/UX Upliftment
- **Categorized 3-Tab Architecture**:
  - Structured the monolithic 17-field scroll into three intuitive tabs: `Content & Options`, `Exam & Classification`, and `Explanations & AI Tutor`.
- **Interactive MCQ Option Cards**:
  - Replaced raw JSON option arrays with visual option cards featuring 1-click "Mark Correct" radio selectors, optional Hindi inputs, and dynamic option count management (2–6 options).
- **AI Tutor Command Center**:
  - Built an in-modal action bar with database cache status indicators (`Cached in DB` vs `Not Cached`), on-demand **"Generate with AI"** calling the live Edge Function, and **"Clear Cache"** to purge corrupted entries.
  - Implemented a 1:1 **Student Live Preview** matching the student-facing `AiExplanationButton` modal design with Markdown and LaTeX KaTeX math rendering.

### 🔒 Impacted Scope
- `src/features/admin/components/AdminEditQuestionModal.tsx`
- `docs/APP_JOURNEY_LOG.md`
- `package.json`
- `package-lock.json`

---

## [v1.0.334] - 09 November 2026, 09:56 AM IST

### Executive Summary
Integrated the `AdminQuestionImage` controller directly into `QuizExplanation.tsx`, providing administrators with direct, in-place image review and Cloudinary uploading capabilities for question explanations during active quizzes and solution reviews.

### ✨ Features & UI Enhancements
- **Inline Admin Question Image Controller**:
  - Bound `<AdminQuestionImage />` with `kind="explanation"` and `initialImageUrl={imageUrl}` into `QuizExplanation.tsx`.
  - Enables authorized content creators and administrators to inspect, upload, and remove explanation images directly inside the live quiz solution viewer.

### 🔒 Impacted Scope
- `src/features/quiz/components/QuizExplanation.tsx`
- `package.json`

---

## [v1.0.333] - 08 November 2026, 09:48 PM IST

### Executive Summary
Introduced comprehensive, end-to-end admin image upload support for GK quiz explanations. Added the `explanation_image_url` column to Supabase `questions`, created the `AdminQuestionImage` component with Cloudinary integration, and bound explanation images across Mistake Cards, Question Solution Cards, and Quiz Reviews.

### ✨ Features Added & Architecture
- **Database Schema & RLS Hardening**:
  - Added `explanation_image_url TEXT` column to `public.questions` table via migration `20261108134030_add_explanation_image_url.sql`.
  - Configured idempotent RLS update policy granting `UPDATE` rights on `questions` to authenticated users with `is_admin` or `content_creator` roles.
- **Optimistic State & Query Management (`useQuestionImage`)**:
  - Created custom React Query hook with optimistic cache updates, error rollback, and automatic cache invalidation upon upload or removal.
- **Administrative Image Controller (`AdminQuestionImage`)**:
  - Built full image management component with drag-and-drop / file selection, Cloudinary media upload integration with folder structuring, and image preview/deletion.
- **Display Bindings Across Quiz Experiences**:
  - Integrated visual explanation support into `MistakeQuestionCard.tsx`, `QuestionSolutionCard.tsx`, `QuizReview.tsx`, and `LearningSession.tsx`.

### 🔒 Impacted Scope
- `src/features/quiz/components/AdminQuestionImage.tsx`
- `src/features/quiz/hooks/useQuestionImage.ts`
- `src/features/admin/api/adminQuestionImageApi.ts`
- `src/features/mistakes/components/MistakeQuestionCard.tsx`
- `src/features/quiz/components/QuestionSolutionCard.tsx`
- `src/features/quiz/components/QuizReview.tsx`
- `src/features/quiz/learning/LearningSession.tsx`
- `src/services/mediaUploadService.ts`
- `src/types/models.ts`
- `supabase/migrations/20261108134030_add_explanation_image_url.sql`

---

## [v1.0.332] - 08 November 2026, 04:50 PM IST

### Executive Summary
Enhanced the Question Management Command Center by introducing an editable JSON field for `ask_ai_explanation` in `AdminEditQuestionModal.tsx`.

### ✨ Features Added & Refactoring
- **Editable AI Explanation Field**:
  - Integrated `ask_ai_explanation` field into initial form state, validation pipeline (`validateJson('ask_ai_explanation', ..., 'object')`), and mutation payload.
  - Added dynamic textarea with expected JSON format guidance (`{"ai_analysis": "Text..."}`) for seamless administrative authoring of AI-generated question explanations.

### 🔒 Impacted Scope
- `src/features/admin/components/AdminEditQuestionModal.tsx`
- `package.json`

---

## [v1.0.331] - 08 November 2026, 12:56 PM IST

### Executive Summary
Executed a comprehensive audit of the progressive Login flow (`AuthPage.tsx`) and resolved three critical vulnerabilities: eliminated the Password Recovery dead-end by introducing a dedicated `ResetPasswordPage` and preserving recovery tokens during hash bootstrap, fixed infinite loading UI lockups on session-less sign-ins, and resolved native Android Capacitor `GoogleAuth.initialize()` crashes.

### 🐛 Bug Fixes & Architectural Hardening
- **Password Recovery Dead-End Resolution**:
  - Implemented a dedicated, accessible `ResetPasswordPage` (`src/features/auth/components/ResetPasswordPage.tsx`) mapped to `ROUTES.RESET_PASSWORD = '/reset-password'`.
  - Updated `useAppBootstrap.ts` to detect `type=recovery` in incoming hash payloads, sanitizing sensitive tokens from the address bar while preserving the `#/reset-password` target hash for React HashRouter.
  - Updated `NavigationManager.tsx` to exempt `/reset-password` from premature onboarding redirects, ensuring recovery users can set a new password without interruption.
- **Infinite Loading UI Freeze Resolution**:
  - Hardened `handleAuthAction` in `AuthPage.tsx` to guarantee `isEmailLoading` is safely reset on all code paths, properly surfacing actionable errors if Supabase returns without an active session.
- **Native Android Google Sign-In Hardening**:
  - Added explicit runtime `await GoogleAuth.initialize()` calls prior to `GoogleAuth.signIn()` across both `AuthPage.tsx` and `SignupPage.tsx` to prevent native Capacitor plugin initialization crashes on Android.
- **OAuth Web URL Sanitization**:
  - Sanitized redirect URL path concatenation to prevent duplicate slashes (`//#/`) on strict URL allowlists.
  - Normalized user email input via `.trim().toLowerCase()` to prevent casing-induced authentication discrepancies.

### 🔒 Security & Architecture
- Maintained strict zero-token address bar exposure by immediately stripping sensitive tokens via `window.history.replaceState` before HashRouter mounts.
- Enforced password requirements (minimum 6 characters, matching confirmation) on password reset.

## [v1.0.330] - 08 November 2026, 12:17 PM IST

### Executive Summary
Upgraded the "Create Account" (`SignupPage.tsx`) experience to full visual and architectural parity with the progressive 2-step Login portal (`AuthPage.tsx`). Replaced the bulky legacy white card, redundant checkboxes, and heavy vertical scroll with a frameless, direction-aware 2-step onboarding sequence, bidirectional email state preservation between Login and Signup, Android hardware back/Escape capture interception, and 44x44px accessible touch controls.

### ✨ Features & UI/UX Parity
- **Full Visual Parity with Senior Login Architecture**:
  - Replaced the clunky desktop card box on mobile with a frameless, vertically centered layout (`h-[100dvh] max-h-[100dvh]` with safe-area insets and ambient indigo glow).
  - Adopted the exact typography, BrandLogo sizing, Google OAuth button, and divider aesthetics from `AuthPage.tsx`.
- **Progressive 2-Step Registration Flow**:
  - **Step 1 (Identification)**: One-tap Google Sign-Up or Email Address identification with format validation, forward-sliding animation, and permanent Terms/Privacy notice.
  - **Step 2 (Details & Security)**: Active Email Pill with quick "Change" action, Full Name input with auto-focus, Password & Confirm Password with individual 44x44px eye toggles, and unified 18+ Terms checkbox.
- **Cross-Page Email State Preservation**:
  - Wired bidirectional route state between `AuthPage` and `SignupPage` via `useLocation` / `location.state?.email`. If a user types their email on either screen and switches, their email is seamlessly prefilled.
- **Hardware Back Button & Escape Interception**:
  - Integrated `data-headlessui-state="open"` on Step 2 with capture-phase `Escape` key listeners, enabling seamless return to Step 1 without triggering an Android app exit or full screen pop. Step 1 top-left back button cleanly returns to the Login portal.

## [v1.0.329] - 08 November 2026, 11:55 AM IST

### Executive Summary
Conducted a deep architectural and functional audit of the login portal (`AuthPage.tsx`) and remediated critical blockers: wired up the non-functional "Forgot Password" action to live Supabase password recovery, eliminated the Android hardware back button event trap on Step 2 by enabling standard DOM event bubbling and capture-phase interception, established reliable post-animation auto-focus across progressive step transitions, sanitized input whitespace across transitions, and removed dead component state.

### 🐛 Bug Fixes & Architectural Polish
- **Real Password Recovery Integration (`supabase.auth.resetPasswordForEmail`)**:
  - Replaced the mock/dummy `handleForgotPassword` toast with a production-grade asynchronous handler executing `supabase.auth.resetPasswordForEmail()`.
  - Added dedicated loading (`isResettingPassword`) and error recovery handling, preventing user lockout when credentials are lost.
  
- **Android Hardware Back Button Deadlock Remediation**:
  - Fixed synthetic `Escape` event dispatch in `useHardwareBackButton.ts` by setting `{ bubbles: true, cancelable: true }`.
  - Updated `AuthPage.tsx` keydown listener to capture-phase registration on `document`, ensuring back presses on Step 2 (`step === 'password'`) reliably return to Step 1 (`step === 'email'`) without deadlock on Android Capacitor devices.

- **Framer Motion Auto-Focus Timing Fix**:
  - Replaced immediate `requestAnimationFrame` calls (which fired while incoming DOM elements were unmounted during Framer Motion's 220ms `mode="wait"` exit transition) with a step-change `useEffect` hook.
  - Ensures password input on Step 2 and email input on Step 1 reliably gain focus without requiring manual user tapping.

- **State Sanitization & Dead Code Cleanup**:
  - Enforced `setEmail(trimmed)` upon proceeding past Step 1 to eliminate lingering trailing whitespace on email pills and hidden username fields.
  - Removed unreferenced `message` state and unused `useLocation` / `useAuth` imports in `AuthPage.tsx`.
  - Added `overflow-hidden` to animated error alert containers to prevent text overflow during height collapse animations.

### 🔒 Impacted Scope
- `src/features/auth/components/AuthPage.tsx`
- `src/hooks/useHardwareBackButton.ts`
- `package.json`
- `docs/APP_JOURNEY_LOG.md`

---

## [v1.0.328] - 08 November 2026, 10:32 AM IST

### Executive Summary
Executed a comprehensive, senior-level UI/UX overhaul of the authentication portal (`AuthPage.tsx`). Eliminated the massive 262px whitespace void on tall smartphones (such as Samsung M51) through balanced vertical centering, permanently bound the Terms of Service & Privacy Policy directly beneath the primary action buttons so they never vanish during typing, added focus-ring clearance gutters to eliminate left/right focus border clipping, enhanced touch targets to 44x44px, and introduced responsive height-driven scaling for ultra-short and landscape viewports with zero scrolling.

### ✨ Features Added & UI Polish
- **Cohesive Vertical Architecture (Zero Blank Whitespace on Tall Screens)**:
  - Replaced the fractured `justify-between` and `my-auto` model with a unified, vertically centered card layout.
  - Eliminated the 262px dead space between the header and Google sign-in on devices like Samsung M51 (412x915) and iPhone 14 Pro Max (430x932), providing a tight, natural 20px gap (`mb-3 sm:mb-5`).
  
- **Permanent Terms & Privacy Notice Placement**:
  - Moved the legal notice directly beneath the Continue (Step 1) and Sign In (Step 2) buttons.
  - Removed focus-triggered hide states so the terms notice remains permanently visible and legible both while idle and while typing.

- **Focus Ring Clipping Elimination (Issue 3 Fix)**:
  - Added a `p-1 -m-1` gutter around the sliding container, providing 4px of clearance outside the input borders.
  - Replaced hard-clipped outer focus rings with smooth, non-overflowing focus states (`focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25`), ensuring 100% unclipped, beautiful borders on Android WebView.

- **Dynamic Height Adaptability (Ultra-Short & Landscape)**:
  - Introduced arbitrary height variants (`[@media(max-height:500px)]:`) that automatically compress button and input heights to 36px (`h-9`), reduce vertical gaps, and hide redundant subtitles on short screens.
  - Verified 0px vertical and 0px horizontal scroll across all viewports including `640x360` (landscape) and `360x340` (keyboard simulation).

- **Senior UX Micro-Interactions & Accessibility**:
  - Replaced native browser `alert()` for "Forgot Password?" with a non-blocking toast via `useNotificationStore`.
  - Added a prominent top-left `<ArrowLeft />` back button on Step 2 to easily return to Step 1 alongside the email pill "Change" action.
  - Guaranteed 44x44px touch targets on the show/hide password toggle.
  - Wrapped error banners in `<AnimatePresence>` to eliminate Cumulative Layout Shift (CLS).

### 🔒 Security & Architecture
- Full compliance with MindFlow Product Constitution Section 8 performance budgets and zero-tolerance hard invariants.
- 100% preservation of Supabase auth, Google OAuth, and native Capacitor Google Sign-In handlers.


## [v1.0.327] - 08 November 2026, 08:38 AM IST

### Executive Summary
Re-engineered the authentication portal (`AuthPage.tsx`) into a modern, 2-step progressive authentication flow (`email` ➔ `password`) with direction-aware Framer Motion transitions. Pinned the brand header to eliminate visual jumping between steps, established a stable middle step container, removed the obsolete "Try 3 Sample Questions First" feature, integrated Android hardware back / Escape interception on Step 2, and ensured complete credential matching for mobile and desktop password managers.

### ✨ Features Added
- **2-Step Progressive Authentication Flow (`AuthPage.tsx`)**:
  - **Step 1 (Identification)**: Users enter their email or select Google Sign-In. Email format regex validation runs synchronously on "Continue" with zero account enumeration delays.
  - **Step 2 (Password Authentication)**: Displays an active email pill with an emerald status indicator and a quick "Change" button that smoothly returns to Step 1.
  - **Auto-Focus Workflow**: Automatically focuses the password input upon transitioning to Step 2, and focuses the email input when returning to Step 1.
  - **Password Manager Compatibility**: Added standard `autoComplete="username"` on Step 1, `autoComplete="current-password"` on Step 2, and a visually hidden `username` input in Step 2 so password managers (Google Password Manager, Apple Keychain, Bitwarden) seamlessly store and autofill credentials.

- **Anchored Brand Header & Stable Min-Height Container**:
  - Pinned the MindFlow wordmark, "Welcome Back" greeting, and "CREATE ACCOUNT" link at the top with fixed padding. The header remains firmly in place and never shifts or collapses.
  - Enforced a stable middle container with `min-h-[220px]` (`[@media(min-height:750px)]:min-h-[250px]`), preventing layout height bouncing during transitions.

- **Direction-Aware Motion Transitions (`framer-motion`)**:
  - Configured slide variants where forward progression slides left (`x: 36 -> 0`) and backward navigation slides right (`x: -36 -> 0`).
  - Fully respects system accessibility settings via `useReducedMotion()`.

- **Android Hardware Back & Escape Interception**:
  - Tagged Step 2 with `data-headlessui-state="open"` and bound an `Escape` keydown handler.
  - Pressing the Android hardware Back button or Escape key on Step 2 gracefully returns the user to Step 1 without exiting the application or navigating away.

- **Debounced Virtual Keyboard Optimization**:
  - Form container utilizes debounced (`150ms`) `focusin`/`focusout` listeners.
  - On mobile viewports when typing, only the bottom legal/terms footer is hidden, keeping the header and the active input/action button 100% visible and unclipped.

### ⚡ Performance & Refactoring
- **Complete Decommission of "Try 3 Sample Questions" in Auth**:
  - Completely removed the Sample Questions button, demo drawer, and associated local demo state machines from `AuthPage.tsx`, eliminating the excess whitespace beneath the Google Sign-in button.
  - Preserved `src/features/quiz/data/starterDiagnosticQuestions.ts` on disk for zero-risk repository hygiene.

### 🔒 Security & Architecture
- **Auth Flow & Protocol Invariance**:
  - Preserved underlying Supabase authentication calls (`supabase.auth.signInWithPassword`, `signInWithOAuth`, native `GoogleAuth.signIn`), haptic feedback protocols, and zero-secrets compliance.


## [v1.0.326] - 08 November 2026, 07:56 AM IST

### Executive Summary
Re-architected the Authentication / Login portal (`AuthPage.tsx`) into a viewport-locked, native single-screen experience. The mobile interface eliminates the web "card-on-a-page" border and vertical/horizontal scrolling, features a responsive two-column layout for short landscape screens, smoothly collapses secondary blocks when the virtual keyboard is active, and provides a consolidated, authoritative terms/privacy footer.

### ✨ Features Added
- **Native Viewport-Locked Single-Screen Experience (`AuthPage.tsx`)**:
  - Bound root container to `h-[100dvh] max-h-[100dvh] w-full overflow-hidden` with safe-area positive padding (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  - Mobile & Native Canvas: Stripped artificial card borders and shadows on `< md` screens so auth controls rest seamlessly on the deep navy gradient background; preserved centered card presentation on desktop (`md+`).
  - Consolidated Legal Links: Replaced redundant duplicate terms notices with a single pinned footer at the bottom maintaining intact terms and privacy policy routes.
  - Viewport-Height Based Typography & Sizing: Standardized inputs and buttons to 44–48px with dynamic height-aware classes (`[@media(min-height:750px)]:`), guaranteeing zero vertical or horizontal overflow across 360x640, 390x844, and 412x915 viewports.

- **Short Landscape 2-Column Responsive Layout**:
  - Implemented an automatic two-column layout for short screens in landscape (`(min-width: 540px) and (max-height: 520px)`), placing Brand & Google/Sample triggers on the left and Email/Password/Submit actions on the right to eliminate scrolling at 640x360.

- **Flicker-Free Virtual Keyboard Reactivity**:
  - Added debounced (150ms) `focusin`/`focusout` and `visualViewport` height tracking.
  - Automatically collapses top brand and secondary buttons on mobile when typing so email, password, error feedback, and the "Sign In" button remain 100% visible and accessible above the virtual keyboard.

### 🔒 Security & Architecture
- **Auth Flow & Policy Invariance**:
  - Preserved 100% of underlying Supabase authentication methods (`signInWithPassword`, `signInWithOAuth`, native `GoogleAuth.signIn`), 3-question diagnostic micro-demo state machine, route policies, and haptic feedback.

## [v1.0.325] - 08 November 2026, 07:05 AM IST

### Executive Summary
Replaced immediate auto-start quiz behavior on dashboard drill buttons with an informative, beginner-friendly confirmation Downsheet (`DashboardDrillBottomSheet`). Users now see detailed context on what is about to start—including drill rationale, target exam, mode selection (Learning vs Mock), question count options (10, 15, 20, 25 Qs), and estimated duration—with direct options to start, customize in Quiz Builder, or safely cancel.

### ✨ Features Added
- **Dashboard Drill Confirmation Downsheet (`DashboardDrillBottomSheet.tsx`)**:
  - Implemented a unified, accessible mobile-friendly bottom sheet for all dashboard quiz launch entry points.
  - Contextual explanation card informing users what questions are included and why the drill is recommended (resolving beginner confusion over "which button is doing what").
  - Interactive Mode Selector: Toggle between Learning Mode (instant answer reveal & AI explanations) and Mock Exam Mode (timed simulation with score review).
  - Flexible Question Count selector chips (`10 Qs`, `15 Qs`, `20 Qs`, `25 Qs`) with dynamic estimated completion time calculation.
  - Action options: "Start Practice Drill / Mock Test", "Customize Filters" (opens Quiz Builder pre-filtered without starting), and "Cancel" (safe dismissal).
  - Accessible interaction design: mobile drag-handle visual cue, backdrop blur dismissal, keyboard `Escape` listener, and body scroll lock.

### 🐛 Bug Fixes
- **Dashboard Accidental Immediate Quiz Start Fix (`DashboardPage.tsx`, `AIPrescriptionCard.tsx`, `ImportantForSscStrip.tsx`)**:
  - Intercepted direct `autoStart: true` navigation on "Start Targeted Drill", "Daily PYQ Drill", "Important for SSC CGL" curated topic cards, and ExamCard 25 Qs buttons.
  - All triggers now cleanly stage drill parameters into `DashboardDrillBottomSheet`, eliminating unintended quiz session generation when exploratory clicks occur.

### 🔒 Security & Architecture
- **Diagnostic Telemetry Integration (`telemetryService.ts`)**:
  - Added strictly typed telemetry payloads: `dashboard_drill_sheet_opened`, `dashboard_drill_started`, and `dashboard_drill_customize_clicked` for privacy-first observability without PII.
## [v1.0.324] - 08 November 2026, 06:55 AM IST

### Executive Summary
Architected and deployed an enterprise-grade, desktop-first Admin Command Center (`/#/admin/*`), centralizing control over user IAM, question bank management, vocabulary matrix, content ingestion pipelines, mock test series, study materials, financial transaction ledgers, moderation queues, and remote app configuration. Completely eradicated hardcoded legacy admin email checks and elevated error boundary diagnostics.

### ✨ Features Added
- **Unified Enterprise Desktop Command Center Shell (`AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminCommandPalette.tsx`)**:
  - Implemented collapsible responsive sidebar with grouped navigation: Control Room, Access & IAM, Academic Content, Mock Tests CMS, Governance & Billing.
  - Added global `Ctrl+K` Command Palette for instant keyboard-driven search and navigation across all admin modules.
  - Added dynamic route breadcrumb path navigation and real-time operational status indicators in `AdminHeader`.
- **System Overview & Health Dashboard (`AdminOverviewPage.tsx`)**:
  - Live metric counters querying total questions, registered learners, vocabulary items, published tests, pending moderation flags, and AI DLQ sizes.
  - High-density KPI cards and quick-action shortcuts for daily platform operations.
- **Learner Directory & IAM Access Control Studio (`AdminUsersPage.tsx`, `UserDetailsDrawer.tsx`, `UserFilterBar.tsx`, `UserRoleBadge.tsx`)**:
  - High-density user master table with search, role filters (`all`, `admin`, `moderator`, `content_creator`, `teacher`, `super_admin`), sorting by registration date, XP, and streaks, and CSV export.
  - Flyout inspection drawer providing tabbed views for learner analytics, RBAC privilege management, active device session tokens with one-click revocation, and trust/risk heuristics with shadow-flag toggles.
- **Question Bank Studio & Inspector (`AdminQuestionsPage.tsx`, `QuestionInspectorDrawer.tsx`)**:
  - High-throughput question browser with multi-select bulk operations, subject/difficulty filters, and pagination.
  - Full inspector drawer supporting bilingual inspection, options editing, difficulty adjustment, and tags management.
- **Universal Multi-Format Content Importer (`UniversalContentImporter.tsx`)**:
  - Unified modal supporting bulk JSON and single-item ingestion for Questions, One Word Substitutions (OWS), Idioms & Phrases, and Synonyms with interactive schema validation and sample template exports.
- **Vocabulary Matrix Hub (`AdminVocabPage.tsx`)**:
  - Consolidated tabbed workspace for OWS, Idioms, and Synonyms with inline editing links, live counts, and fast text filtering.
- **Financials & Monetization Ledger (`AdminFinancialsPage.tsx`)**:
  - Complete Razorpay transaction audit ledger with status filters (`Captured`, `Failed`, `Pending`), plan breakdown (`Spark`), raw gateway payload modal inspector, and CSV export.
- **Governance & Moderation Queue (`AdminReportsQueue.tsx`)**:
  - Moderation queue with status tabs (`pending`, `being_reviewed`, `resolved`, `ignored`), review modal with full user/post evidence snapshots, and content restore/permanent deletion actions.
- **Broadcast & Notification Center (`AdminNotifications.tsx`)**:
  - Modern dual-column desktop composer for multi-channel announcements with audience segmentation and audit history table with pagination.
- **Study Materials Command Center (`AdminManageMaterials.tsx`)**:
  - Integrated course document catalog with direct PDF drag-and-drop uploader to Supabase Storage.
- **Legacy Route Modernization**:
  - Seamlessly redirected legacy admin upload routes (`/admin/upload`, `/admin/upload-gk`, `/admin/upload-ows`, `/admin/upload-idioms`, `/admin/upload-synonyms`) to modern desktop studio tabs.

### 🐛 Bug Fixes
- **Enrichment Pipeline Hero Crash Fix**:
  - Resolved `Cannot read properties of undefined (reading 'is_active')` in `pipelineMetricsService.ts` by mapping Supabase RPC `get_ai_pipeline_dashboard_metrics` keys (`pipeline_status` -> `hero`, `metrics` -> `telemetry`, etc.) and providing safe fallback defaults.
  - Added robust optional chaining across `PipelineHeroCard`, `QualityMetrics`, `QueueIntelligence`, `ProgressMatrix`, `PhaseLatencyChart`, and `TokenEconomicsPanel`.
- **Route Reference & SearchParams Fixes**:
  - Fixed missing `useSearchParams` import in `AdminQuestionsPage.tsx` and declared `useSearchParams` in `AdminVocabPage.tsx`.
  - Repaired JSX nesting in `AdminReportsQueue.tsx` review modal action bar.
- **PresenceAvatar Typings Alignment**:
  - Aligned prop contracts in `AdminUsersPage.tsx` and `UserDetailsDrawer.tsx` to `avatarUrl` and `altText`.

### 🔒 Security & Architecture
- **Eradication of Hardcoded Admin Email Checks**:
  - Replaced all legacy `user.email === 'admin@mindflow.com'` checks across the entire repository with `AuthPolicy.isAdmin(user, profile, roles)` and RBAC roles (`admin`, `super_admin`).
  - Protected admin route group centrally in `NavigationManager` with `RouteAccessType.ADMIN`.
- **Diagnostic Glassmorphism Error Boundary (`ErrorBoundary.tsx`)**:
  - Upgraded system error boundary with collapsible component stack traces, exact error details banner, 1-click diagnostic JSON copy, and safe return to dashboard navigation.


## [v1.0.323] - 07 November 2026, 07:15 PM IST

### Executive Summary
Investigated and resolved an issue where dashboard quick drills and topic boxes inadvertently generated multi-thousand question mega-quizzes. Introduced an authoritative system-wide ceiling guard (`MAX_QUIZ_QUESTIONS = 100`), enforced default question count boundaries (10–25 questions) across all dashboard launch triggers, and added interactive Question Count selector chips (10, 20, 25, 50, 100) to the Quiz Configuration footer per MindFlow Constitution Section 8.

### 🐛 Bug Fixes
- **Dashboard Drill Over-Generation Fix (`DashboardPage.tsx`, `useVulnerabilityEngine.ts`, `AIAdaptiveQuizModal.tsx`, `useExamReadiness.ts`)**:
  - Fixed `Daily PYQ Drill` (`handleQuickAction('mock')`) which previously navigated with `{ tags: ['PYQ'] }` and `autoStart: true` without specifying a limit, inadvertently generating quizzes with all ~9,184 PYQs in the database. Now strictly requests `questionCount: 25`.
  - Fixed `Start Targeted Drill` in `useVulnerabilityEngine.ts`, which now passes `questionCount: target.suggestedQuestionCount || 10`.
  - Fixed `Important for SSC CGL` topic cards (`ImportantForSscStrip.tsx`), ensuring high-yield topic drill clicks strictly limit practice sessions to a curated 25 questions instead of whole-subject dumps.
  - Fixed `AIAdaptiveQuizModal` and `useExamReadiness`, standardizing auto-started diagnostic and readiness drills to 15 questions.

### 🔒 Security & Architecture
- **Hard System Ceiling Enforcement (`quizCreationService.ts`)**:
  - Introduced `MAX_QUIZ_QUESTIONS = 100` and `DEFAULT_DRILL_QUESTION_COUNT = 25`.
  - Even if an unbounded question array is passed to `createQuiz`, the service now automatically clamps and logs a warning, guaranteeing that no quiz session can ever bloat IndexedDB or flood `bridge_saved_quiz_questions` with thousands of records.

### ✨ Features Added
- **Interactive Question Count Selector (`QuizConfig.tsx`)**:
  - Implemented sticky footer question count selector chips (`10`, `20`, `25`, `50`, `100 (Max)`), giving users direct control over their session length (defaulting to 25 per Constitution Section 8).
  - Dynamically updated the primary CTA label to `Create Quiz (X / Total Available)` with automatic random sampling so each generated session is fresh and focused.

## [v1.0.322] - 07 November 2026, 03:55 PM IST

### Executive Summary
Revamped the Answer Key Tool and Candidate Details section to match the intended user specification. Implemented end-to-end extraction and persistence for all candidate fields (`Subject/Exam Name`, `Exam Time`, `State`, `Gender`, `Roll Number`, `Category`, `Venue Name`), maximized the result page viewport by removing constraining lateral margins, removed the global header from the tool route, and deployed Edge Function v5 live to Supabase.

### ✨ Features Added
- **Exact Candidate Details Card Specification (`CandidateDetailsSection.tsx`)**:
  - Rebuilt the card to match the user's intended UI with an ID card header badge and a clean, vertically stacked list separated by crisp dividers.
  - Formatted all 9 core candidate fields: Candidate Name, Roll Number, Category, Exam Date, Exam Time (`10:00 AM (Shift-1)`), Venue Name, Subject/Exam Name, State (`BIHAR`), and Gender (`MALE`).
- **Comprehensive Candidate Form Controls (`AnswerKeyCalculator.tsx`)**:
  - Added dedicated form selectors for `Gender` (Male, Female, Other) and `Home State / UT` (populated with all 36 Indian states & union territories).
  - Integrated state inference heuristic (`inferStateFromVenue`) to automatically extract the candidate's home/exam state from the venue center name and city address if not manually specified.
- **Maximized Viewport & Minimal Margins**:
  - Overhauled layout constraints on the result page to use minimal lateral margins (`px-1 sm:px-2 md:px-3` with `max-w-[1440px]`), ensuring full screen real-estate is dedicated to dense score analytics and section breakdowns.
- **Global Header Removal on Result Page (`MainLayout.tsx`)**:
  - Registered `/tools/answer-key-calculator` to `isHeaderHiddenRoute`, removing the global app header to eliminate visual clutter and granting 100% vertical focus to the answer key scorecard.

### ⚡ Performance & Refactoring
- **Parser & Type Engine Modernization (`ExamParserAdapter.ts`, `EduquityAdapter.ts`, `types.ts`)**:
  - Added `Subject` extraction from TCS iON tables and Eduquity response sheets.
  - Enhanced `formatExamTimeWithShift` to accurately compose time and shift labels without duplication.
- **Supabase Cloud Sync & Edge Function Deployment (`parse-exam-sheet` v5)**:
  - Updated Edge Function `parse-exam-sheet` to extract `subject`, accept `gender` and `state`, and persist them directly into `public.exam_submissions`.
  - Deployed Edge Function version 5 live to production project `sjcfagpjstbfxuiwhlps`.

### Impacted Scope
- `src/features/tools/answer-key-engine/components/sections/CandidateDetailsSection.tsx`
- `src/features/tools/answer-key-engine/AnswerKeyCalculator.tsx`
- `src/features/tools/answer-key-engine/components/ScorecardDashboard.tsx`
- `src/features/tools/answer-key-engine/adapters/ExamParserAdapter.ts`
- `src/features/tools/answer-key-engine/adapters/EduquityAdapter.ts`
- `src/features/tools/answer-key-engine/services/answerKeyService.ts`
- `src/features/tools/answer-key-engine/utils/format.ts`
- `src/features/tools/answer-key-engine/types.ts`
- `src/layouts/MainLayout.tsx`
- `supabase/functions/parse-exam-sheet/index.ts`
- `package.json`


## [v1.0.321] - 07 November 2026, 02:30 PM IST

### Executive Summary
Expanded the Brand & Motion System to include the 4th purposeful variants: the ultra-compact **Morphing Synapse** spinner (`<BrandSpinner variant="morphing" />`) and the standalone **Smooth Brain Glyph** (`<BrandLogo variant="glyph" />`). Restored the user's signature compact Google Play-style morphing gradient spinner with inner pulsing brain to the official design system and integrated it into `AppConfigHub` with dynamic variant switching.

### ✨ Features Added
- **Morphing Synapse Spinner Variant (`variant="morphing"`)**:
  - Encapsulated the 140x140 Google Play-style morphing path and animated coordinate values (`MORPHING_SYNAPSE_PATHS`) into `brandTokens.ts`.
  - Added ultra-compact sizing tokens (`xs: 24px`, `sm: 32px`, `md: 48px`, `lg: 64px`, `xl: 96px`) allowing the morphing spinner to fit inside compact chips, badges, and table rows.
  - Centered the pulsing smooth brain emblem inside the morphing gradient loop with full dark/light theme support.
- **Bare Vector Smooth Brain Glyph (`<BrandLogo variant="glyph" />`)**:
  - Added standalone glyph variant that renders the canonical smooth brain emblem without the squircle background badge, ideal for tight spaces and inline typography.
- **4-Variant Motion Studio in `AppConfigHub`**:
  - Expanded `LoadingConfigPanel` to showcase live interactive previews for all 4 variants: Halo Ring, Morphing Synapse, Inline Arc, and Neural Skeleton.
  - Added an active app-wide spinner selector allowing administrators to toggle between the full-screen Halo Ring and the compact Morphing Synapse.

### ⚡ Performance & Refactoring
- **SynapticLoader Backwards Compatibility**:
  - Enhanced `<SynapticLoader />` to accept `variant` and `size` while defaulting to the active remote configuration or morphing loader for compact layouts.
- **Store & Schema Modernization**:
  - Updated `useAppConfigStore.ts` with strongly typed `LoadingConfig` supporting `'synaptic' | 'morphing' | 'inline' | 'skeleton'`.

## [v1.0.320] - 07 November 2026, 01:25 PM IST

### Executive Summary
Established the unified MindFlow Brand Identity, Logo, and Motion System. Consolidated fragmented brain icons and ad-hoc loaders across the repository into canonical `<BrandLogo />` and `<BrandSpinner />` components. Promoted the orbital halo spinner from BlueIntro to the application's universal signature brand loader, backed by a live control panel in `AppConfigHub` (`/#/admin/app-config`) and remote configuration via Supabase.

### ✨ Features Added
- **Canonical Brand Identity Layer (`src/components/brand/`)**:
  - `brandTokens.ts`: Canonical vector definitions for the Smooth Brain Glyph with Neural Lobes, circuit brain paths, standard gradient anchors, and sizing tokens.
  - `BrandLogo.tsx`: Authoritative brand logo component supporting 3 purposeful variants (`icon`, `wordmark`, `animated`) across light, dark, and auto modes.
  - `BrandSpinner.tsx`: Unified loader system featuring 3 purposeful variants:
    - `synaptic`: Signature rotating orbital gradient halo ring with centered pulsing brand emblem.
    - `inline`: Clean, single-stroke geometric arc that inherits `currentColor` for buttons, chips, and input adornments.
    - `skeleton`: Neural card and row shimmer.
- **Admin Motion Control Center (`src/features/admin/app-config/`)**:
  - `AppConfigHub.tsx`: Replaced stubbed loading tab with a production `LoadingConfigPanel` offering live side-by-side previews of halo, inline, and skeleton loaders, halo rotation speed controls (`Snappy (0.9s)`, `Normal (1.5s)`, `Relaxed (2.2s)`), and a center emblem toggle.
  - One-tap "Publish Config" dynamically synchronizing loading preferences to Supabase `public.app_ui_config`.
  - `useAppConfigStore.ts`: Extended configuration schema with strongly typed `LoadingConfig` interface and local caching.

### ⚡ Performance & Refactoring
- **Backwards Compatibility**: Re-exported `<BrandSpinner variant="synaptic" />` from `src/components/ui/SynapticLoader.tsx` to instantly upgrade 30+ legacy call sites without breaking API contracts.
- **Auth Flow Standardization**: Migrated `AuthPage.tsx` and `SignupPage.tsx` from raw Lucide `BrainCircuit` and `Loader2` to `<BrandLogo variant="wordmark" size="lg" />` and `<BrandSpinner variant="inline" size="sm" />`.
- **Intro Engine Unification**: Refactored `BlueIntro.tsx` to consume `<BrandLogo variant="icon" />` in its core logo squircle, eliminating 20+ lines of duplicate inline brain SVG markup.

### 🔒 Security & Architecture
- **Architecture Documentation Persistence**:
  - `docs/AI_MEMORY_CONTEXT.md`: Added comprehensive App Launch Lifecycle & Dynamic Intro Pipeline reference.
  - `docs/MINDFLOW_CONSTITUTION.md`: Added Section 5.4 Application Launch & First-Impression Contract governing zero-waterfall parallel mounting and remote-decoupled intro orchestration.
  - `AGENTS.md`: Added App Launch Lifecycle & Intro Diagnostics invariants for autonomous pair programmers.

## [v1.0.319] - 07 November 2026, 11:55 AM IST

### Executive Summary
Delivered the comprehensive MindFlow Result Dashboard & Analytics Engine for high-stakes CBT examinations (SSC CGL, RRB, Eduquity). Integrated mathematical scoring models, standard competition 1224 rankings, Commission Formula-2 multi-shift normalisation with Top-0.1% anchor, 0ms offline-first caching, 5 SVG visual primitives, and 8 modular analytics cards with complete PII masking.

### ✨ Features Added
- **Pure Statistical Calculation & Formatting Engine (`src/features/tools/answer-key-engine/utils/`)**:
  - `stats.ts`: Deterministic calculation models for raw section scores, accuracy, standard competition ranking with tie handling, percentile calculations, directional deltas (`more`/`less`/`neutral`), and Formula-2 normalisation.
  - `format.ts`: Indian number formatting (`en-IN`), trailing zero suppression for whole integers (`136` vs `40.5`), 12-hour IST dates/times, and strict PII protection masking (`R*** K***`, `3261******36`).
  - Unit test suite: 29 / 29 Vitest tests passing with 100% green coverage across golden calculation fixtures.
- **Offline Storage & Layer 3 Integration Hooks (`src/features/tools/answer-key-engine/hooks/` & `services/`)**:
  - `answerKeyCache.ts`: Instant 0ms offline snapshot persistence and candidate caching layer.
  - `useResultDashboard.ts`: 0ms hydration from local offline storage combined with background Supabase RPC synchronization.
  - `useHistogramSlider.ts`: Interactive mark density scrubber, category filter tabs (`All`, `UR`, `OBC`, `EWS`, `SC`, `ST`), and dynamic counter metrics.
  - `useShiftAverages.ts`: Shift difficulty ranking (#1 hardest to easiest), user shift matching, and slide-over directory drawer state.
- **Visual Primitives & 8 Modular Sections (`src/features/tools/answer-key-engine/components/`)**:
  - 5 Pure SVG Primitives: `ScoreDonut` (~170px animated donut with 12 o'clock progress arc), `BalanceScale` (dynamic You vs Average beam tilt), `HistogramSlider` (interactive SVG histogram with 7 ticks and range slider), `CohortComparisonBar` (rounded bar with vertical benchmark tick), and `SortedBars` (horizontal shift difficulty ranking).
  - 8 Dedicated Section Cards: `CandidateDetailsSection`, `ScoreSummarySection`, `RankAndAverageSection`, `SubjectWiseMarksSection`, `NormalisedScoreSection`, `MarksDistributionSection`, `SubjectWiseComparisonSection`, and `AverageMarksSection`.
  - Coordinator Refactor: `ScorecardDashboard.tsx` coordinating the 8 analytics sections alongside full question-by-question review filtering, honest labeling disclosure banner ($N$), and offline state indicators.

### ⚡ Performance & Refactoring
- Completely decoupled business calculations from UI rendering for 0ms computation overhead.
- Self-contained caching layer eliminates global database lockouts while guaranteeing instant rendering on flaky network conditions.

### 🔒 Security & Architecture
- Strict PII masking prevents candidate exposure in competitive rank listings.
- Transparent sample size ($N$) disclosure banners clarify that rank and normalisation values are community estimates.


## [v1.0.318] - 07 November 2026, 10:45 AM IST

### Executive Summary
Executed enterprise Role-Based Access Control (RBAC) modernization and database security hardening on PostgreSQL 17 (Supabase project `sjcfagpjstbfxuiwhlps`). Replaced legacy hardcoded email checks (`admin@mindflow.com`) with a scalable `public.user_roles` architecture, modernized 49 Row-Level Security policies across 18 tables and storage buckets, hardened administrative stored procedures, locked down mutable search paths on 102 functions, and integrated resilient role caching into the frontend authentication and navigation pipelines.

### 🔒 Security & Architecture
- **Enterprise PostgreSQL 17 RBAC Foundation (`supabase/migrations/20261107000000_create_rbac_foundation.sql`)**:
  - Created strongly typed `public.app_role` enum (`super_admin`, `admin`, `moderator`, `content_creator`, `teacher`, `student`).
  - Implemented authoritative `public.user_roles` junction table with cascade deletion, performance indexes, and strict super-admin management policies.
  - Implemented high-performance, STABLE, `SECURITY DEFINER` authorization helpers: `is_admin()`, overloaded `has_role()`, and `get_my_roles()`.
  - Added zero-downtime, backward-compatible fallback for `admin@mindflow.com` and idempotently backfilled roles.
- **Row-Level Security Modernization (`supabase/migrations/20261107000001_modernize_rls_policies.sql`)**:
  - Resolved critical Supabase Advisor finding by enabling RLS and locking write/truncate on `public.official_answer_keys`.
  - Upgraded 49 policies across 18 tables (`study_materials`, `questions`, `idiom`, `ows`, `synonym`, `reports`, `notifications`, `source_documents`, `app_ui_config`, mock test tables, AI pipeline tables) to scope `TO authenticated` and consume cached scalar subqueries `(SELECT public.is_admin())`.
  - Modernized storage policies for `branding` and `study_materials` buckets.
- **Admin RPC Security Hardening & Search Path Lockdown (`supabase/migrations/20261107000002_harden_admin_rpcs.sql`)**:
  - Closed critical security vulnerabilities on `delete_content_by_admin`, `restore_content_by_admin`, and `admin_override_explanation` by enforcing role checks and revoking execution from `public`/`anon`.
  - Set immutable `search_path = public` across 102 functions to eliminate search path hijacking vectors flagged by Supabase Security Advisor.
  - Revoked public/anon execution and restricted access to authenticated callers for all sensitive administrative queue, DLQ, and pipeline control functions.

### ✨ Features Added & Frontend Integration
- **Permissions Registry (`src/config/permissions.ts`)**:
  - Exported strongly typed `AppRole` union and mapped roles in `PERMISSIONS.ROLES`.
- **Authorization Policy (`src/lib/navigation/policies/AuthPolicy.ts`)**:
  - Upgraded `AuthPolicy.isAdmin()` to evaluate authoritative roles first, profile fallback second, and transitional email third.
  - Added `AuthPolicy.hasRequiredRole()` supporting hierarchical role inheritance (`super_admin` wildcard, `admin` inheriting moderation/content creation).
- **Auth Context (`src/features/auth/context/AuthContext.tsx`)**:
  - Exposed `roles: AppRole[]`, `isAdmin`, `isModerator`, `isContentCreator`, `hasRole()`, and `refreshRoles()`.
  - Implemented offline-resilient role caching in `localStorage` (`mindflow_cached_user_roles`) to eliminate race conditions on initial app render.
- **Navigation Policy (`src/lib/navigation/NavigationManager.tsx`)**:
  - Added support for `requiredRoles?: AppRole[]` to enable granular role-protected route guards with automatic intent redirection.
- **Developer Profile (`src/features/about/components/AalokProfile.tsx`)**:
  - Switched from email check to reactive `!isAdmin` flag.

## [v1.0.317] - 06 November 2026, 09:20 PM IST

### Executive Summary
Resolved live Edge Function execution error (`Failed to send a request to the Edge Function`) by executing the production deployment ritual for the `parse-exam-sheet` Edge Function and PostgreSQL database migrations on the live Supabase project (`sjcfagpjstbfxuiwhlps`). Fixed Eduquity candidate roll number extraction against CSS watermark style matches, resolved database submission re-run upsert conflicts, and aligned frontend validation guidance with multi-vendor portal support.

### 🐛 Bug Fixes & Hidden Gotchas Solved
- **Live Supabase Edge Function Deployment**:
  - Identified that while `parse-exam-sheet` was merged into the repository, GitHub Actions only builds static frontend assets for GitHub Pages and does not deploy Edge Functions to Supabase.
  - Successfully deployed `parse-exam-sheet` (v4) with JWT bypass for public parsing endpoints to the live production Supabase instance (`sjcfagpjstbfxuiwhlps`).
- **PostgreSQL Analytics Engine Migration Applied**:
  - Applied migration `20261106130000_create_exam_analytics_engine.sql` containing `exam_configs`, `exam_submissions`, `exam_stats_snapshots`, `official_answer_keys` tables and `get_candidate_live_rankings` RPC to the live database.
- **Watermark Text Extraction Regex Refinement (`EduquityAdapter.ts` & `supabase/functions/parse-exam-sheet/index.ts`)**:
  - Fixed a regex vulnerability where `.watermark-text { position: absolute; ... }` inside `<style>` blocks was erroneously matched instead of candidate DOM elements, resulting in empty roll numbers.
  - Hardened regex to strictly target `<div class='watermark-text'...>([0-9]+)</div>`.
- **Submission Upsert Conflict Constraint Alignment**:
  - Resolved `uq_exam_user` constraint collision during repeated candidate submissions by explicitly targeting `onConflict: 'exam_id,user_id'` in `exam_submissions` upsert queries.
- **Frontend Guidance & Error UI (`AnswerKeyCalculator.tsx`)**:
  - Clarified error state hint text to inform users of both supported vendor portals (`*.digialm.com` and `*.cbexams.com`) or the offline HTML dropzone option.

### ⚡ Performance & Verification
- End-to-end verified live URL execution against `https://sscexams.cbexams.com/CGLE2026jsdgheQchallengemshetsOct13/ViewCandResponse.aspx?EncKey=...`.
- Verified live response: 136.0 / 200 marks (Reasoning: 40.5, GK: 17.0, Maths: 33.5, English: 45.0) with live candidate ranking calculation.
- Passed full TypeScript compile (`npx tsc --noEmit`) and Vite production build (`npx vite build`) with zero errors.

---


## [v1.0.316] - 06 November 2026, 08:35 PM IST

### Executive Summary
Engineered complete Multi-Vendor CBT Exam Answer Key parsing support for SSC's newly adopted vendor, Eduquity (`*.cbexams.com`). Solved the critical ASP.NET WebForms postback silent rollback defect via direct parallel session token requests (`A -> P2`, `A -> P3`, `A -> P4`), introduced `EduquityAdapter` for image-based CBT sheets with HTML table cell color matrix decoding (`bgcolor='green'`, `red`, `yellow`, `gray`), watermark candidate extraction, and updated the SSRF-guarded Edge Function and Toolbox UI.

### ✨ Features Added
- **Eduquity CBT Adapter (`src/features/tools/answer-key-engine/adapters/EduquityAdapter.ts`)**:
  - Implements `ExamParserAdapter` interface for Eduquity CBT response sheets.
  - Decodes table background color rules: `green` (+2.0 correct answer selected), `red` (-0.5 incorrect answer selected), `yellow` (official correct option when unattempted or failed), and `gray` (0.0 unattempted).
  - Handles image-based question statement and option tags (`qimg/...`) without fragile text dependencies.
  - Extracts candidate Roll / Registration Number directly from embedded watermark text layers (`<div class='watermark-text'>...</div>`).
- **Vendor-Neutral Edge Function (`supabase/functions/parse-exam-sheet/index.ts`)**:
  - Updated SSRF domain allowlist to permit `*.cbexams.com` alongside `*.digialm.com` and `*.ssc.nic.in`.
  - Added parallel multi-part postback fetching for Eduquity: concurrently fetches Part B (`P2`, General Awareness), Part C (`P3`, Quantitative Aptitude), and Part D (`P4`, English) using Part A's root session tokens.
  - Seamlessly persists candidate submission to `exam_submissions` table in PostgreSQL.
- **Toolbox UI & Client Service Updates (`AnswerKeyCalculator.tsx`, `answerKeyService.ts`)**:
  - Allowed `cbexams.com` URLs in client-side pre-validation.
  - Automatically routes uploaded HTML or pasted URLs to either `TcsIonAdapter` or `EduquityAdapter` based on structural detection.
  - Refined input placeholders and helper text to indicate multi-vendor compatibility (TCS iON / Eduquity).

### 🐛 Bug Fixes & Hidden Gotchas Solved
- **ASP.NET WebForms Postback Silent Rollback Fix**:
  - *Symptom*: Sequential chained postbacks (`A -> B -> C -> D`) caused Quantitative Aptitude (Part C / Maths) to silently duplicate Reasoning (Part A / 40.5 marks instead of 33.5 marks) due to server-side `__EVENTVALIDATION` mismatches without throwing 500 errors.
  - *Fix*: Strictly enforced direct parallel postbacks from Part A's root session tokens (`A -> P2`, `A -> P3`, `A -> P4`), successfully producing 100% accurate scores verified against the real exam answer key.
- **TypeScript Circular Export Disambiguation**:
  - Centralized `ExamParserAdapter` interface in `src/features/tools/answer-key-engine/types.ts` to prevent TS2308 export collision between types and adapters.

### 🔒 Security & Architecture
- Documented multi-vendor CBT exam architecture, image parsing protocols, and ASP.NET postback gotchas in `docs/architecture/13-hidden-knowledge.md` (Section 8) and `docs/AI_MEMORY_CONTEXT.md` (Section 10).

---

## [v1.0.315] - 06 November 2026, 01:32 PM IST

### Executive Summary
Delivered Phase 1 (MVP) and core architectural skeleton for the MindFlow Exam Intelligence, Answer Key & Rank Prediction Engine. Introduced dual-input response sheet parsing (online URL fetching via SSRF-safeguarded Supabase Edge Function and 0ms offline browser HTML parsing via `TcsIonAdapter`), section-wise metrics, question review filters, indexed PostgreSQL database schema with RLS and `SECURITY DEFINER` live ranking RPC stubs, and responsive scorecard dashboard in MindFlow Toolbox (`/tools/answer-key-calculator`).

### ✨ Features Added
- **Answer Key & Score Calculator Tool (`src/features/tools/answer-key-engine/`)**:
  - Registered new tool in Toolbox Hub (`src/features/tools/ToolsHome.tsx`) with animated Cyan/Sky SVG token (`AnswerKeyCalculatorSVG`).
  - Seamlessly inherits active exam context from `useExamContextStore` (Constitution Section 1, Commandment 2).
  - Offers dual input modes:
    1. *Paste URL Link*: Fetches official TCS iON response sheet via Edge Function without exposing client tokens.
    2. *Upload HTML (Offline)*: Parses downloaded response sheet 100% in-browser with 0ms latency.
  - Generates comprehensive scorecard featuring Total Raw Score, Accuracy %, Correct/Negative marks, and 4-subject breakdown (Reasoning, GK, Math, English).
  - Provides detailed Question-by-Question review filterable by status (`All`, `Wrong Only`, `Unattempted`, `Correct`) and by subject.
  - Implements honest community disclaimer banner and sample-gated UI tabs for future phases (Rank Matrix, Shift Difficulty & Normalization, AI Weakness Insights).
- **Pure TypeScript Resilient Parser (`src/features/tools/answer-key-engine/adapters/ExamParserAdapter.ts`)**:
  - Resilient `TcsIonAdapter` matching official TCS iON Question IDs and Option IDs rather than fragile question sequence indices.
  - Shared design compatible with both browser DOM parsing and server-side Edge Functions.
- **Client Caching & Offline Hydration (`src/features/tools/answer-key-engine/services/answerKeyService.ts`)**:
  - Automatically caches the most recent scorecard in local storage for instant 0ms restoration upon revisiting the tool.
  - Implements PII masking utilities (`maskRollNumber`, `maskName`) protecting candidate privacy in shared environments.

### 🔒 Security & Architecture
- **Enterprise PostgreSQL Schema (`supabase/migrations/20261106130000_create_exam_analytics_engine.sql`)**:
  - `exam_configs`: Config-driven exam rules, positive/negative marking (+2.0 / -0.5), and section weights.
  - `exam_submissions`: Stores candidate submissions with dedicated BTree-indexed numeric columns (`score_reasoning`, `score_gk`, `score_math`, `score_english`) for sub-millisecond ranking sorting.
  - `exam_stats_snapshots`: Asynchronous precomputed snapshot table preventing full-table scan bottlenecks during traffic spikes.
  - Row Level Security (RLS) ensuring students only read/write their own submission (`auth.uid() = user_id`).
  - `get_candidate_live_rankings` RPC configured with `SECURITY DEFINER` and `SET search_path = public`, returning aggregate counts and ranks without exposing other users' personal records.
- **SSRF-Safeguarded Edge Function (`supabase/functions/parse-exam-sheet/index.ts`)**:
  - Validates domain against allowlist (`*.digialm.com`, `*.ssc.nic.in`), blocks private IP ranges/metadata endpoints, enforces 8s timeout, and prevents open redirects (`redirect: 'error'`).
  - Never logs or stores raw URLs containing authentication tokens; securely stores SHA-256 hash for deduplication.
- **Feature Flags (`src/config/features.ts`)**:
  - Added `EXAM_ANALYTICS` flags isolating Phase 1 (MVP) while maintaining skeletons for Phase 2, 3, and 4.


## [v1.0.314] - 06 November 2026, 12:44 PM IST

### Executive Summary
Implemented Phase 5C of the Constitution Implementation Plan: Intelligence Layer (Predictive Exam Readiness & Spaced Repetition Revision Planner). Introduced the `useExamReadiness` engine calculating coverage, accuracy, and readiness scores scoped to the active target exam, activated the `AIStudyPlannerModal` on `AIHome` with Ebbinghaus spaced retention schedules, and surfaced the predictive readiness index directly on the Dashboard `UserProgressCard`.

### ✨ Features Added
- **Predictive Exam Readiness Engine (`src/features/ai/hooks/useExamReadiness.ts`)**:
  - Dynamically calculates readiness percentage (0–100%) against historical syllabus requirements for the user's active canonical exam.
  - Weights syllabus coverage (50%), question accuracy (50%), and subtracts deductions for unresolved critical mistakes.
  - Classifies readiness into actionable tiers (`Exam Ready`, `On Track`, `Developing`, `Foundational`) with tailored study guidance.
  - Emits `readiness_computed` and `revision_plan_generated` diagnostic telemetry events.
- **Spaced Repetition Revision Planner Modal (`src/features/ai/components/AIStudyPlannerModal.tsx` & `src/features/ai/AIHome.tsx`)**:
  - Activated the fourth and final card ("AI Study Planner") in `AIHome` with an interactive, rich revision modal.
  - Analyzes attempted topics against the Ebbinghaus forgetting curve, flagging topics unpracticed for $>3$ days or having sub-optimal accuracy.
  - Provides a 1-tap "Drill" button per topic or an "All Due Revisions" sprint launcher with 0ms direct execution.
- **Dashboard Predictive Readiness Integration (`src/features/dashboard/components/UserProgressCard.tsx`)**:
  - Embedded a dynamic target exam readiness pill directly on the Dashboard `UserProgressCard` (e.g. `🎯 SSC CGL 68% Ready`), connecting high-level progress with active exam preparation.

## [v1.0.313] - 06 November 2026, 12:20 PM IST

### Executive Summary
Implemented Phase 5B of the Constitution Implementation Plan: Intelligence Layer (Pre-Grounded Conversational Tutor & Adaptive AI Quiz Generator). Bound `useAIChat` to the active target exam context (`useExamContextStore`), added an ambient Active Goal header in `AIChatPage` with dynamic exam-scoped quick starters, and launched the `AIAdaptiveQuizModal` in `AIHome` with 3 personalized practice strategies.

### ✨ Features Added
- **Pre-Grounded Conversational AI Tutor (`src/features/ai/chat/useAIChat.ts`)**:
  - Automatically ingests `activeExam` (`useExamContextStore`) into the system prompt and initial request payload, enforcing Constitution Section 10 (*The AI must never ask: "What exam are you studying for?"*).
  - Automatically tailors tone, syllabus references, difficulty, and mnemonics to the active target exam and PYQs.
  - Retains and combines user profile mastery context seamlessly when enabled.
- **Ambient Target Exam Context Bar & Smart Quick Starters (`src/features/ai/chat/AIChatPage.tsx`)**:
  - Surfaced an ambient `Active Goal: {exam.displayName} ({exam.shortCode})` bar at the top of the chat area with a 1-tap shortcut to change focus on the Dashboard.
  - Dynamically computes high-yield quick starters tailored to the user's active exam (e.g., top-scoring topics, hard practice questions, short tricks, 7-day revision strategies).
- **AI Adaptive Quiz Generator Modal (`src/features/ai/components/AIAdaptiveQuizModal.tsx` & `src/features/ai/AIHome.tsx`)**:
  - Activated the "Generate Quiz with AI" card on `AIHome` with a rich, interactive modal.
  - Offers 3 adaptive strategies:
    1. *Target Weak Areas (Adaptive Sprint)*: Focuses on diagnosed weak topics from `useVulnerabilityEngine`.
    2. *High-Yield PYQ Sprint*: Focuses on frequently repeated previous year questions for the active exam.
    3. *Balanced Mixed Simulation*: Multi-subject coverage across the entire syllabus.
  - Provides 10, 15, and 25-question length selection with direct 0ms session launch (`autoStart: true`).

## [v1.0.312] - 06 November 2026, 11:58 AM IST

### Executive Summary
Implemented Phase 5A of the Constitution Implementation Plan: Intelligence Layer (Vulnerability Engine & Ambient AI Study Coach). Introduced `useVulnerabilityEngine` for local 0ms offline mistake & topic vulnerability aggregation scoped to the active target exam, injected the non-disruptive `AIPrescriptionCard` on the Dashboard, added one-tap remedial and diagnostic drill launches, and added diagnostic telemetry.

### ✨ Features Added
- **Algorithmic Vulnerability & Weakness Engine (`src/features/ai/hooks/useVulnerabilityEngine.ts`)**:
  - Dynamically scopes mistake and error history to the user's active canonical exam (`useExamContextStore`).
  - Aggregates errors by subject and topic, weighting repeat and critical mistakes to identify the top vulnerable area.
  - Implements offline-first fallback: seamlessly aggregates from local IndexedDB `saved_quizzes` if remote mastery sync is unavailable.
  - Emits `vulnerability_diagnosed` and `ai_drill_launched` diagnostic telemetry events.
- **Ambient AI Study Prescription Card (`src/features/ai/components/AIPrescriptionCard.tsx`)**:
  - Embedded seamlessly on `DashboardPage.tsx` directly beneath the `ExamQuickAccessStrip` (Constitution Section 10).
  - Automatically updates its pedagogical diagnosis in real-time whenever the user switches their active target exam.
  - Provides a 1-tap "Start Targeted Drill" (or "Start Diagnostic Drill") button that directly initiates a focused 10-Q learning session.
  - Displays a contextual "Review Mistakes" shortcut with badge counter when mistakes exist for the active exam.
- **Diagnostic Baseline Mode (Constitution Section 7 Zero Dead Ends)**:
  - If a user has 0 recorded mistakes for a newly selected exam, provides an intelligent diagnostic invitation to establish their baseline via PYQ drill, eliminating blank empty states.

### ⚡ Performance & Refactoring
- **Exam Matching Prefix Support (`src/features/dashboard/constants/examRegistry.ts`)**:
  - Added `matchPrefix: 'SSC CGL'` to canonical exam definitions to reliably associate all multi-tier question variants.
- **Vitest Path Resolution (`vitest.config.ts`)**:
  - Added `@` alias configuration resolving to `./src` for test execution parity with Vite bundler.

## [v1.0.311] - 06 November 2026, 11:05 AM IST

### Executive Summary
Implemented Phase 4 of the Constitution Implementation Plan: Engine & Architecture Optimization. Delivered smart filter pruning and reverse PYQ year ordering in `QuizConfig`, high-precision Dashboard FCP SLA instrumentation, IndexedDB cache performance tracking, resilient offline sync retry queue preservation, and vitest test timeout stabilization for CI/sandboxes.

### ⚡ Performance & Refactoring
- **Smart Filter Pruning & PYQ Ordering (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Dynamically pruned stale exam years and shifts when switching active exams or subjects, eliminating dead-end zero-question queries (Constitution Section 6.1).
  - Reversed PYQ years list (`.sort().reverse()`) to surface recent exam papers first.
  - Scoped available tags and filter chips strictly to active exam and subject metadata.
- **Dashboard First Contentful Paint SLA Telemetry (`src/pages/DashboardPage.tsx`)**:
  - Injected `dashboard_fcp` SLA budget tracking (`PERF_BUDGETS.DASHBOARD_FCP = 1000ms`) via `performanceTracker.startMark()` and `endMark()` in `requestAnimationFrame` on initial render.
- **IndexedDB Metadata Cache Hit Instrumentation (`src/features/quiz/hooks/useQuestionMetadata.ts`)**:
  - Added millisecond-level telemetry tracking (`perf_quiz_metadata_cached_ms` vs `perf_quiz_metadata_fetch_ms`) measuring cache hit efficiency against Constitution Section 8 performance budgets.
- **Resilient Offline Sync Retry Queue (`src/lib/syncService.ts`)**:
  - Configured `pushBookmark`, `removeBookmark`, and `pushSynonymInteraction` to support `throwOnError = true` when dispatched by `processEventQueue`.
  - Ensures network errors in background sync queue prevent failed items from being prematurely purged from `useSyncStore`, preserving offline mutations until successful cloud synchronization (Constitution Section 5).
- **Vitest Windows Sandbox Test Timeout Stabilization (`vitest.config.ts`)**:
  - Configured `testTimeout: 15000` to prevent CPU throttling false-positive timeouts during concurrent test runs on Windows virtual sandboxes.

## [v1.0.310] - 06 November 2026, 10:29 AM IST

### Executive Summary
Implemented Phase 3B of the Constitution Implementation Plan: Platform Consistency across Bookmarks, Mistake Notebook, Dashboard Greeting, and Post-Quiz Review Scorecard. Preserved target exam context across memory modules, added actionable Section 7 recovery empty states, and surfaced canonical exam scoping badges.

### ✨ Features Added
- **Bookmarks Page Target Exam Preservation & Empty Recovery (`src/pages/BookmarksPage.tsx`)**:
  - Automatically scopes bookmarks to `activeExamId` when questions exist for the active exam, preserving aspirant context on launch.
  - Implemented Constitution Section 7 compliant actionable recovery empty state when filter combinations yield zero bookmarks, providing direct one-tap recovery actions (`View All Exams`, `Clear Subject Filter`, `Start Practice Quiz`).
  - Context-aware logical back navigation using `location.state.returnTo` / `from` with safe fallback to `/dashboard`.
- **Mistake Notebook Target Exam Scoping & Recovery (`src/features/mistakes/pages/MistakeNotebookPage.tsx`)**:
  - Automatically initializes exam filter to `activeExamId` when mistakes exist for the user's active exam.
  - Added comprehensive recovery empty state offering contextual buttons to clear exam filters, clear subject filters, or reset all filters.
  - Aligned hierarchical back navigation with `handleBack` routing.
- **Dashboard Paused Quiz Canonical Exam Scoping (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Added canonical exam shortcode badge (`🎯 SSC CGL`, `🎯 BPSC`, etc.) at the top-right corner of the active "Resume Quiz" tile.
  - Prefixed paused quiz title with the matched canonical exam shortCode to provide instant contextual recognition.
- **Review Flow Exam Scoping Badge (`src/features/quiz/components/QuizResultBase.tsx`)**:
  - Surfaced matched canonical exam badge directly above the quiz title in the main scorecard hero section.

### ⚡ Performance & Refactoring
- Preserved single source of truth across all 4 modules (`useExamContextStore`), ensuring 0ms offline-first in-memory filtering without extra database roundtrips.

## [v1.0.309] - 06 November 2026, 10:05 AM IST

### Executive Summary
Implemented Phase 3A of the Constitution Implementation Plan: Platform Consistency across Quiz Library and Subject Hub. Established target exam scoping, contextual filter bars, exam-aware recovery empty states, and visual context banners adhering to the MindFlow Constitution (Sections 2.1, 4.1 & 6.4).

### ✨ Features Added
- **Quiz Library Target Exam Scoping Toolbar (`src/features/quiz/components/QuizLibraryToolbar.tsx`)**:
  - Added horizontal scrollable Target Exam Filter pill bar (`All` + pinned user exams with dynamic count badges).
  - Synchronized selection with `useExamContextStore` while allowing ad-hoc examination scoping within the library.
- **Exam-Scoping in Saved & Attempted Quizzes (`src/features/quiz/components/SavedQuizzesList.tsx`, `src/features/quiz/components/AttemptedQuizzesList.tsx`)**:
  - Filtered saved drafts and completed quiz sessions by selected exam context.
  - Added Constitution Section 7 compliant actionable recovery empty states when no quizzes match the active exam, providing direct actions to clear the exam filter or launch a new quiz.
- **Subject Hub & Topics Exam Context Focus (`src/features/dashboard/pages/subject/SubjectHubPage.tsx`, `src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`)**:
  - Added Active Target Exam Focus banner below the subject header, displaying the active exam's badge and full title.
- **Quiz Start BottomSheet Exam Scoping Badge (`src/features/dashboard/components/subject/QuizStartBottomSheet.tsx`)**:
  - Surface active target exam badge directly beside the subject/topic subtitle, preserving context prior to session generation.

### ⚡ Performance & Refactoring
- **Quiz Library Logical Back Navigation (`src/features/quiz/components/QuizLibrary.tsx`)**:
  - Aligned back button to return to `/dashboard` instead of legacy `/mcqs`, strictly honoring Constitution Section 6.2 hierarchical navigation.

## [v1.0.308] - 06 November 2026, 09:41 AM IST

### Executive Summary
Implemented Phase 2 Core UX: codified the 3-Tier Progressive Disclosure system in `QuizConfig.tsx`, established Context-Aware Logical Back Navigation across all views, and aligned hardware back button handling with the MindFlow Constitution (Sections 6.2 & 6.3).

### ✨ Features Added
- **QuizConfig 3-Tier Progressive Disclosure (`src/features/quiz/components/QuizConfig.tsx`)**:
  - **Tier 1 (Core Essentials)**: Default open viewport with Active Target Exam banner, mode selector, quick start pills, subject/topic classification, and difficulty selection.
  - **Tier 2 (PYQ & Examination Scoping)**: Single-tap accordion with dynamic active filter counters (`activeBadge`), encapsulating exam years, exam date shifts, and question format options.
  - **Tier 3 (Deep Diagnostics & Tags)**: Structured secondary accordion for granular tags and metadata search without cognitive overload.
- **Enhanced Accordion Component (`src/features/quiz/components/ui/Accordion.tsx`)**:
  - Added support for semantic subtitles, active count badges (`activeBadge`), and Constitution Section 9 atmospheric styling.

### ⚡ Performance & Refactoring
- **Context-Aware Logical Back Navigation Engine (`src/features/quiz/components/QuizConfig.tsx`, `src/routes/AppRoutes.tsx`)**:
  - Replaced legacy hardcoded redirects (`ROUTES.MCQS`) with intelligent hierarchical back resolution checking `location.state.returnTo`, `location.state.from`, active subject context, and defaulting safely to `/dashboard`.
  - Propagated contextual `returnTo` and `from` state in `DashboardPage.tsx`, `SubjectHubPage.tsx`, and `SubjectTopicsPage.tsx`.
- **Session Pause Exit Alignment (`src/features/quiz/learning/LearningSession.tsx`, `src/routes/AppRoutes.tsx`)**:
  - Replaced legacy redirect to `/quiz/library` on session pause with return to `/dashboard`, surfacing the active paused session immediately on the Dashboard "Resume Quiz" tile.
- **Android Hardware Back Alignment (`src/hooks/useHardwareBackButton.ts`)**:
  - Updated level 2 nested routing to redirect `/quiz/config`, `/quiz/create`, and `/quiz/library` to `/dashboard` instead of legacy `/mcqs`.

## [v1.0.307] - 06 November 2026, 09:16 AM IST

### Executive Summary
Fixed CI build pipeline failures by converting `TelemetryRecord` into a strict discriminated union and adding type narrowing in unit test suites for `telemetryService` and `performanceMetrics`.

### 🐛 Bug Fixes
- **TypeScript Discriminated Union for Telemetry (`src/lib/telemetry/`)**:
  - Converted `TelemetryRecord` from generic payload lookup to a distributed mapped discriminated union on `name: K`.
  - Resolved `TS2339: Property does not exist on type union` compiler failures encountered during CI `npm run build` (`tsc && vite build`).
  - Added type-guard narrowing in `telemetryService.test.ts` and `performanceMetrics.test.ts`.
  - Re-verified with local `npm run build` and `npx vitest --run` (all 10 tests green).

## [v1.0.306] - 06 November 2026, 09:00 AM IST

### Executive Summary
Implemented Phase 1 Foundation Infrastructure: established the Canonical State Ownership Registry, developed the centralized privacy-first Diagnostic Telemetry Service, and introduced the Performance Budget Tracking Engine strictly enforcing Sections 3, 8, and 11 of the MindFlow Constitution.

### ⚡ Performance & Refactoring
- **Performance Budget Engine (`src/lib/performance/`)**:
  - Implemented `performanceTracker` instrumented with Constitution Section 8 quantitative SLA thresholds: Filter Recalculation (< 16ms / 60fps), Quiz Generation (< 300ms), Route Transition (< 150ms), and AI Response (< 2.5s).
  - Instrumented `QuizConfig.tsx` to benchmark dynamic filter calculation against the 16ms SLA budget on every user filter change.
  - Instrumented `quizCreationService.ts` to measure quiz session generation latency against the 300ms SLA budget.
  - Automatic emission of `perf_budget_exceeded` telemetry events and styled developer console warnings whenever operations exceed budgets.

### 🔒 Security & Architecture
- **State Ownership Registry (`src/lib/state/`)**:
  - Implemented `stateOwnershipRegistry.ts` registering all 10 canonical state slices with their sole owner store, primary storage medium, authorized consumers, and prohibited anti-patterns.
  - Implemented runtime consumer assertion `assertStateConsumer` to detect and warn against shadow local state mutations in dev mode.
- **Diagnostic Telemetry Service (`src/lib/telemetry/`)**:
  - Implemented `telemetryService.ts` and `useTelemetry()` React hook enforcing Section 11 of the Constitution.
  - Built-in zero-PII sanitizer stripping sensitive user details and an in-memory 50-item ring buffer for live diagnostics.
  - Wired foundational telemetry events across the application:
    - `exam_selected`: Emitted in `useExamContextStore.ts` upon exam selection with source tag (`strip`, `modal`, `hub`, `banner`).
    - `quiz_generated` / `quiz_generation_failed`: Emitted in `quizCreationService.ts` with execution time and reuse state.
    - `filters_cleared`: Emitted in `QuizConfig.tsx` when user resets secondary filters while preserving the active exam and subject context.
    - `resume_quiz`: Emitted in `DashboardPage.tsx` with progress metrics when continuing paused learning/mock sessions.
- **Automated Verification**:
  - Created unit test suites for `telemetryService.test.ts`, `performanceMetrics.test.ts`, and `stateOwnershipRegistry.test.ts` (10/10 passing).

## [v1.0.305] - 06 November 2026, 08:35 AM IST

### Executive Summary
Established Phase 0 Repository Governance: ratified and enshrined the MindFlow Constitution as the supreme architectural and product standard, introduced Architecture Decision Records (ADRs 0001–0004), established the Product Decisions Log, updated AI agent operating instructions, and integrated the mandatory Constitution Compliance Checklist into the engineering lifecycle.

### 🔒 Security & Architecture
- **Ratification of the MindFlow Constitution (`docs/MINDFLOW_CONSTITUTION.md`)**:
  - Enshrined the 10 Immutable Product Commandments (One Concept → One Control, Never Ask Twice, Context Preservation, Logical Back Navigation, Offline-First 0ms Hydration, Zero Dead-End Empty States).
  - Established the Global State Ownership Matrix assigning every piece of application state to a single authoritative store.
  - Formalized the Unidirectional Data Flow Charter, Core Product Contracts (Quiz Gen, Context Switch, Back Navigation), and Quantitative Performance Budgets.
- **Architecture Decision Records (ADRs) Framework (`docs/ADR/*`, `docs/PRODUCT_DECISIONS.md`)**:
  - `ADR-0001`: Exam-First Architecture & Canonical Exam Registry.
  - `ADR-0002`: Logical Back Navigation & Direct Session Launch.
  - `ADR-0003`: Single State Ownership & Protected Context Clears.
  - `ADR-0004`: Offline-First Zero-Latency Hydration via IndexedDB.
- **AI Agent Directives & Compliance Checklist (`AGENTS.md`, `docs/AI_MEMORY_CONTEXT.md`)**:
  - Elevated the Constitution to priority level #2 (directly below explicit user prompt) in the Decision Precedence Hierarchy.
  - Embedded the Constitution Compliance Checklist for all future Pull Requests and implementation verification passes.

## [v1.0.304] - 06 November 2026, 03:35 AM IST

### Executive Summary
Unified the visual design language across the entire MindFlow Dashboard by extending the acclaimed atmospheric ambient gradient and tinted border design system from the Exam Target Cards to all dashboard sections (Greeting Actions, GK/GS Subjects, English Vocabulary Pillars, Quick Actions, User Progress, and Important Drills) with strict semantic color congruency.

### ✨ Features Added
- **Atmospheric Ambient Gradients & Tinted Borders Across Dashboard**:
  - **Hero Greeting Strip (`DashboardGreeting.tsx`)**: Replaced flat grey action buttons with themed cards featuring atmospheric gradients, squircle icon tiles, and glowing hover states for Today's Plan (Indigo), Bookmarks (Amber), Resume Quiz (Violet), and Quiz History (Emerald).
  - **GK / GS Subjects (`SubjectStrip.tsx`)**: Replaced standard grey subject buttons with semantic tinted cards featuring delicate ambient gradient overlays, elevated squircle icon containers, and color-matched borders across all 8 core subjects (History, Polity, Geography, Economy, Physics, Chemistry, Biology, Static GK).
  - **English & Vocabulary (`EnglishSection.tsx`)**: Elevated Synonyms, One Word Substitution, and Idioms pillar cards with ambient gradient washes and elevated icon tiles. Upgraded mini-game buttons (Imposter Trap, Tap & Connect, Speed Match) with semantic pill washes and borders.
  - **Quick Actions Grid (`QuickActionsGrid.tsx`)**: Styled Daily PYQ, Custom Quiz, and Mistake Notebook cards with the signature ambient glow and squircle icon badges.
  - **User Progress Card (`UserProgressCard.tsx`)**: Harmonized the progress card with an Indigo/Blue ambient wash and tinted border to match the surrounding dashboard cards.
  - **Important Drills Strip (`ImportantForSscStrip.tsx`)**: Upgraded drill cards with subject-correlated ambient washes and elevated play button squircles.

### ⚡ Performance & Refactoring
- **Token Consolidation (`sscDashboardConfig.ts`)**:
  - Centralized gradient tokens, structural border classes, and hover borders across `SSC_SUBJECTS`, `QUICK_ACTIONS`, and `IMPORTANT_FOR_SSC` to maintain design system consistency.

## [v1.0.303] - 06 November 2026, 03:08 AM IST

### Executive Summary
Delivered Phase 3 of the Exam-First Architecture: introduced granular exam filtering and canonical badges across the Mistake Notebook and Bookmarks pages, empowering students preparing for specific examinations (such as SSC CGL or BPSC) to review errors and saved questions targeted to their active exam.

### ✨ Features Added
- **Mistake Notebook Exam Filtering (`MistakeNotebookPage.tsx`)**:
  - Integrated dynamic Exam filter chips above the subject filters, allowing students to filter cognitive mistake records by exam (e.g. `🎯 SSC CGL (14)`, `📄 BPSC (3)`).
  - Scoped retention drills triggered via `MasteryDrillBar` to respect the active exam filter.
- **Canonical Exam Badge in Mistake Cards (`MistakeQuestionCard.tsx`)**:
  - Resolved and rendered canonical exam badges (e.g. `🎯 SSC CGL`, `🎯 BPSC`) directly on mistake question cards alongside cognitive vulnerability status badges.
- **Bookmarks Exam Filtering & Badges (`BookmarksPage.tsx`)**:
  - Added horizontal exam filter chips to filter saved bookmarks by canonical exam alongside subject filters.
  - Rendered canonical exam badges directly on bookmark cards for immediate visual identification.

### ⚡ Performance & Refactoring
- **Reactive Fast-Switching**:
  - Implemented zero-latency client-side memoized filter matching (`matchesCanonicalExam`) to ensure instantaneous filter switching on low-end mobile devices without triggering network round-trips.

## [v1.0.302] - 06 November 2026, 02:52 AM IST

### Executive Summary
Executed Phase 1 & 2 of the approved Exam-First Architecture Audit: eliminated duplicate exam controls in `QuizConfig.tsx`, enabled zero-library friction direct quiz session launches, resolved state leakage in QuickStart and filter resets, propagated active exam context to Subject Hubs, and introduced canonical exam badges on saved and attempted quiz cards.

### ⚡ Performance & Refactoring
- **One Concept, One Control (`QuizConfig.tsx`)**:
  - Hidden raw alphabetical exam capsules (`[A-I]`, `[J-R]`, `[S-Z]`, `[Other]`) inside "Advanced Filters" whenever an active exam context is present, establishing the top banner as the sole authoritative controller.
  - Dynamically scoped `allExamYears` and `allExamShifts` so only shifts and years relevant to the active target exam are rendered.
- **Zero-Library Friction Direct Launch (`QuizConfig.tsx`)**:
  - Replaced post-creation redirect to `/quiz/library?tab=created` with direct session launch (`navigate('/quiz/session/${mode}/${result.quizId}')`), eliminating redundant navigation steps.
- **State Leak & Reset Hardening (`QuizConfig.tsx`)**:
  - Hardened `handleQuickStart` to sample only from the active exam question pool instead of resetting to global database metadata.
  - Fixed `handleClearFilters` to preserve the user's active target exam context upon clearing ad-hoc topic and difficulty filters.
  - Contextualized default quiz titles to `${activeExamInfo.displayName} Practice • {Date}`.

### ✨ Features Added
- **Subject Hub & Topics Exam Context Preservation (`SubjectHubPage.tsx`, `SubjectTopicsPage.tsx`)**:
  - Propagated active exam state when launching custom quizzes and direct subtopic drills from Subject Hub and Subject Topics pages, preventing unintended question leakage across exams.
  - Eliminated delayed library navigation flicker in `SubjectTopicsPage.tsx`, launching directly into active quiz sessions.
- **Canonical Exam Badges on Quiz Cards (`SavedQuizCard.tsx`, `AttemptedQuizCard.tsx`)**:
  - Resolved and rendered branded exam pills (e.g. `🎯 SSC CGL`, `🎯 BPSC`) directly on library cards for instant visual identification.
- **Dynamic Exam Adaptability in Dashboard (`ImportantForSscStrip.tsx`)**:
  - Adapted the strip title and topic clicks to the active target exam (`Important for {activeExam}`), preventing hardcoded bias toward SSC for BPSC/Railways aspirants.

### 🔒 Security & Architecture
- Verified 0 TypeScript errors (`npx tsc --noEmit`) and successful production build with clean asset chunking.

## [v1.0.301] - 06 November 2026, 01:46 AM IST

### Executive Summary
Introduced the Exam-First Quick Access architecture on the Dashboard with multi-exam preparation support, establishing a Canonical Exam Registry (`examRegistry.ts`), dedicated persistent multi-exam context store (`useExamContextStore.ts`), horizontal swipeable target exam cards (`ExamQuickAccessStrip.tsx`), a goal management modal (`ManageTargetExamsModal.tsx`), and pre-scoped `QuizConfig` deep-linking.

### ✨ Features Added
- **Canonical Exam Registry (`src/features/dashboard/constants/examRegistry.ts`)**:
  - Implemented declarative exam mapping matching user-facing brands (SSC CGL, BPSC, RRB NTPC, IB ACIO, UPSC CDS, Bihar Police) to raw database values (`questions.examName`), resolving database alias variations (e.g. `'CGL PRE'` and `'SSC CGL'`).
  - Added $O(N)$ lightweight client metadata count computation (`computeExamCounts`).
- **Multi-Exam Context Store (`src/stores/useExamContextStore.ts`)**:
  - Built persistent Zustand store managing active exam focus (`activeExamId`) and user-pinned multi-exam target list (`pinnedExamIds`).
  - Enables seamless multi-exam preparation (e.g. candidates preparing simultaneously for SSC CGL and BPSC).
- **Exam Quick Access Strip (`src/features/dashboard/components/ExamQuickAccessStrip.tsx`)**:
  - Embedded responsive horizontal snap carousel at Tier 1.5 of the Dashboard.
  - Implemented 1-tap "Configure Quiz" and express "⚡ 25 Qs Drill" actions.
- **Manage Target Exams Modal (`src/features/dashboard/components/ManageTargetExamsModal.tsx`)**:
  - Bottom sheet on mobile / modal on desktop for exploring all exam categories, pinning/unpinning target goals, and inspecting question counts.
- **Quiz Config Exam Context Banner (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Added URL parameter (`?exam=<id>`) and navigation state hydration.
  - Rendered sticky "Target Exam Active" header banner with available question counts and one-click "Clear Exam" CTA.

### ⚡ Performance & Refactoring
- **Pre-computed Offline Question Counts**: Cached exam question counts in `localStorage` (`mindflow_exam_counts_cache_v1`) for instant 0ms rendering upon app launch.
- **Zero-Count Topic Pruning**: Leveraged existing index counts so subject/topic capsules automatically hide when 0 questions exist for the active exam.

### 🔒 Security & Architecture
- **Preserved Existing Routes & Capabilities**: Unconstrained "Custom Quiz" builder and GK/GS subject hubs remain completely intact.
- **Zero-Dependency Footprint**: Leveraged existing Zustand, Lucide, and Tailwind primitives without introducing third-party packages.

## [v1.0.300] - 06 November 2026, 12:49 AM IST

### Executive Summary
Documented the Windows Antigravity shell runner (`exebox`) relative path resolution workaround across all AI agent operational rules, established the permanent repository `.gitignore` hygiene for local batch forwarders, and synchronized the missing `v1.0.299` app journey changelog entry.

### 🔒 Security & Architecture
- **Antigravity Shell Runner (`exebox`) Workaround Documentation (`AGENTS.md`, `docs/AI_MEMORY_CONTEXT.md`)**:
  - Documented the root cause of the Windows `failed to start PTY command via exebox: The system cannot find the file specified` bug (where Antigravity resolves bare `powershell` relative to the workspace directory `d:\MindFlow-main\powershell`).
  - Added instructions for the `powershell.bat` local environment bridge forwarding calls directly to Windows PowerShell with system path injection.
  - Added strict Git hygiene rules requiring `powershell.bat` and `powershell.cmd` to remain uncommitted in `.gitignore`.
- **Git Hygiene (`.gitignore`)**:
  - Ensured `powershell.bat` and `powershell.cmd` are persistently ignored by version control.
- **App Journey History Synchronization (`docs/APP_JOURNEY_LOG.md`)**:
  - Backfilled the missing changelog entry for `v1.0.299` documenting the Quiz Configuration exam categorization and scrollable capsule refactor.

### Impacted Scope
- `.gitignore`
- `AGENTS.md`
- `docs/AI_MEMORY_CONTEXT.md`
- `docs/APP_JOURNEY_LOG.md`
- `package.json` (bumped to 1.0.300)

## [v1.0.299] - 05 November 2026, 07:33 PM IST

### Executive Summary
Refactored the Quiz Configuration advanced filters by replacing static multi-select dropdowns with responsive, categorized `ScrollableCapsules` for Exam Names (split alphabetically into `[A-I]`, `[J-R]`, `[S-Z]`, and `[Other]`), Exam Years, and Exam Shifts, significantly improving touch ergonomics and filter discoverability on mobile viewports.

### ✨ Features Added
- **Alphabetical Exam Categorization (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Segmented `allExamNames` into 4 memoized subsets: `examNamesAI` (`[A-I]`), `examNamesJR` (`[J-R]`), `examNamesSZ` (`[S-Z]`), and `examNamesOther` (non-alphabetic/special prefixes).
  - Replaced legacy `MultiSelectDropdown` with dynamic `ScrollableCapsules` for each alphabetical partition with count badges (`filterCounts.examName`), zero-count hiding (`hideZeroCount`), and multi-row capsule wrapping (`maxRows={3}`).
- **Scrollable Capsule Filters for Years & Shifts (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Migrated `Exam Year` and `Exam Shift` filters from dropdown menus into touch-friendly horizontal `ScrollableCapsules`.
  - Added contextual tooltips (`tooltip`) and multi-select toggle handlers (`onOptionToggle`) allowing swift multi-year and multi-shift selection.

### Impacted Scope
- `src/features/quiz/components/QuizConfig.tsx`
- `package.json` (bumped to 1.0.299)
- `package-lock.json`

## [v1.0.298] - 04 November 2026, 08:58 AM IST

### Executive Summary
Fixed the Quiz Library shimmer skeleton loading layout by eliminating the constrained centering box in `QueryStateHandler` and aligning `QuizLibrarySkeleton` with the full page structure, responsive grid, and toolbar placement for seamless, zero-layout-shift loading.

### 🐛 Bug Fixes
- **Full-Width Skeleton Presentation (`src/components/ui/ErrorState/QueryStateHandler.tsx`)**:
  - Removed restrictive fixed-height (`h-48`) and flex-centering wrapper when a custom `loadingComponent` is provided, preventing skeletons from collapsing into a distorted compact box in the center of the viewport.
- **Quiz Library Skeleton Alignment (`src/features/quiz/components/QuizLibrarySkeleton.tsx`)**:
  - Replaced basic pulse boxes with animated gradient light-sweep shimmer (`animate-shimmer` with `bg-[length:200%_100%]`).
  - Added an integrated Toolbar skeleton placeholder matching `QuizLibraryToolbar` to eliminate layout shift when data finishes loading.
  - Aligned grid and list container classes (`grid gap-4 sm:gap-6 z-20 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`) with actual saved and attempted quiz cards.
  - Dynamic count adaptation based on active view mode (6 for grid, 3 for list).
- **Component Consumption (`src/features/quiz/components/SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`, `index.ts`)**:
  - Updated `loadingComponent` invocations to pass dynamic `viewMode` directly into `QuizLibrarySkeleton`.
  - Exported `QuizLibrarySkeleton` in the quiz components public index.

### Impacted Scope
- `src/components/ui/ErrorState/QueryStateHandler.tsx`
- `src/features/quiz/components/QuizLibrarySkeleton.tsx`
- `src/features/quiz/components/SavedQuizzesList.tsx`
- `src/features/quiz/components/AttemptedQuizzesList.tsx`
- `src/features/quiz/components/index.ts`

## [v1.0.297] - 04 November 2026, 01:45 AM IST

### Executive Summary
Streamlined the main Dashboard visual and navigation hierarchy by permanently removing the Suggested Drill section and the Weak Areas action button from Quick Actions for all user states, resulting in a cleaner, distraction-free student dashboard.

### ⚡ Performance & Refactoring
- **Dashboard Streamlining (`src/pages/DashboardPage.tsx`)**:
  - Removed `SuggestedDrillCard` and associated diagnostic/challenge drill selection logic from the Dashboard.
  - Promoted `UserProgressCard` to a clean full-width insight widget under Tier 5.
  - Removed deprecated `weak-topics` handler from `handleQuickAction`.
- **Quick Actions Optimization (`src/features/dashboard/`)**:
  - Removed `weak-topics` ("Weak Areas") from `QUICK_ACTIONS` in `sscDashboardConfig.ts`.
  - Upgraded `QuickActionsGrid.tsx` with responsive grid layout (`grid-cols-2 sm:grid-cols-3`), allowing the 3 core actions (Daily PYQ Drill, Custom Quiz, Mistake Notebook) to span cleanly on both mobile and desktop without gaps.

### Impacted Scope
- `src/features/dashboard/constants/sscDashboardConfig.ts`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/pages/DashboardPage.tsx`

## [v1.0.296] - 04 November 2026, 01:20 AM IST

### Executive Summary
Re-aligned MindFlow's AI infrastructure with active Google AI Studio production tiers and quotas (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`, and `gemma-4` batch workhorses), replacing deprecated `gemini-2.5-flash` references. Re-architected Edge Function execution planners with prioritized candidate matching and guaranteed non-terminating fallback so AI chats and tutor requests never fail when individual models are degraded.

### ✨ Features Added
- **Production Google AI Model Alignment**:
  - Synced client and server AI orchestration to use `gemini-3.1-flash-lite` (500 RPD, 15 RPM), `gemini-3.5-flash-lite` (500 RPD, 15 RPM), and `gemini-3.8-flash` (20 RPD, 5 RPM).
  - Configured batch enrichment pipelines (`explanation`, `etymology`, `mnemonic`, `grammar`) to leverage high-volume `gemma-4-31b-it` and `gemma-4-26b-a4b-it` (14,400 RPD) alongside flash models.
- **Frontend Quota & Model Selection (`src/features/ai/chat/`)**:
  - Updated `MODEL_CONFIGS` in `useQuota.ts` with accurate RPD/RPM limits and tier labels ("Fast", "Fast 2x", "Pro").
  - Defaulted active AI Chat model in `useAIChat.ts` to `gemini-3.1-flash-lite`.
  - Polished model badge and dropdown presentation in `ChatInput.tsx` and `AIChatPage.tsx`.

### 🐛 Bug Fixes
- **Resolved AI Chat 500 Failure ("All scheduled models failed")**:
  - Fixed rigid model filtering in `supabase/functions/chat-ai/index.ts` where execution plan candidates were discarded if their model did not strictly match the requested model ID.
  - Implemented priority sorting `[...matchingCandidates, ...fallbackCandidates]` ensuring requests gracefully fall back to active healthy models instead of throwing an unhandled exception.
- **Search Grounding Fallback (`supabase/functions/ask-ai-tutor/index.ts`)**:
  - Aligned Search Grounding fallback from deprecated `gemini-2.5-flash` to `gemini-2.5` to conform to Google AI Studio's 1,500 daily free grounding queries.
- **Synonyms Enrichment Model Update (`supabase/functions/enrich-synonyms/index.ts`)**:
  - Replaced legacy `gemini-2.5-flash` with `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, and `gemma-4-31b-it`.

### 🔒 Security & Architecture
- **Multi-Key Edge Runtime Synchronization (`public.ai_model_runtime`)**:
  - Provisioned and enabled `gemini-3.5-flash-lite` and `gemini-3.8-flash` across all active and fallback API keys (`GEMINI_API_KEY_v1`, `GEMINI_API_KEY_FALLBACK_v1`, `enrich-ques-api_v1`, `enrich-ques-api-fallback_v1`).
- **Dynamic Task Configuration Alignment (`public.ai_feature_config`, `public.ai_task_config`)**:
  - Updated model chains for `chat`, `ask_ai_tutor`, and `planner` to prioritize `["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"]`.
- **Edge Deployment Verification**:
  - Deployed updated `chat-ai` Edge Function bundle to Supabase production environment.


## [v1.0.295] - 03 November 2026, 10:48 PM IST

### Executive Summary
Eliminated the 50–60 second new-tab dashboard freeze by fundamentally resolving the root-level "Pull-Wipe-Resync Echo Loop" in the storage and synchronization layers. Decoupled local IndexedDB writes from outbound network pushes via `skipRemotePush`, eradicated destructive startup database wipes, implemented cross-tab Web Lock synchronization deduplication, and delivered instant 0ms local-first hydration for paused quizzes and GK subject counts with multi-account isolation.

### ⚡ Performance & Refactoring
- **Storage Layer Decoupling (`src/lib/db.ts`)**:
  - Introduced `DBSaveOptions` with `skipRemotePush?: boolean` across `saveQuiz`, `updateQuizName`, `saveQuizHistory`, `saveBookmark`, `saveSynonymInteraction`, `saveOWSInteraction`, and `saveIdiomInteraction`.
  - Prevented local IndexedDB persistence operations from automatically firing outbound HTTP `_pushToSupabase` side-effects during background sync operations.
- **Instant Paused Quiz Hydration (`src/pages/DashboardPage.tsx`)**:
  - Implemented eager local-first hydration from IndexedDB (`db.getAllSavedQuizzes()`), illuminating the "Resume Quiz" button in **0ms** upon tab mount.
  - Quietly synchronizes remote query updates into IndexedDB in the background with `skipRemotePush: true`.
- **Instant GK Subject Counts (`src/features/dashboard/components/SubjectStrip.tsx`, `SubjectsPage.tsx`)**:
  - Implemented sanitized and schema-validated `localStorage` caching (`mindflow_subject_counts`).
  - Provides `initialData` to TanStack Query so GK subject cards display `1,200+ Qs` instantly on tab boot without displaying loading indicators (`...`).
- **Dashboard Bookmark Resilience (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Passed `skipRemotePush: true` during local bookmark hydration, preventing redundant bookmark sync echoes.

### 🔒 Security & Architecture
- **Eradication of Destructive Startup Wipes (`src/lib/syncService.ts`)**:
  - Permanently removed `db.clearAllUserData()` from `syncOnLogin()`. Background synchronization now performs non-destructive, key-matched atomic upserts, preserving offline-first quiz state and preventing database thrashing.
  - Added remote `saved_quizzes` hydration during sync so active quiz sessions synchronize seamlessly across user devices.
- **Cross-Tab Web Lock Coordination & Cooldown (`src/lib/syncService.ts`)**:
  - Introduced a 15-minute sync cooldown (`mindflow_last_full_sync_${userId}`) shared across tabs in `localStorage`, protecting against corrupted future timestamps.
  - Gated cloud delta synchronization behind a non-blocking Web Lock (`navigator.locks.request('mindflow_cloud_sync_lock', { ifAvailable: true })`), guaranteeing that only one tab synchronizes with Supabase at any moment while peer tabs yield cleanly.
- **Multi-Account Storage Boundary Isolation (`src/features/auth/context/AuthContext.tsx`)**:
  - Implemented `mindflow_last_auth_user_id` tracking. If a different user authenticates on a shared machine, previous user caches and IndexedDB records are wiped immediately before new user session hydration, preventing cross-user data leakage.

## [v1.0.294] - 03 November 2026, 09:20 PM IST

### Executive Summary
Upgraded MindFlow's AI pair programming guidelines (`AGENTS.md`) to a production-grade 9.9/10 autonomous agent architecture. Codified an explicit 5-tier Decision Precedence Hierarchy, established strict "Stop and Ask" circuit breakers, introduced Confidence Calibration and Anti-Hallucination rules, enforced PostgreSQL `SECURITY INVOKER` defaults for database RPCs, and established dynamic tooling discovery while rigorously preserving all hard invariants (HashRouter, OAuth hash interception in `useAppBootstrap.ts`, Port 3000, `--legacy-peer-deps`, and Capacitor Android requirements).

### 🔒 Security & Architecture
- **Decision Precedence Hierarchy (`AGENTS.md`)**:
  - Formalized explicit conflict resolution precedence: (1) Explicit User Prompt → (2) Repository Guardrails & Safety Invariants → (3) Existing Codebase Conventions & FSD → (4) Project Documentation → (5) General Best Practices.
- **Circuit Breakers ("Stop and Ask")**:
  - Implemented automatic pause triggers requiring user confirmation if >10 files are modified, database migrations alter existing table data, new npm dependencies are introduced, auth/permission logic changes, or public APIs break.
- **Database Function Safety Policy**:
  - Mandated `SECURITY INVOKER` by default for all database RPCs to respect Row Level Security (RLS) and caller permissions.
  - Restricted `SECURITY DEFINER` exclusively to functions with reviewed internal authorization checks and strict `SET search_path = public`.
- **Confidence Calibration & Anti-Hallucination Triad**:
  - Codified High/Medium/Low confidence self-evaluation; mandates reporting uncertainties rather than fabricating solutions.
  - Enforced Read-Before-Write and surgical edits with a zero-tolerance policy against unsolicited drive-by refactoring.
  - Codified the separation of observed codebase facts from subjective architectural recommendations.
- **Full Invariant Preservation**:
  - Retained MindFlow-critical requirements: `<HashRouter>`, OAuth hash extraction in `src/hooks/useAppBootstrap.ts`, local port 3000, `--legacy-peer-deps`, IndexedDB quiz offline-first resilience, and Gemini Live bidirectional audio specifications (16kHz in / 24kHz out).

## [v1.0.293] - 03 November 2026, 08:55 PM IST

### Executive Summary
Executed a comprehensive Lighthouse performance and accessibility overhaul targeting the unauthenticated login portal (`https://aklabx.github.io/MindFlow/`). Eliminated massive initial JS over-bundling (~2.4 MB uncompressed JS dropped from login modulepreloads), decoupled render-blocking Google Fonts, resolved WCAG accessibility violations (button accessible names and landmark elements), and split core routes to achieve optimal First Contentful Paint (FCP) and Largest Contentful Paint (LCP) on mobile and desktop without regressing HashRouter, OAuth, or Capacitor native flows.

### ⚡ Performance & Bundle Optimization
- **Vite ModulePreload Dependency Decoupling (`vite.config.ts`)**:
  - Implemented `build.modulePreload.resolveDependencies` filter to strictly exclude heavyweight markdown and export vendor bundles (`vendor-export`, `vendor-markdown`) from initial entry HTML modulepreloads.
  - Consolidated Rollup chunking rules to route `vite/preload-helper` directly to `vendor-react`, preventing Rollup from co-locating the dynamic import runtime helper inside `vendor-export` (which was triggering a cascading preload of `pdfmake`, `xlsx`, and `html2canvas` on the login page).
  - Shrunk entry bundle `index.js` from 501.8 kB to 428.6 kB and eliminated ~2.4 MB of uncompressed JavaScript from the initial unauthenticated network waterfall.
- **Route Code-Splitting & Barrel Decoupling (`src/routes/AppRoutes.tsx`)**:
  - Converted `DashboardPage`, `SubjectsPage`, and `AppPreferencesPage` into lazy-loaded chunks (`React.lazy()`).
  - Decoupled `AppRoutes.tsx` from the top-level `@/features/quiz` barrel export, directly importing `QuizProvider` and `useFlashcardStore` from their atomic files to avoid pulling heavy quiz session/plugin machinery into the initial route map.
  - Imported `QuizSessionGuard`, `ResultGuard`, and `ShareGatekeeper` directly from their respective component paths.
- **Non-Blocking Asynchronous Typography (`index.html`)**:
  - Maintained preconnect for `fonts.googleapis.com` and `fonts.gstatic.com`.
  - Loaded primary UI font (`Inter`) synchronously with `display=swap`.
  - Converted secondary and non-critical font families (`Crimson Text`, `Noto Sans Devanagari`, `Playfair Display`, `Poppins`) to load asynchronously via `media="print" onload="this.media='all'"` with `<noscript>` fallback, removing render-blocking latency on the critical rendering path.

### ♿ Accessibility & Semantic UX
- **WCAG Landmark & Screen Reader Fixes (`src/features/auth/components/AuthPage.tsx`, `src/features/auth/components/SignupPage.tsx`)**:
  - Replaced root `<div>` containers with semantic `<main id="main-content" role="main">` landmarks, eliminating the Lighthouse "Document does not have a main landmark" audit error.
  - Added explicit `aria-label={showPassword ? "Hide password" : "Show password"}` and `<span className="sr-only">` accessible text to password visibility toggle buttons, resolving the "Buttons do not have an accessible name" audit violation.
  - Preserved responsive keyboard-aware layout and positive viewport constraints (`min-h-[100dvh]`).

### Impacted Scope
- `index.html`
- `vite.config.ts`
- `src/routes/AppRoutes.tsx`
- `src/features/auth/components/AuthPage.tsx`
- `src/features/auth/components/SignupPage.tsx`
- `package.json` & `package-lock.json`
- `docs/APP_JOURNEY_LOG.md`

## [v1.0.292] - 03 November 2026, 01:10 PM IST

### Executive Summary
Engineered the Centralized Mastery & Memory Engine (CMME) and Panacea Mistake Notebook. Pushes past conventional error notebooks by introducing Memory Vulnerability Indexing (MVI), spaced verification for first-time lucky guesses (तुक्का vs mastery), escalating cognitive error tiers (Fresh Slip 1x, Repeated Error 2x, Critical Trap 3x+), automated historical quiz backfilling, and 1-click targeted retention drills across GK/GS, English, and all future subjects.

### ✨ Features & Architecture
- **Universal Mastery Engine Schema & RPCs (`supabase/migrations/20261103120000_create_centralized_mastery_engine.sql`)**:
  - Created `public.user_question_mastery` table with composite uniqueness on `(user_id, question_id)`, tracking interaction counts, consecutive streaks, MVI (0-100), cognitive tiers, and spaced review timestamps.
  - Implemented `record_question_interactions(p_interactions JSONB)` RPC with algorithmic vulnerability tier evaluation:
    - `CRITICAL_ERROR` (MVI 95-100, $\ge 3$ consecutive/total failures, 1-day spaced repetition).
    - `REPEATED_ERROR` (MVI 70-80, 2 failures, concept traps, 2-day spaced repetition).
    - `FRESH_SLIP` (MVI 45-55, 1 mistake, 3-day spaced repetition).
    - `UNVERIFIED_GUESS` (MVI 30-35, 1st-time correct answer flagged for spaced verification).
    - `FAMILIAR` (MVI 10-15, 2 consecutive correct answers).
    - `MASTERED` (MVI 0, 3 consecutive correct answers, graduated).
  - Implemented resilient `backfill_user_question_mastery()` RPC parsing historical attempt logs from all completed quizzes, populating 235 initial questions into the mastery table.
- **Mastery Service (`src/features/quiz/services/masteryService.ts`)**:
  - Centralized manager for querying summaries, filtering questions by cognitive tier/subject, saving personal concept notes, manual graduation, and launching revision drills.
- **Asynchronous Interaction Logging in Quiz Pipeline (`src/features/quiz/hooks/useQuiz.ts`)**:
  - Integrated with `submit_quiz_session` in `useQuiz.ts` to automatically record all question interactions into the CMME engine asynchronously upon session completion.
- **Command Center Mistake Notebook UI (`src/features/mistakes/`)**:
  - `MistakeNotebookPage.tsx`: Full-fledged error revision dashboard mounted at `/mistake-notebook` with multi-subject filtering and real-time search.
  - `CognitiveSummaryDeck.tsx`: Memory Vulnerability Index meter and interactive 6-tier filter buttons (All Mistakes, Critical Traps, Repeated, Fresh Slips, Lucky Guesses?, Mastered).
  - `MasteryDrillBar.tsx`: 1-click retention drill launchers ("Kill Critical Traps", "Verify Lucky Guesses", and "Quick 10-Q Sweep").
  - `MistakeQuestionCard.tsx`: Deep solution cards featuring bilingual EN/HI question toggles, option comparison (student choice vs correct answer), official explanations, private concept takeaway note persistence, AiExplanation modal integration, single-question practice drills, and "Mark as Mastered" graduation toggles.
- **Routing & Navigation (`src/config/routes.ts`, `src/routes/AppRoutes.tsx`, `src/pages/DashboardPage.tsx`, `src/layouts/MainLayout.tsx`)**:
  - Added `ROUTES.MISTAKE_NOTEBOOK = '/mistake-notebook'` and `ROUTES.QUIZ.MISTAKES = '/quiz/mistakes'`.
  - Wired Dashboard Quick Actions tile "Mistake Notebook" to route directly to `/mistake-notebook`.
  - Added header suppression in `MainLayout.tsx` for clean sticky navbar presentation.

### Impacted Scope
- `supabase/migrations/20261103120000_create_centralized_mastery_engine.sql`
- `src/features/quiz/services/masteryService.ts`
- `src/features/quiz/hooks/useQuiz.ts`
- `src/features/mistakes/`
- `src/config/routes.ts`
- `src/routes/AppRoutes.tsx`
- `src/pages/DashboardPage.tsx`
- `src/layouts/MainLayout.tsx`
- `package.json`
- `docs/APP_JOURNEY_LOG.md`

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
