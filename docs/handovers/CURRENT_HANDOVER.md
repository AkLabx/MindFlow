# MindFlow Handover Baton (`CURRENT_HANDOVER.md`)

> **First Read on Every Cold Start!** Keep strictly concise and operational (< 6 KB). Do NOT paste code snippets, DB credentials, tokens, or PII.

---

## 1. Current Verified Baseline
- **Active Generation:** Gen 2 (`docs/blueprint/v2.0_blueprint.md`)
- **Last Completed Version:** **`v1.0.383`** (26 November 2026, 12:55 AM IST)
- **Last Merged PR / Status:** `PR #1128` — `package.json` `1.0.383` | Android `versionCode 10`, `versionName "1.10"`
- **Live Verification Evidence (`v1.0.383`):**
  - Typecheck: `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors).
  - Unit & Integration Tests: `npx.cmd vitest --run --pool=forks --maxWorkers=1` (`47` test files, `298` tests passed).
  - Production Build: `npx.cmd vite build` (`5498` modules, `214` PWA precache entries, `7104.03 KiB`).
  - Playwright E2E: `npx.cmd playwright test --workers=1 --reporter=list` (`2/2` passed: `e2e/mock-tests-smoke.spec.ts` + `e2e/paid-courses-cbt-ux.spec.ts` across Desktop `1280x800` and Mobile `390x844`, `0` console errors, `0px` horizontal overflow, `>=44px` controls, AI orb clearance, BPSC `fixed bottom-0` footer, `TCS iON` / `Eduquity` switching, `My Purchase` receipts & empty state, `#/exam/:lockedId` 0-fetch guard).
  - Database State: `profiles.student_id` (`MF-100001`–`MF-100018`), pricing/demo/live columns on `mock_series`/`mock_tests`, `payments` receipt columns, `user_course_entitlements`, and 4 `SECURITY DEFINER` RPCs applied on `sjcfagpjstbfxuiwhlps` (`supabase_mcp.get_advisors` `0` `ERROR`s; existing 3 official PYQ series remain free; check `list_migrations` / `apply_migration` sync for `20261126000000_paid_courses_student_id_cbt_ux.sql` at session start).
- **Workstation / Deterministic Port Mapping:**
  - Slot 1 (`D:\MindFlow-main`): `main` $\rightarrow$ `http://localhost:3000/` (`npm run dev`)
  - Slot 2 (`worker-1`): `feat/...` $\rightarrow$ `http://localhost:3001/` (`npm run dev -- --port 3001`)
  - Slot 3 (`worker-2`): `feat/...` $\rightarrow$ `http://localhost:3002/` (`npm run dev -- --port 3002`)
  - Repo hygiene check: keep `main` clean on remote (`feat/vX.Y.Z-...` branched from `origin/main`).

---

## 2. Active Critical Invariants (Do Not Break)
- Preserve `<HashRouter>`, OAuth hash token extraction (`useAppBootstrap.ts`), and `0ms` IndexedDB hydration (`DEC-0001`..`DEC-0005`, no guest login `DEC-0006`).
- Import all remote Supabase table/RPC names from `DB_TABLES` / `DB_RPCS` (`src/config/dbTables.ts`) (`DEC-0018`); NEVER rename IndexedDB stores in `src/lib/db.ts`.
- Keep global header hidden via `isHeaderHiddenRoute` on `/mcqs/test-series*`, `/quiz/library*`, and `/purchased` (`DedicatedPageHeader.tsx`, `DEC-0030`); preserve 5-tab footer (`Dashboard | Mock Tests | AI | My Purchase | Profile`) with `School Mode` & `Community & Social` in `SidePanel.tsx`.
- Keep `My Purchase` (`ROUTES.PURCHASED = '/purchased'`) free of `Saved Mock Tests`, validating receipt `target_route` (`startsWith('/') && !startsWith('//')`) and keeping `profiles.student_id` immutable (`DEC-0031`).
- Never fetch CBT questions on `#/exam/:testId` without passing `resolveMockTestAccess` (`DEC-0031`); keep `overflow-x-clip` + `fixed bottom-0` across `BpscDefaultExamShell`, `TcsIonExamShell`, and `EduquityExamShell`, and keep `>=6px` clearance above `MainLayout`'s AI orb on `test-series-bottom-action-strip` (`DEC-0032`).
- Use `>=44x44px` `type="button"` `active:scale-95` controls, MWG `<NativeDialog>` / `<InfoHintPopover />`, zero `navigate(-1)`, and zero secrets/PII in code, docs, or git history.

