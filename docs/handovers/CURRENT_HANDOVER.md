# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.373` (`package.json` SemVer: `1.0.373`, PR `#1117`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`37/37` test files, `233/233` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5483` modules transformed, PWA precache `202` entries / `6741.72 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - Confirmed `DEC-0017` unpublished protection directly on `#/exam/4ca359c7-4d19-4441-9ee2-83d0148e29e6` (`Test Not Found` EmptyState when `BPSC PYQs Prelims` has `is_published = false`), then temporarily published series `40e2567b-79b6-4fb7-811a-0af425d3cf45` to verify **`69th BPSC Prelims PYQs`** (`103` Qs, `120 mins`, `150` total marks, `95` passing, `-0.33` negative marks) end-to-end before restoring `is_published = false`.
  - **Desktop (`1280x800`):** Verified live monotonic countdown (`01:59:55` $\rightarrow$ `01:59:53`), `103`-Q chunked ordered hydration inside persistent right-hand Question Palette sidebar, Q1 answer + Mark toggle (`aria-pressed="true"`), Q103 jump + answer, and mid-exam **page reload** crash recovery (`Q 103 / 103 • 2 Answered`, Option B checked, `01:59:32`).
  - **Mobile (`390x844`):** Verified `0px` horizontal overflow (`scrollWidth: 390 === 390`), `0` buttons below `44x44px`, `0` `button:not([type="button"])`, `<NativeDialog variant="drawer-right">` Question Palette drawer + Q2 jump, Pause & Exit `<NativeDialog role="alertdialog">` returning to `TestDetailPage` (`Resume Attempt` + `In Progress` row), re-entry at `01:58:25`, Submit `<NativeDialog>` (`Re-attempt Test` + `Completed` row), and `0` console errors.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 8 (`v1.0.374`) — Prepared Mock Test Scoring, Negative Marking & Solution Review Pipeline**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.374`)

- **Target Milestone:** `v1.0.374` (`package.json` SemVer: `1.0.374`)
- **Target Branch:** `feat/v1.0.374-mock-scoring-solution-review`
- **Blueprint Reference:** Gen 1B, **Step 8** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Upgrade the post-submission experience for prepared BPSC mock tests from a toast-only return to `TestDetailPage` into an exam-grade **Result Scorecard & Bilingual Solution Review Pipeline** with idempotent offline submission replay (`useSyncStore`), subject-wise accuracy breakdowns, and clickable completed attempt inspection from `TestDetailPage`.
- **Exact Scope & Targets:**
  1. **Offline Submission Replay & Attempt Result Hydration (`src/features/mock-tests/api/mockTestsApi.ts`, `src/features/quiz/stores/useSyncStore.ts`):**
     - Add idempotent offline queue replay in `useSyncStore` for `mock_test_attempt_submit` (`DB_TABLES.MOCK.ATTEMPTS` `.upsert(..., { onConflict: 'id' })`) when `submitPreparedMockAttempt()` runs offline or encounters a transient network error (`DEC-0004`).
     - Add `fetchPreparedMockAttemptById(testId, attemptId, userId)` + local result cache so `PreparedMockResultPage` hydrates in 0ms offline or fetches the student's own attempt (including `answers` JSONB strictly filtered by `user_id`, `DEC-0017`) paired with `fetchPreparedMockTestQuestions()` (`100`-UUID chunked ordered hydration, `DEC-0021`).
  2. **Result & Solution Review Route + `TestDetailPage` History Deep-Link (`src/config/routes.ts`, `src/routes/AppRoutes.tsx`, `src/features/mock-tests/pages/PreparedMockExamPage.tsx`, `src/features/mock-tests/pages/TestDetailPage.tsx`):**
     - Register `ROUTES.TEST_SERIES.RESULT(testId, attemptId)` in `src/config/routes.ts` and mount `<PreparedMockResultPage />` in `src/routes/AppRoutes.tsx`.
     - Navigate directly from `PreparedMockExamPage` upon **Confirm & Submit** / `00:00` auto-submit into the new Result & Solution Review screen, and make `"Completed"` attempt entries in `TestDetailPage` (**Your Attempt History**) interactive so students can revisit any past attempt's Solution Review (`>=44x44px` `type="button"`).
  3. **Score Breakdown & Bilingual Solution Review UI (`src/features/mock-tests/pages/PreparedMockResultPage.tsx`):**
     - Render scorecard summary (`score / total_marks`, exact `-0.33` / positive-marking math, `accuracy %`, `Pass` / `Below Cutoff` vs `passing_marks`, `Correct` / `Wrong` / `Unanswered`, and time taken), subject-wise breakdown bars, filterable Solution Review (`All`, `Correct`, `Incorrect`, `Unanswered`) with bilingual stems, KaTeX math, picked vs correct option badges, detailed `explanation` cards, `scroll-mb-28`, and deterministic `<ArrowLeft />` / hardware back return to `TestDetailPage` (`DEC-0002`, `useHardwareBackButton.ts`).
  4. **Automated Vitest Suite (`src/features/mock-tests/__tests__/`):**
     - Test subject-wise breakdown + BPSC `-0.33` scoring math, offline submission queuing & idempotent `useSyncStore` replay, Solution Review filtering (`Correct`/`Incorrect`/`Unanswered`) & bilingual explanation rendering, `TestDetailPage` completed-attempt navigation, and `DEC-0002` logical/hardware back navigation.
  - *Out of scope:* `"Continue Learning"` home resume cards & series progress / leaderboard UI (Step 9 `v1.0.375`) and Admin Insights aggregation (Step 10 `v1.0.376`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 8` files (`<= 10` threshold).
  - *New npm dependencies:* **None**. *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0002` (zero `navigate(-1)`), `DEC-0004` (0ms IndexedDB & idempotent sync replay), `DEC-0007` (native `<dialog>` / Popover), `DEC-0008` (`>=44x44px` `active:scale-95`), `DEC-0014` (`useNotification()` Popover toasts), `DEC-0017` (`isTestWithinScheduleWindow()` & strict own-attempt RLS), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28`), `DEC-0020` (`negative_marks`), `DEC-0021` (`100`-UUID chunked ordered hydration & clean `answers` JSONB).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (`http://localhost:3000/` via Chrome DevTools on Desktop `1280x800` & Mobile `390x844`):* Submit a BPSC mock test (online + offline-then-reconnect), verify exact negative-marking math, subject breakdown, Solution Review filters, completed attempt inspection from `TestDetailPage`, `>=44x44px` controls, `0px` mobile overflow, and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.374.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0022`, and `OLD-013` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 8 (`v1.0.374`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 9 (`v1.0.375`) to High-Definition Spec (`[ ] NEXT`), and refine Step 14 (`v1.0.380`) into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.374` verified baseline and Step 9 (`v1.0.375`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.374`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 8 (v1.0.374) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate the Prepared Mock Test Scoring & Solution Review lifecycle (online + offline submission replay via useSyncStore, 0ms attempt result hydration with clean answers JSONB, negative-marking & subject breakdown calculation, bilingual/KaTeX Solution Review filtering, TestDetailPage completed-attempt deep-linking, and deterministic <ArrowLeft /> / Android hardware back), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.374 — Prepared Mock Test Scoring, Negative Marking & Solution Review Pipeline).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming negative-marking math, offline replay, Solution Review filters, >=44x44px controls, 0px mobile overflow, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 8 v1.0.374 DONE, promoting Step 9 v1.0.375 to High-Def NEXT, and refining Step 14 v1.0.380), overwrite CURRENT_HANDOVER.md with Step 9 (v1.0.375), and output the starter prompt for v1.0.375.
```
