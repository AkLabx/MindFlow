# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly concise (< 6 KB). Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.384`** *(26 Nov 2026 | Gen 2 Step 4)* — `pkg` `1.0.384` | Android `1.11` (`11`) *(Prior: `v1.0.383.2`; `v1.0.383.1` `#1131`; `v1.0.383` `#1128`/`#1129`)*
- **Proof:** `tsc` `0` err | `vitest` (`51`/`336`) | `vite build` (`5505` mod / `215` PWA / `7214.96 KiB`) | `playwright` (`2/2`, `1.7m`) | `advisors` `0` err | DevTools (`1280x800` & `390x844`: `0` console err, `0px` mobile overflow, `10,991` Qs + latest-first shifts).
- **PENDING REMOTE DB APPLY:** [`20261126220000_v1_0_384_bundles_shifts_mind_id.sql`](../../supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql) is committed in `v1.0.384`, **NOT YET APPLIED remotely** on `sjcfagpjstbfxuiwhlps` (`apply_migration` auto-cancelled by client; remote DB still has `18` `MF-` IDs & `bundle_items_table: null`; client degrades gracefully). **Check & apply first in `v1.0.385`!**
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Keep `<HashRouter>`, OAuth hash extraction (`useAppBootstrap.ts`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy` + 5-key v3.0 `explanation` + `<QuizExplanation />` (`DEC-0033`).
- Keep `<TestLeaderboardCard />` ONLY inside `PreparedMockResultPage` `Leaderboard` tab; preserve `SwipeableTabViewport` `1:1` `translate3d` + `.mf-h-rail` arbitration, `examOnboardingRegistry` + `EXAM_INTEGRITY_DECLARATION`, `MIND-`/`ORD-` prefixes, and `QuizConfig` multi-exam + `shiftSorting.ts` (`DEC-0034`, `OLD-024`).
- Keep `DedicatedPageHeader` + `isHeaderHiddenRoute` (`/mcqs/test-series*`, `/quiz/library*`, `/purchased`), 5-tab footer, `#/exam/:testId` `resolveMockTestAccess` gate, `overflow-x-clip`+`fixed bottom-0` CBT footers, and `>=6px` AI orb gap (`DEC-0030`–`0032`).
- Enforce `>=44x44px` `type="button"` `active:scale-95`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`, zero `navigate(-1)`, zero secrets/PII.

---

## 3. Target Execution Brief for Next Chat: `v1.0.385` (Gen 2 Step 5)
- **Target Branch:** `feat/v1.0.385-result-analytics-solution-mastery`
- **Scope (`v2.0_blueprint.md` Step 5):**
  1. **Remote Migration Verification & Apply:** Check `supabase_migrations.schema_migrations` on `sjcfagpjstbfxuiwhlps` and apply `supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql` if still pending; verify `mock_series_bundle_items`, `mock_series.target_route`, `shift_slot`/`shift_timing`, and `0` remaining `MF-` IDs (`18` $\rightarrow$ `0`).
  2. **Deep Section & Timing Analytics (`PreparedMockResultPage.tsx` `Analysis` Tab, `mockTestsApi.ts` / scoring utils):** Add per-section/subject time-spent vs accuracy breakdowns, negative-marking deduction summaries (`-0.33`/`-0.25`/`0`), and clear visual progress indicators inside the `Analysis` tab without adding new leaderboard cards outside `Leaderboard`.
  3. **Solution Mastery Filters & Instant Bookmarking (`PreparedMockResultPage.tsx` `Solutions` Tab):** Add filterable solution review chips (`All`, `Incorrect`, `Unattempted`, `Saved`) and 1-tap question bookmarking/unbookmarking directly from Solution Review (`44x44px` touch targets, `useBookmarks` / `bookmarks` sync, unified `<QuizExplanation />` with `languageMode`, `<KeyboardAwareBottomBar fullWidth>`, `scroll-mb-28`, `lang="hi"`, `<NativeDialog>`).
  4. **Verification:** `npx.cmd tsc --noEmit`, `npx.cmd vitest --run --pool=forks --maxWorkers=1`, `npx.cmd vite build`, `npx.cmd playwright test --workers=1`, `supabase_mcp.get_advisors`, and Desktop (`1280x800`) + Mobile (`390x844`) Chrome DevTools MCP checks on `#/mcqs/test-series/test/:testId/result/:attemptId`.

## 4. Phase 4 Checklist (`v1.0.385`)
1. Bump `package.json` (`1.0.385`) & `android/app/build.gradle` (`12`, `"1.12"` if Android/UI changed).
2. Write `docs/versions/v1.0.385.md` & update `DECISIONS_MASTER.md`, `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md`.
3. Overwrite `CURRENT_HANDOVER.md` (`< 6 KB`) for `v1.0.386`, secret-scan, PR/CI merge, sync, output `v1.0.386` prompt.

---

## 5. Starter Prompt for `v1.0.385` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 5 (v1.0.385) on branch feat/v1.0.385-result-analytics-solution-mastery: (1) check & apply pending supabase/migrations/20261126220000_v1_0_384_bundles_shifts_mind_id.sql remotely on sjcfagpjstbfxuiwhlps if not yet applied and verify 0 MF- rows + mock_series_bundle_items live; (2) deepen PreparedMockResultPage Analysis tab with per-section/subject time-spent vs accuracy and negative-marking breakdowns; and (3) upgrade Solutions tab with filterable mastery chips (All | Incorrect | Unattempted | Saved) and instant 1-tap bookmarking using <QuizExplanation />, <KeyboardAwareBottomBar fullWidth>, scroll-mb-28, and >=44x44px controls while keeping <TestLeaderboardCard /> exclusive to the Leaderboard tab.
First confirm Circuit Breakers and run System-2 Cognitive Pre-Flight before editing code; verify with tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), supabase_mcp advisors, and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.386.
```
