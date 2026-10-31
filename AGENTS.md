# MindFlow Autonomous Agent Guidelines (AGENTS.md)

Welcome, Autonomous AI Agent! This file contains the strict architectural, safety, routing, and development guidelines for working on the MindFlow full-stack application. You MUST read and adhere to these rules before executing any task.

## 1. Safety Boundaries & Core Guardrails

- **Backend / Database Changes:** Destructive database migrations (e.g., dropping tables, removing columns) should be avoided unless explicitly confirmed by the user.
- **Hash Routing & OAuth (CRITICAL):**
  - Our app is deployed on GitHub Pages at a subpath (`https://aklabx.github.io/MindFlow/`) and wrapped in Capacitor for Android.
  - **DO NOT remove or replace `<HashRouter>`** in `src/App.tsx`.
  - **DO NOT remove or alter the OAuth hash interception logic** in `src/hooks/useAppBootstrap.ts` (where `access_token` and `refresh_token` are parsed from `window.location.hash`, passed to `supabase.auth.setSession()`, and cleaned via `window.history.replaceState`).
- **No Guest Login:** Guest login functionality is strictly prohibited. All users must authenticate with a real account.
- **Understand Before Doing:** Before starting tasks, ask clarifying questions using `request_user_input` until expectations are absolutely certain. Investigate the codebase for existing implementations or bug reports before creating redundant work or regressions.
- **Architectural Refactors:** Do not perform large-scale architectural refactors. The project is stabilizing its OAuth and routing systems (Single Door architecture). Maintain the existing Feature-Sliced Design (FSD) boundaries.

## 2. App Architecture & Routing

- **App Bootstrap:** `useAppBootstrap.ts` acts as a strict state machine yielding discrete states (`BOOTSTRAPPING`, `READY`, `FAILED`, `MAINTENANCE`, `UPDATE_REQUIRED`, `OFFLINE_INITIALIZATION`) handled centrally in `App.tsx` instead of returning a generic boolean.
- **Navigation (Single Door):** Centralized in `NavigationManager`, acting as an orchestrator delegating to a Policy Engine (e.g., `PlatformPolicy`, `AuthPolicy`, `IntentPolicy`, `OnboardingPolicy`). Legacy route guards (`AuthGuard`, `ProtectedRoute`, `AdminProtectedRoute`) have been strictly removed.
- **App Layout:** The main authenticated application shell is `AppLayout.tsx` (in `src/layouts/`). It relies on a single top-level `NavigationManager` route guard to prevent UI flashes for unauthenticated visitors. Redundant nested guards inside `AppLayout` should be omitted unless child routes require different authorization (e.g., Admin-only).
- **Public Entry Points:**
  - The Landing Page (`/`) acts as the single-gate Auth Page (sign in/sign up) strictly for unauthenticated web traffic. Authenticated users automatically redirect to `/dashboard`. Native Capacitor apps bypass this and default to `/login` for unauth users.
  - Onboarding is a modular, post-auth workflow route (`/onboarding`) backed by a state machine ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') and is completely detached from the Landing Page.
- **Navigation Intents:** Saved navigation intents (deep-linking before auth) must store the full URL state, explicitly including `pathname`, `search`, `hash`, `timestamp`, `expiresAt`, and `platform`.
- **OAuth Redirects:** When initiating Supabase OAuth redirects (e.g., `supabase.auth.signInWithOAuth`), yield to the event loop after setting the loading state so the UI paints. Do NOT reset the loading state on success or in a `finally` block (this causes UI flickering). Only reset it in a `catch` block on error.

## 3. Quiz & Offline-First Architecture

- **Offline-First Storage:** The quiz feature relies on IndexedDB for offline-first support. Quizzes MUST be seeded into IndexedDB (e.g., via `db.saveQuiz`) immediately upon creation before any progress updates occur to prevent 'not found' synchronization errors.
- **Local DB Mutations:** Mutations in IndexedDB (e.g., `db.updateQuizProgress`) must be upsert-safe (automatically inserting missing records) for resilience against offline seeding delays.
- **Quiz Creation:** Session creation, state initialization, and database persistence are strictly centralized in `src/features/quiz/services/quizCreationService.ts`. UI components must not manually construct or persist quiz objects.
- **State Initialization:** When inserting into Supabase `saved_quizzes`, ensure the payload includes `created_at` and a fully initialized `state` object (`activeQuestions`, `filters`, `quizId`, `quizTimeRemaining`, `remainingTimes`). Missing state causes silent fallback failures in `QuizSessionGuard`.
- **Plugin Architecture:** The Quiz feature utilizes a plugin-based architecture (`QuizEngine` and `QuizPlugin`) in `src/features/quiz/engine/` for parsing/validating different question types.
- **Supabase Quizzes Table:** The `public.saved_quizzes` table does not have an `updated_at` column. Use the `created_at` column for recent/paused queries to avoid SQL 42703 errors.

## 4. Database, Backend, & State Sync

- **Background Sync:** Background state synchronization must use the Supabase JS client (e.g., `supabase.from().update()`) rather than raw `fetch` with `keepalive: true` to avoid memory limits and preflight CORS restrictions.
- **Idempotency:** Background workers processing `pgmq` queues must be strictly idempotent, using explicit row-level locks (`SELECT ... FOR UPDATE`) and checking local progress states before initiating external API calls.
- **Enums & Columns:**
  - `question_lifecycle_status` enum: 'APPROVED', 'ARCHIVED', 'ENRICHED', 'ENRICHING', 'ENRICHMENT_PENDING', 'EXTRACTED', 'FAILED', 'PENDING_REVIEW', 'REJECTED'. There is NO 'DRAFT' state.
  - `options` and `options_hi` in `public.questions` are `text[]` arrays. Use `array_length(column_name, 1)` instead of JSON length functions.
