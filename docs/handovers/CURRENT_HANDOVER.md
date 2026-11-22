# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.369`
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (0 errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`17/17` tests across `2` files via `npx.cmd vitest --run --pool=forks --maxWorkers=1`: `10/10` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx` + `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5479` modules transformed, clean PWA production build)
- **Live Browser Verification (Desktop `1280x800`):**
  - *Part A (`/#/admin/test-series?tab=tests`):* Verified URL-synced Category/Series/Status filters + cross-tab Category persistence + `Reset Filters`, 1-tap Draft Clone (`"HISTORY [ Easy ] (Copy)"` with intact `"SSC CGL · SSC CGL 2025 GK"` label & Popover toast), 1-tap Publish/Unpublish with KPI updates, Cascade Delete `ConfirmDialog` exact child counts (`1 test series and 2 mock tests`, `2 mock tests`, `28 questions` + Draft status), temporary clone cleanup, and 0 console errors.
  - *Part B (`/#/admin/test-series/tests/new?step=3`):* Verified swift mount, `7` `get_distinct_values` HTTP 200 RPCs (0 unpaged scans), `Filter by Sub-Topic` (`51` capped options, `"Showing 50 of 424 matches"`, `"Photosynthesis"` $\rightarrow$ `27` results), `Filter by Exam Date / Shift` (`51` capped options, `"Showing 50 of 332 matches"`, `"Shift-1"` $\rightarrow$ `34` options, `"01 Oct 2026 (10:00 AM (Shift-1))"` $\rightarrow$ `25` results with card badges), chip removal restoring `10470` results, 0 console errors, and 0 `button:not([type="button"])`.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 4 (`v1.0.370`) — Mock Tests & Admin RBAC Database Security & RLS Hardening**

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

## 3. Pre-Planned Execution Brief for Next Version (v1.0.370)

- **Target Version:** `v1.0.370`
- **Target Branch:** `feat/v1.0.370-mock-tests-rls-security-hardening`
- **Blueprint Reference:** Gen 1B, **Step 4** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Audit and harden all Supabase tables, RLS policies, leaderboard RPCs, and schedule visibility rules backing Mock Tests and Admin CMS so student attempt payloads stay private and only verified RBAC admins can mutate test series content.
- **CRITICAL CIRCUIT BREAKER (DB / RLS MIGRATION):**
  - **STOP and ask the user for explicit approval before applying any SQL migration!** You MUST first inspect live Supabase policies/functions via Supabase MCP (`execute_sql` / `list_migrations`), draft the exact additive/hardening SQL migration, present it clearly to the user, and wait for confirmation before calling `apply_migration`.
- **Exact Scope & Targets:**
  1. **RBAC RLS Policy Hardening (`exam_categories`, `test_series`, `tests`, `user_test_attempts`):**
     - Inspect live RLS policies on all 4 tables in Supabase (`project_id: sjcfagpjstbfxuiwhlps`).
     - Replace any legacy hardcoded admin email RLS policies with `(SELECT public.is_admin())` across `exam_categories`, `test_series`, `tests`, and `user_test_attempts`.
  2. **Leaderboard `answers` JSONB Privacy Leak Fix (`user_test_attempts`):**
     - Eliminate any public/cross-user `SELECT` policy on `user_test_attempts` that exposes another student's raw `answers` JSONB payload.
     - Replace direct cross-user table reads with a safe `SECURITY DEFINER` leaderboard RPC (`SET search_path = public`) returning only non-sensitive leaderboard fields (rank, display name/avatar, score, accuracy, time taken, completed timestamp).
  3. **Schedule Window & Publish Integrity Enforcement ([`mockTestsApi.ts`](../../src/features/mock-tests/api/mockTestsApi.ts) & [`adminTestSeriesApi.ts`](../../src/features/admin/test-series/api/adminTestSeriesApi.ts)):**
     - Enforce `release_date` / `expiry_date` schedule window checks in `mockTestsApi.ts` (and matching RLS visibility rules for non-admin students) so unreleased or expired tests are hidden from student listings.
     - Enforce publish integrity checks (`tests.question_ids` non-empty / valid reference guard) and add Vitest unit/contract tests for schedule-window filtering, leaderboard projection, and publish integrity.
- **Circuit Breaker Check:**
  - *Client files:* `<= 6` modified (`<= 10` threshold). *New npm/Gradle dependencies:* None. *DB/RLS changes:* **TRIGGERED** — inspect live policies first and obtain explicit user approval before running `apply_migration`.
- **Invariants to Protect:**
  - `DEC-0006` (No guest login; all users authenticate with real accounts).
  - `DEC-0014` (`useNotification()` Popover toasts, relational `TEST_SELECT_QUERY` / `SERIES_SELECT_QUERY` mutation selects).
  - `DEC-0016` (CMS parity publish validation, schedule nulling on clone, cascade hook sync).
  - Database Function Safety (`AGENTS.md`): `SECURITY INVOKER` by default; when `SECURITY DEFINER` is strictly required (e.g., anonymized leaderboard RPC), always include `SET search_path = public` and explicit authorization/projection bounds.
- **Real-World Verification Goal:**
  - *Supabase Security Advisors:* Run `supabase_mcp.get_advisors(type="security")` and verify 0 mock-test RLS/function findings; verify non-admin JWT cannot mutate admin tables or query another user's `answers` JSONB.
  - *Static:* `npx.cmd tsc --noEmit` (0 errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build` (clean).
  - *Live Browser (`http://localhost:3000/` on Desktop `1280x800`):* Run smoke check on `#/admin/test-series?tab=tests` and student mock-tests listing to confirm zero regressions and 0 console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.370.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (Table 1 or Table 2).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 4 (`v1.0.370`) as `[x] DONE` with PR/commit in `docs/blueprint/v1.0_blueprint.md`, promote Step 5 (`v1.0.371`) to High-Definition Spec, and refine Step 9 (`v1.0.375`) to Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the new baseline and Step 5 (`v1.0.371`) brief.
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
   - Active Step 4 in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check — NOTE: Step 4 involves Supabase RLS/SQL hardening, so inspect live policies first and STOP to ask for my explicit approval of the migration SQL before calling apply_migration.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles, identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.370 — Mock Tests & Admin RBAC Database Security & RLS Hardening).
5. Verify via Supabase Security Advisors (get_advisors type="security"), statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build), and run a Desktop 1280x800 live smoke check on http://localhost:3000/#/admin/test-series?tab=tests and student mock-tests entry.
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 4 DONE, promoting Step 5 v1.0.371, refining Step 9 v1.0.375), overwrite CURRENT_HANDOVER.md with Step 5 (v1.0.371), and output the starter prompt for v1.0.371.
```
