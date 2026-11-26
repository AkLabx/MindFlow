# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly `< 6 KB`. Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.385.1`** *(27 Nov 2026 | Gen 2 Step 5A)* — `pkg` `1.0.385.1` | Android `1.13` (`13`) *(Prior: `v1.0.385` `#1136`, `v1.0.384`, `v1.0.383.2`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`343`, `336.15s`) | `vite build` (`215` PWA / `7241.65 KiB`) | `playwright` (`2/2`, `1.2m`) | DevTools (`390x844` & `1280x800`: `#desktop-mode-warning` hidden, `0px` overflow, `0` console err).
- **PENDING REMOTE DB APPLY:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) is **still not applied remotely** on `sjcfagpjstbfxuiwhlps` (`bundle_items_table: null`, `18` `MF-` rows; MCP DDL confirmation auto-cancelled & CLI lacked `SUPABASE_ACCESS_TOKEN`). Apply via Supabase Dashboard SQL Editor or `npx supabase db push`.
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth/recovery/verification interception (`useAppBootstrap.ts` + `extractAuthHashParams` + `mindflow_auth_hydrating`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy`, 5-key v3.0 `explanation`, `<QuizExplanation />` (`DEC-0033`), `DedicatedPageHeader` + `isHeaderHiddenRoute`, 5-tab footer, `#/exam/:testId` `resolveMockTestAccess` gate, `overflow-x-clip`+`fixed bottom-0` CBT footers, `>=6px` AI orb gap (`DEC-0030`–`0032`).
- Keep `<TestLeaderboardCard />` ONLY inside `PreparedMockResultPage` `Leaderboard` tab, `SwipeableTabViewport` `1:1` `translate3d` + `.mf-h-rail`, `examOnboardingRegistry`, `MIND-`/`ORD-` prefixes, `QuizConfig` + `shiftSorting.ts` (`DEC-0034`).
- Keep `__cbt_meta` stripped from submitted `mock_test_attempts.answers`, `mindflow_mock_attempt_timing_*` snapshots, `MIN_PASSWORD_LENGTH = 8`, `emailRedirectTo`, `identities.length === 0` guard, automated `AuthPage` `verify-email` wait step (never increment brute-force lockout on `'Email not confirmed'`), standalone-only `#desktop-mode-warning` in `index.html` (never `android-app://` referrer), `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)` (`DEC-0035`, `DEC-0036`).

---

## 3. Target Execution Brief for Next Chat: `v1.0.386` (Gen 2 Step 6)
- **Target Branch:** `feat/v1.0.386-offline-mock-entitlement-sync`
- **Scope (`v2.0_blueprint.md` Step 6):**
  1. **Remote Migration Sync Check:** Check `schema_migrations` (`sjcfagpjstbfxuiwhlps`) for `20261126220000_v1_0_384_bundles_shifts_mind_id.sql` (verify `0` `MF-` rows + `mock_series_bundle_items` live).
  2. **Offline Mock Caching & Entitlement Hydration (`mockTestsApi.ts`):** Harden 3-tier SWR + `MindFlowDB` caching for course entitlements, bundle child unlocks, and purchased series metadata while strictly preventing paid test question payload leaks before entitlement verification.
  3. **Online / Visibility Sync Reconciliation (`syncService.ts`, `mockTestsApi.ts`):** Reconcile stale entitlements and replay queued `mock_test_attempt_submit` / bookmark events on `online` & `visibilitychange` without wiping `mock_active_attempt_*` or duplicating submissions.
  4. **Verification:** `tsc`, `vitest --pool=forks --maxWorkers=1`, `vite build`, `playwright --workers=1`, `get_advisors`, Desktop (`1280x800`) + Mobile (`390x844`) Chrome DevTools across `/purchased`, `/mcqs/test-series`, `/mcqs/test-series/series/:id`, and `/exam/:testId`.

## 4. Phase 4 Checklist (`v1.0.386`)
1. Confirm any triggered **Circuit Breakers** and run System-2 Cognitive Pre-Flight before editing code; bump `package.json` (`1.0.386`) & `android/app/build.gradle` (`14`, `"1.14"`).
2. Write `docs/versions/v1.0.386.md`; update `DECISIONS_MASTER.md`, `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md`; overwrite `CURRENT_HANDOVER.md` (`< 6 KB`), secret-scan, PR/CI merge, sync `main`, output `v1.0.387` prompt.

---

## 5. Starter Prompt for `v1.0.386` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 6 (v1.0.386) on branch feat/v1.0.386-offline-mock-entitlement-sync: (1) check supabase_migrations.schema_migrations on sjcfagpjstbfxuiwhlps for 20261126220000_v1_0_384_bundles_shifts_mind_id.sql and verify 0 MF- rows + mock_series_bundle_items live; (2) harden 3-tier SWR + MindFlowDB caching in mockTestsApi.ts for course entitlements, bundle child unlocks, and purchased series metadata with strict locked-payload isolation (zero paid test questions cached or fetched before entitlement verification); and (3) harden syncService.ts & mockTestsApi.ts stale-entitlement reconciliation and coalesced offline replay (mock_test_attempt_submit & bookmarks) on online and visibilitychange events without wiping mock_active_attempt_* or duplicating submissions.
Confirm any triggered Circuit Breakers and run System-2 Cognitive Pre-Flight before editing code; verify with tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), supabase_mcp advisors, and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.387.
```
