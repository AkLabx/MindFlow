# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.380` (`package.json` SemVer: `1.0.380`, on `main`)
- **Android App Version:** `versionCode 7`, `versionName "1.7"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Integration Tests:** Passed (`43/43` test files, `275/275` tests passed in `286.17s` via `npx.cmd vitest --run --pool=forks --maxWorkers=1`)
- **Playwright E2E Suite:** Passed (`1/1` passed in `58.0s` via `npx.cmd playwright test --reporter=list`, running `e2e/mock-tests-smoke.spec.ts` in `41.3s`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5489` modules transformed, `2m 14s`, PWA v1.3.0 `generateSW`, precache `208` entries / `6914.44 KiB`)
- **Supabase Security & Performance Advisor Sign-Off (`v1.0.380` Zero-DDL):**
  - `get_advisors(type="security")`: `0` ERRORs; `4` non-blocking WARN categories (`extension_in_public` for `pg_trgm`/`pg_net`, `auth_leaked_password_protection`, `anon_security_definer_function_executable` on 5 non-mock AI/telemetry worker RPCs, `authenticated_security_definer_function_executable` including expected `get_mock_test_leaderboard`, `get_test_leaderboard`, `is_admin`, `create_quiz_session`, `submit_quiz_session`).
  - `get_advisors(type="performance")`: `0` ERRORs; `5/5` `mock_*` tables `rowsecurity = true`, `"Public read for leaderboard if completed"` locked `USING (false)`, `get_mock_test_leaderboard` / `get_test_leaderboard` / `is_admin` all verified with `search_path = public, pg_temp`, `anon_exec = false`, `auth_exec = true`, and 6 covering indexes (`idx_test_series_category`, `test_series_slug_key`, `idx_tests_series`, `idx_leaderboard`, `idx_user_attempts_user`, `idx_user_attempts_test`).
  - Documented non-blocking `WARN`/`INFO` backlog queued into Gen 2 Step 1 (`v1.0.381`): (a) `multiple_permissive_policies` on `mock_*`, (b) `anon` `EXECUTE` on 5 non-mock AI/telemetry worker RPCs, and (c) `chat_room_messages` / `chat_message_reactions` `auth_rls_initplan` + 2 unindexed FK `INFO` lints.
- **Live Browser Verification (External Chrome DevTools MCP against `http://localhost:3000/`):**
  - **Mobile (`390x844`):** `0px` horizontal overflow across `#/mcqs/test-series`, `#/mcqs/test-series/bpsc`, `#/mcqs/test-series/category/...` (`TestSeriesPage`: `0` sub-44px buttons), `#/mcqs/test-series/series/...`, `#/mcqs/test-series/test/.../result/...` (error state: `0` sub-44px buttons), `#/admin/test-series?tab=tests` + Analytics Drawer (`dialogOpen: true`, `hasPiiStrings: false`, `overflowPx: 0`; non-blocking `All` pill `39x44px` noted on dashboard), `#/admin/test-series/tests/new?step=3`, and `#/admin/questions` (`0` sub-44px buttons).
  - **Desktop (`1280x637` in `1280x800` window):** `0px` horizontal overflow (`scrollWidth: 1272`, `innerWidth: 1280`) across `#/admin/questions`, `#/admin/test-series?tab=tests`, `#/admin/test-series/tests/new?step=3`, `#/mcqs/test-series`, and `#/mcqs/test-series/bpsc`; `0` console errors; network queries scoped strictly to authenticated `user_id` with `0` cross-user `answers` leaks.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`) `COMPLETED`**
- **Active Generation Blueprint:** [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md) — **Gen 2 (`v1.0.381` $\rightarrow$ `v1.0.390`): Community Chatrooms & Study Rooms Hardening (`src/features/community/`)**
- **Next Active Step:** **Step 1 (`v1.0.381`) — Community Chatroom DB RLS/Index Hardening & Realtime v2 Channel Resilience**

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

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.381`)

