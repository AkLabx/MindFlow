# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.375` (`package.json` SemVer: `1.0.375`, PR `#1119`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Component Tests:** Passed (`39/39` test files, `249/249` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `10/10` in `src/features/mock-tests/__tests__/mockTestsProgressLeaderboard.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockScoringReview.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5486` modules transformed, PWA precache `207` entries / `6824.50 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - **Desktop (`1280x800`):**
    - `#/mcqs/test-series`: Verified `<ContinueLearningSection variant="grid">` rendering live test card with progress bar, time left, and 1-tap "Resume Test" button.
    - `#/mcqs/test-series/series/bpsc-prelims-test-series`: Verified `<ArrowLeft />` back navigation, live "Your Progress" counters (Completed: 1/1, Best Score: 102.34, Average Score: 102.34, Accuracy: 80.6%, Time Spent: 4m 32s), and `<TestLeaderboardCard />` highlighting the logged-in student row ("YOU" badge) with rank 1, zero `answers` JSONB leakage, and test selector dropdown.
    - `#/mcqs/test-series/test/bpsc-69th-prelims-mock-01`: Verified `<TestLeaderboardCard />` locked to the active test on `TestDetailPage`.
  - **Mobile (`390x844`):**
    - `#/mcqs/test-series`: Verified 0px horizontal overflow (`390/390`), compact touch card layout, `>=44x44px` buttons, `active:scale-95` tactile feedback, and 0 console errors.
    - `#/mcqs/test-series/series/bpsc-prelims-test-series`: Verified responsive leaderboard container rendering stacked cards with rank badges, score, accuracy, and time taken.
    - Restored `is_published = false` in Supabase (`DEC-0017`).
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 10 (`v1.0.376`) — Admin Mock Test Analytics & Student Attempt Quality Inspector**

---

## 2. Workstation & Runtime Testing Rules

- **Deterministic Slot & Port Architecture:**
  - **Slot 1 (Anchor / Host):** Port `3000` (`http://localhost:3000/`) — Sole owner of `main`.
  - **Slot 2 (Worker 1):** Port `3001` (`http://localhost:3001/`) — Secondary session.
  - **Slot 3 (Worker 2):** Port `3002` (`http://localhost:3002/`) — Tertiary session.
- **Windows Command Runner Protocol:**
  - Use `npx.cmd` or `npm.cmd` on Windows shells to prevent PowerShell script execution policy errors.
  - Use `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` for typechecking across large codebases.
  - Dev server startup: `npm.cmd run dev` (in Slot 1) or `npm.cmd run dev -- --port 3001` (in Worker 1).
- **Vite HMR Zero-Commit Live Preview:**
  - Vite hot-reloads edits on disk in milliseconds. AI agents and developers do NOT need to commit to git to preview or verify UI changes.
- **Android Native Feel Directives (Non-Negotiable):**
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (`type="button"`, zero hover-only hidden action buttons), `scroll-mb-28` clearance above `MainLayout` fixed bottom navigation (`WCAG 2.4.11`), `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.376`)

