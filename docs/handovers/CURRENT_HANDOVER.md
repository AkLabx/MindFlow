# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly `< 6 KB`. Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.385.4`** *(27 Nov 2026 | Step 5D, `#1142`)* — `pkg` `1.0.385.4` | Android `1.16` (`16`) *(Prior: `v1.0.385.3` `#1141`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`352`; `AuthPage` `16/16`) | `vite build` (`5508` mod, `215` PWA / `7267.17 KiB`) | `playwright` (`2/2`, `2.1m`) | DevTools (`390x844` & `1280x800`: `0` console err, `0px` overflow, `0` sub-44px controls).
- **PENDING REMOTE DB:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) — verify/apply in `v1.0.386` on `sjcfagpjstbfxuiwhlps`.
- **Supabase SMTP & OTP:** Brevo Custom SMTP (`:587`), templates, and rate limits live & verified (`POST /signup` `961ms`, `POST /verify` `75ms`).
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth/recovery/verification interception (`useAppBootstrap.ts` + `extractAuthHashParams` + `mindflow_auth_hydrating`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy`, 5-key v3.0 `explanation`, `<QuizExplanation />` (`DEC-0033`), `DedicatedPageHeader` + `isHeaderHiddenRoute`, 5-tab footer, `#/exam/:testId` `resolveMockTestAccess` gate, `overflow-x-clip`+`fixed bottom-0` CBT footers, `>=6px` AI orb gap (`DEC-0030`–`0032`).
- Keep `<TestLeaderboardCard />` ONLY inside `PreparedMockResultPage` `Leaderboard` tab, `SwipeableTabViewport` `1:1` `translate3d` + `.mf-h-rail`, `examOnboardingRegistry`, `MIND-`/`ORD-` prefixes, `MAX_QUIZ_QUESTIONS = 300`, `examDomainGroups`, `compareExamDateShiftsDesc` (`DEC-0029`,`0030`,`0034`).
- Keep `__cbt_meta` stripped from `mock_test_attempts.answers`, `mindflow_mock_attempt_timing_*`, `validatePasswordPolicy()`, `formatAuthError()`, `AUTH_EMAIL_TIMEOUT_MS = 30000` + native `TimeoutError` guard (`fetchWithTimeout.ts`), zero-tab linear `AuthPage` (`ReadOnlyEmailField`, stacked Password/OTP chooser, single vertical Create Account, `AuthHeroShowcase` `<h2>`), `<EmailOtpInput />` (`shouldCreateUser: false`, `mindflow_recovery_otp_pending`), `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)` (`DEC-0035`–`0039`).

---

## 3. Target Execution Brief for Next Chat: `v1.0.385.5` (Gen 2 Step 5E)
- **Branch:** `feat/v1.0.385.5-quiz-config-hierarchy-perf`
- **Circuit Breakers:** Strict `<= 10` code/test files (`CB#1`); zero new npm deps (`CB#2`); zero DB DDL (`CB#3`).
- **Scope & Locked Decisions (`v2.0_blueprint.md` Step 5E):**
  1. **5-Group Color Hierarchy + Smart Collapsible Rows (`1A`):** Bordered color-themed cards (`Classification`=Indigo: `Subject`/`Topic`/`Sub-Topic`; `Properties`=Amber: `Difficulty`; `Source`=Emerald: `Exam Name`/`Exam Year`/`Exam Shift`; `Format`=Sky: `Question Type`; `Deep Diagnostics`=Violet: `Tags`) with `>=48px` vertical-accent (`▌`) collapsible rows + chevron (`▸`/`▼`), single-open auto-collapse `<768px`, multi-open `>=768px`, lazy body mount, and matching chip colors in `ActiveFiltersBar.tsx`.
  2. **Fix `Clear All` & Auto-Exam Bugs (`QuizConfig.tsx`):** Separate route-locked context (`fixedExamContext` / `?exam=`) from user-picked `filters.examName` (never auto-expand `dbExamNames` on `Clear All`); guard initial hydration with `hasHydratedInitialFiltersRef`.
  3. **Permutation-Safe `<4ms` Engine:** Non-destructive pruning in `useDependentFilters.ts` (keep valid topics/sub-topics when adding parents), remove silent Year/Shift delete effects, fix `visibleOptions.length === 0` empty check in `ScrollableCapsules.tsx`, and skip eager `tags` loop in `useOptimizedFilterCounts.ts` unless Tag Sheet is open.
  4. **Tag Search Bottom Sheet (`3A` — `TagSearchBottomSheet.tsx`):** Sticky header `🔍 Tags` lens + Violet `Tags` row open `<NativeDialog variant="bottom-sheet">` with `150ms` debounced local `questionIndex.tags` search, intersected `(count)` badges, pinned selected tags, and **Topic/Sub-Topic Keyword Hint chips**.
  5. **2-Row Bottom Bar (`2A`) + Mode Launch Sheet (`CreateQuizModeSheet.tsx`):** Default `selectedQuestionCount = null` (**`All (N)`** active $\rightarrow$ `Math.min(filteredMetadata.length, 300)`) + `10|25|50|100|150|300|Custom`; remove top `Learning|Mock|God` bar (preserve `initialMode === 'god'`); `Create Quiz` opens `<NativeDialog variant="bottom-sheet">` for **Learning** vs **Mock** (descriptions + `<InfoHintPopover />` + optional Quiz Name).

## 4. Phase 4 Checklist (`v1.0.385.5`)
1. Bump `package.json` (`1.0.385.5`) & `android/app/build.gradle` (`17`, `"1.17"`).
2. Write `docs/versions/v1.0.385.5.md`; update `DECISIONS_MASTER.md` (`DEC-0040`), `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md` (promote Step 6 `v1.0.386` to `NEXT`); overwrite `CURRENT_HANDOVER.md` (`< 6 KB`), secret-scan, PR/CI merge, sync `main`, output `v1.0.386` prompt.

---

## 5. Starter Prompt for `v1.0.385.5` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 5E (v1.0.385.5) on branch feat/v1.0.385.5-quiz-config-hierarchy-perf (<= 10 code/test files, zero new npm deps): (1) redesign /quiz/config into 5 color-coded bordered group cards (Classification=Indigo, Properties=Amber, Source=Emerald, Format=Sky, Deep Diagnostics=Violet) with >=48px vertical-accent collapsible rows (Decision 1A: single-open <768px, multi-open >=768px, lazy body mount) and matching ActiveFiltersBar chip colors; (2) fix Clear All & auto-selected exam bugs (separate fixedExamContext/?exam= from user-picked examName + hasHydratedInitialFiltersRef) and make filtering 100% permutation-safe & <4ms (non-destructive pruning in useDependentFilters, remove silent Year/Shift delete effects, visibleOptions.length===0 check in ScrollableCapsules, lazy tag counting in useOptimizedFilterCounts); (3) build TagSearchBottomSheet (Decision 3A: top header lens + Tags row -> NativeDialog bottom-sheet with local questionIndex.tags search, intersected counts & Topic/Sub-Topic keyword hints); and (4) apply Decision 2A 2-row bottom bar defaulting to All Available (up to 300) and open CreateQuizModeSheet (Learning vs Mock descriptions + InfoHintPopover + optional Quiz Name) on Create Quiz while preserving initialMode==='god'.
Run System-2 Cognitive Pre-Flight first; verify with Vitest permutation/perf/sheet tests, tsc --noEmit, full vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.386.
```
