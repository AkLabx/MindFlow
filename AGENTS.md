# MindFlow Autonomous Agent Guidelines & Memory Context (AGENTS.md)

Welcome, Autonomous AI Agent! This file contains the prioritized architectural, safety, routing, and development guidelines for working on the MindFlow full-stack application. You MUST read and adhere to these directives before executing any task.

---

## 0. Decision Precedence Hierarchy

When conflicting instructions or ambiguous choices arise, strictly follow this order of priority:
1. **Explicit User Prompt** (The user's direct instruction in chat).
2. **MindFlow Product Constitution** (`docs/MINDFLOW_CONSTITUTION.md` — Supreme product, UX & state standard).
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

### [NORMAL] Architectural & Domain Conventions
- **Development Server**: The local Vite development server runs on port **3000** (`http://localhost:3000/`), not the standard Vite port 5173.
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

- **Local Execution Truth**: Antigravity operates directly on the user's local disk (`d:\MindFlow-main`). All file edits take effect locally in real time and are hot-reloaded by the Vite development server (port 3000).
- **Installed CLI**: The official GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` and authenticated as `AkLabx`.
- **Git Credential Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` before pushing to avoid interactive GCM GUI deadlocks in background shells.
- **Antigravity Windows Shell Runner (`exebox`) Workaround**:
  - *Symptom*: Commands fail instantly with `Command failed to run: The system cannot find the file specified..` or `failed to start PTY command via exebox: The system cannot find the file specified.`
  - *Root Cause*: In Antigravity on Windows, `exebox` resolves the bare shell name `powershell` relative to the workspace root (`d:\MindFlow-main\powershell`).
  - *Mandatory Fix*: Ensure `d:\MindFlow-main\powershell.bat` exists in the workspace root with the content:
    ```cmd
    @echo off
    C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe %*
    ```
  - *Git Hygiene*: `powershell.bat` and `powershell.cmd` MUST remain in `.gitignore` so they are never staged or committed to remote.

### Standard 4-Step Working Method:

1. **Step 1: Session Start & Pre-Task Branch Sync Ritual**:
   - Check current working branch:
     ```powershell
     git branch --show-current
     ```
   - Ensure local workspace is on `main` and fully synchronized:
     ```powershell
     git checkout main
     git pull origin main
     ```
   - Never build a new feature or fix on top of a stale or unmerged feature branch.

2. **Step 2: Isolated Feature Development**:
   - Create a descriptive feature branch matching the targeted bump version:
     ```powershell
     git checkout -b feat/<feature-name>-v<version>
     ```
   - Make all changes directly in the workspace. Test with local dev server (`http://localhost:3000`).

3. **Step 3: Verification, Version Bump & PR Creation Ritual**:
   - Verification: Run `npx tsc --noEmit` and `npx vite build` (and `npx vitest --run` when applicable) to guarantee 0 errors.
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
     ```powershell
     git checkout main
     git pull origin main
     git branch -d <branch-name>
     git fetch --prune
     ```
   - Confirm with `git status` that the working tree is clean and up to date on `main`.
