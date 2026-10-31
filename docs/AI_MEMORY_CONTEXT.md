# MindFlow Memory Context & Repository Guidelines

This document serves as a complete backup of the AI Assistant's memory context, rules, technical expectations, and repository metadata (including `AGENTS.md` and `README.md` contents) for the MindFlow project.

## AI Assistant Memory Context & Rules

### 1. Safety Boundaries & Core Guardrails
* **Backend / Database Changes:** Destructive database migrations (e.g., dropping tables, removing columns, truncating tables) should be avoided unless explicitly confirmed by the user.
* **Hash Routing & OAuth (CRITICAL):**
  - Our app is deployed on GitHub Pages at a subpath (`https://aklabx.github.io/MindFlow/`) and wrapped in Capacitor for Android.
  - **DO NOT remove or replace `<HashRouter>`** in `src/App.tsx`.
  - **DO NOT remove or alter the OAuth hash interception logic** in `src/hooks/useAppBootstrap.ts` (where `access_token` and `refresh_token` are parsed from `window.location.hash`, passed to `supabase.auth.setSession()`, and cleaned via `window.history.replaceState`).
* **Mandatory Version Bump & App Journey Logging Ritual:**
  - Every time a version bump is performed (in `package.json` or `android/app/build.gradle`), you MUST record an entry in `docs/APP_JOURNEY_LOG.md`.
  - Required information:
    - App Version: e.g., `## [v1.0.283] - DD MMMM YYYY, HH:MM AM/PM IST`.
    - Current IST Timestamp: Always record date and time in **Indian Standard Time (IST)** (UTC+5:30).
    - Summary of Work: Clear, well-documented breakdown of features, bug fixes, refactorings, and architectural improvements.
  - **STRICT ZERO-SENSITIVITY POLICY**: NEVER include sensitive info (no API keys, tokens, credentials, connection strings, private user data, or confidential configuration secrets).
* **No Guest Login:** Guest login functionality is strictly prohibited. All users must authenticate with a real account.
* **Understand Before Doing:** Before starting tasks, ask clarifying questions until expectations are absolutely certain. Investigate the codebase for existing implementations or bug reports first to prevent redundant work or regressions.
* **Architectural Refactors:** Do not perform large-scale architectural refactors. Maintain the existing Feature-Sliced Design (FSD) boundaries (`src/features/*`).

### 2. App Architecture & Routing
* **App Bootstrap:** `useAppBootstrap.ts` acts as a strict state machine yielding discrete states (`BOOTSTRAPPING`, `READY`, `FAILED`, `MAINTENANCE`, `UPDATE_REQUIRED`, `OFFLINE_INITIALIZATION`) handled centrally in `App.tsx` instead of returning a generic boolean.
* **Navigation (Single Door):** Centralized in `NavigationManager` (`src/lib/navigation/NavigationManager.tsx`), acting as an orchestrator delegating to a Policy Engine (`PlatformPolicy`, `AuthPolicy`, `IntentPolicy`, `OnboardingPolicy`). Legacy route guards (`AuthGuard`, `ProtectedRoute`, `AdminProtectedRoute`) have been strictly removed.
* **App Layout Shell:** The main authenticated application shell is `AppLayout.tsx` (in `src/layouts/AppLayout.tsx` wrapping `MainLayout.tsx`). It relies on a single top-level `NavigationManager` route guard to prevent UI flashes for unauthenticated visitors. Redundant nested guards inside `AppLayout` should be omitted unless child routes require different authorization (e.g., Admin-only).
* **Public Entry Points & Single Door:**
  - The root URL (`/`) serves as the unified Authentication Portal (`AuthPage`, wrapped with `RouteAccessType.GUEST_ONLY`) for all unauthenticated traffic across both Web and native Capacitor apps (`PlatformPolicy.getGuestEntryRoute()` returns `'/'`).
  - Authenticated users automatically redirect to `/dashboard` (or restored deep-link intent).
  - The `/login` route simply redirects to `/`.
  - Onboarding is a modular, post-authentication workflow route (`/onboarding`) backed by a state machine (`'NOT_STARTED'`, `'IN_PROGRESS'`, `'COMPLETED'`) and is completely detached from the Auth Page.
* **Navigation Intents:** Saved navigation intents (deep-linking before auth) must store the full URL state, explicitly including `pathname`, `search`, `hash`, `timestamp`, `expiresAt`, and `platform`.
* **OAuth Redirects:** When initiating Supabase OAuth redirects (`supabase.auth.signInWithOAuth`), yield to the event loop after setting the loading state so the UI paints. Crucially, do NOT reset the loading state on success or in a `finally` block (as the function resolves before browser redirect completes, causing UI flicker). Only reset it in a `catch` block on error.
* **GitHub Pages SPA Routing:** For GitHub Pages deployment, the project uses a script in `public/404.html` to normalize non-hash SPA URLs and rewrite them into HashRouter format (e.g., redirecting `/MindFlow/dashboard` to `/MindFlow/#/dashboard`).

