# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly concise (< 6 KB). Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Current Verified Baseline
- **Active Generation:** Gen 2 (`docs/blueprint/v2.0_blueprint.md`)
- **Last Completed Version:** **`v1.0.383.1`** *(Backend/SSOT Point Release off `v1.0.383`, 26 Nov 2026)* — `package.json` `1.0.383-1` | Android `versionCode 10` (`1.10`) *(Step 3 baseline: `v1.0.383`, `PR #1128` + `PR #1129`)*
- **Verified Proof (`v1.0.383.1` & `v1.0.383`):** `tsc --noEmit` (`0` err) | `vitest --run --pool=forks` (`48` files, `312` tests) | `vite build` (`214` PWA entries) | `v1.0.383.1` DB verification (`10,991` active Qs, `21` canonical `examName`s, `203` shifts, `0` cache drift, `get_advisors` `0` `ERROR`s) | `v1.0.383` Playwright `2/2` (`1.1m`) & Chrome DevTools (`1280x800` & `390x844`).
- **DB Sync Check:** `20261126000000` DDL & hardened RPCs plus `20261126010000` (`exam_catalog` / `exam_cycles` SSOT, `questions` constraints & soft-delete RPCs) are live on `sjcfagpjstbfxuiwhlps` (`create_exam_catalog_ssot_tables` & `enforce_exam_source_constraints_and_rpcs` recorded in `schema_migrations`). Pending manual/CLI ops: deploy updated `extract-questions` Edge Function and optionally run commented `DROP INDEX` cleanup for 6 duplicate lowercase indexes on `questions`.
- **Slots:** Slot 1 (`D:\MindFlow-main`, `main`, `:3000`) | Slot 2 (`worker-1`, `:3001`) | Slot 3 (`worker-2`, `:3002`). Keep `main` clean.

---

## 2. Active Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth hash extraction (`useAppBootstrap.ts`), `0ms` IndexedDB (`db.ts`), `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`DEC-0006`, `DEC-0018`).
- Keep `DedicatedPageHeader` + `isHeaderHiddenRoute` (`/mcqs/test-series*`, `/quiz/library*`, `/purchased`) and 5-tab footer (`Dashboard | Mock Tests | AI | My Purchase | Profile`) (`DEC-0030`–`DEC-0031`).
- Gate `#/exam/:testId` behind `resolveMockTestAccess`; preserve `overflow-x-clip` + `fixed bottom-0` CBT footers & `>=6px` gap above AI orb on `/mcqs/test-series` (`DEC-0031`–`DEC-0032`).
- Enforce `>=44x44px` `type="button"` `active:scale-95`, MWG `<NativeDialog>`/`<InfoHintPopover />`, zero `navigate(-1)`, zero secrets/PII.

---

## 3. Target Execution Brief for Next Chat: `v1.0.384` (Gen 2 Step 4)
- **Target Branch:** `feat/v1.0.384-bundles-onboarding-swipe-ux`
- **Scope (`v2.0_blueprint.md` Step 4):**
  1. **Course Bundles & Renewals:** `course_type = 'bundle'` in `resolveMockTestAccess`, `SeriesDrawer`, `AdminFinancialsPage`, bundle cards on `/mcqs/test-series`, `<14d` `Renew Access` + safe polymorphic `target_route` on `My Purchase`.
  2. **Mock Card Shift Detail & Declutter:** Show `Morning`/`Afternoon`/`Evening` + shift timing on test cards; remove boxy `1, 2, 3, 4` number column and duplicate header/card noise for clean, lag-free mobile layout.
  3. **1:1 Finger-Tracking Swipe & Rail Arbitration:** Upgrade `SwipeableTabViewport` (Quiz History, Mock Tests, Test Series Hub) for live `1:1` synchronous drag tracking; on `/mcqs/test-series`, arbitrate inner `.mf-h-rail` series scroll vs outer exam-tab swipe seamlessly.
  4. **`View Result` 3-Tab Hub & Leaderboard Move:** Completed tests show **`View Result`**, opening reusable 3-tab Result page (`Analysis | Solutions | Leaderboard` at top). Remove `<TestLeaderboardCard />` from `TestDetailPage`, `TestsListPage`, and everywhere else.
  5. **`Start Test` + Modular Exam Onboarding:** Rename `"View Details"` $\rightarrow$ **`"Start Test"`**. SSC flow: pattern popup (`Eduquity` vs `TCS iON`) $\rightarrow$ Step 1 general instructions/stats/language + `Next` $\rightarrow$ Step 2 UI symbol legend + **"Select Test Language"** + mandatory integrity declaration checkbox $\rightarrow$ CBT. Scalable per-exam config (SSC, BPSC, future exams).
  6. **Student ID Prefix Rebrand:** Replace `MF-` prefix (`profiles.student_id`, trigger, `CHECK` constraint, backfill, `order_code`, Admin/UI/tests) with a clean prefix.
  7. **`QuizConfig` (`/quiz/config`) Fixes:** Fix `!activeExamInfo` guard so selecting one exam keeps `examDomainGroups` visible for multi-exam selection; sort `allExamShifts` **latest-to-oldest** chronologically.
- **Pre-Flight:** Run `/plan` + `/grill-me` first to confirm **Circuit Breakers #1 (`>10 files`) & #3 (DDL)**, replacement Student ID prefix (`STU-`/`ASP-`/`MFL-`/`MIND-`), bundle scope, and onboarding wording.

---

## 4. Phase 4 Closeout Checklist
1. Bump `package.json` (`1.0.384`) & `android/app/build.gradle` (`versionCode 11`, `"1.11"`).
2. Write `docs/versions/v1.0.384.md` from template.
3. Update `docs/DECISIONS_MASTER.md` (incl. Student ID prefix & Leaderboard move).
4. Prepend IST entry to `docs/APP_JOURNEY_LOG.md`.
5. Update `docs/blueprint/v2.0_blueprint.md` (Step 4 `[x] DONE` + PR `#`, promote Step 5, refine Step 9).
6. Overwrite `CURRENT_HANDOVER.md` (`< 6 KB`) for `v1.0.385`.
7. Secret scan, PR merge after CI green, delete branch, sync `main`, output `v1.0.385` starter prompt.

---

## 5. Starter Prompt for `v1.0.384` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 4 (v1.0.384) on branch feat/v1.0.384-bundles-onboarding-swipe-ux: Course Bundles & multi-course entitlements, Shift timing badges & decluttered cards (remove wide number column), 1:1 finger-tracking SwipeableTabViewport + Test Series rail/tab arbitration, dynamic View Result 3-tab hub (Analysis | Solutions | Leaderboard ONLY here, remove leaderboard elsewhere), modular Start Test onboarding (SSC Eduquity vs TCS iON popup -> Step 1 rules -> Step 2 symbols + language + declaration; BPSC config), Student ID prefix rebrand (replacing MF-), and QuizConfig multi-exam + latest-to-oldest shift filter fixes.
First run /plan + /grill-me via ask_question to confirm Circuit Breakers (#1 >10 files, #3 DDL), replacement Student ID prefix, and scope decisions before editing code. Follow System-2 Cognitive Pre-Flight, verify with tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), supabase_mcp advisors, and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.385.
```
