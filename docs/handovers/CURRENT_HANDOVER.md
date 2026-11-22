# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.370.1` (`package.json` SemVer: `1.0.370-1`, PR `#TBD`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`34/34` test files, `214/214` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `11/11` in `src/lib/fetchWithTimeout.test.ts`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5480` modules transformed, PWA precache `196` entries / `6635.12 KiB`)
- **Database & Registry Verification (`project_id: sjcfagpjstbfxuiwhlps`):**
  - Applied migration `supabase/migrations/20261122010000_standardize_assessment_nomenclature.sql`: non-destructively renamed Block A Preset Mock Tests (`exam_categories` $\rightarrow$ `mock_categories`, `test_series` $\rightarrow$ `mock_series`, `tests` $\rightarrow$ `mock_tests`, `user_test_attempts` $\rightarrow$ `mock_test_attempts`) and Block B Custom Student Quizzes (`saved_quizzes` $\rightarrow$ `quiz_sessions`, `bridge_saved_quiz_questions` $\rightarrow$ `quiz_session_questions`, `quiz_history` $\rightarrow$ `quiz_session_results`), added `COMMENT ON TABLE` across 18 tables, and atomically updated all 10 live PostgreSQL functions (plus `public.get_mock_test_leaderboard`) with locked `search_path` and `anon` execute revoked.
  - Verified live `pg_tables`, `pg_policies` (`14` policies intact), `pg_constraint` (`22` constraints intact), `pg_proc` (`0` stale table references across `public` functions), and `supabase_mcp.get_advisors(type="security")`.
  - Centralized all assessment table and RPC identifiers in `src/config/dbTables.ts` (`DB_TABLES` & `DB_RPCS`) and synced 25 frontend/test files while keeping local IndexedDB store names (`'saved_quizzes'`, `'quiz_history'`) untouched in `src/lib/db.ts` (`DEC-0004`, `DEC-0018`, `OLD-010`).
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 5 (`v1.0.371`) — Dedicated BPSC Prepared Mock Tests Page (Student Listing & Discovery)**

---

## 2. Workstation & Runtime Testing Rules

- **Deterministic Slot & Port Architecture:**
  - **Slot 1 (Anchor / Host):** Port `3000` (`http://localhost:3000/`) — Sole owner of `main`.
  - **Slot 2 (Worker 1):** Port `3001` (`http://localhost:3001/`) — Secondary session.
  - **Slot 3 (Worker 2):** Port `3002` (`http://localhost:3002/`) — Tertiary session.
- **Windows Command Runner Protocol:**
  - Use `npx.cmd` or `npm.cmd` on Windows shells to prevent PowerShell script execution policy errors.
  - Dev server startup: `npm.cmd run dev` (in Slot 1) or `npm.cmd run dev -- --port 3001` (in Worker 1).
- **Vite HMR Zero-Commit Live Preview:**
  - Vite hot-reloads edits on disk in milliseconds. AI agents and developers do NOT need to commit to git to preview or verify UI changes.
- **Android Native Feel Directives (Non-Negotiable):**
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (zero hover-only hidden action buttons), zero web-like layout bounce, `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.371`)

