# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.370`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`34/34` test files, `212/212` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `14/14` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx` + `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5479` modules transformed, PWA precache `196` entries / `6633.15 KiB`)
- **Database & Security Verification (`project_id: sjcfagpjstbfxuiwhlps`):**
  - Applied migration `supabase/migrations/20261122000000_harden_mock_tests_rls_and_leaderboard.sql`: locked `"Public read for leaderboard if completed"` (`USING (false)`), scoped all 11 policies on `exam_categories`, `test_series`, `tests`, and `user_test_attempts` `TO authenticated` with cascading active-parent + `release_date`/`expiry_date` schedule-window RLS, added `user_test_attempts.accuracy` + status/publish/schedule `CHECK` constraints, and created `public.get_test_leaderboard(p_test_id uuid, p_limit integer)` (`SECURITY DEFINER SET search_path = public, pg_temp`, `anon` execute revoked, `authenticated` execute granted).
  - `supabase_mcp.get_advisors(type="security")`: `0` mock-test RLS or anonymous `SECURITY DEFINER` issues.
- **Live Browser Verification (Built-In Browser, Desktop `1280x800` at `http://localhost:3000/`):**
  - *`#/admin/test-series?tab=tests`:* Initial cold load hit a `getSession` 2500ms timeout (`AuthTimeout`) before reload; after reload hydrated cleanly across `Categories` (`SSC CGL`), `Series` (`SSC CGL 2025 GK`), and `Tests` (`HISTORY [ Easy ]`, Draft, 28 Questions) with `0` console errors.
  - *`#/mcqs/test-series`:* Rendered `MindFlow v1.0.370`, `Master Your Next Examination.`, `Continue Learning`, `Popular Series` (`SSC CGL 2025 GK`), and `Browse Categories` (`SSC CGL`) with `0` console errors.
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

## 3. Pre-Planned Execution Brief for Next Version (v1.0.371)

- **Target Version:** `v1.0.371`
- **Target Branch:** `feat/v1.0.371-dedicated-bpsc-mock-tests-page`
- **Blueprint Reference:** Gen 1B, **Step 5** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Deliver a dedicated, offline-resilient student listing and discovery page for **BPSC Prepared Mock Tests** (and exam-aware prepared mock test discovery), backed by canonical exam aliasing, schedule-window-filtered queries (`DEC-0017`), and context-aware shortcuts from Dashboard / MCQs Hub / Mock Tests Home.
- **Exact Scope & Targets:**
  1. **Exam-Aware Prepared Mock Tests Data Layer ([`mockTestsApi.ts`](../../src/features/mock-tests/api/mockTestsApi.ts) & IndexedDB/SWR cache):**
     - Add `fetchPreparedMockTestsByExam(examId)` resolving canonical exam aliases via `getCanonicalExamById()` / `resolveCanonicalExamNames()` (`src/features/dashboard/constants/examRegistry.ts`) across active `exam_categories`, published `test_series`, and `isTestWithinScheduleWindow()`-filtered published `tests`.
     - Provide 0ms local cache hydration + background sync (`DEC-0004`).
  2. **Dedicated BPSC & Exam-Aware Listing Route (`src/features/mock-tests/pages/ExamPreparedMockTestsPage.tsx`, `src/config/`, [`AppRoutes.tsx`](../../src/routes/AppRoutes.tsx)):**
     - Add `/mcqs/test-series/bpsc` and `/mcqs/test-series/exam/:examSlug` routes in `src/config/` `ROUTES` and `AppRoutes.tsx`.
     - Render prepared BPSC test series & mock tests with `>=44x44px` `active:scale-95` filter chips (`All`, `Full-Length`, `Free`, `Attempted`), official exam specs (`duration_minutes`, `question_ids.length`, `total_marks`, `negative_marks`), direct Launch/Detail CTAs (`TestDetailPage`), and strict `DEC-0002` logical `<ArrowLeft />` return (no `navigate(-1)`).
  3. **Context-Aware Discovery Shortcuts ([`DashboardPage.tsx`](../../src/pages/DashboardPage.tsx), [`McqsQuizHomePage.tsx`](../../src/pages/McqsQuizHomePage.tsx), [`ExamCategoriesPage.tsx`](../../src/features/mock-tests/pages/ExamCategoriesPage.tsx)):**
     - Surface a prominent shortcut card to `/mcqs/test-series/bpsc` (or active exam slug) driven by `useExamContextStore((s) => s.activeExamId)` (`DEC-0001` & `DEC-0003`).
- **Circuit Breaker Check:**
  - *Files count:* Estimated `<= 7` modified/created (`<= 10` threshold). *New npm/Gradle dependencies:* **None**. *DB/RLS changes:* **None**.
- **Invariants to Protect:**
  - `DEC-0001` (Canonical `BPSC` exam aliasing from `examRegistry.ts`).
  - `DEC-0002` (Deterministic logical `<ArrowLeft />` back navigation via `NavigationManager`; never `navigate(-1)`).
  - `DEC-0003` (Single State Ownership Matrix via `useExamContextStore`).
  - `DEC-0004` (0ms offline-first IndexedDB cache).
  - `DEC-0008` (Native Android feel, `>=44x44px` touch targets, `active:scale-95`).
  - `DEC-0017` (`isTestWithinScheduleWindow()` + active-parent checks on student queries).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` (with new Vitest coverage for canonical BPSC filtering & listing filters) + `npx.cmd vite build` (clean).
  - *Live Browser (`http://localhost:3000/` via built-in browser):* Verify `/mcqs/test-series/bpsc` and context-aware Dashboard/MCQs Hub entry on both Desktop (`1280x800`) and Mobile (`390x844`) viewports, checking instant listing, filter chips, `>=44x44px` touch targets, logical `<ArrowLeft />` navigation, and 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.371.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 5 (`v1.0.371`) as `[x] DONE` with PR/commit in `docs/blueprint/v1.0_blueprint.md`, promote Step 6 (`v1.0.372`) to High-Definition Spec, and refine Step 10 (`v1.0.376`) to Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and Step 6 (`v1.0.372`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 5 in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (<=10 files, 0 new npm packages, 0 DB changes).
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.371 — Dedicated BPSC Prepared Mock Tests Page).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build) and run live smoke checks using the built-in browser at http://localhost:3000/#/mcqs/test-series/bpsc on Desktop (1280x800) and Mobile (390x844).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 5 DONE, promoting Step 6 v1.0.372, refining Step 10 v1.0.376), overwrite CURRENT_HANDOVER.md with Step 6 (v1.0.372), and output the starter prompt for v1.0.372.
```
