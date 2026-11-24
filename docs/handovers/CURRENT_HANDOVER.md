# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.378` (`package.json` SemVer: `1.0.378`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Component Tests:** Passed (`42/42` test files, `267/267` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `6/6` in `src/features/admin/questions/__tests__/adminQuestionsSync.test.tsx`, `5/5` in `src/features/admin/layouts/__tests__/adminShellRbac.test.tsx`, `7/7` in `src/features/admin/test-series/__tests__/adminTestAnalytics.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `10/10` in `src/features/mock-tests/__tests__/mockTestsProgressLeaderboard.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockScoringReview.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5489` modules transformed, PWA precache `209` entries / `6903.43 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - **Desktop (`1280x800`):**
    - `#/admin/questions`: Verified table loaded 26 rows from live database, touch targets `>=44x44px` `type="button"`, opened `QuestionInspectorDrawer` via Preview button, verified Bilingual / English / Hindi modes, KaTeX math formatting, Edit mode transition with 7 structured fields, and `<ConfirmDialog>` on delete.
  - **Mobile (`390x844`):**
    - `#/admin/questions`: Verified responsive mobile cards (`md:hidden`) with `0px` horizontal overflow (`scrollW: 492 <= innerW: 500`), desktop table hidden (`hidden md:block`), touch targets `>=44x44px` `active:scale-95`, and `0` console errors.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 13 (`v1.0.379`) — Mock Tests SWR/IndexedDB Caching & Automated Vitest/Playwright Suite**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.379`)

- **Target Milestone:** `v1.0.379` (`package.json` SemVer: `1.0.379`)
- **Target Branch:** `feat/v1.0.379-mock-tests-swr-e2e-suite`
- **Blueprint Reference:** Gen 1B, **Step 13** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Lock in speed (`<16ms` INP, 0ms cached render) and prevent regressions across the Admin CMS and full BPSC Prepared Mock Test lifecycle with unified SWR caching contracts and automated end-to-end regression suites.
- **Exact Scope & Targets:**
  1. **Unified SWR & IndexedDB Cache Contracts (`mockTestsApi.ts`, `adminTestSeriesApi.ts`, `useSyncStore.ts`):**
     - Standardize stale-time durations, cache invalidation keys, and storage contracts across student discovery (`fetchPreparedMockTestsByExam`), test details (`fetchTestDetails`), CBT runner question hydration (`fetchPreparedMockTestQuestions`), and Admin CMS test listings (`fetchAdminTests`).
     - Coordinate memory, localStorage, and `MindFlowDB.sync_metadata` invalidations so that publishing, updating, or deleting a mock test in the admin CMS instantly invalidates student mock listings and shortcut cards (`DEC-0004`, `DEC-0018`, `DEC-0026`).
  2. **Comprehensive Vitest Integration & Regression Suite:**
     - Add integration specs covering end-to-end cache invalidation cascades (Admin edit $\rightarrow$ student cache purge), mock test schedule window edge cases (`release_date` in future, expired tests), negative marking math (`-0.33` for BPSC 4-option questions vs `-0.25` 5-option), and offline queue idempotency (`mock_test_attempt_submit` replay in `syncService.ts`).
  3. **Playwright E2E Smoke Flow:**
     - Construct an automated Playwright smoke spec executing the core student journey: Navigate to `#/mcqs/test-series/bpsc` $\rightarrow$ Select prepared mock test $\rightarrow$ Launch CBT runner $\rightarrow$ Answer questions & Mark for Review $\rightarrow$ Submit test $\rightarrow$ Verify Scorecard & 1-by-1 Solution Review.
  - *Out of scope:* Supabase Security/Performance Advisor sign-off and final Gen 1B Android WebView audit (Step 14 `v1.0.380`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 7` files inside `src/features/mock-tests/`, `src/features/admin/test-series/`, and test suites.
  - *New npm dependencies:* **None** (use existing Vitest and Playwright harnesses).
  - *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0004` (0ms IndexedDB SWR hydration), `DEC-0007` (native `<dialog>` / Popovers), `DEC-0008` (`>=44x44px` `type="button"` `active:scale-95`), `DEC-0014` (`useNotification()`), `DEC-0015` (no unpaged filter scans or updater `onChange`), `DEC-0017` (100-UUID chunked `.is('deleted_at', null)` validation), `DEC-0018` (`DB_TABLES.*`), `DEC-0024` (zero-PII analytics), `DEC-0025` (Admin shell error isolation), `DEC-0026` (Question bank & mock prep sync).
- **Real-World Verification Goal:**
  - *Static:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser & E2E:* All Vitest and Playwright tests pass 100% with verified 0ms SWR hydration, `<16ms` filter transitions, and 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.379.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0027`, and `OLD-017` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 13 (`v1.0.379`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 14 (`v1.0.380`) to High-Definition Spec (`[ ] NEXT`), and keep the rolling 4-step medium horizon updated.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.379` verified baseline and Step 14 (`v1.0.380`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.379`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 13 (v1.0.379) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 7 files, zero new npm packages, and zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate SWR cache invalidation cascades (Admin publish/update/delete -> student listing purge), mock test schedule window edge cases (future release dates, expired tests), negative marking scoring math (-0.33 vs -0.25), and offline submission queue replay; identify 3 runtime failure modes and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.379 — Mock Tests SWR/IndexedDB Caching & Automated Vitest/Playwright Suite).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build) and run automated regression/smoke tests, confirming 0ms SWR hydration, <16ms filter transitions, and 0 console errors.
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 13 v1.0.379 DONE, promoting Step 14 v1.0.380 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 14 (v1.0.380), and output the starter prompt for v1.0.380.
```
