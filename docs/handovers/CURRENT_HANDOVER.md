# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + Dexie)
- **Current Baseline Version:** `v1.0.370` (PR `#1112`, commit `7f300b30` on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `npx.cmd tsc --noEmit`)
- **Unit & Component Tests:** Passed (`34/34` test files, `212/212` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `14/14` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx` + `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5479` modules transformed, PWA precache `196` entries / `6633.15 KiB`)
- **Database & Security Verification (`project_id: sjcfagpjstbfxuiwhlps`):**
  - Applied migration `supabase/migrations/20261122000000_harden_mock_tests_rls_and_leaderboard.sql`: locked `"Public read for leaderboard if completed"` (`USING (false)`), scoped all 11 policies on `exam_categories`, `test_series`, `tests`, and `user_test_attempts` `TO authenticated` with cascading active-parent + `release_date`/`expiry_date` schedule-window RLS, added `user_test_attempts.accuracy` + status/publish/schedule `CHECK` constraints, and created `public.get_test_leaderboard(p_test_id uuid, p_limit integer)` (`SECURITY DEFINER SET search_path = public, pg_temp`, `anon` execute revoked, `authenticated` execute granted).
  - `supabase_mcp.get_advisors(type="security")`: `0` mock-test RLS or anonymous `SECURITY DEFINER` issues.
- **Live Browser Verification (Built-In Browser, Desktop `1280x800` at `http://localhost:3000/`):**
  - *`#/admin/test-series?tab=tests`:* Hydrated cleanly across `Categories` (`SSC CGL`), `Series` (`SSC CGL 2025 GK`), and `Tests` (`HISTORY [ Easy ]`, Draft, `28 Questions`) with `0` console errors after reload.
  - *`#/mcqs/test-series`:* Rendered `MindFlow v1.0.370`, `Master Your Next Examination.`, `Continue Learning`, `Popular Series` (`SSC CGL 2025 GK`), and `Browse Categories` (`SSC CGL`) with `0` console errors.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 4B (`v1.0.370.1`) — Backend Assessment Nomenclature (`mock_*` / `quiz_*`), Modular `dbTables.ts` Registry & Frontend Sync (Approved Option A)**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.370.1` — Approved Option A)

- **Target Milestone:** `v1.0.370.1` (`package.json` SemVer: `1.0.370-1` so `v1.0.371`–`v1.0.380` numbering stays intact)
- **Target Branch:** `feat/v1.0.370.1-assessment-db-nomenclature`
- **Blueprint Reference:** Gen 1B, **Step 4B** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Standardize MindFlow's assessment backend nomenclature in Supabase (`public` schema) so **Admin-Prepared Preset Mock Tests (`mock_*`)** and **Custom Student Quizzes (`quiz_*`)** group cleanly in alphabetical blocks inside the Supabase Table Editor, update all 10 dependent PostgreSQL functions atomically, add `COMMENT ON TABLE` descriptions across assessment tables, and introduce a centralized `src/config/dbTables.ts` registry across the frontend.
- **CRITICAL CIRCUIT BREAKERS:**
  - **DB DDL / RPC MIGRATION:** **STOP and ask the user for explicit approval of the exact SQL migration before calling `apply_migration`!** First inspect live `pg_get_functiondef()` for all 10 affected functions in Supabase (`project_id: sjcfagpjstbfxuiwhlps`), draft the non-destructive `ALTER TABLE ... RENAME TO ...` + `CREATE OR REPLACE FUNCTION` + `COMMENT ON TABLE` migration (ZERO `DROP` statements so Supabase MCP elicitation doesn't auto-cancel), present it clearly, and wait for confirmation.
  - **>10 FILES THRESHOLD:** **Pre-approved by user under Option A** (`~22–26` files across `src/config/dbTables.ts`, APIs, components, sync services, and tests). *New npm/Gradle dependencies:* **None**.
- **Exact Scope & Targets (Approved Option A — Clean Rename):**
  1. **Non-Destructive PostgreSQL Table Renames (`supabase/migrations/20261122010000_standardize_assessment_nomenclature.sql`):**
     - **Block A — Admin-Prepared Preset Mock Tests (`mock_*`):**
       - `exam_categories` $\rightarrow$ **`mock_categories`**
       - `test_series` $\rightarrow$ **`mock_series`**
       - `tests` $\rightarrow$ **`mock_tests`**
       - `user_test_attempts` $\rightarrow$ **`mock_test_attempts`**
     - **Block B — Custom Student Quizzes (`quiz_*`):**
       - `saved_quizzes` $\rightarrow$ **`quiz_sessions`**
       - `bridge_saved_quiz_questions` $\rightarrow$ **`quiz_session_questions`**
       - `quiz_history` $\rightarrow$ **`quiz_session_results`**
     - Add `COMMENT ON TABLE` descriptions on all 7 renamed tables plus `questions`, `user_question_mastery`, `subject_metadata_cache`, `exam_configs`/`exam_submissions`/`exam_section_results`/`exam_stats_snapshots`/`official_answer_keys`, `user_exam_blueprints`/`blueprint_seen_questions`, and deprecation comment on unused `user_answers`.
  2. **Atomic Update of All 10 Live PostgreSQL Functions (Verified via `pg_proc.prosrc`):**
     - `public.get_test_leaderboard` *(plus `public.get_mock_test_leaderboard` alias or clean update with `REVOKE ALL ... FROM PUBLIC, anon; GRANT EXECUTE ... TO authenticated;`)*
     - `public.create_quiz_session`
     - `public.submit_quiz_session`
     - `public.clone_shared_quiz`
     - `public.export_user_data`
     - `public.backfill_user_question_mastery`
     - `public.cleanup_orphaned_bridge_rows`
     - `public.get_user_performance_metrics`
     - `public.record_question_interactions`
     - `public.reset_user_analytics`
  3. **Centralized Modular Registry (`src/config/dbTables.ts`) & Frontend Call-Site Sync:**
     - Create `src/config/dbTables.ts` exporting `DB_TABLES` (`MOCK`, `QUIZ`, `BANK`, `BLUEPRINT`, `RANKER`) and `DB_RPCS`.
     - Replace all raw `.from(...)` and PostgREST nested relation queries across Admin CMS (`adminTestSeriesApi.ts`, `AdminOverviewPage.tsx`, `AdminTestSeriesDashboard.tsx`, `AdminTestBuilderPage.tsx`, `SeriesCard.tsx`, `TestCard.tsx`, `TestDrawer.tsx`, `adminUsersService.ts`, `adminTestSeriesCms.test.tsx`), Student Mock Tests (`mockTestsApi.ts`, `TestDetailPage.tsx`, `TestsListPage.tsx`), and Custom Quizzes / Sync (`AttemptedQuizzesList.tsx`, `QuizSessionGuard.tsx`, `ResultGuard.tsx`, `SavedQuizzesList.tsx`, `useQuizSessionStore.ts`, `usePerformanceAnalytics.ts`, `quizCreationService.ts`, `quizProgressService.ts`, `useTodaysPlan.ts`, `DashboardPage.tsx`, `db.ts`, `syncService.ts`).
     - **CRITICAL OFFLINE-STORAGE RULE (`DEC-0004`):** Keep local browser IndexedDB store names (`'saved_quizzes'`, `'quiz_history'`) in `src/lib/db.ts` **unchanged** so existing offline user data is preserved; update ONLY remote Supabase `.from(DB_TABLES.QUIZ.*)` calls!
     - **PostgREST Relational Select Consistency (`DEC-0014`):** Ensure nested selects (`mock_series(..., mock_categories(...))`) match component property reads (or use clean PostgREST aliases / typed DTOs) so zero `"Unassigned Series"` UI flashes occur.
- **Invariants to Protect:**
  - `DEC-0004` (IndexedDB offline-first preservation — do NOT wipe or rename local `MindFlowDB` object stores).
  - `DEC-0014` (Relational mutation selects & `useNotification()` Popover toasts).
  - `DEC-0016` (CMS filters, publish parity, draft clone, cascade sync).
  - `DEC-0017` (All RLS policies `TO authenticated`, `mock_test_attempts` privacy lock, `get_test_leaderboard` `anon` revoke & `isTestWithinScheduleWindow()`).
- **Real-World Verification Goal:**
  - *Supabase Verification:* Query `pg_tables`, `pg_policies`, `pg_constraint`, `pg_proc.prosrc` (confirm `0` stale references to old table names across all `public` functions), and `supabase_mcp.get_advisors(type="security")`.
  - *Static:* `npx.cmd tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` (100% passing) + `npx.cmd vite build`.
  - *Live Browser (`http://localhost:3000/` via built-in browser at Desktop `1280x800`):* Verify `#/admin/test-series?tab=tests`, `#/mcqs/test-series`, and `#/quiz/config` (custom quiz load/history) render real data with `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.370.1.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0018`, `OLD-010`).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 4B (`v1.0.370.1`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md` and promote Step 5 (`v1.0.371`) to High-Definition Spec (`[ ] NEXT`).
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.370.1` verified baseline and Step 5 (`v1.0.371`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.370.1`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 4B (v1.0.370.1) in docs/blueprint/v1.0_blueprint.md
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check — NOTE: Option A (>10 files) is pre-approved, but Step 4B involves Supabase table renames & RPC updates, so inspect live function bodies via pg_get_functiondef() first and STOP to ask for my explicit approval of the exact non-destructive migration SQL before calling apply_migration.
3. Run System-2 Cognitive Pre-Flight: simulate lifecycles (including IndexedDB offline store preservation in src/lib/db.ts and PostgREST relational join keys), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.370.1 — Backend Assessment Nomenclature mock_* / quiz_*, Modular src/config/dbTables.ts Registry & Frontend Sync).
5. Verify via Supabase live queries (pg_tables, pg_policies, pg_proc stale-reference check, get_advisors type="security"), statically (npx.cmd tsc --noEmit && npx.cmd vitest --run --pool=forks --maxWorkers=1 && npx.cmd vite build), and run a Desktop 1280x800 live smoke check using the built-in browser on http://localhost:3000/#/admin/test-series?tab=tests, http://localhost:3000/#/mcqs/test-series, and http://localhost:3000/#/quiz/config.
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 4B v1.0.370.1 DONE and promoting Step 5 v1.0.371 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 5 (v1.0.371), and output the starter prompt for v1.0.371.
```
