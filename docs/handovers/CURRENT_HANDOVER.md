# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Cold Start!** Keep strictly concise (< 6 KB). Full spec: [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md).

---

## 1. Verified Baseline
- **Last:** **`v1.0.383.2`** *(26 Nov 2026 | Gen 2 Bridge)* — `pkg` `1.0.383-2` | Android `1.10` (`10`) *(Prior: `v1.0.383.1` `#1131`; `v1.0.383` `#1128`/`#1129`)*
- **Proof:** `tsc` `0` err | `vitest` (`49`/`322`) | `vite build` (`215`/`7151 KiB`) | `advisors` `0` new err | DevTools (`:3002`: `321` tuples, Admin 13-subject+25-exam UI, `<QuizExplanation />`, `0` console err/`0px` overflow).
- **DB/Edge:** `20261126000000`/`010000`/`100000` live (`sjcfagpjstbfxuiwhlps`: `question_taxonomy` `321`, `CHECK`s, taxonomy trigger, `ai_prompts` v2/v3); `enrich-taxonomy` `v20` & `enrich-questions` `v46` deployed (`v3.0.0`).
- **Slots:** `main` (`:3000`) | `worker-1` (`:3001`) | `worker-2` (`:3002`). Keep `main` clean.

## 2. Critical Invariants (Do Not Break)
- Keep `<HashRouter>`, OAuth hash extraction (`useAppBootstrap.ts`), `0ms` IndexedDB, `DB_TABLES`/`DB_RPCS`, real auth (`DEC-0001`..`0006`,`0018`).
- Keep 13-subject `question_taxonomy` + 5-key v3.0 `explanation` (`summary`, `analysis_correct`, `analysis_incorrect`, `conclusion`, `fact`) across Track A/B, Admin & `<QuizExplanation />` (`DEC-0033`, `OLD-023`).
- Keep `DedicatedPageHeader` + `isHeaderHiddenRoute` (`/mcqs/test-series*`, `/quiz/library*`, `/purchased`) & 5-tab footer (`DEC-0030`–`0031`).
- Gate `#/exam/:testId` (`resolveMockTestAccess`); keep `overflow-x-clip`+`fixed bottom-0` CBT footers & `>=6px` AI orb gap (`DEC-0031`–`0032`).
- Enforce `>=44x44px` `type="button"` `active:scale-95`, `<NativeDialog>`/`<InfoHintPopover />`, zero `navigate(-1)`, zero secrets/PII.

---

## 3. Target Execution Brief for Next Chat: `v1.0.384` (Gen 2 Step 4)
- **Target Branch:** `feat/v1.0.384-bundles-onboarding-swipe-ux`
- **Scope (`v2.0_blueprint.md` Step 4):**
  1. **Course Bundles & Renewals:** `course_type = 'bundle'` in `resolveMockTestAccess`, `SeriesDrawer`, `AdminFinancialsPage`, bundle cards on `/mcqs/test-series`, `<14d` `Renew Access` + safe polymorphic `target_route` on `My Purchase`.
  2. **Shift Detail & Decluttered Cards:** Show `Morning`/`Afternoon`/`Evening` + timing on test cards; remove boxy `1, 2, 3, 4` number column, deduplicate repeated card/header text, maximize mobile `390x844` speed/clarity.
  3. **1:1 Swipe & Rail Arbitration:** `60fps` `1:1` finger-tracking swipe across Quiz History, Mock Tests, Test Series, Result Hub & related tabbed pages; arbitrate inner `.mf-h-rail` scroll vs outer `/mcqs/test-series` exam-tab swipe smoothly.
  4. **`View Result` 3-Tab Hub & Leaderboard Move:** Submitted tests switch CTA dynamically to **`View Result`**, opening reusable 3-tab Result Hub (`Analysis | Solutions | Leaderboard`). Remove leaderboards from all other screens.
  5. **`Start Test` + Modular Exam Onboarding:** Rename `"View Details"` $\rightarrow$ **`"Start Test"`**. SSC: **`New Pattern (Eduquity)`** vs **`Old Pattern (TCS iON)`** popup $\rightarrow$ Step 1 full format overview (`TestDetailPage` info) + official rules + language + `Next` $\rightarrow$ Step 2 UI symbol legend (Green/Red/Blue-Purple/Gray, `Save & Next`/`Previous`/`Mark`/`Unmark Review`) + **"All the Best"** + bottom **"Select Test Language"** + mandatory integrity declaration checkbox $\rightarrow$ CBT. Pluggable BPSC & future exam configs.
  6. **Student ID Rebrand:** Replace `MF-` prefix (`profiles.student_id`, trigger, `CHECK`, backfill, `order_code`, Admin/UI/tests) with clean prefix (`ASP-`/`STU-`/`MIND-`).
  7. **`QuizConfig` Fixes:** Keep `examDomainGroups` visible on selection for multi-exam filtering; sort `allExamShifts` latest-to-oldest.
- **Pre-Flight:** `/plan` + `/grill-me` first (`CB#1`, `CB#3`, Student ID prefix, bundles, onboarding details).

## 4. Phase 4 Checklist (`v1.0.384`)
1. Bump `package.json` (`1.0.384`) & `build.gradle` (`11`, `"1.11"`).
2. Write `docs/versions/v1.0.384.md` & update `DECISIONS_MASTER.md`, `APP_JOURNEY_LOG.md`, `v2.0_blueprint.md`.
3. Overwrite `CURRENT_HANDOVER.md` (`< 6 KB`) for `v1.0.385`, secret-scan, PR/CI merge, sync, output `v1.0.385` prompt.

---

## 5. Starter Prompt for `v1.0.384` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 4 (v1.0.384) on branch feat/v1.0.384-bundles-onboarding-swipe-ux: Course Bundles & multi-course entitlements, Shift timing badges & decluttered zero-duplicate cards (remove wide number column, zero lag on 390x844), 1:1 finger-tracking SwipeableTabViewport across Quiz History/Mock Tests/Test Series/Result Hub/related tabbed views + Test Series rail/tab arbitration, dynamic View Result 3-tab hub (Analysis | Solutions | Leaderboard ONLY here, remove leaderboard elsewhere), modular Start Test onboarding (SSC Eduquity vs TCS iON popup -> Step 1 format overview + rules + language -> Step 2 Green/Red/Blue-Purple/Gray UI legend + All the Best + Select Test Language + mandatory declaration; BPSC config), Student ID prefix rebrand (replacing MF-), and QuizConfig multi-exam + latest-to-oldest shift filter fixes.
First run /plan + /grill-me via ask_question to confirm Circuit Breakers (#1 >10 files, #3 DDL), replacement Student ID prefix, and scope decisions before editing code. Follow System-2 Cognitive Pre-Flight, verify with tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), supabase_mcp advisors, and Desktop (1280x800) + Mobile (390x844) Chrome DevTools MCP checks, then complete all 7 Phase 4 closeout steps and output the starter prompt for v1.0.385.
```
