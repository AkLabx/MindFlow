# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.381` (`package.json` SemVer: `1.0.381`)
- **Android App Version:** `versionCode 8`, `versionName "1.8"` (`android/app/build.gradle`)
- **Current Git Branch / PR:** `feat/v1.0.381-student-home-mock-hub` / `PR #PENDING` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Integration Tests:** Passed (`44` files passed, `282` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`)
- **Playwright E2E Suite:** Passed (`1` passed in `31.6s` via `npx.cmd playwright test --reporter=list`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`209` PWA precache entries, `6947.76 KiB`)
- **Live Browser Verification (Chrome DevTools MCP — Desktop `1280x800` + Mobile `390x844`, 3x touch):**
  - Routes audited: `#/dashboard`, `#/mcqs`, `#/quiz/bookmarks`, `#/quiz/library` (all 3 tabs), `#/profile`, `#/mcqs/test-series`, `#/admin/test-series`.
  - Result: `0` console errors, `0px` horizontal overflow, `0` interactive targets `<44x44px`.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md) — **Gen 2 (`v1.0.381` $\rightarrow$ `v1.0.390`) `ACTIVE` (`1/10 Done`)**
- **Active Generation Blueprint:** [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md) — **Student-First UX Simplification, Centralized Assessment & Paid Mock Test Courses**
- **Next Active Step:** **Step 2 (`v1.0.382`) — Paid Mock Test Courses Packaging, Pricing/Demo Lock & Purchase Flow** *(Collaborative `/plan` + `/grill-me` alignment FIRST)*

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
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (`type="button"`, zero hover-only hidden action buttons), `scroll-mb-28` clearance above `MainLayout` fixed bottom navigation (`WCAG 2.4.11`), `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, `<InfoHintPopover />` (`popover="auto"`), and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.382`)

- **Target Milestone:** `v1.0.382` (`package.json` SemVer: `1.0.382`)
- **Target Branch:** `feat/v1.0.382-paid-mock-courses`
- **Blueprint Reference:** Gen 2, **Step 2** in [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md)
- **MANDATORY FIRST PHASE — Collaborative `/plan` + `/grill-me` (DO NOT WRITE CODE FIRST):**
  - Before touching any source file or database migration, **interview the user via `/plan` + `/grill-me` (`ask_question`)** to align on all Paid Mock Test Course design decisions:
    1. **Packaging Unit:** Series-level pricing vs multi-series Course Bundles vs per-test locks.
    2. **Pricing & Validity:** INR price/MRP display, lifetime vs timed validity (e.g., 6/12 months), and whether coupons/bundles belong in `v1.0.382` or later steps.
    3. **Free Demo / Preview Rules:** How many tests per paid course are free demos and how locked vs unlocked badges render on `ExamCategoriesPage`, `TestSeriesPage`, `TestsListPage`, and `TestDetailPage`.
    4. **Purchase & Entitlement Mechanism:** Exact payment flow (e.g., Razorpay / UPI / Play Billing / Admin-assisted activation) and Supabase tables/RLS/Edge Functions required.
- **Objective (After Plan Approval):** Implement the agreed Paid Mock Test Courses packaging, pricing/demo-lock badges, server-verified entitlement guards (blocking unentitled `/exam/:testId` launches), Admin pricing/demo toggles, and initial purchase/unlock flow.
- **Circuit Breakers & Constraints:**
  - *Scope Check (`Circuit Breaker #1`):* Confirm total modified/created files (`<= 10` threshold, or get explicit approval if broader).
  - *New Dependencies (`Circuit Breaker #2`):* STOP and ask before adding any payment/billing npm or Gradle package.
  - *Database / RLS / Auth (`Circuit Breaker #3`, `#4`, `#5`):* Present exact additive SQL DDL & RLS policies (`SECURITY INVOKER` default; `SECURITY DEFINER` only with `SET search_path = public, pg_temp` + auth checks) and get explicit user confirmation before applying via `supabase_mcp`.
  - *Invariants to protect:* `DEC-0001` through `DEC-0029` & `OLD-018` (`<HashRouter>`, OAuth hash extraction, no guest mode, 0ms IndexedDB hydration, `DB_TABLES.*` / `DB_RPCS.*`, native `<dialog>`/Popover UI, `>=44x44px` `type="button"` `active:scale-95`, 4-section Home, `/mcqs` studio, `300`-Q caps, `**/e2e/**` excluded in `vitest.config.ts`).
- **Real-World Verification Goal:**
  - *Static & Automated:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build` + `npx.cmd playwright test --reporter=list`.
  - *Database & Live Browser:* `supabase_mcp.get_advisors` (`0` errors); Chrome DevTools MCP (`390x844` + `1280x800`) verifies free demo launch, paid lock protection (including direct `#/exam/:testId` URL guard), purchase/unlock state, `0px` horizontal overflow, and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.382.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0030`, and `OLD-019` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 2 (`v1.0.382`) as `[x] DONE` with PR `#` in `docs/blueprint/v2.0_blueprint.md`, promote Step 3 (`v1.0.383`) to High-Def Spec, and refine Step 7 (`v1.0.387`) from Vision into Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.382` verified baseline and Step 3 (`v1.0.383`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.382`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 2 (v1.0.382) in docs/blueprint/v2.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main (ensure PR #PENDING for v1.0.381 is merged and main is clean) and do NOT write any code yet.
3. Run collaborative /plan + /grill-me alignment with me FIRST using ask_question to lock down Paid Mock Test Courses architecture (packaging unit, INR pricing & validity, free demo test policy, checkout/payment verification mechanism, and DB/RLS requirements) and confirm any Circuit Breakers (#1-#5) before implementing Section 3 of CURRENT_HANDOVER.md (Target: v1.0.382).
4. Once aligned, run System-2 Cognitive Pre-Flight (trace entitlement hydration, offline cache safety, direct URL guards, purchase/unlock recovery, and unmount cleanup; identify 3 runtime failure modes) and implement cleanly.
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build; npx.cmd playwright test --reporter=list), check Supabase Advisors via MCP if DDL ran, and verify Desktop + Mobile UX in Chrome DevTools MCP with 0 console errors.
6. Execute the mandatory 7-step Phase 4 closeout ritual in docs/blueprint/v2.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 3 (v1.0.383), and output the starter prompt for v1.0.383.
```
