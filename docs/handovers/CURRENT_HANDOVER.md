# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.367`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (0 errors via `npx.cmd tsc --noEmit`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`AdminTestBuilderPage` + `AdminTestSeriesDashboard` chunks clean)
- **Live Browser Verification:** Verified Desktop (`1280x800`) + Mobile (`390x844`) with 0 console errors, 0 accidental form submits, Popover toasts, deep-link Edit hydration, `0`-value persistence, and 44px touch cards
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 2 (`v1.0.368`) — Admin `QuestionBuilder` Performance, Refetch-Loop Fix & Canonical BPSC Filter**

---

## 2. Workstation & Runtime Testing Rules

- **Deterministic Slot & Port Architecture:**
  - **Slot 1 (Anchor / Host):** Port `3000` (`http://localhost:3000/`) — Sole owner of `main`.
  - **Slot 2 (Worker 1):** Port `3001` (`http://localhost:3001/`) — Secondary session.
  - **Slot 3 (Worker 2):** Port `3002` (`http://localhost:3002/`) — Tertiary session.
- **Windows Command Runner Protocol:**
  - Use `npx.cmd` or `npm.cmd` on Windows shells to prevent PowerShell script execution policy errors.
  - Dev server startup: `npm run dev` (in Slot 1) or `npm run dev -- --port 3001` (in Worker 1).
- **Vite HMR Zero-Commit Live Preview:**
  - Vite hot-reloads edits on disk in milliseconds. AI agents and developers do NOT need to commit to git to preview or verify UI changes.
- **Android Native Feel Directives (Non-Negotiable):**
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (zero hover-only hidden action buttons), zero web-like layout bounce, `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (v1.0.368)

- **Target Version:** `v1.0.368`
- **Target Branch:** `feat/v1.0.368-question-builder-perf-and-bpsc-filter`
- **Blueprint Reference:** Gen 1B, **Step 2** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Eliminate root-level query bottlenecks, render-phase `setState` warnings, missing `type="button"` attributes, tiny mobile hit targets, and raw exam alias mismatches inside the Admin `QuestionBuilder`.
- **Exact Scope & Impacted Files (`<= 6` files inside `src/features/admin/question-builder/`):**
  1. **Fix Refetch Loop & Render-Phase `onChange` in [`QuestionBuilder.tsx`](../../src/features/admin/question-builder/components/QuestionBuilder.tsx):**
     - Fix `useEffect([initialQuestionIds])` so toggling selected questions does NOT trigger redundant Supabase `questions?id=in.(...)` refetches on every parent state update.
     - Move all `onChange(...)` calls outside `setSelectedQuestions(prev => ...)` updater functions so parent components never receive render-phase updates.
  2. **Explicit `type="button"` & `>=44x44px` Mobile Touch Targets:**
     - Add explicit `type="button"` across [`QuestionFilterBar.tsx`](../../src/features/admin/question-builder/components/QuestionFilterBar.tsx), [`QuestionResultCard.tsx`](../../src/features/admin/question-builder/components/QuestionResultCard.tsx), [`QuestionSearchPanel.tsx`](../../src/features/admin/question-builder/components/QuestionSearchPanel.tsx), and [`SelectedQuestionsPanel.tsx`](../../src/features/admin/question-builder/components/SelectedQuestionsPanel.tsx).
     - Increase the mobile `"Add to test"` row button touch target in `QuestionResultCard.tsx` from `20x20px` to `min-w-[44px] min-h-[44px]` with `active:scale-95`.
  3. **Optimize Filter Options & Add Canonical BPSC Exam Filter in [`questionBuilderApi.ts`](../../src/features/admin/question-builder/api/questionBuilderApi.ts):**
     - Replace the unpaged full-table scan in `fetchFilterOptions()` (silently capped at 1,000 rows by PostgREST) with lightweight cached metadata / distinct values.
     - Add canonical exam group filtering (e.g., selecting `BPSC` resolves all 19 canonical BPSC `dbExamNames` from `src/features/dashboard/constants/examRegistry.ts` per `DEC-0001`).
- **Circuit Breaker Check:**
  - *Files:* `<= 6` modified (`<= 10` threshold). *New dependencies:* None. *DB migrations:* None. *Auth changes:* None.
- **Invariants to Protect:**
  - `DEC-0001` (Canonical `BPSC` alias resolution from `examRegistry.ts`).
  - `DEC-0008` (`>=44x44px` mobile touch targets and `active:scale-95` feedback).
  - `DEC-0014` (Keep `QuestionBuilder` decoupled from `<form>` and use `useNotification()` Popover toasts).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vite build` (clean).
  - *Live Browser (`http://localhost:3000/#/admin/test-series/tests/new?step=3` on Desktop `1280x800` + Mobile `390x844`):* Filter by canonical `BPSC` (confirming all 19 BPSC aliases are resolved), add/remove 10 questions rapidly, verify zero redundant `questions?id=in.(...)` refetches in Network DevTools, zero React render-phase console errors/warnings, and `>=44x44px` mobile `"Add to test"` button dimensions.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.368.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 2 (`v1.0.368`) as `[x] DONE` with PR/commit in `docs/blueprint/v1.0_blueprint.md` and promote Step 3 (`v1.0.369`) to High-Definition Spec (and refine Step 7 to Medium Detail).
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and Step 3 (`v1.0.369`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 2 in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.368 — Admin QuestionBuilder Performance, Refetch-Loop Fix & Canonical BPSC Filter).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vite build) and test live on http://localhost:3000/#/admin/test-series/tests/new?step=3 (desktop + 390x844 mobile viewport).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 3 (v1.0.369), and output the starter prompt for v1.0.369.
```
