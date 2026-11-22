# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.371` (`package.json` SemVer: `1.0.371`, PR `#1115`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`35/35` test files, `221/221` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, and `2/2` in `src/features/ai/hooks/useExamReadiness.test.ts`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5482` modules transformed, PWA precache `199` entries / `6670.93 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - Verified `#/mcqs/test-series/bpsc`, `#/mcqs/test-series/exam/ssc_cgl` (`1` live published series `SSC CGL 2025 GK`), `#/mcqs/test-series`, `#/dashboard`, and `#/mcqs` across **Desktop (`1280x800`)** and **Mobile (`390x844`)**.
  - Confirmed `0` console errors, `0px` horizontal overflow (`scrollWidth === innerWidth` on Mobile `390px`), `>=44x44px` touch targets across all page buttons, `aria-pressed` filter chip toggling, and deterministic `<ArrowLeft />` logical return to `#/mcqs/test-series` and `#/dashboard`.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 6 (`v1.0.372`) — Student `TestDetailPage` Bug Fixes, Real Attempt History & Save/Share Actions**

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
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (`type="button"`, zero hover-only hidden action buttons), `scroll-mb-28` clearance above `MainLayout` fixed bottom navigation (`WCAG 2.4.11`), `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.372`)

- **Target Milestone:** `v1.0.372` (`package.json` SemVer: `1.0.372`)
- **Target Branch:** `feat/v1.0.372-test-detail-history-save-share`
- **Blueprint Reference:** Gen 1B, **Step 6** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Make [`TestDetailPage.tsx`](../../src/features/mock-tests/pages/TestDetailPage.tsx) 100% accurate, offline-resilient, and interactive before students launch a prepared mock test — fixing the negative-marking field bug, removing `navigate(-1)`, wiring real `mock_test_attempts` history, implementing Save/Bookmark and Share with `useNotification()` Popover feedback, and resolving decorative `BrandedThumbnail` heading-level nesting.
- **Exact Scope & Targets:**
  1. **Real Attempt History & 0ms Detail Caching (`src/features/mock-tests/api/mockTestsApi.ts`):**
     - Add `fetchUserTestAttempts(testId, userId)` querying `DB_TABLES.MOCK.ATTEMPTS` (`id, test_id, start_time, end_time, time_taken_seconds, score, accuracy, status, created_at`) ordered by `created_at DESC`, backed by `userId`-scoped `localStorage` + `MindFlowDB.sync_metadata` (`db.getCacheEntry`/`db.setCacheEntry`) 0ms caching (`DEC-0004`, `DEC-0018`).
     - Ensure `fetchTestDetails()` remains strict on `isTestWithinScheduleWindow()` (`DEC-0017`) and can hydrate safely from cached detail snapshots when offline.
  2. **`TestDetailPage` Bug Fixes, Attempt History UI & Save/Share (`src/features/mock-tests/pages/TestDetailPage.tsx`, `src/features/mock-tests/components/BrandedThumbnail.tsx`):**
     - Fix `test.negative_marks_per_question` $\rightarrow$ `Number(test.negative_marks ?? 0)` so negative marking (e.g., `-0.33` for BPSC) renders accurately alongside `passing_marks`, duration, question count, and total marks.
     - Replace raw `navigate(-1)` in the empty/error state and add a visible `<ArrowLeft />` logical back button routing via validated `location.state?.returnTo` or deterministic hierarchical parent (`ROUTES.TEST_SERIES.SERIES(series.id)` $\rightarrow$ `ROUTES.TEST_SERIES.BPSC` $\rightarrow$ `ROUTES.TEST_SERIES.ROOT`) per `DEC-0002`.
     - Replace the static `"You haven't attempted this test yet."` placeholder with real attempt summary stats (Attempts, Best Score, Accuracy %, Latest Status/Date) and an accessible attempt history list (`in_progress` vs `completed`).
     - Wire **Save/Bookmark** (user-scoped `localStorage` + `MindFlowDB.sync_metadata` toggle) and **Share** (`@capacitor/share` / `navigator.share` / clipboard fallback) using `useNotification()` Popover toasts (`DEC-0014`), explicit `type="button"`, `scroll-mb-28`, and `>=44x44px` `active:scale-95` touch targets (`DEC-0008`, `DEC-0019`).
     - Replace decorative `<h2>` inside `BrandedThumbnail.tsx` with `<span aria-hidden="true">` to keep heading hierarchy (`<h1>` $\rightarrow$ `<h2>` $\rightarrow$ `<h3>`) clean across all Mock Tests views.
  3. **Automated Vitest Suite (`src/features/mock-tests/__tests__/testDetailPage.test.tsx`):**
     - Verify `-0.33` negative marking display, logical `<ArrowLeft />` return (zero `navigate(-1)`), real attempt history + offline cache fallback, Save/Bookmark persistence + Popover toast, Share action feedback, and `>=44x44px` `type="button"` controls.
  - *Out of scope:* Live timed CBT runner execution on `/exam/:testId` (Step 7 `v1.0.373`) and post-submission scoring pipeline (Step 8 `v1.0.374`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 5` files (`<= 10` threshold).
  - *New npm dependencies:* **None**. *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0002` (logical back — zero `navigate(-1)`), `DEC-0004` (0ms IndexedDB offline cache), `DEC-0008` (`>=44x44px` `active:scale-95`), `DEC-0014` (`useNotification()` Popover toasts), `DEC-0017` (`isTestWithinScheduleWindow()`), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28` clearance & canonical exam routes).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`testDetailPage.test.tsx` + full suite) + `npx.cmd vite build`.
  - *Live Browser (`http://localhost:3000/#/mcqs/test-series/test/:testId` via Chrome DevTools at Desktop `1280x800` & Mobile `390x844`):* Verify `-0.33` negative marking, logical `<ArrowLeft />` return, attempt history / empty state, Save & Share Popover toasts, `>=44x44px` targets, and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.372.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0020`, and `OLD-011` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 6 (`v1.0.372`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 7 (`v1.0.373`) to High-Definition Spec (`[ ] NEXT`), and refine Step 12 (`v1.0.378`) into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.372` verified baseline and Step 7 (`v1.0.373`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.372`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 6 (v1.0.372) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate TestDetailPage lifecycles (0ms offline hydration, negative_marks accuracy, userId-scoped attempt history cache, and Desktop/Mobile Android back navigation), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.372 — Student TestDetailPage Bug Fixes, Real Attempt History via DB_TABLES.MOCK.ATTEMPTS, Save/Share Popover actions, and BrandedThumbnail heading fix).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming -0.33 negative marking, >=44x44px buttons, logical <ArrowLeft /> return, Save/Share toasts, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 6 v1.0.372 DONE, promoting Step 7 v1.0.373 to High-Def NEXT, and refining Step 12 v1.0.378), overwrite CURRENT_HANDOVER.md with Step 7 (v1.0.373), and output the starter prompt for v1.0.373.
```
