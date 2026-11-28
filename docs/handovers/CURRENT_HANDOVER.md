# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep `< 6 KB`. Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.385.4`** *(Step 5D, `#1142`)* — `pkg` `1.0.385.4` | Android `1.16` (`16`) *(Prior: `v1.0.385.3` `#1141`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`352`) | `vite build` (`5508` mod, `215` PWA / `7267.17 KiB`) | `playwright` (`2/2`) | DevTools (`390x844` & `1280x800`: `0` err, `0px` overflow, `0` `<44px`).
- **PENDING DB:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) — verify/apply in `v1.0.386` (`sjcfagpjstbfxuiwhlps`).
- **SMTP & Slots:** Brevo (`:587`) + OTP live (`961ms`/`75ms`). Slots: `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`).

## 2. Critical Invariants (`DECISIONS_MASTER.md` `DEC-0001`–`0039`)
- Preserve `<HashRouter>`, auth hash parsing (`useAppBootstrap.ts`, `extractAuthHashParams`, `mindflow_auth_hydrating`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy`, 5-key v3.0 `explanation`, `<QuizExplanation />`, `DedicatedPageHeader` + `isHeaderHiddenRoute`, 5-tab footer, `#/exam/:testId` `resolveMockTestAccess`, `overflow-x-clip`+`fixed bottom-0` CBT footers, `>=6px` AI orb gap (`DEC-0030`–`0033`).
- Keep `<TestLeaderboardCard />` ONLY in `PreparedMockResultPage` `Leaderboard`, `1:1` `SwipeableTabViewport` + `.mf-h-rail`, `examOnboardingRegistry`, `MIND-`/`ORD-`, `MAX_QUIZ_QUESTIONS = 300`, `examDomainGroups`, `compareExamDateShiftsDesc` (`DEC-0029`,`0030`,`0034`).
- Keep `__cbt_meta` stripped, `mindflow_mock_attempt_timing_*`, `validatePasswordPolicy()`, `formatAuthError()`, `AUTH_EMAIL_TIMEOUT_MS = 30000` + `TimeoutError` guard, zero-tab `AuthPage` (`ReadOnlyEmailField`, stacked Password/OTP, vertical Signup, `AuthHeroShowcase` `<h2>`), `<EmailOtpInput />` (`shouldCreateUser: false`, `mindflow_recovery_otp_pending`), `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)` (`DEC-0035`–`0039`).

---

## 3. Target Execution Brief: `v1.0.385.5` (Gen 2 Step 5E)
- **Branch:** `feat/v1.0.385.5-quiz-config-hierarchy-perf` | **Guards:** `<= 10` files (`CB#1`), `0` deps (`CB#2`), `0` DDL (`CB#3`).
- **Locked Decisions & Scope (`v2.0_blueprint.md` Step 5E):**
  1. **5-Group Color Cards + Rows (`1A`):** `Classification`=Indigo (`Subject`/`Topic`/`Sub-Topic`), `Properties`=Amber (`Difficulty`), `Source`=Emerald (`Exam Name`/`Year`/`Shift`), `Format`=Sky (`Question Type`), `Deep Diagnostics`=Violet (`Tags`); `>=48px` vertical-accent rows, single-open `<768px`, multi-open `>=768px`, lazy mount, matching `ActiveFiltersBar` chips.
  2. **`Clear All` & Auto-Exam Fix (`QuizConfig.tsx`):** Separate route `fixedExamContext`/`?exam=` from user `filters.examName` (no `dbExamNames` expansion on `Clear All`) + `hasHydratedInitialFiltersRef`.
  3. **Permutation-Safe `<4ms` Engine:** Non-destructive pruning (`useDependentFilters.ts`), drop silent Year/Shift delete effects, `visibleOptions.length === 0` (`ScrollableCapsules.tsx`), lazy `tags` count (`useOptimizedFilterCounts.ts`).
  4. **Tag Search Sheet (`3A` — `TagSearchBottomSheet.tsx`):** Header lens + `Tags` row -> `<NativeDialog variant="bottom-sheet">` (`150ms` local `questionIndex.tags` search, intersected `(count)`, pinned tags, Topic/Sub-Topic Keyword Hints).
  5. **2-Row Bottom Bar (`2A`) + Mode Sheet (`CreateQuizModeSheet.tsx`):** Default `selectedQuestionCount = null` (**`All (N)`** -> `Math.min(filteredMetadata.length, 300)`) + `10|25|50|100|150|300|Custom`; remove top mode bar (keep `initialMode === 'god'`); `Create Quiz` -> `<NativeDialog variant="bottom-sheet">` (**Learning** vs **Mock** + `<InfoHintPopover />` + Quiz Name).

## 4. Phase 4 Checklist (`v1.0.385.5`)
1. Bump `package.json` (`1.0.385.5`) & `android/app/build.gradle` (`17`, `"1.17"`).
2. Write `docs/versions/v1.0.385.5.md`; update `DECISIONS_MASTER.md` (`DEC-0040`), `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md` (Step 6 `v1.0.386` -> `NEXT`), `CURRENT_HANDOVER.md` (`< 6 KB`); secret-scan, PR/CI merge, sync `main`, output `v1.0.386` prompt.

---

## 5. Starter Prompt for `v1.0.385.5` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 5E (v1.0.385.5) on branch feat/v1.0.385.5-quiz-config-hierarchy-perf (<= 10 files, 0 new deps): (1) 5 color-coded bordered cards (Classification=Indigo, Properties=Amber, Source=Emerald, Format=Sky, Deep Diagnostics=Violet) with >=48px vertical-accent rows (1A: single-open <768px, multi-open >=768px, lazy mount) + matching ActiveFiltersBar chips; (2) fix Clear All & auto-exam bugs (separate fixedExamContext/?exam= from user examName + hasHydratedInitialFiltersRef) and make filtering permutation-safe & <4ms (non-destructive pruning in useDependentFilters, drop silent Year/Shift delete effects, visibleOptions.length===0 in ScrollableCapsules, lazy tag counts in useOptimizedFilterCounts); (3) TagSearchBottomSheet (3A: header lens + Tags row -> NativeDialog bottom-sheet with local questionIndex.tags search, counts & Topic/Sub-Topic hints); (4) 2-row bottom bar (2A: default All Available up to 300) + CreateQuizModeSheet (Learning vs Mock + InfoHintPopover + Quiz Name; keep initialMode==='god').
Run System-2 Pre-Flight; verify with Vitest, tsc --noEmit, full vitest (--pool=forks --maxWorkers=1), vite build, playwright (--workers=1), and Desktop/Mobile DevTools MCP, then complete all 7 Phase 4 closeout steps and output the v1.0.386 starter prompt.
```
