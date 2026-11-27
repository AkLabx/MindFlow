# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly `< 6 KB`. Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.385.4`** *(27 Nov 2026 | Step 5D)* — `pkg` `1.0.385.4` | Android `1.16` (`16`) *(Prior: `v1.0.385.3` `#1141`, `v1.0.385.2`, `v1.0.385.1` `#1137`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`352`; `AuthPage` `16/16`) | `vite build` (`5508` mod, `215` PWA / `7267.17 KiB`) | `playwright` (`2/2`, `2.1m`) | DevTools (`390x844` & `1280x800`: `0` console err, `0px` overflow, `0` sub-44px controls, `0` tablists, `1` visible `<h1>`).
- **PENDING REMOTE DB:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) — verify/apply on `sjcfagpjstbfxuiwhlps` (`mock_series_bundle_items` + `0` legacy `MF-` rows).
- **Supabase SMTP & OTP:** Brevo Custom SMTP (port `587`), templates (`{{ .Token }}` + `{{ .ConfirmationURL }}`), and rate limits are live & verified (`POST /signup` `200 OK` `961ms`, `POST /verify` `200 OK` `75ms`).
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth/recovery/verification interception (`useAppBootstrap.ts` + `extractAuthHashParams` + `mindflow_auth_hydrating`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy`, 5-key v3.0 `explanation`, `<QuizExplanation />` (`DEC-0033`), `DedicatedPageHeader` + `isHeaderHiddenRoute`, 5-tab footer, `#/exam/:testId` `resolveMockTestAccess` gate, `overflow-x-clip`+`fixed bottom-0` CBT footers, `>=6px` AI orb gap (`DEC-0030`–`0032`).
- Keep `<TestLeaderboardCard />` ONLY inside `PreparedMockResultPage` `Leaderboard` tab, `SwipeableTabViewport` `1:1` `translate3d` + `.mf-h-rail`, `examOnboardingRegistry`, `MIND-`/`ORD-` prefixes, `QuizConfig` + `shiftSorting.ts` (`DEC-0034`).
- Keep `__cbt_meta` stripped from submitted `mock_test_attempts.answers`, `mindflow_mock_attempt_timing_*`, `MIN_PASSWORD_LENGTH = 8`, `validatePasswordPolicy()`, `formatAuthError()`, `AUTH_EMAIL_TIMEOUT_MS = 30000` + native `TimeoutError` guard + non-retryable auth email POSTs (`fetchWithTimeout.ts`), `isSubmittingSignUpRef`/`isSendingSignInOtpRef` mutexes, zero-tab linear `AuthPage` (`ReadOnlyEmailField`, stacked Password/OTP chooser, single vertical Create Account, `AuthHeroShowcase` `<h2>`), `emailRedirectTo`, `identities.length === 0`, `verify-email` auto-detect, standalone-only `#desktop-mode-warning`, single-input MWG `<EmailOtpInput />` (`shouldCreateUser: false`, `mindflow_recovery_otp_pending`), `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)` (`DEC-0035`–`0039`).

---

## 3. Target Execution Brief for Next Chat: `v1.0.386` (Gen 2 Step 6)
- **Branch:** `feat/v1.0.386-offline-entitlement-sync`
- **Circuit Breakers:** Preserve `MindFlowDB` store names (`DEC-0018`) and `mock_active_attempt_*` exclusion (`DEC-0026`, `DEC-0027`); check `CB#3` before remote SQL apply; zero new npm deps.
- **Scope (`v2.0_blueprint.md` Step 6):**
  1. **Remote Migration Sync (`sjcfagpjstbfxuiwhlps`):** Verify `schema_migrations` for `20261126220000_v1_0_384_bundles_shifts_mind_id.sql` (`mock_series_bundle_items` live & `0` `MF-` rows).
  2. **3-Tier SWR & `MindFlowDB` Entitlement/Receipt Hydration (`mockTestsApi.ts`, `syncService.ts`):** Harden 0ms cached course entitlements, bundle child unlocks, and purchased series metadata with strict locked-payload isolation (zero test question prefetch before entitlement check).
  3. **Reconnect & Visibility Reconciliation (`syncService.ts`, `mockTestsApi.ts`):** Reconcile stale entitlements and flush queued `mock_test_attempt_submit` / bookmark events cleanly on `online` & `visibilitychange` without wiping `mock_active_attempt_*` or duplicating submissions.
  4. **Verify:** Add offline reload, entitlement expiry/reconciliation, and reconnect replay Vitest tests; run `tsc --noEmit`, `vitest --run --pool=forks --maxWorkers=1`, `vite build`, `playwright test --workers=1`, and Desktop (`1280x800`) + Mobile (`390x844`) Chrome DevTools MCP.

## 4. Phase 4 Checklist (`v1.0.386`)
1. Bump `package.json` (`1.0.386`) & `android/app/build.gradle` (`17`, `"1.17"`).
2. Write `docs/versions/v1.0.386.md`; update `DECISIONS_MASTER.md`, `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md` (promote Step 7 `v1.0.387` to `NEXT`); overwrite `CURRENT_HANDOVER.md` (`< 6 KB`), secret-scan, PR/CI merge, sync `main`, output `v1.0.387` prompt.

---

## 5. Starter Prompt for `v1.0.386` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 6 (v1.0.386) on branch feat/v1.0.386-offline-entitlement-sync: (1) check remote migration status for 20261126220000_v1_0_384_bundles_shifts_mind_id.sql on sjcfagpjstbfxuiwhlps (mock_series_bundle_items + zero MF- rows; respect CB#3); (2) harden 3-tier SWR & MindFlowDB 0ms hydration for course entitlements, bundle child unlocks, and My Purchase receipts in mockTestsApi.ts / syncService.ts with strict locked-payload isolation (never prefetch test questions before entitlement verification) and zero MindFlowDB store renames; and (3) add online/visibilitychange entitlement reconciliation and idempotent offline replay for queued mock_test_attempt_submit & bookmark events without wiping mock_active_attempt_* or duplicating submissions.
Run System-2 Cognitive Pre-Flight before editing code; verify with Vitest offline/reconciliation tests, tsc --noEmit, full vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.387.
```
