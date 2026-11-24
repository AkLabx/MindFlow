# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.377` (`package.json` SemVer: `1.0.377`, PR `#1121`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Component Tests:** Passed (`41/41` test files, `261/261` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `5/5` in `src/features/admin/layouts/__tests__/adminShellRbac.test.tsx`, `7/7` in `src/features/admin/test-series/__tests__/adminTestAnalytics.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `10/10` in `src/features/mock-tests/__tests__/mockTestsProgressLeaderboard.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockScoringReview.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5487` modules transformed, PWA precache `207` entries / `6868.19 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - **Desktop (`1280x800`):**
    - `#/admin/test-series?tab=tests`: Verified `overflowPx: 0` (`1272 <= 1280`), `0` non-`type="button"` controls, `0` undersized buttons, `Admin > Mock Tests CMS > Mock Tests Catalog` breadcrumb, and `Admin > Control Room > Live Telemetry` on `#/admin/analytics`.
    - Pressed `Ctrl+K` $\rightarrow$ verified focused WAI-ARIA `combobox` + Mock Tests/BPSC quick actions $\rightarrow$ `ArrowDown` + `Enter` jumped to `#/admin/test-series/tests/new` $\rightarrow$ reopened `Ctrl+K` (verified clean empty search reset) $\rightarrow$ `"bpsc preview"` + `Enter` jumped to `#/mcqs/test-series/bpsc`, with `0` console errors/warnings on clean reload.
  - **Mobile (`390x844`):**
    - `#/admin/test-series?tab=tests`: Verified `0px` horizontal overflow (`390/390`), `>=44x44px` `type="button"` header buttons, opened mobile `NativeDialog` drawer (`296/296`, `0px` overflow, `19/19` controls `>=44x44px`), tapped `"Overview"` $\rightarrow$ confirmed auto-close + `#/admin/overview` navigation, opened mobile Command Palette (`358/358`, `0px` overflow, `19/19` buttons `>=44x44px`) $\rightarrow$ jumped back to `#/admin/test-series?tab=tests`, and `0` console errors/warnings.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 12 (`v1.0.378`) — Admin Question Bank & Preview Sync Reliability for Mock Preparation**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.378`)

- **Target Milestone:** `v1.0.378` (`package.json` SemVer: `1.0.378`)
- **Target Branch:** `feat/v1.0.378-question-bank-preview-sync`
- **Blueprint Reference:** Gen 1B, **Step 12** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Ensure editing or soft-deleting a question in `AdminQuestionsPage` / `QuestionInspectorDrawer` stays synchronized with prepared BPSC mock tests (`AdminTestBuilderPage`, `QuestionPreviewDrawer`, and 3-tier question/test caches) without leaving stale cached question payloads or broken `question_ids` references.
- **Exact Scope & Targets:**
  1. **Question Bank Nomenclature & Cross-Feature Cache Invalidation (`src/features/admin/questions/services/adminQuestionsService.ts`, `QuestionInspectorDrawer.tsx`, `AdminQuestionsPage.tsx`):**
     - Migrate any remaining raw `'questions'` queries in `adminQuestionsService.ts` to `DB_TABLES.BANK.QUESTIONS` (`DEC-0018`) and centrally invalidate React Query, `localStorage`, and `MindFlowDB.sync_metadata` question/test/analytics caches whenever `saveQuestion()` or `softDeleteQuestion()` runs.
  2. **Orphaned / Soft-Deleted `question_ids` Warning & 1-Tap Prune (`AdminTestBuilderPage.tsx`, `TestDrawer.tsx`, `QuestionBuilder`):**
     - Detect missing or soft-deleted `question_ids` when loading a mock test into `AdminTestBuilderPage` (and `TestDrawer` if applicable), display a clear diagnostic warning banner with count, and provide a 1-tap `Prune Missing Questions` action (`>=44x44px`, `type="button"`, `active:scale-95`) with `useNotification()` Popover feedback (`DEC-0014`).
  3. **Bilingual + KaTeX Preview Fidelity & Automated Tests (`QuestionPreviewDrawer.tsx`, `QuestionInspectorDrawer.tsx`):**
     - Verify English/Hindi + KaTeX rendering fidelity and `>=44x44px` `type="button"` controls inside `QuestionPreviewDrawer` / `QuestionInspectorDrawer`, and add targeted Vitest checks covering cache invalidation on question edit/soft-delete and 1-tap missing-question pruning.
  - *Out of scope:* Global Mock Tests SWR/Playwright test-suite expansion (Step 13 `v1.0.379`) and Supabase Security/Performance Advisor audit (Step 14 `v1.0.380`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 6` files inside `src/features/admin/questions/`, `src/features/admin/question-builder/`, `src/features/admin/test-series/`, and Vitest tests.
  - *New npm dependencies:* **None**.
  - *DB schema changes:* **None**.
  - *Invariants to protect:* `DEC-0004` (0ms IndexedDB SWR hydration), `DEC-0007` (native `<dialog>` / Popovers), `DEC-0008` (`>=44x44px` `type="button"` `active:scale-95`), `DEC-0014` (`useNotification()`), `DEC-0015` (no unpaged filter scans or updater `onChange`), `DEC-0017` (100-UUID chunked `.is('deleted_at', null)` validation), `DEC-0018` (`DB_TABLES.*`), `DEC-0024` (zero-PII analytics), `DEC-0025` (Admin shell error isolation).
- **Real-World Verification Goal:**
  - *Static:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (Desktop `1280x800` & Mobile `390x844`):* Edit/inspect a BPSC question in `#/admin/questions` (`QuestionInspectorDrawer`), immediately inspect it inside `#/admin/test-series/tests/:testId/edit` (`QuestionPreviewDrawer`), verify stale-cache invalidation + missing-question prune flow, `0px` mobile overflow, `>=44x44px` controls, and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.378.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0026`, and `OLD-016` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 12 (`v1.0.378`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 13 (`v1.0.379`) to High-Definition Spec (`[ ] NEXT`), and keep the rolling 4-step medium horizon updated.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.378` verified baseline and Step 13 (`v1.0.379`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.378`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 12 (v1.0.378) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 6 files, zero new npm packages, and zero DB DDL changes).
3. Run System-2 Cognitive Pre-Flight: simulate AdminQuestionsPage/QuestionInspectorDrawer edit & soft-delete lifecycles, cross-cache invalidation (React Query, localStorage, MindFlowDB.sync_metadata), orphaned question_ids pruning inside AdminTestBuilderPage, and bilingual/KaTeX QuestionPreviewDrawer rendering; identify 3 runtime failure modes and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.378 — Admin Question Bank & Preview Sync Reliability for Mock Preparation).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming live cache sync after question edit, orphaned-question prune UX, bilingual/KaTeX preview fidelity, >=44x44px type="button" controls, 0px mobile overflow, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 12 v1.0.378 DONE, promoting Step 13 v1.0.379 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 13 (v1.0.379), and output the starter prompt for v1.0.379.
```
