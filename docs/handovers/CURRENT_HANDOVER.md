# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly `< 6 KB`. Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.385.1`** *(27 Nov 2026 | Step 5A)* — `pkg` `1.0.385.1` | Android `1.13` (`13`) *(Prior: `v1.0.385` `#1136`, `v1.0.384`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`343`, `336.15s`) | `vite build` (`215` PWA / `7241.65 KiB`) | `playwright` (`2/2`, `1.2m`) | DevTools (`390x844` & `1280x800`: `#desktop-mode-warning` hidden, `0px` overflow, `0` console err).
- **PENDING REMOTE DB:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) not yet applied on `sjcfagpjstbfxuiwhlps` (`bundle_items_table: null`, `18` `MF-` rows). Apply via Supabase SQL Editor or `npx supabase db push`.
- **Supabase SMTP:** **Brevo Custom SMTP** is configured on `sjcfagpjstbfxuiwhlps`. Confirm Email Templates (`Confirm signup`, `Magic Link`, `Reset Password`) include `{{ .Token }}` alongside `{{ .ConfirmationURL }}`.
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth/recovery/verification interception (`useAppBootstrap.ts` + `extractAuthHashParams` + `mindflow_auth_hydrating`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy`, 5-key v3.0 `explanation`, `<QuizExplanation />` (`DEC-0033`), `DedicatedPageHeader` + `isHeaderHiddenRoute`, 5-tab footer, `#/exam/:testId` `resolveMockTestAccess` gate, `overflow-x-clip`+`fixed bottom-0` CBT footers, `>=6px` AI orb gap (`DEC-0030`–`0032`).
- Keep `<TestLeaderboardCard />` ONLY inside `PreparedMockResultPage` `Leaderboard` tab, `SwipeableTabViewport` `1:1` `translate3d` + `.mf-h-rail`, `examOnboardingRegistry`, `MIND-`/`ORD-` prefixes, `QuizConfig` + `shiftSorting.ts` (`DEC-0034`).
- Keep `__cbt_meta` stripped from submitted `mock_test_attempts.answers`, `mindflow_mock_attempt_timing_*`, `MIN_PASSWORD_LENGTH = 8`, `emailRedirectTo`, `identities.length === 0`, automated `AuthPage` `verify-email` flow (never lock out on `'Email not confirmed'`), standalone-only `#desktop-mode-warning` (never `android-app://` referrer), `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)` (`DEC-0035`,`0036`).

---

## 3. Target Execution Brief for Next Chat: `v1.0.385.2` (Gen 2 Step 5B)
- **Branch:** `feat/v1.0.385.2-email-otp-auth` *(after merging, `v1.0.386` resumes Step 6)*
- **CB#5 (Auth):** Pre-approved by user for all 3 Email OTP flows + link fallback. Run System-2 Pre-Flight first; zero new npm deps.
- **Scope (`v2.0_blueprint.md` Step 5B):**
  1. **`<EmailOtpInput />` (`src/features/auth/components/EmailOtpInput.tsx`):** 6-digit numeric OTP input (`inputMode="numeric"`, `autoComplete="one-time-code"`, paste sanitize, `>=44x44px`, `active:scale-95`, 60s resend cooldown).
  2. **Signup OTP (`AuthPage` `verify-email`):** Verify via `verifyOtp({ email, token, type: 'signup' })`; keep 3-layer link auto-detection fallback.
  3. **Email OTP Sign-In (`AuthPage` `signin`):** `Password | Email OTP` toggle -> `signInWithOtp({ email, options: { shouldCreateUser: false } })` (guide unregistered emails to Create Account for DPDP) + `verifyOtp({ email, token, type: 'email' })`.
  4. **Reset OTP (`AuthPage`, `ResetPasswordPage`):** `verifyOtp({ email, token, type: 'recovery' })` -> `#/reset-password`; keep `extractAuthHashParams()` link fallback.
  5. **Verify:** Expand `AuthPage.test.tsx`; run `tsc`, `vitest`, `vite build`, `playwright`, and Desktop + Mobile Chrome DevTools (`#/`, `#/signup`, `#/reset-password`).

## 4. Phase 4 Checklist (`v1.0.385.2`)
1. Bump `package.json` (`1.0.385.2`) & `android/app/build.gradle` (`14`, `"1.14"`).
2. Write `docs/versions/v1.0.385.2.md`; update `DECISIONS_MASTER.md`, `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md` (promoting Step 6 `v1.0.386` back to `NEXT`); overwrite `CURRENT_HANDOVER.md` (`< 6 KB`), secret-scan, PR/CI merge, sync `main`, output `v1.0.386` prompt.

---

## 5. Starter Prompt for `v1.0.385.2` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 5B (v1.0.385.2) on branch feat/v1.0.385.2-email-otp-auth (Brevo SMTP is configured; CB#5 approved for all 3 Email OTP flows while keeping confirmation/reset links as fallbacks): (1) build reusable <EmailOtpInput /> (6-digit numeric, inputMode="numeric", autoComplete="one-time-code", paste normalization, >=44x44px, 60s resend cooldown, zero new npm deps); (2) add 6-digit signup verification via supabase.auth.verifyOtp({ email, token, type: 'signup' }) inside AuthPage step="verify-email" alongside existing 3-layer link auto-detection; (3) add Password | Email OTP Sign-In mode via signInWithOtp({ email, options: { shouldCreateUser: false } }) + verifyOtp({ email, token, type: 'email' }) preserving Create Account DPDP consent; and (4) add in-app 6-digit recovery OTP via verifyOtp({ email, token, type: 'recovery' }) after resetPasswordForEmail() navigating cleanly to #/reset-password while keeping extractAuthHashParams() link recovery intact.
Run System-2 Cognitive Pre-Flight before editing code; verify with AuthPage.test.tsx, tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.386.
```
