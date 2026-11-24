# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.379` (`package.json` SemVer: `1.0.379`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Integration Tests:** Passed (`43/43` test files, `273/273` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `6/6` in `src/features/mock-tests/__tests__/mockTestsSwrRegression.test.tsx`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, and `7/7` in `src/features/admin/test-series/__tests__/adminTestAnalytics.test.tsx`)
- **Playwright E2E Suite:** Passed (`1/1` passed via `npx.cmd playwright test --reporter=list` in `48.8s`, running `e2e/mock-tests-smoke.spec.ts` across `#/mcqs/test-series/bpsc` $\rightarrow$ `TestDetailPage` $\rightarrow$ CBT Runner $\rightarrow$ Scorecard $\rightarrow$ 1-by-1 Solution Review $\rightarrow$ 0ms SWR revisit with `0` console/page errors)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5489` modules transformed, PWA precache `208` entries / `6911.93 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - `#/mcqs/test-series/bpsc`: Verified 0ms SWR reload reuse (`mock_tests` skipped within 5m stale window), `Refresh` (`forceRefresh: true`) revalidation, `9.3ms` (`<16ms`) filter chip click latency, `>=44x44px` touch targets (`0` sub-44px controls), `0px` horizontal overflow (Desktop `1280x800` & Mobile `500x637`), and `0` console errors/warnings.
  - `#/admin/test-series?tab=tests`: Verified `"Mock Tests & Exam CMS"` rendered with `0px` horizontal overflow and `0` console errors/warnings.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 14 (`v1.0.380`) — End-to-End Security Advisor Audit, Android WebView Polish & Gen 1B Sign-Off**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.380`)

- **Target Milestone:** `v1.0.380` (`package.json` SemVer: `1.0.380`, plus `android/app/build.gradle` check if mobile shell adjusted)
- **Target Branch:** `feat/v1.0.380-gen1b-security-android-signoff`
- **Blueprint Reference:** Gen 1B, **Step 14** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Final production hardening pass across Supabase Security/Performance advisors, Android WebView tactile ergonomics, WCAG accessibility, and complete multi-persona live End-to-End verification to graduate Gen 1B cleanly at `v1.0.380` and scaffold Gen 2 (`v1.0.381`).
- **Exact Scope & Targets:**
  1. **Supabase Security & Performance Advisor Audit (`supabase_mcp`):**
     - Execute `get_advisors` (`type: "security"` and `type: "performance"`) on project `sjcfagpjstbfxuiwhlps`.
     - Verify RLS policies, `SECURITY DEFINER` `search_path` hardening, and index coverage across `public.mock_categories`, `public.mock_series`, `public.mock_tests`, `public.mock_test_attempts`, and `public.get_test_leaderboard` (`DEC-0017`, `DEC-0018`).
  2. **Android WebView Tactile & Layout Audit:**
     - Audit all student and admin mock-test routes (`ExamCategoriesPage`, `ExamPreparedMockTestsPage`, `TestsListPage`, `TestDetailPage`, `PreparedMockExamPage`, `PreparedMockResultPage`, `AdminTestSeriesDashboard`, `AdminTestBuilderPage`, `AdminQuestionsPage`) across Desktop (`1280x800`) and Mobile (`390x844` / `500x844`): verify `active:scale-95`, `>=44x44px` `type="button"` targets, `0px` horizontal overflow, `scroll-mb-28` clearance, `<KeyboardAwareBottomBar>`, and Android hardware back priority (`DEC-0002`, `DEC-0008`).
  3. **End-to-End Multi-Persona Verification & Gen 1B Graduation:**
     - Verify Admin CMS $\rightarrow$ Student Discovery $\rightarrow$ CBT Runner $\rightarrow$ Scorecard & Bilingual Solution Review $\rightarrow$ Continue Learning / Series Progress / Leaderboard $\rightarrow$ Admin Analytics end-to-end.
     - Formally mark Gen 1B `COMPLETED` in `docs/blueprint/main_blueprint.md` and scaffold the Gen 2 blueprint (`docs/blueprint/v2.0_blueprint.md` or Gen 2 section) for Step 15 (`v1.0.381`).
  - *Out of scope:* Net-new feature development; this milestone is strictly dedicated to security/performance verification, tactile polish, and Gen 1B graduation.
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 7` consolidation/doc files (stop & ask if any DB DDL migration is needed to resolve a Supabase Advisor warning).
  - *New npm dependencies:* **None**.
  - *DB schema changes:* **None** without explicit user confirmation.
  - *Invariants to protect:* `DEC-0001` through `DEC-0027` (`<HashRouter>`, OAuth hash extraction, no guest mode, 0ms IndexedDB SWR, `DB_TABLES.*` / `DB_RPCS.*`, native `<dialog>`/Popover UI, `>=44x44px` `type="button"` `active:scale-95`, zero-PII analytics/caches, `**/e2e/**` excluded in `vitest.config.ts`).
- **Real-World Verification Goal:**
  - *Static & Automated:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`43/43` files, `273/273` tests) + `npx.cmd vite build` + `npx.cmd playwright test --reporter=list`.
  - *Database & Live Browser:* Zero critical Supabase Advisor warnings, zero WCAG/touch-target failures on mobile, and verified end-to-end flows in Chrome DevTools MCP (`0` console errors).

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.380.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0028`, and `OLD-017` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 14 (`v1.0.380`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, graduate Gen 1B to `COMPLETED` in `docs/blueprint/main_blueprint.md`, and scaffold Gen 2 (`v1.0.381`).
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.380` verified baseline and Step 15 (`v1.0.381`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.380`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 14 (v1.0.380) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 7 files, zero new npm packages, and zero unapproved DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: trace end-to-end Admin-to-Student lifecycle, Android WebView tactile/back-button/viewport edge cases, and Supabase RLS/performance invariants; identify 3 runtime failure modes and enforce zero-shortcut real verification.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.380 — End-to-End Security Advisor Audit, Android WebView Polish & Gen 1B Sign-Off).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build), run Playwright E2E (npx.cmd playwright test --reporter=list), run Supabase Security & Performance Advisors via MCP, and verify Desktop + Mobile UX in Chrome DevTools MCP with 0 console errors.
6. Execute the mandatory 7-step Phase 4 closeout ritual (including graduating Gen 1B in docs/blueprint/main_blueprint.md and scaffolding Gen 2 v1.0.381), overwrite CURRENT_HANDOVER.md with Step 15 (v1.0.381), and output the starter prompt for v1.0.381.
```
