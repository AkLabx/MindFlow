# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.382` (`package.json` SemVer: `1.0.382`)
- **Android App Version:** `versionCode 9`, `versionName "1.9"` (`android/app/build.gradle`)
- **Current Git Branch / PR:** `main` (`PR #1126` merged cleanly for `v1.0.382`; Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Integration Tests:** Passed (`46` files passed, `292` tests passed in `312.06s` via `npx.cmd vitest --run --pool=forks --maxWorkers=1`)
- **Playwright E2E Suite:** Passed (`1` passed in `30.9s` via `npx.cmd playwright test --reporter=list` — `e2e/mock-tests-smoke.spec.ts`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5493` modules transformed, PWA `generateSW` `212` entries, `6979.50 KiB`)
- **Supabase Security & Performance Advisors (`get_advisors`):** `0` new security/performance issues from additive migration `add_question_source_and_mock_types` and `107` seeded official PYQ tests (`8` BPSC `66th–71st` 150-Q papers, `53` SSC CGL 2026 Tier-1 25-Q shifts, `46` SSC CGL 2025 Tier-1 25-Q shifts)
- **Live Browser Verification (Chrome DevTools MCP — Desktop `1280x800` + Mobile `390x844`, 3x touch):**
  - Result: `0` console errors, `0px` horizontal overflow, `0` interactive targets `<44x44px` across audited routes.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md) — **Gen 2 (`v1.0.381` $\rightarrow$ `v1.0.390`) `ACTIVE` (`2/10 Done`)**
- **Active Generation Blueprint:** [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md) — **Student-First UX Simplification, Centralized Assessment & Paid Mock Test Courses**
- **Next Active Step:** **Step 3 (`v1.0.383`) — Paid Mock Courses, `My Purchase` Receipts, Unique Student ID, Test Series UX Redesign & Modular CBT (`BPSC` Fix + `SSC CGL` `TCS iON` / `Eduquity`)** *(quick `/plan` + `/grill-me` ONLY for remaining pricing/gateway choices FIRST)*

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
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (`type="button"`, zero hover-only hidden action buttons), `scroll-mb-28` clearance above `MainLayout` fixed bottom navigation (`WCAG 2.4.11`), `<KeyboardAwareBottomBar>`, `<DedicatedPageHeader>` on sub-pages, MWG scroll-snap `<SwipeableTabViewport>` / `.mf-h-rail`, native `<dialog>`/`RightDrawer` sheets, `<InfoHintPopover />` (`popover="auto"`), and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.383`)

- **Target Milestone:** `v1.0.383` (`package.json` SemVer: `1.0.383`)
- **Target Branch:** `feat/v1.0.383-paid-courses-cbt-ux`
- **Blueprint Reference:** Gen 2, **Step 3** in [`docs/blueprint/v2.0_blueprint.md`](../blueprint/v2.0_blueprint.md)
- **ALREADY-LOCKED & APPROVED USER SPECIFICATIONS (DO NOT RE-ASK THESE):**
  1. **`My Purchase` Page Redesign & Ultra-Clean Empty State (`MainLayout.tsx` + `PurchasedCoursesPage.tsx`):**
     - Rename UI label `Purchased` $\rightarrow$ **`My Purchase`** across footer (`MainLayout`), side panel, and `<DedicatedPageHeader title="My Purchase" />` (keep `ROUTES.PURCHASED` `/purchased` route intact for deep links).
     - Remove `Saved Mock Tests` section and all extra buttons/clutter from `/purchased`. If zero purchases exist, render ONLY a single centered empty state declaring `"No purchase yet"`.
     - Render purchases as receipt cards sorted **newest-to-oldest** (`created_at DESC`) displaying: **Course / Mock Series Name**, **Order ID**, **Purchase Date**, **End Date** (`valid_until`), and **Days Remaining**. Clicking a card navigates directly to that Mock Test Series (`ROUTES.TEST_SERIES.SERIES(id)`) or polymorphic future Video/PDF course target (`course_type` / `target_route`).
  2. **Unique Immutable Student ID in Profile & Exam Header:**
     - `public.profiles` currently has `18` rows and no `student_id` column (`public.handle_new_user()` creates new rows). Add unique `student_id text UNIQUE` via additive Postgres migration (sequence-backed prefix e.g. `MF-XXXXXX`, `BEFORE INSERT` default trigger + backfill for all existing users), expose it safely on `AuthProfile` (`AuthContext`), display prominently with 1-tap Copy (`>=44x44px`) in `ProfilePage.tsx`, and surface in SSC CBT Candidate Headers.
  3. **`/mcqs/test-series` Horizontal Android UX + Bottom Action Strip (`ExamCategoriesPage.tsx` + `TestsListPage.tsx`):**
     - Root `/mcqs/test-series` displays ONLY top-hierarchy **Mock Test Series** cards in true native Android left-to-right horizontal rails (fix touch panning competition with outer `SwipeableTabViewport`, use mobile peek card widths `w-[82vw] max-w-[304px]` so adjacent cards visibly peek, `overflow-x-auto overscroll-x-contain touch-pan-x`).
     - Remove `All Types | PYQ Papers | Expert Mocks` strip from root `/mcqs/test-series` and render the **`PYQ Papers` vs `Expert Mocks`** slide/filter **ONLY after opening a Test Series** inside `TestsListPage.tsx`.
     - Move `My Attempts` out of top category tabs AND add a new **`Live Test`** action inside a **fixed horizontally left-right scrollable button bar docked right above the Global Fixed Footer** (`bottom-[calc(4rem+env(safe-area-inset-bottom,0px))]`, keeping page padding `pb-36` / `scroll-mb-40`), backing `Live Test` with real timed/live filtering (`is_live`, `release_date`, `expiry_date`).
  4. **Fix BPSC Sticky Bottom Bar + Modular SSC CGL Exam Interfaces (`TCS iON` + `Eduquity Pattern`):**
     - **Verified Root Cause of BPSC Bottom Bar Bug (`PreparedMockExamPage.tsx`):** Outer wrapper (`L950`) sets `overflow-x-hidden`, which breaks `<footer className="sticky bottom-0 ...">` (`L1215`) on mobile/Android WebView until the user scrolls to the bottom of `<article>`. Fix by changing outer `overflow-x-hidden` $\rightarrow$ `overflow-x-clip`, pinning the footer via `fixed bottom-0 left-0 right-0 z-30` (with desktop sidebar padding offset and `<main className="... pb-28">`), keeping MindFlow's existing UI reserved for `BPSC Prelims`.
     - **Modular Pluggable CBT Architecture (`src/features/mock-tests/components/cbt/`):** Extract a shared `ExamRunnerSkinProps` interface + skin registry (`'bpsc_default' | 'tcs_ion' | 'eduquity'`) sharing `PreparedMockExamPage`'s single crash-safe timer, Dexie offline persistence, and submission engine so new exam skins plug in easily:
       - `BpscDefaultExamShell`: Existing MindFlow UI reserved for BPSC Prelims (with sticky/fixed bottom bar bug resolved).
       - `TcsIonExamShell`: Official classic SSC CGL TCS iON CBT layout (Top candidate header with Name + Unique Student ID + timer; Dynamic Section tabs from `subject`; Left Question pane with EN/HI toggle; **Right Question Palette sidebar** using the exact 5 classic TCS iON states & legend `[Not Visited, Not Answered, Answered, Marked for Review, Answered & Marked (green dot — Evaluated)]`; fixed bottom bar `Mark for Review & Next`, `Clear Response`, `Previous`, `Save & Next`, `Submit` section-summary modal).
       - `EduquityExamShell`: Authentic 2025/2026 SSC CGL Eduquity Career Technologies CBT layout (**Question Palette docked on the LEFT side** on split view, wide clean Question/Passage workspace on right, prominent built-in **Zoom In / Zoom Out** font scaling toolbar, streamlined `Save & Next` / `Mark for Review` / `Clear Response` / `Previous` controls, optional non-blocking biometric/camera readiness banner on start).
     - **SSC CGL Interface Chooser (`TestDetailPage.tsx`):** When launching any mock under SSC CGL, present a sleek selector (`<NativeDialog>` / persisted preference) letting the student pick **`TCS iON Classic`** vs **`Eduquity New Pattern`**, passing it into `/exam/:testId`.
  5. **Paid Mock Test Courses Packaging, Pricing/Demo Lock & Purchase Flow:**
     - Series/bundle packaging columns, free demo test unlock rules (`N` demos per paid series + lock badges + direct `#/exam/:testId` entitlement guard), Admin CMS pricing/demo controls, and Checkout/Unlock fulfillment writing real receipt records (`payments` + `user_course_entitlements`) rendered in `My Purchase`.

- **MANDATORY COLLABORATION GATE (Run `/plan` + `/grill-me` FIRST — ONLY on Open Pricing/Payment Decisions):**
  - **DO NOT write implementation code at session start.** Research and root-cause audits for Items #1–#4 above are ALREADY COMPLETE.
  - Interview the user concisely via `ask_question` ONLY to lock down the 4 remaining Paid Course & Schema decisions + Circuit Breakers:
    1. **Packaging Unit:** Series-level purchase (`mock_series` pricing) vs multi-series Course Bundles vs both?
    2. **Pricing, MRP & Validity Window:** INR price/MRP display rules and timed validity (`valid_until`, e.g., 180 / 365 days vs per-series validity days) for `My Purchase` Days Remaining.
    3. **Free Demo Count:** How many initial tests in a paid series are unlocked as Free Demo (`1`, `2`, or configurable `free_demo_count` per series)?
    4. **Payment / Fulfillment Mechanism:** Live Razorpay checkout Edge Function (`razorpay_order_id` + signature verification) vs Test/UPI + Admin-assisted activation hook first?
    5. **Circuit Breaker #1 Confirmation:** Confirm upfront whether the user approves implementing this full `v1.0.383` scope (`~14–22` files across UI, CBT skins, and additive migrations) in one release or wants it split.

- **Circuit Breakers & Constraints:**
  - *Scope Check (`Circuit Breaker #1`):* Expected file count (`~14–22` files) exceeds `10` files — **explicitly ask for approval before editing**.
  - *New Dependencies (`Circuit Breaker #2`):* STOP and ask before adding any payment/billing npm or Gradle package.
  - *Database / RLS / Auth (`Circuit Breaker #3`, `#4`, `#5`):* Present exact additive SQL DDL (`profiles.student_id` + sequence/trigger/backfill, `payments` receipt columns `series_id`, `course_type`, `target_route`, `valid_until`, `validity_days`, `mock_series` pricing/demo columns, `mock_tests.is_live`, `user_course_entitlements`) & RLS policies (`SECURITY INVOKER` default; `SECURITY DEFINER` only with `SET search_path = public, pg_temp` + auth checks) for user approval before applying via `supabase_mcp`.
  - *Invariants to protect:* `DEC-0001` through `DEC-0030`, `OLD-018`, `OLD-019` (`<HashRouter>`, OAuth hash extraction, no guest mode, 0ms IndexedDB hydration, `DB_TABLES.*` / `DB_RPCS.*`, native `<dialog>`/Popover UI, `>=44x44px` `type="button"` `active:scale-95`, 4-section Home, `/mcqs` studio, 5-tab Paid-App footer, `<DedicatedPageHeader>`, `PYQ` vs `MOCK` taxonomy, `6`-domain exam grouping, `300`-Q caps, `**/e2e/**` excluded in `vitest.config.ts`).

- **Real-World Verification Goal:**
  - *Static & Automated:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build` + `npx.cmd playwright test --reporter=list`.
  - *Database & Live Browser:* `supabase_mcp.get_advisors` (`0` errors); Chrome DevTools MCP (`390x844` + `1280x800`) verifies empty `My Purchase` (`"No purchase yet"`) & populated receipt card (`Order ID`, `Purchase Date`, `End Date`, `Days Remaining` -> opens series), `ProfilePage` Unique `Student ID`, `/mcqs/test-series` horizontal swipeable peek rails + docked bottom `My Attempts` / `Live Test` bar + `PYQ`/`Expert` filter inside `TestsListPage`, BPSC sticky/fixed bottom bar on top of Question 1, and SSC CGL `TCS iON` (right palette, 5 symbols) vs `Eduquity` (left palette, Zoom controls) switching cleanly with `0px` horizontal overflow and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.383.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0031`+, and `OLD-*` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 3 (`v1.0.383`) as `[x] DONE` with PR `#` in `docs/blueprint/v2.0_blueprint.md`, promote Step 4 (`v1.0.384`) to High-Def Spec, and refine Step 8 (`v1.0.388`) from Vision into Medium Detail.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.383` verified baseline and Step 4 (`v1.0.384`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, UUIDs, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.383`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 3 (v1.0.383) in docs/blueprint/v2.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main (ensure main is clean and synced) and do NOT write any code yet.
3. All product & UX requirements in Section 3 of CURRENT_HANDOVER.md are ALREADY APPROVED (My Purchase rename + receipt cards + "No purchase yet" empty state, immutable Unique Student ID in Profile + exam headers, /mcqs/test-series horizontal peek rails + bottom docked "My Attempts" & "Live Test" strip + moving PYQ/Expert inside TestsListPage, BPSC bottom bar fixed-position bug fix, and modular SSC CGL TCS iON vs Eduquity Pattern CBT selector). Do NOT re-ask or re-research those. Run a quick collaborative /plan + /grill-me via ask_question ONLY to lock down the remaining monetization choices (packaging unit, INR price/validity rules, free demo test count, payment/fulfillment mechanism, and Circuit Breaker #1 >10-file + #3 DDL approval) before coding.
4. Once aligned, run System-2 Cognitive Pre-Flight (trace entitlement hydration, Dexie cache safety, horizontal rail touch/scroll gesture isolation, fixed CBT footer layout & mobile palette drawers, direct #/exam/:testId URL guards, and unmount cleanup; identify 3 runtime failure modes) and implement cleanly.
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build; npx.cmd playwright test --reporter=list), check Supabase Advisors via MCP after DDL, and verify Desktop + Mobile UX across all changed flows in Chrome DevTools MCP with 0 console errors.
6. Execute the mandatory 7-step Phase 4 closeout ritual in docs/blueprint/v2.0_blueprint.md, overwrite CURRENT_HANDOVER.md with Step 4 (v1.0.384), and output the starter prompt for v1.0.384.
```
