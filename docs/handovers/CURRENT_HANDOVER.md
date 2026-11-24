# MindFlow Live Handover Baton (CURRENT_HANDOVER.md)

> **MANDATORY READING FOR FRESH CHATS:**
> This file is the single live baton passed from the concluding chat session to the next incoming fresh chat session. It contains the exact verified baseline, the immediate milestone brief, and the ready-to-run prompt.

---

## 1. Current Verified Baseline Snapshot

- **Repository:** `MindFlow` (Full-Stack React 19 + TypeScript + Vite + TailwindCSS + Capacitor Android + Supabase + IndexedDB)
- **Current Baseline Version:** `v1.0.376` (`package.json` SemVer: `1.0.376`, PR `TBD`, on `main`)
- **Android App Version:** `versionCode 6`, `versionName "1.6"` (`android/app/build.gradle`)
- **Current Git Branch:** `main` (Slot 1 Anchor / Host)
- **Static Typecheck:** Passed (`0` errors via `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit`)
- **Unit & Component Tests:** Passed (`40/40` test files, `256/256` tests passed via `npx.cmd vitest --run --pool=forks --maxWorkers=1`, including `7/7` in `src/features/admin/test-series/__tests__/adminTestAnalytics.test.tsx`, `15/15` in `src/features/admin/test-series/__tests__/adminTestSeriesCms.test.tsx`, `10/10` in `src/features/mock-tests/__tests__/mockTestsProgressLeaderboard.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockScoringReview.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/preparedMockExamRunner.test.tsx`, `6/6` in `src/features/mock-tests/__tests__/testDetailPage.test.tsx`, `13/13` in `src/hooks/useHardwareBackButton.test.ts`, `7/7` in `src/features/mock-tests/__tests__/examPreparedMockTests.test.tsx`, and `7/7` in `src/features/admin/question-builder/__tests__/questionBuilder.test.tsx`)
- **Production Build:** Verified cleanly via `npx.cmd vite build` (`5487` modules transformed, PWA precache `207` entries / `6859.40 KiB`)
- **Live Browser Verification (Chrome DevTools MCP against `http://localhost:3000/`):**
  - **Desktop (`1280x800`):**
    - `#/admin/test-series?tab=tests`: Verified `TestCard` `Insights` button and live hydration on `69th BPSC Prelims PYQs` (`Total Attempts: 2`, `1 unique students`, `Completion Rate: 50%`, `1 completed · 0 active`, `Avg Score: 1.13 / 150`, `Median 1.13 · Best 1.13`, `Avg Time: 1m 35s`, `Pass (≥95): 0 (0%)`, `Below Cutoff: 1`, Hardest Questions `Q103`/`Q1`, Most Skipped `Q2`–`Q6`).
    - Verified `QuestionPreviewDrawer` LIFO Top-Layer stacking (`openDialogs: 2` $\rightarrow$ `Escape` $\rightarrow$ `1` $\rightarrow$ `Escape` $\rightarrow$ `0`), `HISTORY [ Easy ]` empty state (`No Student Attempts Yet`), zero `profiles` joins, and `hasPii: false` in `localStorage`.
  - **Mobile (`390x844`):**
    - `#/admin/test-series?tab=tests`: Verified `0px` horizontal overflow on dashboard (`390/390`, `10/10` card footer buttons `>=44x44px`, `type="button"`) and inside open analytics drawer (`389/389`, `7/7` drawer buttons `>=44x44px`, `type="button"`), and `0` console errors.
- **Master Blueprint Index:** [`docs/blueprint/main_blueprint.md`](../blueprint/main_blueprint.md)
- **Active Generation Blueprint:** [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md) — **Gen 1B (`v1.0.367` $\rightarrow$ `v1.0.380`): Admin Panel & Dedicated BPSC Prepared Mock Tests Hardening**
- **Next Active Step:** **Step 11 (`v1.0.377`) — Admin Panel Global Shell, RBAC Route Guards, Command Palette & UX**

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
  - All screens must strictly adhere to native Android tactile touch feedback (`active:scale-95`), `>=44x44px` touch targets (`type="button"`, zero hover-only hidden action buttons), `scroll-mb-28` clearance above `MainLayout` fixed bottom navigation (`WCAG 2.4.11`), `<KeyboardAwareBottomBar>`, native `<dialog>`/`RightDrawer` sheets, and Top-Layer Popover `useNotification()` toasts.