- **Target Milestone:** `v1.0.376` (`package.json` SemVer: `1.0.376`)
- **Target Branch:** `feat/v1.0.376-admin-mock-analytics-quality`
- **Blueprint Reference:** Gen 1B, **Step 10** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Close the administrative feedback loop in the Mock Tests CMS so exam creators and admins can inspect BPSC mock test performance, student completion rates, score distributions, and question-level difficulty diagnostics directly inside `/admin/test-series` without leaving the dashboard or exposing student PII.
- **Exact Scope & Targets:**
  1. **Admin Mock Test Analytics Aggregator (`src/features/admin/test-series/api/adminTestSeriesApi.ts`):**
     - Function `fetchMockTestAnalytics(testId: string)` querying `DB_TABLES.MOCK.TESTS` (`mock_tests`) and `DB_TABLES.MOCK.ATTEMPTS` (`mock_test_attempts`).
     - Aggregates: Total attempts, unique students count, completion rate %, average score, median score, highest score, pass rate against `passing_marks`, and average time spent.
  2. **Question-Level Difficulty & Hardest Questions Diagnostics:**
     - Computes accuracy per question from submitted attempt `answers` JSONB: identifies top 5 hardest questions (lowest accuracy / highest incorrect rate) and most skipped questions to help admins calibrate test quality.
     - Strictly preserves student privacy: aggregates stats anonymously with zero student identity exposure.
  3. **Admin Test Insights Drawer / Panel (`AdminTestSeriesDashboard.tsx`, `TestCard.tsx`, new `AdminTestAnalyticsDrawer.tsx`):**
     - Add an accessible "Insights" action button on `TestCard.tsx` (`>=44x44px`, `type="button"`, `active:scale-95`).
     - Opens a native `<NativeDialog variant="drawer-right">` slide-over sheet or modal showing:
       - Summary Stat Cards: Total Attempts, Completion Rate, Avg Score vs Pass Cutoff, Avg Time.
       - Score Distribution & Pass/Fail breakdown pills.
       - Hardest Questions table / cards with 1-tap link to inspect question details in `QuestionPreviewDrawer`.
  4. **Accessibility, Performance & SWR Caching:**
     - 0ms cached hydration via `MindFlowDB.sync_metadata` / React Query with background refresh.
     - Android-first ergonomics: swipe-to-dismiss drawer, full touch targets, 0px horizontal overflow.
     - Automated Vitest suite verifying analytics calculation math, empty attempt states, and admin authorization.
  - *Out of scope:* Global Admin layout/command palette refactor (Step 11 `v1.0.377`) and question bank preview sync (Step 12 `v1.0.378`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 7` files (`AdminTestSeriesDashboard.tsx`, `TestCard.tsx`, `adminTestSeriesApi.ts`, `AdminTestAnalyticsDrawer.tsx`, tests).
  - *New npm dependencies:* **None**.
  - *DB schema changes:* **None** (client-side aggregation over existing tables with admin RLS permissions).
  - *Invariants to protect:* `DEC-0002` (zero `navigate(-1)`), `DEC-0004` (0ms IndexedDB hydration & offline resilience), `DEC-0007` (native `<dialog>` / Popovers), `DEC-0008` (`>=44x44px` `active:scale-95`), `DEC-0014` (`useNotification()`), `DEC-0017` (schedule check & own-attempt privacy), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28`), `DEC-0020` (`negative_marks`), `DEC-0021` (`answers` JSONB clean isolation), `DEC-0022` (`PreparedMockResultPage` Dual-View), `DEC-0023` (monotonic completed attempt guard & container queries).
- **Real-World Verification Goal:**
  - *Static:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (Desktop `1280x800` & Mobile `390x844`):* Open Mock Tests CMS at `#/admin/test-series?tab=tests`, click "Insights" on a test with completed attempts, verify total attempts count, average score, pass rate, hardest questions list, 0px mobile overflow, and 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.376.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0024`, and `OLD-015` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 10 (`v1.0.376`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 11 (`v1.0.377`) to High-Definition Spec (`[ ] NEXT`), and refine Step 15 (`v1.0.381`) / Step 16 into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.376` verified baseline and Step 11 (`v1.0.377`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.376`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 10 (v1.0.376) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate the Admin Mock Test Analytics & Student Attempt Quality Inspector lifecycle (fetching completed attempts for a test, computing aggregated stats: total attempts, completion rate, avg score vs passing_marks, hardest questions accuracy breakdown from answers JSONB with zero student PII leakage, 0ms SWR caching, slide-over drawer UI, and deterministic <ArrowLeft /> / Android hardware back), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.376 — Admin Mock Test Analytics & Student Attempt Quality Inspector).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming TestCard Insights button, slide-over analytics drawer, stats accuracy, hardest questions list, >=44x44px controls, 0px mobile overflow, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 10 v1.0.376 DONE, promoting Step 11 v1.0.377 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 11 (v1.0.377), and output the starter prompt for v1.0.376.
```
