# MindFlow Autonomous Agent Guidelines & Memory Context (AGENTS.md)

Welcome, Autonomous AI Agent! This file contains the prioritized architectural, safety, routing, and development guidelines for working on the MindFlow full-stack application. You MUST read and adhere to these directives before executing any task.

---

## 0. Decision Precedence Hierarchy

When conflicting instructions or ambiguous choices arise, strictly follow this order of priority:
1. **Explicit User Prompt** (The user's direct instruction in chat).
2. **Sound Engineering Best Practices & Pragmatic Constitution** (`docs/MINDFLOW_CONSTITUTION.md` — Supreme product, UX & state standard, subject to the Pragmatic Amendment Clause: if a rule conflicts with a sound best practice, the best practice may be chosen provided the rationale is recorded in `docs/PRODUCT_DECISIONS.md`).
3. **Repository Guardrails & Safety** (This file and Section 2 Critical Invariants).
4. **Architecture Decision Records & Design Logs** (`docs/PRODUCT_DECISIONS.md`, `docs/ADR/*`).
5. **Existing Codebase Conventions & Feature-Sliced Architecture** (`src/features/*`).
6. **Project Documentation** (`docs/AI_MEMORY_CONTEXT.md` and `docs/APP_JOURNEY_LOG.md`).
7. **General Best Practices** (Industry standards).

---

## 0.1 MindFlow Product Constitution & Compliance Checklist

All autonomous agents, pair programmers, and contributors must read and strictly adhere to **`docs/MINDFLOW_CONSTITUTION.md`** before proposing, drafting, or implementing any architectural, state, navigation, or UX modifications.

Every Pull Request and implementation verification report MUST verify against the **Constitution Compliance Checklist**:

### Constitution Compliance Checklist
- [ ] **One Concept → One Control → One Location:** Single authoritative controller for every state dimension; zero duplicate controls.
- [ ] **Context Preserved:** Downstream screens inherit active exam, subject, and mode without redundant prompts or resetting on clear.
- [ ] **Logical Back Respected:** In-app `<ArrowLeft />` returns to hierarchical logical parent; Android HW back follows topmost interceptor.
- [ ] **Offline-First:** Immediate 0ms local render from IndexedDB; network acts purely as background synchronization.
- [ ] **State Owner Defined:** Every new or modified state slice is registered to exactly one owning store in the State Ownership Matrix.
- [ ] **Unidirectional Data Flow:** No component-to-component shadow state or two-way sync loops.
- [ ] **Performance Budget Respected:** Verifies against Section 8 budgets (Dashboard FCP <1s, filter calculation <16ms, quiz gen <300ms).
- [ ] **Accessibility Reviewed:** Minimum 44x44px touch targets, WCAG 2.1 AA contrast ratio, screen-reader labels.
- [ ] **Telemetry Events Added:** Meaningful diagnostic events emitted without PII (`exam_selected`, `quiz_generated`, etc.).
- [ ] **Empty & Error States Implemented:** Actionable diagnostics and one-tap recovery buttons provided; zero dead ends.

---

## 1. Circuit Breakers: "Stop and Ask"

Before executing planned changes, **STOP and ask the user for confirmation** if:
- More than **10 files** would be created or modified in a single task.
- A database migration alters, drops, or transforms existing table data.
- A new third-party dependency (`npm` package) must be added.
- Authentication flows, security models, or route permission logic change.
- Public APIs, shared component contracts, or exported types will break.
- Architectural requirements are ambiguous, contradictory, or unverified.

---

## 2. Core Priority Matrix

### [CRITICAL] Hard Invariants (Zero-Tolerance)
- **Hash Routing & OAuth Preservation**:
  - MindFlow is deployed on GitHub Pages at a subpath (`https://aklabx.github.io/MindFlow/`) and wrapped in Capacitor for Android.
  - **DO NOT remove or replace `<HashRouter>`** in `src/App.tsx`.
  - **DO NOT remove or alter the OAuth hash interception logic** in `src/hooks/useAppBootstrap.ts` (where `access_token` and `refresh_token` are parsed from `window.location.hash`, passed to `supabase.auth.setSession()`, and cleaned via `window.history.replaceState`).
- **Zero Secrets**: NEVER commit, log, or expose private API keys, service role tokens, connection strings, or user credentials. Client bundles must only contain public client keys (`VITE_SUPABASE_ANON_KEY`).
- **Destructive Database Protection**: Destructive database migrations (e.g., dropping tables, removing columns, truncating tables) are strictly prohibited unless explicitly authorized in writing by the user.
- **No Guest Login**: Guest login functionality is strictly prohibited. All users must authenticate with a real account.
- **Android Native Feel & Behavior Uplift (Non-Negotiable)**: All ongoing and future application frontend development is bound by the non-negotiable term and condition that every screen, component, and interaction MUST strictly uplift and adhere to a native Android APK feel and behavior. The UI and UX must look, feel, transition, handle gestures, and respond like a top-tier native Android application (proper tactile touch feedback/ripple, zero web-like layout shifting or bounce, native Android navigation/back handling, Android-style bottom sheets/dialogs, Android WebView keyboard avoidance, and mobile-first ergonomics).
- **Database Function Safety**: Database RPCs must use `SECURITY INVOKER` by default so they execute with caller permissions and respect RLS. Only use `SECURITY DEFINER` when elevated privileges are strictly necessary, always setting `SET search_path = public` with internal authorization checks.

### [HIGH] Mandatory Process & Verification Rules
- **Read-Before-Write**: Inspect target files and verify call sites before editing. NEVER assume a file, function, component, or export exists without locating it first.
- **Surgical Edits**: Keep diffs minimal. Avoid drive-by formatting, unsolicited styling changes, or modifying unrelated code while fixing a bug or adding a feature.
- **Distinguish Facts from Recommendations**: Clearly separate observed codebase reality (*"MindFlow uses Feature-Sliced Design in src/features/"*) from suggestions. Do not rewrite working patterns to match personal preference.
- **Confidence Calibration**: Before presenting code or declaring a task complete, evaluate your confidence:
  - **High**: Verified against codebase patterns and validated via project scripts.
  - **Medium**: Works conceptually, but edge cases or platform quirks remain unverified.
  - **Low**: Uncertain about behavior or dependencies. **Explain what remains uncertain to the user instead of guessing or fabricating a solution.**
- **Pre-Commit Verification**:
  - Run typecheck: `npx tsc --noEmit` (Must pass with 0 errors).
  - Run build: `npx vite build` (or `npm run build`).
  - Run tests (when applicable): `npx vitest --run`.
  - *Note: Do NOT run `npm run test` or `npm run typecheck` as those scripts are not configured in `package.json`.*
- **Mandatory Version Bump & App Journey Logging Ritual**:
  - Every time a version bump is performed in `package.json` (or `android/app/build.gradle`), you MUST record an entry in `docs/APP_JOURNEY_LOG.md`.
  - Required format: `## [vX.Y.Z] - DD MMMM YYYY, HH:MM AM/PM IST` (Always use Indian Standard Time, UTC+5:30).
  - Summarize work cleanly under structured headings (`✨ Features`, `🐛 Bug Fixes`, `⚡ Performance & Refactoring`, `🔒 Security & Architecture`).
  - STRICT ZERO-SENSITIVITY POLICY: Never include sensitive info, tokens, credentials, or private connection strings.

### [HIGH] Modern Web Guidance & Baseline Platform Directives (Google Chrome MWG)
Autonomous agents implementing or modifying MindFlow UI, styles, scheduling, or client logic MUST adhere to **Google Chrome Modern Web Guidance (MWG)** standards and prioritize web platform native capabilities:
- **Baseline Primitives First**: Favor native, high-performance web platform capabilities (Baseline Widely Available) over heavy npm dependencies, legacy polyfills, and outdated JavaScript workarounds.
- **Dialogs & Popovers (Top Layer)**:
  - Use native HTML `<dialog>` elements and the HTML **Popover API** (`popover="auto"` or `popover="manual"`).
  - Animate elements entering and exiting the Top Layer smoothly using CSS `@starting-style` and `transition-behavior: allow-discrete`.
  - Avoid custom modal backdrop portaling, manual body scroll locks, or fragile z-index escalation ladders.
- **CSS Anchor Positioning**:
  - Prefer native **CSS Anchor Positioning** (`anchor-name`, `position-anchor`, `inset-area`, `@position-try-fallbacks`) for tooltips, floating popups, and quiz action hint bubbles instead of JavaScript bounding-box calculation libraries (`floating-ui`, `popper.js`).
- **Core Web Vitals & INP Optimization (`scheduler.yield()`)**:
  - Break up long-running JavaScript execution (e.g., question bank filtering, search indexing, IndexedDB hydration, math rendering, and AI response stream processing) using `await scheduler.yield()` or `scheduler.postTask()` with appropriate task priorities (`user-visible`, `background`).
  - Maintain a strict frame budget ($< 16\text{ms}$) to guarantee stutter-free 60fps performance on mobile Android WebView.
- **Fluid Screen & Page Transitions**:
  - Leverage the native **View Transitions API** (`document.startViewTransition()`) for fluid page-to-page morphing, card expansions, and route transitions in MindFlow's SPA routing without heavy animation runtime overhead.
- **Modern CSS Layout & Primitives**:
  - Use **Container Queries** (`@container`) and **Subgrid** (`grid-template-columns: subgrid`) for responsive cards and choice grids that adapt to their container context rather than viewport widths.
  - Utilize `:has()` relational selectors instead of component-to-component shadow state synchronization.
  - Standardize dark/light theme styling with modern CSS functions like `light-dark()` and high-gamut `oklch()`.
- **Accessible & Standardized Forms**:
  - Leverage native HTML form validation with CSS `:user-invalid` instead of heavy external schema validation libraries for basic UI field hygiene.
  - Support WebAuthn biometric **Passkey Conditional UI** (autofilling credentials on identity inputs) for frictionless, one-tap mobile authentication.
- **Nuanced Fallbacks & Progressive Enhancement**:
  - Distinguish additive enhancements (e.g., speculative rules, smooth scroll-driven effects) which can be safely omitted on older engines, from critical capabilities.
  - When non-Baseline features require fallbacks, implement lightweight inline custom fallbacks ($\le 20$ lines of code, zero extra npm dependencies) rather than pulling in external bundle bloat.
  - Respect project configuration in `.mwgrc` (`allowOriginTrials: false`, `allowVolatileFeatures: false`).

### [NORMAL] Architectural & Domain Conventions
- **Development Server & Deterministic Port Architecture**:
  - The default Vite dev server port is **3000** for Slot 1 (`http://localhost:3000/`).
  - To prevent port collisions and confusing cross-slot previews during parallel multi-agent development, ports are deterministically mapped by workspace slot:
    - **Slot 1 (Anchor / Host: `D:\MindFlow-main`)**: Port `3000` (`http://localhost:3000/`).
    - **Slot 2 (Worker 1: `worktrees/.../supabase_user_profiles_count` or `worker-1`)**: Port `3001` (`http://localhost:3001/`).
    - **Slot 3 (Worker 2: `worktrees/.../update_main_feature_branch` or `worker-2`)**: Port `3002` (`http://localhost:3002/`).
  - **Live Preview Without Commits**: AI agents and developers do NOT need to commit to `main` (or commit at all) to see live previews. Vite's Hot Module Replacement (HMR) reflects live file edits on disk in milliseconds directly inside the slot where the dev server is running.
  - **Dev Server Startup Protocol**:
    - When launching Vite in Slot 1: `npm run dev`
    - When launching Vite in Worker 1: `npm run dev -- --port 3001` (or `npx vite --port 3001`)
    - When launching Vite in Worker 2: `npm run dev -- --port 3002` (or `npx vite --port 3002`)
    - Autonomous agents must inspect the command output to verify the actual bound port before reporting the preview URL to the user.
- **Dependency Installation**: ALWAYS use `npm install --legacy-peer-deps` to bypass ERESOLVE peer dependency conflicts arising from Capacitor Android plugins.
- **App Architecture & Navigation**:
  - `useAppBootstrap.ts` is a state machine yielding discrete states (`BOOTSTRAPPING`, `READY`, `FAILED`, `MAINTENANCE`, `UPDATE_REQUIRED`, `OFFLINE_INITIALIZATION`) handled centrally in `App.tsx`.
  - Centralized in `NavigationManager` (`src/lib/navigation/NavigationManager.tsx`), delegating to a Policy Engine (`PlatformPolicy`, `AuthPolicy`, `IntentPolicy`, `OnboardingPolicy`). Legacy route guards (`AuthGuard`, `ProtectedRoute`) have been strictly removed.
  - Root `/` serves as the unified guest authentication portal (`AuthPage`). Authenticated users redirect to `/dashboard`.
- **Quiz & Offline-First Storage**:
  - Rely on IndexedDB for offline-first support. Quizzes must be seeded into IndexedDB (`db.saveQuiz`) immediately upon creation.
  - IndexedDB mutations must be upsert-safe.
  - Session creation is strictly centralized in `src/features/quiz/services/quizCreationService.ts`.
  - The `public.saved_quizzes` table does NOT have an `updated_at` column; always query `created_at`.
  - Consume metadata caching centrally via `useQuestionMetadata` hook.
- **AI Pipelines (pgmq & Edge Functions)**:
  - Ingestion: Client upload (`content_studio`) -> `source_documents` -> `enqueue_extraction_job` -> `pgmq.pre_phase_question_jobs`.
  - Enrichment: `pgmq.q_question_ai_jobs` consumed by `enrich-questions`.
  - In `ai_task_config`, `batch_size` must strictly be **1** to prevent bypassing RPM rate limits. Primary model: `gemini-3.1-flash-lite`.
  - Infrastructure errors (429, 503, timeouts) must use exponential backoff by updating `pgmq` visibility timeout (`vt`). `FAILED` status is strictly reserved for unrecoverable data errors.
- **Gemini Multimodal Live API**:
  - Library: `@google/genai` with `live.connect()`.
  - Microphone input: **16kHz** Float32 -> Int16 PCM.
  - Speaker output: **24kHz** Int16 PCM -> Float32.
  - AudioWorkletProcessor is stored as an inline string blob (`AudioRecorderWorkletCode` in `audio-helpers.ts`) via `URL.createObjectURL(blob)`.
- **UI, UX, & Layout Best Practices**:
  - Fixed-bottom components must use `<KeyboardAwareBottomBar>` to handle safe areas and Android WebView keyboard resizing.
  - Headers are centralized in `src/layouts/MainLayout.tsx`; use route-based exclusion logic (`isHeaderHiddenRoute`).
  - Full-viewport pages: `min-h-[100dvh] w-full` with positive padding. Safe-area insets: `pb-[env(safe-area-inset-bottom)]`.

- **App Launch Lifecycle & Intro Diagnostics**:
  - When diagnosing startup animations, splash screens, or visual launch bugs, **NEVER assume the hardcoded client `DEFAULT_CONFIG` is active**.
  - Always check the live database table `public.app_ui_config` in Supabase (`project_id: sjcfagpjstbfxuiwhlps`), as remote configuration overrides client defaults after the initial bootstrap.
  - Distinguish between the three launch visual layers:
    1. *Android System Splash Screen:* OS-level adaptive icon launch screen.
    2. *Blue Splash Reveal (`BlueIntro`):* Orbital spinning halo ring around the logo with "MindFlow" text, followed by the circular aperture zoom reveal.
    3. *AI Particle Intro (`ParticleIntro`):* Interconnected neural particle mesh with "MINDFLOW" text overlaid over the eager-mounted UI.

### [OPTIONAL] Recommendations
- Suggest performance optimizations (memoization, route-level code splitting) when tangible bottlenecks exist.
- Recommend clean component composition over deep prop drilling.

---

## 3. Automated GitHub PR & Git Workflow (GitHub CLI) & Antigravity Working Method

### 3.1 Multi-Slot Architecture & Deterministic Port Mapping (Solo Developer Standard)
MindFlow uses a standardized Multi-Slot Architecture designed specifically for solo developers operating parallel Antigravity AI sessions without branch collisions, port clashing, or disk bloat:

| Slot | Workspace Location | Assigned Branch | Dev Port | Preview URL | Primary Function |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Slot 1 (Anchor / Host)** | `D:\MindFlow-main` | `main` | **`3000`** | `http://localhost:3000/` | Sole owner of `main`, stable release preview, root documentation, fast-forward post-merge pulls |
| **Slot 2 (Worker 1)** | `worktrees/.../supabase_user_profiles_count` | `worker-1` / `feat/...` | **`3001`** | `http://localhost:3001/` | Primary parallel AI session, feature branch development & live preview |
| **Slot 3 (Worker 2)** | `worktrees/.../update_main_feature_branch` | `worker-2` / `feat/...` | **`3002`** | `http://localhost:3002/` | Secondary parallel AI session, audit/refactor tasks & independent live preview |

- **CRITICAL INVARIANTS**:
  - **Slot 1 is the Sole Owner of Local `main`**: Never checkout `main` in Worker 1 or Worker 2.
  - **Branching Protocol**: Always branch directly from `origin/main` in workers:
    ```powershell
    git fetch origin main
    git checkout -B feat/<feature-name>-v<version> origin/main
    ```
  - **Deterministic Port & Live Preview Awareness**:
    - An agent must check its working directory (`pwd` / system working directory).
    - If in Slot 1 (`D:\MindFlow-main`): Launch dev server with default port `3000` (`npm run dev`).
    - If in Worker 1 (`supabase_user_profiles_count`): Launch dev server with `--port 3001` (`npm run dev -- --port 3001`).
    - If in Worker 2 (`update_main_feature_branch`): Launch dev server with `--port 3002` (`npm run dev -- --port 3002`).
    - Agents must inspect Vite's startup output to confirm the actual bound port before reporting preview URLs to the user.
    - **Zero Commits Needed for Preview**: Vite's HMR hot-reloads uncommitted disk edits in milliseconds. Neither local nor remote commits to `main` are required to test or view changes in the browser.
  - **Worker Post-Merge Protocol**:
    After PR merge on GitHub, delete the local feature branch, prune tracking references, and return to the slot's idle scratch branch:
    ```powershell
    # In Worker 1:
    git checkout worker-1
    git merge --ff-only origin/main
    git branch -d feat/<feature-name>-v<version>
    git fetch --prune

    # In Worker 2:
    git checkout worker-2
    git merge --ff-only origin/main
    git branch -d feat/<feature-name>-v<version>
    git fetch --prune
    ```
    Never checkout `main` in worker worktrees! Slot 1 will pull `origin/main` cleanly.

### 3.2 User Flexibility & Decision Governance (Recommendation vs User Choice)
If the user prompt instructs or prefers a different workflow (e.g., creating a new ephemeral worktree or working directly in Slot 1), the agent **must not** blindly refuse or proceed silently. The agent must provide a brief **Recommendation vs User Decision with Pros & Cons** before executing:

> **Template for Workflow Tradeoffs**:
> - **Recommended Default (2-Slot System)**: Use Slot 2 (`worktrees/...`) branched from `origin/main`.
>   - *Pros*: Zero `main` branch lock collisions; no extra disk space wasted; persistent `node_modules` junction; Vite dev server in Slot 1 stays uninterrupted.
>   - *Cons*: Reuses a dedicated worker directory.
> - **Alternative A (New Ephemeral Worktree)**: Create a brand new worktree for this single task.
>   - *Pros*: 100% clean-slate isolation.
>   - *Cons*: Accumulates orphaned folders on C: drive; requires running `git worktree remove` at session end.
> - **Alternative B (Direct in Slot 1 `D:\MindFlow-main`)**: Develop directly in the host repo.
>   - *Pros*: Fastest for small 1-file edits.
>   - *Cons*: Cannot run parallel AI sessions; switches branches out from under live dev server.
>
> *(After presenting tradeoffs, the agent respects and executes the user's chosen approach).*

---

### 3.3 Operational Prerequisites & Windows Shell Runner
- **Local Execution Truth**: Antigravity operates directly on the user's local disk (`d:\MindFlow-main` for Slot 1, or the worktree path for Slot 2).
- **Installed CLI**: The official GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` and authenticated as `AkLabx`.
- **Git Credential Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` before pushing to avoid interactive GCM GUI deadlocks in background shells.
- **Antigravity Windows Shell Runner (`exebox`) Workaround**:
  - *Symptom*: Commands fail instantly with `Command failed to run: The system cannot find the file specified..` or `failed to start PTY command via exebox: The system cannot find the file specified.`
  - *Root Cause*: In Antigravity on Windows, `exebox` resolves the bare shell name `powershell` relative to the workspace root.
  - *Mandatory Fix*: Ensure `powershell.bat` exists in the workspace root with the content:
    ```cmd
    @echo off
    set "PATH=D:\DevTools\nvm\v22.16.0;%PATH%"
    C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe -ExecutionPolicy Bypass %*
    ```
  - *Git Hygiene*: `powershell.bat` and `powershell.cmd` MUST remain in `.gitignore` so they are never staged or committed to remote.

---

### 3.4 Worktree-Aware Standard 4-Step Working Method:

1. **Step 1: Session Start & Pre-Task Branch Sync Ritual**:
   - Check current working directory and branch:
     ```powershell
     git branch --show-current
     ```
   - **If in Slot 1 (`D:\MindFlow-main`)**:
     ```powershell
     git checkout main
     git pull origin main
     ```
   - **If in Slot 2 (Worker Worktree)**:
     ```powershell
     git fetch origin main
     # DO NOT checkout main! Branch directly from origin/main in Step 2.
     ```

2. **Step 2: Isolated Feature Development**:
   - Create a descriptive feature branch matching the targeted bump version:
     - *In Slot 1*: `git checkout -b feat/<feature-name>-v<version>`
     - *In Worker 1 or Worker 2*: `git checkout -B feat/<feature-name>-v<version> origin/main`
   - Make all changes directly in the workspace. Test with local dev server on the slot's assigned port:
     - *Slot 1*: `npm run dev` (`http://localhost:3000/`)
     - *Worker 1*: `npm run dev -- --port 3001` (`http://localhost:3001/`)
     - *Worker 2*: `npm run dev -- --port 3002` (`http://localhost:3002/`)
   - Verify live in the browser BEFORE committing. Vite HMR reloads in milliseconds without any commits.

3. **Step 3: Verification, Version Bump & PR Creation Ritual**:
   - Verification: Run `npx tsc --noEmit` and `npx vite build` (and `npx vitest --run --pool=forks` when applicable) to guarantee 0 errors.
   - Version Bump: Increase version by 0.0.1 (`npm version patch --no-git-tag-version`), and append an entry in `docs/APP_JOURNEY_LOG.md` with the current IST timestamp.
   - Commit and push via the GitHub CLI bridge:
     ```powershell
     git add .
     git commit -m "<structured commit message>"
     & "C:\Program Files\GitHub CLI\gh.exe" auth setup-git
     git push -u origin <branch-name>
     ```
   - Open PR via CLI:
     ```powershell
     & "C:\Program Files\GitHub CLI\gh.exe" pr create --title "<PR Title>" --body "<PR Summary Markdown>" --base main --head <branch-name>
     ```

4. **Step 4: Post-Merge Local Sync & Housekeeping Ritual**:
   - Once the PR is merged on GitHub:
     - **If in Slot 1 (`D:\MindFlow-main`)**:
       ```powershell
       git checkout main
       git pull origin main
       git branch -d <branch-name>
       git fetch --prune
       ```
     - **If in Worker 1 (`supabase_user_profiles_count`)**:
       ```powershell
       git checkout worker-1
       git merge --ff-only origin/main
       git branch -d <branch-name>
       git fetch --prune
       ```
     - **If in Worker 2 (`update_main_feature_branch`)**:
       ```powershell
       git checkout worker-2
       git merge --ff-only origin/main
       git branch -d <branch-name>
       git fetch --prune
       ```
   - Confirm with `git status` that working tree is clean. Slot 1 remains the sole holder of `main`.