### 3. Quiz & Offline-First Architecture
* **Offline-First Storage:** The quiz feature relies on IndexedDB for offline-first support. Quizzes MUST be seeded into IndexedDB (via `db.saveQuiz`) immediately upon creation before any progress updates occur to prevent 'not found' synchronization errors.
* **Local DB Mutations:** Mutations in IndexedDB (e.g., `db.updateQuizProgress`, `db.updateQuizName`) must be upsert-safe (automatically inserting missing records) for resilience against offline seeding delays or sudden network instability.
* **Quiz Creation Service:** Session creation, state initialization, and database persistence (IndexedDB and Supabase) are strictly centralized in `src/features/quiz/services/quizCreationService.ts`. UI components must not manually construct or persist quiz objects.
* **State Initialization:** When inserting into Supabase `saved_quizzes`, ensure the payload includes `created_at` and a fully initialized `state` object (`activeQuestions`, `filters`, `quizId`, `quizTimeRemaining`, `remainingTimes`). Missing state causes silent fallback failures in `QuizSessionGuard` when it attempts to resume or hydrate.
* **Supabase Quizzes Table:** The `public.saved_quizzes` table in Supabase does NOT have an `updated_at` column. Always use the `created_at` column for recent/paused queries to avoid SQL 42703 (column does not exist) errors.
* **Plugin Architecture:** The Quiz feature utilizes a plugin-based architecture (`QuizEngine` and `QuizPlugin`) in `src/features/quiz/engine/` for parsing and validating different question types (e.g., `mcqPlugin`).
* **Metadata Caching & Hook:** Question metadata caching and synchronization are centrally orchestrated by the `useQuestionMetadata` hook (`src/features/quiz/hooks/useQuestionMetadata.ts`). UI components must consume this hook rather than reading IndexedDB or invoking delta syncs manually.
* **Taxonomy Fallback:** Quiz metadata mapped into IndexedDB may store taxonomy fields under a nested classification object (e.g., `q.classification.subject`, `q.classification.topic`). Always fallback (e.g., `q.subject ?? q.classification?.subject`) to gracefully support both current and legacy data structures.
* **Cache Invalidation:** When modifying DB schema or metadata queries for vocabulary features (synonyms, OWS, idioms), increment the `vocab_cache_cleared_vX` flag in `localStorage` in the frontend config (currently `v3` for idioms, `v4` for synonyms & OWS) to invalidate client IndexedDB caches.

### 4. Database, Backend, & State Sync
* **Background Sync:** Background state synchronization must use the Supabase JS client (e.g., `supabase.from().update()`) rather than raw `fetch` with `keepalive: true` to avoid Chromium/WebKit 64KB memory limits and preflight CORS restrictions.
* **Idempotency:** Background workers processing `pgmq` queues must be strictly idempotent, using explicit row-level locks (`SELECT ... FOR UPDATE`) and checking local progress states before initiating external API calls to prevent duplicated work or race conditions.
* **Postgres Enums & Column Types:**
  - `question_lifecycle_status` Postgres enum valid values: `'APPROVED'`, `'ARCHIVED'`, `'ENRICHED'`, `'ENRICHING'`, `'ENRICHMENT_PENDING'`, `'EXTRACTED'`, `'FAILED'`, `'PENDING_REVIEW'`, and `'REJECTED'`. There is NO `'DRAFT'` state.
  - `options` and `options_hi` in `public.questions` are PostgreSQL `text[]` arrays (not JSONB). Use `array_length(column_name, 1)` instead of JSON length functions when querying size.
* **Column Aliasing & Mapping:** When mapping Supabase RPC results or reading IndexedDB caches, explicitly handle potential column aliasing and casing mismatches (e.g., falling back between `row.phrase` and `row.word`, or `row.source_pdf` and `row.examName`).
* **Timeouts:** Global fetch override (`fetchWithTimeout` in `src/lib/fetchWithTimeout.ts`, wired into `src/lib/supabase.ts`) uses a 15s default timeout. Extended timeouts: 45s for AI Tutor functions (`/functions/v1/ask-ai-tutor`), 5 minutes for Supabase Storage uploads (`/storage/v1/object/`).
* **QueryClient Architecture:** TanStack Query Client is centralized in `src/lib/queryClient.ts` (configured with `retry: 1`, `refetchOnWindowFocus: true`) and provided to the application tree via `src/providers/AppProvider.tsx`.
* **Backend-First Approach:** When building or fixing data pipelines, follow a backend-first architectural approach: establish system correctness, reliability, and observability before adding complex UI UX enhancements.