---

## 3. Pre-Planned Execution Brief for Next Version (`v1.0.377`)

- **Target Milestone:** `v1.0.377` (`package.json` SemVer: `1.0.377`)
- **Target Branch:** `feat/v1.0.377-admin-shell-command-palette`
- **Blueprint Reference:** Gen 1B, **Step 11** in [`docs/blueprint/v1.0_blueprint.md`](../blueprint/v1.0_blueprint.md)
- **Objective:** Harden the overall Admin Panel shell (`AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminCommandPalette.tsx`) and audit admin RBAC route guards (`NavigationManager` / `AuthPolicy`) so managing BPSC mock tests and navigating CMS workflows feels fast, safe, and mobile-ergonomic.
- **Exact Scope & Targets:**
  1. **Admin Command Palette Quick Actions (`src/features/admin/layouts/AdminCommandPalette.tsx`):**
     - Add quick actions (`Ctrl+K` / `Cmd+K`) to jump directly to `/admin/test-series?tab=tests`, `/admin/test-series/tests/new`, and student preview `/mcqs/test-series/bpsc`, ensuring `>=44x44px` touch items (`type="button"`, `active:scale-95`) and accessible keyboard navigation.
  2. **Admin Shell, Mobile Drawer & Error Boundary Hardening (`AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`):**
     - Audit `AdminLayout.tsx` & `AdminSidebar.tsx` mobile `NativeDialog` drawer behavior (auto-close on route switch, `>=44x44px` touch targets, `0px` horizontal overflow), resilient error boundary / recovery around `<Outlet />`, safe-area padding (`env(safe-area-inset-bottom)`, `scroll-mb-28`), and zero broken sidebar routes across all `navGroups`.
  3. **Admin RBAC Route Guard Audit (`NavigationManager` / `AuthPolicy`):**
     - Audit `RouteAccessType.ADMIN` and `AuthPolicy.isAdmin` enforcement across all admin routes and add targeted Vitest checks verifying non-admin redirect to `/dashboard` without introducing unrequested auth flow rewrites.
  - *Out of scope:* Question bank edit cache invalidation (Step 12 `v1.0.378`) and global Mock Tests SWR test-suite expansion (Step 13 `v1.0.379`).
- **Circuit Breakers & Constraints:**
  - *Estimated files:* `<= 5` files inside `src/features/admin/` (`AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminCommandPalette.tsx`) and Vitest tests.
  - *New npm dependencies:* **None**.
  - *DB schema changes:* **None**.
  - *Auth / RBAC Circuit Breaker:* Audit-only by default — **STOP and ask** the user before modifying `AuthPolicy.ts`, OAuth interception, or route permission rules.
  - *Invariants to protect:* `DEC-0002` (zero `navigate(-1)`), `DEC-0004` (0ms IndexedDB hydration & offline resilience), `DEC-0007` (native `<dialog>` / Popovers), `DEC-0008` (`>=44x44px` `type="button"` `active:scale-95`), `DEC-0014` (`useNotification()`), `DEC-0018` (`DB_TABLES.MOCK.*`), `DEC-0019` (`scroll-mb-28`), `DEC-0024` (zero-PII admin analytics & LIFO drawer stacking).