---

## 3. Target Execution Brief for Next Chat: `v1.0.384` (Gen 2 Step 4)
- **Target Version:** **`v1.0.384`** (`feat/v1.0.384-course-bundles-entitlement-ux`)
- **Primary Objective:** Implement **Gen 2 Step 4** from [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md): **Course Bundles, Upsell Discovery & Multi-Course Entitlement UX**:
  1. Check first whether `20261126000000_paid_courses_student_id_cbt_ux.sql` is registered in `supabase_mcp.list_migrations` (run idempotent `apply_migration` sync if missing, respecting Circuit Breaker #3 if further schema extensions like `bundle_series_ids` are proposed).
  2. Extend `mockTestsApi.resolveMockTestAccess`, `AdminTestSeriesDashboard` / `SeriesDrawer`, and `AdminFinancialsPage` so `course_type = 'bundle'` packages unlock all mapped child series cleanly without breaking single-series pricing.
  3. Surface bundle discovery cards (`Bundle` badge + included series summary + savings vs MRP) on `/mcqs/test-series`, highlight expiring-soon (`<= 14 days`) receipts on `My Purchase` (`/purchased`) with a 1-tap `Renew Access` checkout flow, and support safe internal polymorphic `target_route` links (`video`/`pdf` course cards).
  4. Verify static checks (`tsc`, full `vitest --pool=forks --maxWorkers=1`, `vite build`, `playwright test --workers=1 --reporter=list`) and inspect Desktop (`1280x800`) + Mobile (`390x844`) UX in Chrome DevTools MCP (`0` console errors, `0px` horizontal overflow, `>=44x44px` controls).

---

## 4. Mandatory Phase 4 Closeout Checklist (`1 Chat = 1 Version`)
Before ending `v1.0.384`:
1. Bump version (`package.json` `1.0.384` + `android/app/build.gradle` `versionCode 11`, `versionName "1.11"`).
2. Create `docs/versions/v1.0.384.md` from `docs/versions/00-template.md` (with real bugs caught + verification proof).
3. Update `docs/DECISIONS_MASTER.md` (`DEC-*` & `OLD-*`).
4. Prepend `v1.0.384` release log entry with IST timestamp in `docs/APP_JOURNEY_LOG.md`.
5. Update `docs/blueprint/v2.0_blueprint.md` (mark Step 4 `[x] DONE` with PR `#`, promote Step 5 `v1.0.385` to High-Def, refine Step 9 `v1.0.389` to Medium).
6. Overwrite this file (`docs/handovers/CURRENT_HANDOVER.md`) with `v1.0.384` baseline, `v1.0.385` brief, and starter prompt.
7. Run secret/PII scan, push PR, squash-merge after CI green, delete feature branch, sync `main`, and output the starter prompt for `v1.0.385`.

---

## 5. Starter Prompt for `v1.0.384` (Copy-Paste into Fresh Chat)

```text
Start a new MindFlow session under AGENTS.md, GEMINI.md, and .agents/skills/version-ritual/SKILL.md.
Read in strict Cold-Start order ONLY:
1. docs/handovers/CURRENT_HANDOVER.md
2. docs/DECISIONS_MASTER.md
3. docs/blueprint/v2.0_blueprint.md

Execute Gen 2 Step 4 (v1.0.384): Course Bundles, Upsell Discovery & Multi-Course Entitlement UX on branch feat/v1.0.384-course-bundles-entitlement-ux.
Follow System-2 Cognitive Pre-Flight, stop for Circuit Breakers if needed (>10 files, new deps, or additive bundle DDL), verify with tsc --noEmit, vitest (--pool=forks --maxWorkers=1), vite build, playwright test (--workers=1), supabase_mcp advisors, and Desktop + Mobile (390x844) browser checks, then complete the full 7-step Phase 4 closeout ritual and output the starter prompt for v1.0.385.
```