### 5. AI Pipelines (pgmq & Edge Functions)
* **Ingestion Pipeline:** Client upload to Supabase Storage (`content_studio`) -> Insert into `source_documents` -> Trigger RPC (`enqueue_extraction_job`) -> Adds to `pgmq.pre_phase_question_jobs` for async background processing (chunking, OCR, extraction).
* **Enrichment Pipeline:** Approved questions are enqueued in `pgmq.q_question_ai_jobs`. The `enrich-questions` edge function consumes these jobs, and processed or failed jobs are archived in `pgmq.a_question_ai_jobs`.
* **Text-to-Speech (TTS):** Edge function `tts-gateway` (`supabase/functions/tts-gateway/`) handles audio generation using Gemini Native Audio, invoked via runtime configuration endpoint `TTS_AI_URL`.
* **AI Task Configuration:**
  - Because one enrichment triggers multiple distinct tasks (taxonomy, research, translation, teacher), `batch_size` in `ai_task_config` must strictly be **1** to prevent queue workers from bypassing global RPM rate limits.
  - The primary model for all AI tasks (`question_extract_v1`, `question_taxonomy_v1`, `question_translation_v1`, `question_teacher_v1`, `question_research_v1`) in `ai_task_config` must be set to `gemini-3.1-flash-lite` (placed first in `model_chain`).
* **Error Handling & Backoff:** Infrastructure errors (429, 503, timeouts) must NEVER permanently fail a question. Use exponential backoff by updating the `pgmq` visibility timeout (`vt`). The `FAILED` status is strictly reserved for non-recoverable data issues (invalid schema or bad JSON).
* **Admission Controller:** Queue-driven edge functions must implement an Admission Controller check (`get_execution_plan`) to verify capacity and enforce global RPM limits (max 5/min across enabled models in `ai_model_runtime`) before fetching jobs.
* **Telemetry:** Comprehensive telemetry must be recorded in the `ai_metadata` JSONB column for observability (pipeline version, worker version, scheduler version, retries, models used, tokens).

### 6. UI, UX, & CSS Best Practices
* **Fixed-Bottom Elements:** Fixed-bottom UI components should utilize the `<KeyboardAwareBottomBar>` component (`src/components/ui/KeyboardAwareBottomBar.tsx`) to automatically handle mobile safe-area insets, global footer offsets, and Android WebView keyboard resizing, avoiding hardcoded bottom positional classes.
* **Global Headers:** Centralized in `src/layouts/MainLayout.tsx`. Do not add header hiding logic (`hideGlobalHeader`) to individual page components; instead, update the route-based exclusion logic (`isHeaderHiddenRoute`) within the layout layer.
* **Full-Viewport Pages:** Unauthenticated pages (such as `AuthPage` and `SignupPage`) are rendered directly into `NavigationManager` outside `MainLayout` constraints. Avoid negative margins on root containers; use `min-h-[100dvh] w-full` with positive padding.
* **Safe Area Insets:** Rely on Tailwind CSS variables `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` applied directly within classes (e.g., `pb-[env(safe-area-inset-bottom)]`) for mobile padding.
* **Styling Rules:** Keep styling responsive rather than creating separate mobile/desktop implementations. Prefer Flexbox/Grid with proper wrapping instead of hardcoded widths. Avoid fixed pixel assumptions. Avoid tiny text (e.g., 9px) on mobile viewports for accessibility.
* **Notifications:** `useNotificationStore` supports rendering `ReactNode` inside the `message` property of `ToastOptions`, allowing custom, actionable HTML elements like inline links (`<a>`) or buttons.
* **Component Reusability:** Do not introduce duplicate components. Reuse existing row/card components. Preserve all existing navigation and click behavior.

### 7. Dependencies, Testing, & Verification Commands
* **Local Setup:** When installing npm dependencies, ALWAYS use the `--legacy-peer-deps` flag to bypass ERESOLVE peer dependency conflicts (e.g., related to Capacitor plugins).
* **Development Server:** The local Vite development server runs on port **3000** (`http://localhost:3000/`), not the standard Vite port 5173.
* **Visual Verification (Playwright):**
  - Write temporary Playwright Python scripts (`sync_playwright`) to verify UI changes before committing.
  - Target port 3000.
  - **Protected Routes Login Flow:** For authenticated routes (e.g., `#/dashboard`), the script must first navigate to the root login page (`#/`), submit credentials (`mindflow@user.com` / `Test@1234`), and wait for redirect before navigating or capturing screenshots.
* **Testing & Build Commands:**
  - Run unit/integration tests: `npx vitest --run`
  - Typecheck: `npx tsc --noEmit`
  - Build application: `npx vite build` (or `npm run build`)
  - Do NOT run `npm run test` or `npm run typecheck` as those scripts are not configured in `package.json`.
