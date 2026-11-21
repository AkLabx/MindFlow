# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.366`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Host: `D:\MindFlow-main`)
- **Static Typecheck:** Passed (0 errors via `npx.cmd tsc --noEmit`)
- **Production Build:** Verified cleanly via `npx.cmd vite build`
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 1 (`v1.0.367`) — Admin Mock Test Create/Edit Fix (`TestDrawer`, Counts & Touch Cards)**

---

## 2. Workstation & Runtime Testing Rules

- **Deterministic Slot & Port Architecture:**
  - **Slot 1 (Anchor / Host: `D:\MindFlow-main`):** Port `3000` (`http://localhost:3000/`) — Sole owner of `main`.
  - **Slot 2 (Worker 1):** Port `3001` (`http://localhost:3001/`) — Secondary session.
  - **Slot 3 (Worker 2):** Port `3002` (`http://localhost:3002/`) — Tertiary session.
- **Windows Command Runner Protocol:**
  - Use `npx.cmd` or `./node_modules/.bin/<tool>.cmd` on Windows shells to prevent PowerShell script execution policy errors.
  - Dev server startup: `npm run dev` (in Slot 1) or `npm run dev -- --port 3001` (in Worker 1).
- **Vite HMR Zero-Commit Live Preview:**
  - Vite hot-reloads edits on disk in milliseconds. AI agents and developers do NOT need to commit to git to preview or verify UI changes.
- **Android Native Feel Directives (Non-Negotiable):**
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (zero hover-only hidden action buttons), zero web-like layout bounce, `<KeyboardAwareBottomBar>`, and native `<dialog>`/`RightDrawer` sheets.

---

## 3. Pre-Planned Execution Brief for Next Version (v1.0.367)

- **Target Version:** `v1.0.367`
- **Target Branch:** `feat/v1.0.367-admin-mock-test-drawer-and-cards`
- **Blueprint Reference:** Gen 1B, **Step 1** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Fix critical blockers preventing Admins from creating, editing, and updating prepared Mock Tests (including BPSC tests) in `/admin/test-series`.
- **Exact Scope & Impacted Files (6 files `<= 10` Circuit Breaker):**
  1. **Repair & Complete [`TestDrawer.tsx`](../../src/features/admin/test-series/components/TestDrawer.tsx):**
     - Restore missing form fields: `description`, `duration_minutes`, `total_marks`, `passing_marks`, `negative_marks`, `display_order`, and optional `release_date` / `expiry_date`.
     - Add a **1-click BPSC Prelims Preset** button (`120 min`, `150 marks`, `passing 95`, `negative 0.33`) and group/label Series options with parent Exam Category names.
     - Wire sticky `<RightDrawer>` `footer` with `Cancel` and `Save Draft` / `Publish Test` submit button (`form="test-form"`), real `isDirty` unsaved-changes guard, and replace raw `window.alert()` with `react-hot-toast` + inline validation banner.
  2. **Align API Metadata in [`adminTestSeriesApi.ts`](../../src/features/admin/test-series/api/adminTestSeriesApi.ts):**
     - Allow optional `release_date` / `expiry_date` in `createTest` / `updateTest`, and select `test_series(id, name, category_id, exam_categories(id, name))` in `fetchTests`.
  3. **Fix Category Test Count Bug & Card Touch Accessibility:**
     - Fix `AdminTestSeriesDashboard.tsx` line 172 (`series.find(...)` bug) so `CategoryCard` counts tests across **all** series in that category.
     - Remove hover-only `opacity-0 group-hover:opacity-100` traps on `TestCard.tsx`, `SeriesCard.tsx`, and `CategoryCard.tsx`; enforce `>=44x44px` touch targets, `active:scale-95`, `aria-label`, and show `negative_marks` + `passing_marks` on `TestCard.tsx`.
- **Circuit Breaker Check:**
  - *Files:* 6 modified (`<= 10`). *New dependencies:* None. *DB migrations:* None. *Auth changes:* None.
- **Invariants to Protect:**
  - Stay strictly inside Admin Panel / Mock Tests CMS — do NOT pull in unrelated features (Gen 2 parked).
  - Preserve `NativeDialog` / `RightDrawer` Top Layer behavior (`DEC-0007`) and mobile touch ergonomics (`DEC-0008`).
- **Real-World Verification Goal:**
  - Static: `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vite build` (clean).
  - Live Browser (`http://localhost:3000/#/admin/test-series`): Create a BPSC mock test using the BPSC Prelims Preset, add questions, save Draft, re-open Edit and verify every field persists, publish, verify multi-series Category test count accuracy, and confirm Edit/Delete controls are visibly tappable at `390x844` mobile viewport.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.367.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 1 (`v1.0.367`) as `[x] DONE` with PR/commit in `docs/blueprint/v1.0_blueprint.md` and promote Step 2 (`v1.0.368`) to High-Definition Spec.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and Step 2 (`v1.0.368`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 1 in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.367 — Admin Mock Test Create/Edit Fix).
5. Verify statically (npx.cmd tsc --noEmit && npx.cmd vite build) and test live on http://localhost:3000/#/admin/test-series (desktop + 390x844 mobile viewport).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 2 (v1.0.368), and output the starter prompt for v1.0.368.
```