- **Real-World Verification Goal:**
  - *Static:* `node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit` (`0` errors) + `npx.cmd vitest --run --pool=forks --maxWorkers=1` + `npx.cmd vite build`.
  - *Live Browser (Desktop `1280x800` & Mobile `390x844`):* Open Admin Panel at `#/admin/test-series?tab=tests`, test `Ctrl+K` / `Cmd+K` jump to Mock Tests CMS / New Test Builder / BPSC student listing, verify mobile slide-over drawer close on route switch, verify non-admin redirect to `/dashboard`, `0px` mobile overflow, `>=44x44px` controls, and `0` console errors.

---

## 4. Mandatory Closeout Checklist (Every Chat MUST Complete All 7)

- [ ] **Step 1:** Create release dossier `docs/versions/v1.0.377.md` using `docs/versions/00-template.md`.
- [ ] **Step 2:** Register newly made decisions in `docs/DECISIONS_MASTER.md` (`DEC-0025`, and `OLD-015` if applicable).
- [ ] **Step 3:** Prepend release entry to `docs/APP_JOURNEY_LOG.md` with exact IST timestamp.
- [ ] **Step 4:** Mark Step 11 (`v1.0.377`) as `[x] DONE` with PR `#` in `docs/blueprint/v1.0_blueprint.md`, promote Step 12 (`v1.0.378`) to High-Definition Spec (`[ ] NEXT`), and keep the rolling 4-step medium horizon updated.
- [ ] **Step 5:** Completely overwrite `docs/handovers/CURRENT_HANDOVER.md` with the `v1.0.377` verified baseline and Step 12 (`v1.0.378`) brief.
- [ ] **Step 6:** Run secret/privacy scan on staged git changes (zero API keys, tokens, personal emails, or local OS paths).
- [ ] **Step 7:** Commit, push, open PR via GitHub CLI `gh pr create`, record PR #, wait for CI check, squash merge, and verify clean `main`.

---

## 5. Copy-Paste Starter Prompt for Fresh Chat (`v1.0.377`)

```text
I am continuing development on MindFlow using the autonomous "1 Chat = 1 Version" workflow system governed by AGENTS.md, GEMINI.md, and the version-ritual skill.

Please follow this exact cold-start protocol:
1. Read ONLY the Hot Context (<20 KB):
   - docs/handovers/CURRENT_HANDOVER.md
   - docs/DECISIONS_MASTER.md
   - Active Step 11 (v1.0.377) in docs/blueprint/v1.0_blueprint.md
   (Do NOT read historical dossiers or full changelogs on startup.)
2. Verify git status on main and perform the 30-second Circuit Breaker sanity check (confirm <= 5 files, zero new npm packages, zero DB DDL changes, and STOP & ask before altering AuthPolicy/RBAC rules).
3. Run System-2 Cognitive Pre-Flight: simulate AdminLayout/AdminSidebar/AdminHeader/AdminCommandPalette lifecycles (Ctrl+K quick navigation, mobile NativeDialog sidebar drawer auto-close on route switch, ErrorBoundary recovery around <Outlet />, safe-area bottom clearance, and RouteAccessType.ADMIN guard enforcement), identify 3 runtime failure modes, and enforce zero-shortcut real implementations.
4. Execute the brief in Section 3 of CURRENT_HANDOVER.md (Target: v1.0.377 — Admin Panel Global Shell, RBAC Route Guards, Command Palette & UX).
5. Verify statically (node --max-old-space-size=4096 ./node_modules/typescript/bin/tsc --noEmit; npx.cmd vitest --run --pool=forks --maxWorkers=1; npx.cmd vite build) and visually in Chrome across Desktop (1280x800) + Mobile (390x844) at http://localhost:3000/ (confirming Ctrl+K quick actions, mobile drawer close on navigation, >=44x44px type="button" controls, 0px mobile overflow, and 0 console errors).
6. Execute the mandatory 7-step Phase 4 closeout ritual, update docs/blueprint/v1.0_blueprint.md (marking Step 11 v1.0.377 DONE, promoting Step 12 v1.0.378 to High-Def NEXT), overwrite CURRENT_HANDOVER.md with Step 12 (v1.0.378), and output the starter prompt for v1.0.378.
```
