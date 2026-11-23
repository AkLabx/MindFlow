# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.374` (`package.json` SemVer: `1.0.374`, PR `#1118`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Component Tests:** Passed (`38/38` test files, `239/239` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `6/6` in `src/features/mock-tests/__tests__/preparedMockScoringReview.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5484` modules transformed, PWA precache `205` entries / `6773.43 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - Verified `69th BPSC Prelims PYQs` (`103` Qs, `120 mins`, `150` total marks, `95` passing marks, `-0.33` negative marks) end-to-end.
  - **Desktop (`1280x800`):** Scorecard hydration (`score / total_marks` with exact `-0.33` negative marking), 13-subject accuracy breakdown with progress bars, Dual-View Switcher to 1-by-1 bilingual paged Solution Review carousel (`Bilingual`, `English`, `Hindi`), KaTeX math formatting, `Incorrect (-0.33)` filter chip, user-picked vs correct option indicators, structured explanation blocks (`Summary`, `Correct Analysis`, `Incorrect Analysis`, `Conclusion`), and quick-jump Question Palette.
  - **Mobile (`390x844`):** Verified `0px` horizontal overflow (`scrollWidth: 390 === 390`), `0` buttons below `44x44px`, `0` `button:not([type="button"])`, `<NativeDialog variant="drawer-right">` Question Palette drawer, completed attempt deep-linking from `TestDetailPage` ("View Solution" action button), deterministic `<ArrowLeft />` navigation back to `TestDetailPage`, and `0` console errors. Restored `is_published = false` in Supabase (`DEC-0017`).
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 9 (`v1.0.375`) — Student Resume ("Continue Learning"), Series Progress & Safe Leaderboard**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.375`)

- **Target Milestone:** `v1.0.375` (`package.json` SemVer: `1.0.375`)
- **Target Branch:** `feat/v1.0.375-student-resume-progress-leaderboard`
- **Blueprint Reference:** Gen 1B, **Step 9** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Replace the remaining static placeholders in `ExamCategoriesPage.tsx` (`Continue Learning` placeholder) and `TestsListPage.tsx` (`Your Progress` placeholder and static `Leaderboard` stub) with real student attempt progress, live series completion stats, and privacy-safe ranked leaderboards backed by Step 4/4B's hardened database RPC (`DB_RPCS.MOCK_LEADERBOARD`).
- **Exact Scope & Targets:**
  1. **Real "Continue Learning" Cards (`src/features/mock-tests/pages/ExamCategoriesPage.tsx`):**
     - Query student's active `in_progress` or recently completed `mock_test_attempts` joined with `mock_tests` (filtered by active schedule window `isTestWithinScheduleWindow`, `DEC-0017`).
     - Hydrate from IndexedDB in 0ms (`DEC-0004`) with background sync.
     - Display test title, progress bar (`answered / total`), time remaining, and 1-tap "Resume Test" (`ROUTES.TEST_SERIES.EXAM_RUNNER(testId)`) or "View Solution" (`ROUTES.TEST_SERIES.RESULT(testId, attemptId)`).
     - Render clean empty state when no recent attempts exist.
  2. **Live "Your Progress" Series Stats (`src/features/mock-tests/pages/TestsListPage.tsx`):**
     - Replace static/mock counters with real stats calculated from the student's `mock_test_attempts`:
       - Tests completed / total published tests in the series.
       - Best score / Average score across completed tests.
       - Series overall accuracy % and total time spent.
  3. **Privacy-Safe Series/Test Leaderboard (`src/features/mock-tests/pages/TestsListPage.tsx`, `src/features/mock-tests/api/mockTestsApi.ts`):**
     - Connect Leaderboard section to `fetchTestLeaderboard(testId)` / `DB_RPCS.MOCK_LEADERBOARD` (`public.get_mock_test_leaderboard`).
     - Display ranked list: Rank, Anonymous/Public Student Handle, Score, Accuracy, Time Taken.
     - Highlight `is_current_user` row prominently (`DEC-0017`).
     - Strictly zero leakage of raw `answers` JSONB or private student metadata.
     - Support empty state ("Be the first to complete this test!") and offline fallback.
  4. **Accessibility, Android Ergonomics & Automated Tests (`src/features/mock-tests/__tests__/`):**
     - Touch targets `>=44x44px`, `type="button"`, `active:scale-95`, `scroll-mb-28` clearance above bottom nav.
     - Vitest suite `mockTestsProgressLeaderboard.test.tsx` verifying:
       - Resume attempt resolution.
       - Series progress calculation.
       - Leaderboard RLS / DTO privacy sanitization (no `answers` JSONB).
       - Empty and offline states.
  - *Out of scope:* Admin analytics aggregation inspector (Step 10 `v1.0.376`) and global admin shell refactor (Step 11 `v1.0.377`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 6` files (`ExamCategoriesPage.tsx`, `TestsListPage.tsx`, `mockTestsApi.ts`, tests).
  - *New npm dependencies:* **None**. *DB schema changes:* **None** (uses existing `get_mock_test_leaderboard` RPC and `mock_test_attempts` table).
  - *Invariants to protect:* `DEC-0002` (zero `navigate(-1)`), `DEC-0004` (0ms IndexedDB hydration & offline resilience), `DEC-0007` (native `<dialog>` / Popovers), `DEC-0008` (`>=44x44px` `active:scale-95`), `DEC-0014` (`useNotification()`), `DEC-0017` (schedule check & own-attempt privacy), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28`), `DEC-0020` (`negative_marks`), `DEC-0021` (`answers` JSONB clean isolation), `DEC-0022` (`PreparedMockResultPage` Dual-View & 0ms result cache).
- **Real-World Verification Goal:**
  - *Static:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (Desktop `1280x800` & Mobile `390x844`):* Resume an in-progress BPSC mock test from `"Continue Learning"`, verify live series progress statistics in `TestsListPage.tsx`, and inspect ranked leaderboard output on Desktop and Mobile (`390x844`) with 0 `answers` JSONB leakage and 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.375.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0023`, and `OLD-014` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 9 (`v1.0.375`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 10 (`v1.0.376`) to High-Definition Spec (`[ ] NEXT`), and refine Step 14 (`v1.0.380`) / Step 15 into `Medium` detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.375` verified baseline and Step 10 (`v1.0.376`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.375`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 9 (v1.0.375) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate the Student Resume ("Continue Learning"), Series Progress & Safe Leaderboard lifecycle (0ms IndexedDB hydration of user's active/completed mock attempts with schedule-window filtering, live calculation of series completion stats, privacy-safe fetchTestLeaderboard via DB_RPCS.MOCK_LEADERBOARD highlighting current user with zero answers JSONB leakage, and deterministic <ArrowLeft /> / Android hardware back), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.375 — Student Resume ("Continue Learning"), Series Progress & Safe Leaderboard).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming 1-tap test resume, live series progress counters, ranked leaderboard output with 0 answers leakage, >=44x44px controls, 0px mobile overflow, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 9 v1.0.375 DONE, promoting Step 10 v1.0.376 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 10 (v1.0.376), and output the starter prompt for v1.0.375.
```