* **Versioning:** `VITE_APP_VERSION` in `vite.config.ts` dynamically evaluates `process.env.npm_package_version`. Update the app version on every PR by increasing it by 0.0.1 using: `npm version patch --no-git-tag-version`.
* **Inspection Tools:** When reading file contents in bash sessions, output from `cat` may be truncated at 1000 characters by tool wrappers. Use `read_file` or chunked commands instead.
* **Release Notes:** Always write app release notes (e.g., Google Play Store) from a user's perspective, focusing on user experience, learning benefits, and avoiding developer jargon.

### 8. Gemini Multimodal Live API (Real-Time Bidirectional Voice)
* **Library**: Use the `@google/genai` library with `live.connect()`. Do not use bare WebSockets or raw `fetch`.
* **Microphone Input Rate**: Gemini expects **16kHz**. Specify `sampleRate: 16000` when creating the recording `AudioContext` (`src/features/ai/talk/audio-recorder.ts`).
* **Speaker Output Rate**: Gemini responds with **24kHz**. Specify `sampleRate: 24000` when creating the output `AudioBuffer` (`src/features/ai/talk/audio-player.ts`).
* **Data Formatting**: Web Audio API uses Float32 (`-1.0` to `1.0`). Gemini expects and returns Raw 16-bit PCM (Int16) Base64 encoded.
  - Encoding: `floatTo16BitPCM()` converts Float32 to Int16 before Base64 encoding.
  - Decoding: `base64ToUint8Array` -> `Int16Array`, divided by `32768.0` back into Float32.
* **AudioWorkletProcessor**: Kept as an inline string blob (`AudioRecorderWorkletCode` in `audio-helpers.ts`) loaded via `URL.createObjectURL(blob)` to prevent bundler path resolution breakages.
* **Seamless Audio Playback**: Maintain an `audioQueue` with `nextStartTime` cursor using `source.start(Math.max(currentTime, nextStartTime))` to avoid stutter.
* **Unmount Cleanup**: Always clean up `LiveSession.close()`, `AudioContext.close()`, and `MediaStreamTracks.stop()`.

### 9. Automated GitHub PR & Git Workflow (GitHub CLI) & Antigravity Working Method
* **Local Execution Truth**: Antigravity operates directly on the user's local disk (`d:\MindFlow-main`). All file edits take effect locally in real time and are immediately hot-reloaded by the local Vite development server (port 3000).
* **Installed CLI**: The official GitHub CLI is installed at `C:\Program Files\GitHub CLI\gh.exe` and authenticated as `AkLabx`.
* **Avoid GCM GUI Deadlocks**: Git Credential Manager GUI prompts fail in headless/background agent shells. Always bridge Git through GitHub CLI credentials rather than invoking bare interactive auth.
* **Git Credential Bridge**: Run `& "C:\Program Files\GitHub CLI\gh.exe" auth setup-git` before pushing to ensure Git seamlessly uses GitHub CLI's stored OAuth token.

#### Standard Antigravity 4-Step Working Method:
1. **Step 1: Session Start & Pre-Task Branch Sync Ritual**:
   - Check current working branch: `git branch --show-current`.
   - Ensure local workspace is on `main` and fully synced before starting new work:
     ```powershell
     git checkout main
     git pull origin main
     ```
   - Never build a new feature or fix on top of a stale or unmerged feature branch.
2. **Step 2: Isolated Feature Development**:
   - Create a descriptive feature branch matching the targeted bump version: `git checkout -b feat/<feature-name>-v<version>`.
   - Make all changes directly in the workspace. Test with local dev server (`npm run dev` at `http://localhost:3000`).
3. **Step 3: Verification, Version Bump & PR Creation Ritual**:
   - Verification: Run `npx tsc --noEmit` and `npm run build` (and `npx vitest --run` when applicable) to guarantee 0 errors.
   - Version Bump: Increase version by 0.0.1 (`npm version patch --no-git-tag-version`), and append an entry in `docs/APP_JOURNEY_LOG.md` with current IST timestamp.
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
   - Once the PR is merged on GitHub, immediately sync local `main` with remote:
     ```powershell
     git checkout main
     git pull origin main
     ```
   - Safely delete the local merged feature branch and prune stale remote tracking references:
     ```powershell
     git branch -d <branch-name>
     git fetch --prune
     ```
   - Confirm with `git status` that working tree is clean and up to date on `main`.

* **Re-Authentication (If Token Ever Expires)**:
  Run `& "C:\Program Files\GitHub CLI\gh.exe" auth login --hostname github.com -p https -w`. This outputs a one-time device code (`XXXX-XXXX`) and points to `https://github.com/login/device` for instant 1-click browser approval.