- **Mapping Metadata:** When mapping Supabase RPC results or IndexedDB caches, explicitly handle potential column aliasing and casing mismatches (e.g., falling back between `row.phrase` and `row.word`, or `row.source_pdf` and `row.examName`) to prevent UI double-mapping bugs.
- **Taxonomy Objects:** Quiz metadata mapped into IndexedDB may store taxonomy fields nested (e.g., `q.classification.subject`). Always fallback (e.g., `q.subject ?? q.classification?.subject`) to support legacy data.
- **Metadata Caching:** Question metadata caching and sync are orchestrated by the `useQuestionMetadata` hook. UI components must consume this hook rather than reading DB/cache manually.
- **Cache Invalidation:** When modifying DB schema or metadata queries for vocabulary, increment the `vocab_cache_cleared_vX` flag in `localStorage` in the frontend config to invalidate client caches.
- **Timeouts:** Global fetch override (`fetchWithTimeout`) in `src/lib/supabase.ts` uses 15s by default. 45s for AI Tutor functions, 5 minutes for Supabase Storage.

## 5. AI Pipelines (pgmq & Edge Functions)

- **Ingestion Pipeline:** Client upload to Supabase Storage -> Insert into `source_documents` -> Trigger RPC (`enqueue_extraction_job`) -> Adds to `pgmq.pre_phase_question_jobs` for async processing (chunking, OCR, extraction).
- **Enrichment Pipeline:** Approved questions are enqueued in `pgmq.q_question_ai_jobs`. The `enrich-questions` edge function consumes these. Processed/failed jobs go to `pgmq.a_question_ai_jobs`.
- **AI Task Configuration:**
  - Because one enrichment triggers multiple distinct tasks (taxonomy, research, translation, teacher), `batch_size` in `ai_task_config` must strictly be **1** to avoid bypassing global RPM rate limits.
  - The primary model for all AI tasks (`question_extract_v1`, `question_taxonomy_v1`, etc.) MUST be `gemini-3.1-flash-lite` (placed first in `model_chain`).
- **Error Handling:** Infrastructure errors (429, 503, timeouts) must NEVER permanently fail a question. Use exponential backoff by updating the `pgmq` visibility timeout (`vt`). The `FAILED` status is strictly for non-recoverable data issues (invalid schema/JSON).
- **Admission Controller:** Queue-driven edge functions must implement an 'Admission Controller' check (`get_execution_plan`) to verify capacity and enforce global RPM limits before fetching jobs.
- **Telemetry:** Comprehensive telemetry must be recorded in the `ai_metadata` JSONB column (e.g., pipeline version, retries, models used, tokens).
- **Backend-First Approach:** Establish system correctness, reliability, and observability (e.g., duration times) before adding UI enhancements like XHR progress bars.

## 6. UI, UX, & CSS Best Practices

- **Fixed-Bottom Elements:** Utilize the `<KeyboardAwareBottomBar>` component (`src/components/ui/`) for safe-area insets, global footer offsets, and Android WebView keyboard resizing. Avoid hardcoded bottom classes.
- **Global Headers:** Centralized in `src/layouts/MainLayout.tsx`. Do not add header hiding logic (`hideGlobalHeader`) to individual pages. Update `isHeaderHiddenRoute` in the layout.
- **Full-Viewport Pages:** Rendered directly into NavigationManager. Avoid negative margins to prevent clipping. Use `min-h-[100dvh] w-full` with positive padding.
- **Safe Area Insets:** Use Tailwind CSS variables `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` applied directly within classes (e.g., `pb-[env(safe-area-inset-bottom)]`) for mobile padding.
- **Styling Rules:** Use Flexbox/Grid instead of hardcoded widths. Keep styling responsive rather than building separate mobile/desktop implementations. Avoid tiny text (e.g., 9px) on mobile viewports for accessibility.
- **Notifications:** `useNotificationStore` supports `ReactNode` in the `message` property for custom, actionable HTML (e.g., links, buttons).
- **Component Reusability:** Do not introduce duplicate components. Reuse existing row/card components. Preserve all existing navigation and click behavior.

## 7. Dependencies, Testing, & Verification Commands

- **Local Setup:** When installing npm dependencies, ALWAYS use the `--legacy-peer-deps` flag to bypass ERESOLVE peer dependency conflicts (e.g., related to Capacitor plugins).
- **Development Server:** The local Vite server runs on port **3000** (`http://localhost:3000/`), not 5173.
- **Visual Verification (Playwright):** Write temporary Playwright Python scripts (`sync_playwright`) to verify UI changes before committing. Target port 3000. For authenticated routes (e.g., `#/dashboard`), the script must first navigate to the login page, submit credentials, and wait for redirect.
- **Testing & Build Commands:**
  - Run tests: `npx vitest --run`
  - Typecheck: `npx tsc --noEmit`
  - Build: `npx vite build` (Implementation must pass with zero TS/ESLint errors).
  - Do NOT use `npm run test` or `npm run typecheck` as they are not configured.
- **Versioning:** `VITE_APP_VERSION` in `vite.config.ts` reads `process.env.npm_package_version`. Update the app version on every PR by increasing it by 0.0.1 using: `npm version patch --no-git-tag-version`.
- **Release Notes:** Always write release notes (e.g., Play Store) from a user's perspective, avoiding developer jargon.