- **Target Milestone:** `v1.0.381` (`package.json` SemVer: `1.0.381`)
- **Target Branch:** `feat/v1.0.381-community-rls-realtime-resilience`
- **Blueprint Reference:** Gen 2, **Step 1** in [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md)
- **Objective:** Kick off Gen 2 (`src/features/community/`) by resolving the documented `chat_room_messages` and `chat_message_reactions` Supabase Advisor RLS/FK lints via a non-destructive additive migration and hardening Supabase Realtime v2 channel lifecycle, reconnect recovery, and query safety in active community study rooms.
- **Exact Scope & Targets:**
  1. **Community Chatroom Database RLS & Index Migration (Circuit Breaker #3 Applies):**
     - Inspect live `pg_policies` and `pg_indexes` on `public.chat_room_messages` and `public.chat_message_reactions` via `supabase_mcp`.
     - Draft a non-destructive SQL migration wrapping `auth.uid()` in `(SELECT auth.uid())` to fix `auth_rls_initplan`, consolidating duplicate permissive policies cleanly without altering access semantics, and adding covering indexes for `chat_message_reactions_user_id_fkey` and `chat_room_messages_reply_to_id_fkey`.
     - **STOP and ask the user for explicit confirmation** on the exact SQL DDL migration before executing via `supabase_mcp` (`Circuit Breaker #3`).
  2. **Chat API Query Hygiene (`src/features/community/api/chatApi.ts`):**
     - Audit message/reaction/room fetchers, pagination bounds, error translation, and mutation returns for type-safety, zero PII leakage, and clean optimistic/server reconciliation.
  3. **Realtime v2 Channel Resilience (`src/features/community/hooks/useSocialRealtime.ts`, `src/features/community/pages/ActiveChatRoom.tsx`):**
     - Harden Realtime channel subscription deduplication, reconnect/resync on `visibilitychange` and `online` events, clean `supabase.removeChannel()` teardown on room switch/unmount, and targeted Vitest unit/integration tests.
  - *Out of scope:* Offline voice/text outbox queueing (`v1.0.382`), WebM audio duration/waveform player (`v1.0.383`), unread badges/keyboard bar (`v1.0.384`), and unrelated Gen 1B `mock-tests`/`admin` modules.
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `5–7` files (`<= 10` threshold).
  - *New npm dependencies:* **None**.
  - *DB schema/RLS changes:* **Triggers Circuit Breaker #3** — present exact additive SQL DDL migration for `chat_room_messages` & `chat_message_reactions` and await explicit user confirmation before applying.
  - *Invariants to protect:* `DEC-0001` through `DEC-0028` (`<HashRouter>`, OAuth hash extraction, no guest mode, 0ms IndexedDB hydration, `DB_TABLES.*` / `DB_RPCS.*`, native `<dialog>`/Popover UI, `>=44x44px` `type="button"` `active:scale-95`, MindFlow Indigo/Violet chat theme `DEC-0011`, `DEC-0012` viewport/audio/swipe invariants, `**/e2e/**` excluded in `vitest.config.ts`).
- **Real-World Verification Goal:**
  - *Static & Automated:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Database & Live Browser:* `supabase_mcp.get_advisors(type="performance")` confirms `0` `auth_rls_initplan` or unindexed FK warnings on `chat_room_messages` / `chat_message_reactions`; Chrome DevTools MCP on `http://localhost:3000/` verifies live room hydration, message/reaction updates, reconnect resync, `0px` horizontal overflow (`390x844` + `1280x800`), and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.381.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0029`, and `OLD-018` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 1 (`v1.0.381`) as `[x] DONE` with PR `#` in `docs/blueprint/v2.0_blueprint.md`, promote Step 2 (`v1.0.382`) to High-Def Spec, and refine Step 6 (`v1.0.386`) from Vision into Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.381` verified baseline and Step 2 (`v1.0.382`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.381`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 1 (v1.0.381) in docs/blueprint/v2.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 10 files, zero new npm packages, and note that Circuit Breaker #3 WILL trigger for the additive RLS/index SQL migration on chat_room_messages and chat_message_reactions — inspect live pg_policies/pg_indexes and ask for explicit approval before applying DDL).
3. Run System-2 Cognitive Pre-Flight: trace Realtime v2 mount, room switch, background/visibility reconnect, network drop, and unmount cleanup lifecycles; identify 3 runtime failure modes and enforce zero-shortcut real verification.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.381 — Community Chatroom DB RLS/Index Hardening & Realtime v2 Channel Resilience).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build), verify Supabase Advisors via MCP, and verify Desktop + Mobile UX in Chrome DevTools MCP with 0 console errors.
6. Execute the mandatory 7-step Phase 4 closeout ritual in docs/blueprint/v2.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 2 (v1.0.382), and output the starter prompt for v1.0.382.
```
