# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.368`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (0 errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`5/5` tests in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx` via `npx.cmd vitest --run --pool=forks`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5478` modules transformed, clean PWA build)
- **Live Browser Verification:** Verified Desktop (`1280x800`) + Mobile (`390x844`) at `/#/admin/test-series/tests/new?step=3` — `8` `get_distinct_values` RPC requests (0 unpaged scans), `canonical:bpsc` resolved 20 aliases (`5794` results), 0 refetches across 20 add/remove toggles, 0 console errors/warnings, Popover toast on Bulk Add + Undo, `165x44px` mobile tabs, `44x44px` buttons, `0` `button:not([type="button"])`, and 0 horizontal overflow
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 3 (`v1.0.369`) — Admin Mock Tests CMS Controls (Filters, Quick Publish, Clone & Cascade Guard)**

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

## 3. Pre-Planned Execution Brief for Next Version (v1.0.369)

- **Target Version:** `v1.0.369`
- **Target Branch:** `feat/v1.0.369-admin-mock-tests-cms-controls`
- **Blueprint Reference:** Gen 1B, **Step 3** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Give admins fast, safe CMS controls over mock tests and series directly from `/admin/test-series`—adding Category/Series/Status filters, 1-tap readiness-guarded Publish/Unpublish, Test Cloning, and child-count cascade delete warnings.
- **Exact Scope & Impacted Files (`<= 6` files inside `src/features/admin/test-series/`):**
  1. **Category, Series & Status Filters in [`AdminTestSeriesDashboard.tsx`](../../src/features/admin/test-series/pages/AdminTestSeriesDashboard.tsx):**
     - Add Category filter dropdown (`categories`), Series filter dropdown (`series`, scoped to the selected category when active), and Status pills (`All` / `Published` / `Draft`) for the `tests` tab (plus Category filter on the `series` tab) with `min-h-[44px]` touch controls and a `"Reset Filters"` action when filters return 0 results.
     - Keep `searchQuery` + filter state unified inside `filteredSeries` and `filteredTests` while preserving the $O(C+S+T)$ `categoryStats` `Map`.
  2. **1-Tap Quick Publish/Unpublish & Clone Test in [`TestCard.tsx`](../../src/features/admin/test-series/components/TestCard.tsx), [`adminTestSeriesApi.ts`](../../src/features/admin/test-series/api/adminTestSeriesApi.ts), and [`useTests.ts`](../../src/features/admin/test-series/hooks/useTests.ts):**
     - Add `cloneTest(sourceTest)` in `adminTestSeriesApi.ts` inserting a Draft copy (`is_published: false`, `name: "${source.name} (Copy)"`) and returning `TEST_SELECT_QUERY` relational joins (`DEC-0014`).
     - Expose `onTogglePublish` and `onClone` `type="button"` `min-w-[44px] min-h-[44px]` `active:scale-95` buttons on `TestCard.tsx`. Guard 1-tap publish against empty `question_ids` or invalid `duration_minutes <= 0` using MindFlow Top-Layer Popover `useNotification()` feedback.
     - Migrate `useTests.ts` (`addTest`, `editTest`, `removeTest`) from unmounted `react-hot-toast` to `useNotification()` Popover toasts (`DEC-0014`).
  3. **Cascade-Safe Delete Warnings in [`AdminTestSeriesDashboard.tsx`](../../src/features/admin/test-series/pages/AdminTestSeriesDashboard.tsx):**
     - Upgrade `confirmDialog` messages before invoking `removeCategory`, `removeSeries`, or `removeTest` to show exact affected child counts (e.g., `X test series and Y mock tests` for a Category, `Y mock tests` for a Series, and question count / publish status for a Test).
- **Circuit Breaker Check:**
  - *Files:* `<= 6` modified (`<= 10` threshold). *New dependencies:* None. *DB migrations:* None. *Auth changes:* None.
- **Invariants to Protect:**
  - `DEC-0008` (`>=44x44px` always-visible touch buttons, `active:scale-95`).
  - `DEC-0014` (`useNotification()` Top-Layer Popover toasts instead of `react-hot-toast`, relational `TEST_SELECT_QUERY`/`SERIES_SELECT_QUERY` mutation returns).
- **Real-World Verification Goal:**
  - *Static:* `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vitest --run --pool=forks` + `npx.cmd vite build` (clean).
  - *Live Browser (`http://localhost:3000/#/admin/test-series?tab=tests` on **Desktop `1280x800` only** — Admin Panel is desktop-primary; reserve mobile `390x844` browser testing for student-facing steps `v1.0.371`+):* Filter Tests by Category (`BPSC`) and Status (`Draft`), clone an existing BPSC test as `"(Copy)"`, verify zero-question publish guard displays a Popover warning, toggle Publish/Unpublish with 1 tap, verify cascade `ConfirmDialog` displays exact child counts, clean up the cloned test, and verify 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.369.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 3 (`v1.0.369`) as `[x] DONE` with PR/commit in `docs/blueprint/v1.0_blueprint.md`, promote Step 4 (`v1.0.370`) to High-Definition Spec (noting its DB/RLS Circuit Breaker!), and refine Step 8 (`v1.0.374`) to Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and Step 4 (`v1.0.370`) brief.
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
   - Active Step 3 in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.369 — Admin Mock Tests CMS Controls: Filters, Quick Publish, Clone & Cascade Guard).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks && npx.cmd vite build) and test live on http://localhost:3000/#/admin/test-series?tab=tests (Desktop 1280x800 only — skip mobile browser check for Admin CMS).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 4 (v1.0.370), and output the starter prompt for v1.0.370.
```
