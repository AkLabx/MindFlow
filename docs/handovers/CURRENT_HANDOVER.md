# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.372` (`package.json` SemVer: `1.0.372`, PR `#PR_TBD`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`36/36` test files, `227/227` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5482` modules transformed, PWA precache `200` entries / `6693.46 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - Verified `DEC-0017` unpublished protection (`BPSC PYQs Prelims` draft $\rightarrow$ `Test Not Found` EmptyState on `#/mcqs/test-series/test/4ca359c7-4d19-4441-9ee2-83d0148e29e6`), and temporarily published the series to verify **`69th BPSC Prelims PYQs`** across **Desktop (`1280x800`)** and **Mobile (`390x844`)** before restoring `is_published = false`.
  - Confirmed `-0.33` negative marking, `95` passing marks, `120 mins`, `103` Qs, `150` total marks, crisp `<h1>` below banner, **Save** (`aria-pressed` + `Test Saved` / `Removed from Saved` Popover toasts), **Share** (`Link Copied` Popover toast), `>=44x44px` `type="button"` controls, `0px` mobile horizontal overflow (`scrollWidth: 390 === 390`), strictly `H1` $\rightarrow$ `H2` headings, logical `<ArrowLeft />` return to `#/mcqs/test-series/bpsc`, and `0` console errors.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 7 (`v1.0.373`) — Replace `ExamPlaceholderPage` with Live Timed CBT Mock Runner**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.373`)

- **Target Milestone:** `v1.0.373` (`package.json` SemVer: `1.0.373`)
- **Target Branch:** `feat/v1.0.373-live-timed-cbt-mock-runner`
- **Blueprint Reference:** Gen 1B, **Step 7** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Replace the `"Coming in Phase 4"` `ExamPlaceholderPage.tsx` dead-end and wire `/exam/:testId` cleanly so students launching **Start Test** / **Resume Attempt** from `TestDetailPage` execute full admin-prepared BPSC mock tests inside a live, crash-safe timed CBT runner.
- **Exact Scope & Targets:**
  1. **Route Registration & Runner Page (`src/config/routes.ts`, `src/routes/AppRoutes.tsx`, `src/features/mock-tests/pages/`):**
     - Register `ROUTES.TEST_SERIES.EXAM_RUNNER(testId)` (`/exam/:testId`) in `src/config/routes.ts` and mount `<PreparedMockExamPage />` in `src/routes/AppRoutes.tsx` (replacing `ExamPlaceholderPage` dead-end and eliminating its raw `navigate(-1)`).
  2. **Prepared Mock Hydration & Crash-Safe `in_progress` Attempts (`src/features/mock-tests/api/mockTestsApi.ts`, `src/features/quiz/services/quizCreationService.ts`):**
     - Hydrate `mock_tests` metadata (`duration_minutes`, `total_marks`, `passing_marks`, `negative_marks`, `question_ids`) via `getCachedTestDetailsSnapshot` / `fetchTestDetails` (`DEC-0017`) and fetch ordered questions in 100-UUID chunks (`DB_TABLES.BANK.QUESTIONS`, `.is('deleted_at', null)`), caching hydrated questions in IndexedDB (`DEC-0004`).
     - Support `>100`-question prepared mocks (e.g., `69th BPSC Prelims PYQs` has `103` questions and full BPSC mocks reach `150` questions; `quizCreationService.MAX_QUIZ_QUESTIONS` is currently `100` for custom quizzes — handle prepared mocks cleanly without breaking custom quiz limits).
     - Support starting a new `DB_TABLES.MOCK.ATTEMPTS` (`status = 'in_progress'`) row or restoring via `location.state?.resumeAttemptId`, persisting selected options, palette status (`Not Visited`, `Answered`, `Marked for Review`), and remaining seconds crash-safely to IndexedDB + Supabase.
  3. **Live Timed CBT UI & Exit Safety (`src/features/mock-tests/pages/`):**
     - Precision countdown timer (`duration_minutes * 60` synced across page reloads), bilingual/KaTeX question & option rendering, `>=44x44px` `type="button"` `active:scale-95` Previous/Next/Clear/Mark for Review controls with `scroll-mb-28`, responsive Question Palette drawer (`<dialog>` / slide-over on Mobile `390x844`), and native `<dialog>` exit confirmation guarded by `DEC-0002` logical back & Android hardware back (`useHardwareBackButton.ts`).
  4. **Automated Vitest Suite (`src/features/mock-tests/__tests__/`):**
     - Verify >100-question chunked hydration, `resumeAttemptId` restoration, crash-safe reload persistence, palette status transitions, `DEC-0017` schedule rejection, and native `<dialog>` exit confirmation (zero `navigate(-1)`).
  - *Out of scope:* Post-submission negative-marking scoring & Solution Review pipeline (Step 8 `v1.0.374`) and series progress / leaderboard UI (Step 9 `v1.0.375`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 8` files (`<= 10` threshold).
  - *New npm dependencies:* **None**. *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0002` (zero `navigate(-1)`), `DEC-0004` (0ms crash-safe IndexedDB cache), `DEC-0007` (native `<dialog>`), `DEC-0008` (`>=44x44px` `active:scale-95`), `DEC-0014` (`useNotification()` Popover toasts), `DEC-0017` (`isTestWithinScheduleWindow()`), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28`), `DEC-0020` (`negative_marks`, `.maybeSingle()`, canonical Share/Bookmark).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (`http://localhost:3000/#/exam/:testId` via Chrome DevTools on Desktop `1280x800` & Mobile `390x844`):* Launch from `TestDetailPage`, verify live countdown timer, answer & mark questions, reload mid-exam to confirm crash-safe recovery, verify Mobile (`390x844`) palette drawer + exit `<dialog>`, and confirm `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.373.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0021`, and `OLD-012` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 7 (`v1.0.373`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 8 (`v1.0.374`) to High-Definition Spec (`[ ] NEXT`), and refine Step 13 (`v1.0.379`) into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.373` verified baseline and Step 8 (`v1.0.374`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.373`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 7 (v1.0.373) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate the Live Timed CBT Mock Runner lifecycle (/exam/:testId hydration for >100-Q BPSC mocks, resumeAttemptId handoff, crash-safe IndexedDB auto-save across reload, timer drift/backgrounding, Mobile 390x844 question palette drawer, and native <dialog> exit / Android hardware back), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.373 — Replace ExamPlaceholderPage with Live Timed CBT Mock Runner on /exam/:testId).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming live countdown, palette state, reload crash recovery, mobile drawer, exit dialog, >=44x44px controls, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 7 v1.0.373 DONE, promoting Step 8 v1.0.374 to High-Def NEXT, and refining Step 13 v1.0.379), overwrite CURRENT_HANDOVER.md with Step 8 (v1.0.374), and output the starter prompt for v1.0.374.
```