- **Target Milestone:** `v1.0.371` (`package.json` SemVer: `1.0.371`)
- **Target Branch:** `feat/v1.0.371-bpsc-prepared-mock-tests-page`
- **Blueprint Reference:** Gen 1B, **Step 5** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Build a dedicated, high-speed student-facing page for **Admin-Prepared BPSC Mock Tests** (and exam-aware canonical routing) powered by `DB_TABLES.MOCK` (`mock_categories`, `mock_series`, `mock_tests`), IndexedDB/SWR 0ms offline hydration, schedule-window enforcement, `>=44x44px` Android-native filter chips, and context-aware discovery shortcuts from Dashboard, MCQs Hub, and Mock Tests Home.
- **Exact Scope & Targets:**
  1. **Exam-Aware Mock Tests Listing API (`src/features/mock-tests/api/mockTestsApi.ts`):**
     - Add `fetchPreparedMockTestsByExam(examId)` using `DB_TABLES.MOCK.*` (`mock_categories`, `mock_series`, `mock_tests`), resolving canonical exam aliases (`getCanonicalExamById`, `resolveCanonicalExamNames`, `matchesCanonicalExam` in `src/features/dashboard/constants/examRegistry.ts`) across active categories, published series, and published tests filtered through `isTestWithinScheduleWindow()` (`DEC-0017`).
     - Add 0ms offline-first IndexedDB / SWR caching (`DEC-0004`) for active categories, published series, and exam-matched mock tests so repeat visits and offline transitions render instantly without blank spinners.
  2. **Dedicated BPSC & Exam-Aware Listing Page (`src/features/mock-tests/pages/ExamPreparedMockTestsPage.tsx`, `src/config/routes.ts`, `src/routes/AppRoutes.tsx`):**
     - Add `ROUTES.TEST_SERIES.BPSC` (`/mcqs/test-series/bpsc`) and `ROUTES.TEST_SERIES.EXAM(examSlug)` (`/mcqs/test-series/exam/:examSlug`) in `src/config/routes.ts` and register lazy routes in `src/routes/AppRoutes.tsx`.
     - Render published BPSC series and prepared mock tests with `>=44x44px` `type="button"` `active:scale-95` filter chips (`All`, `Full-Length`, `Free`, `Attempted`), official specs (`duration_minutes`, `question_ids.length`, `total_marks`, `negative_marks`), direct Launch/Detail CTAs (`TestDetailPage`), actionable Empty/Error states with one-tap retry, and strict `DEC-0002` logical `<ArrowLeft />` parent back navigation (zero `navigate(-1)`).
  3. **Context-Aware Student Discovery Entry (`src/pages/DashboardPage.tsx`, `src/pages/McqsQuizHomePage.tsx`, `src/features/mock-tests/pages/ExamCategoriesPage.tsx`):**
     - Surface a context-aware shortcut card linking directly to `/mcqs/test-series/bpsc` (or active canonical exam slug) driven by `useExamContextStore((s) => s.activeExamId)` (`DEC-0001`, `DEC-0003`) with `>=44x44px` `active:scale-95` touch feedback.
  - *Out of scope:* `TestDetailPage` attempt history & Share/Save fixes (Step 6 `v1.0.372`) and replacing `ExamPlaceholderPage` with live CBT runner (Step 7 `v1.0.373`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 7` files (`<= 10` threshold).
  - *New npm dependencies:* **None**. *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0001` (canonical exam aliasing), `DEC-0002` (logical back navigation — zero `navigate(-1)`), `DEC-0003` (single state owner `useExamContextStore`), `DEC-0004` (0ms offline-first IndexedDB cache), `DEC-0008` (`>=44x44px` touch targets, `active:scale-95`), `DEC-0017` (`isTestWithinScheduleWindow()` enforcement), `DEC-0018` (`DB_TABLES.MOCK` registry usage).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` (including new Vitest unit/component tests for `fetchPreparedMockTestsByExam` and `ExamPreparedMockTestsPage`) + `npx.cmd vite build`.
  - *Live Browser (`http://localhost:3000/` via built-in browser at Desktop `1280x800` & Mobile `390x844`):* Verify `/mcqs/test-series/bpsc`, filter chips, `>=44x44px` buttons, logical `<ArrowLeft />` return, and context-aware entry from Dashboard / MCQs Hub with `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.371.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0019`, and `OLD-011` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 5 (`v1.0.371`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 6 (`v1.0.372`) to High-Definition Spec (`[ ] NEXT`), and refine Step 11 (`v1.0.377`) into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.371` verified baseline and Step 6 (`v1.0.372`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.371`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 5 (v1.0.371) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate component lifecycles (including 0ms IndexedDB offline hydration, exam context persistence across routes, and Desktop/Mobile Android back navigation), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.371 — Dedicated BPSC Prepared Mock Tests Page using DB_TABLES.MOCK, canonical examRegistry aliasing, and >=44x44px tactile UI).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in a real browser at http://localhost:3000/#/mcqs/test-series/bpsc (Desktop 1280x800 + Mobile 390x844, confirming >=44x44px targets, filter chips, logical <ArrowLeft /> return, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 5 v1.0.371 DONE, promoting Step 6 v1.0.372 to High-Def NEXT, and refining Step 11 v1.0.377), overwrite CURRENT_HANDOVER.md with Step 6 (v1.0.372), and output the starter prompt for v1.0.372.
```
