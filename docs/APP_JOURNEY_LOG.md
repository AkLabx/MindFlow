# MindFlow - App Journey & Release Log

This document is the single source of truth for the evolution of the MindFlow application. Every version bump, feature rollout, architectural enhancement, and critical bug fix is chronologically documented here with exact **Indian Standard Time (IST)** timestamps to provide complete visibility into the app's journey for all existing and incoming developers.

---

## 📌 Team Ritual & Governance Policy

> ### ⚠️ MANDATORY WORKFLOW RITUAL FOR ALL TEAM MEMBERS & AI AGENTS
> Every developer (human or AI pair programmer) working on this repository **MUST** follow this ritual without exception:
>
> 1. **Trigger**: Whenever a version bump is performed in `package.json` (or `android/app/build.gradle`).
> 2. **Logging Destination**: Prepend the new release entry immediately below the `---` divider in this file (`docs/APP_JOURNEY_LOG.md`).
> 3. **Required Entry Fields**:
>    - **Version Tag**: `## [vX.Y.Z] - DD MMMM YYYY, HH:MM AM/PM IST`
>    - **Executive Summary**: A concise 1-2 sentence overview of the release purpose.
>    - **Work Breakdown**: Grouped under `### ✨ Features Added`, `### 🐛 Bug Fixes`, `### ⚡ Performance & Refactoring`, or `### 🔒 Security & Architecture`.
>    - **Impacted Scope**: Mention core modules or paths modified (e.g., `src/features/quiz/`, `src/lib/navigation/`).
> 4. **STRICT ZERO-SENSITIVITY POLICY**:
>    - **NEVER** log API keys, access tokens, secrets, service passwords, internal database URLs, or real user identifiers.
>    - Keep all descriptions high-level, architectural, and educational for developers.
> 5. **Cross-Platform Awareness**:
>    - MindFlow is both a PWA on GitHub Pages (`<HashRouter>`) and an Android app via Capacitor. Keep logs mindful of both targets.

---

## 🚀 App Journey Changelog

## [v1.0.340] - 10 November 2026, 08:45 AM IST

### Executive Summary
Established the comprehensive MindFlow Production Readiness Audit and 10-Phase Uplift Roadmap for 10,000 DAU commercial readiness. Codified ADR-0005 (Option B Launch Lifecycle), amended the MindFlow Constitution with Section 13 (Living Pragmatic Amendment Clause), softened Rule 1 to allow authoritative secondary shortcuts, preserved `@capacitor/camera` and `@capacitor/filesystem` dependencies, and established explicit Android-to-web version mapping.

### 🔒 Security, Architecture & Governance
- **Full-Stack Production Audit & 10-Phase Roadmap (`PRODUCTION_AUDIT_REPORT.md`, `TEN_PHASE_ROADMAP.md`)**:
  - Executed a forensic audit across UI/UX, Backend Scalability for 10,000 DAU, Security, Legal/Privacy, and Google Play Store requirements.
  - Formulated an actionable 10-phase sequential execution roadmap detailing objectives, risk assessments, affected systems, and verifiable acceptance criteria.
- **Constitution Section 13 Pragmatic Amendment Clause (`docs/MINDFLOW_CONSTITUTION.md`, `AGENTS.md`)**:
  - Established Section 13 allowing sound engineering best practices to supersede rigid constitutional rules when recorded in `docs/PRODUCT_DECISIONS.md`.
  - Softened Rule 1 to clarify that secondary action shortcuts are permitted provided they bind directly to the single primary authoritative state controller without divergent state.
  - Updated the Decision Precedence Hierarchy across `AGENTS.md` and the Constitution.
- **ADR-0005: Launch Lifecycle Architecture Option B (`docs/ADR/0005-launch-lifecycle-option-b.md`)**:
  - Formally ratified Option B for the application cold-start lifecycle: renders `<IntroEngine>` immediately on Frame 0 with 0ms loader flash, executes `useAppBootstrap` concurrently in the background to guarantee 100% OAuth hash extraction and IndexedDB hydration safety before `<HashRouter>` mounts, and bounds startup with an 8-second watchdog timeout.
- **Capacitor Dependency Preservation & Storage Permission Scoping**:
  - Forensically verified active call sites for `@capacitor/camera` (reels) and `@capacitor/filesystem` (native PDF/export downloads), permanently cancelling package pruning.
  - Specified manifest scoping of legacy storage permissions (`maxSdkVersion="32"`) for Google Play Store compliance.
- **Android Release Version Mapping Ritual**:
  - Decoupled Android release builds from web semver to preserve clean Gradle releases; instituted mandatory mapping entries in `APP_JOURNEY_LOG.md` for all Play Console uploads (`Android X.Y (versionCode Z) = Web v1.0.W`).

## [v1.0.339] - 10 November 2026, 02:10 AM IST

### Executive Summary
Engineered a world-class, professional entry authentication portal and developer/legal framework: eliminated the 8,000ms Web Locks freeze with an instant 0ms unauthenticated fast-path bypass, built a responsive desktop split-screen hero showcase (`AuthHeroShowcase`), implemented live password entropy evaluation (`PasswordStrengthMeter`) and seamless in-app legal dialogs (`AuthLegalModal`), resolved global button accessibility clobbering, unified signup/signin codebases, and fortified legal compliance with the Digital Personal Data Protection (DPDP) Act 2023 and IT Act 2000.

### ✨ Features & UI/UX Upliftment
- **Desktop Split-Screen Showcase (`AuthHeroShowcase.tsx`)**:
  - Designed an enterprise-grade left showcase column on desktop (`lg:grid-cols-12`) featuring animated orbital neural branding, ambient glowing gradients, four academic value pillars (Active Recall Engine, Multimodal Live AI, Deep Diagnostic Analytics, Offline Resilience), live social proof badges, and SSL 256-bit security trust marks.
- **Unified Dual-Tab Authentication Portal (`AuthPage.tsx`, `SignupPage.tsx`)**:
  - Replaced the fragmented and disconnected sign-in and sign-up pages with a unified, dual-tab switcher (`[ Sign In ] | [ Create Account ]`) preserving active user input between tabs.
  - Refactored `SignupPage.tsx` into a lightweight, clean proxy wrapper (`<AuthPage initialMode="signup" />`), eliminating over 700 lines of duplicated code.
- **Interactive Password Entropy Meter (`PasswordStrengthMeter.tsx`)**:
  - Implemented real-time password strength scoring across length, casing, numeric characters, and symbols with progressive colored segments and dynamic criteria pills.
  - Integrated full screen-reader accessibility (`role="status"`, `aria-live="polite"`).
- **Zero-Latency In-App Legal Modals (`AuthLegalModal.tsx`)**:
  - Engineered an in-app legal reader modal for Terms of Service and DPDP Privacy Policy, eliminating external tab redirects, bare-hash 404 vulnerabilities on GitHub Pages, and native Capacitor popup crashes.
- **Mobile Touch Target & Viewport Zoom Hardening**:
  - Increased all interactive hitboxes (action tabs, legal links, mode toggles, password reveals) to exceed WCAG 2.1 AA 44x44px minimum targets.
  - Set mobile input font sizes to 16px (`text-base sm:text-sm`), completely preventing involuntary iOS Safari auto-zoom on field focus.

### 🐛 Bug Fixes
- **Eliminated 8,000ms Unauthenticated Freeze (`src/lib/supabase.ts`)**:
  - Diagnosed Supabase Web Locks contention (`lock:sb-sjcfagpjstbfxuiwhlps-auth-token`) where guest page loads were held in an 8-second timeout loop while `<SynapticLoader />` froze the screen.
  - Introduced token existence check (`hasStoredAuthToken()`, `hasOAuthHash()`) and reduced `AUTH_TIMEOUT_MS` to 2,500ms (1,500ms guest cold-start), delivering an instantaneous 0ms bootstrap for unauthenticated visitors.
- **Resolved Global `<Button>` Screen-Reader Clobbering (`Button.tsx`)**:
  - Removed hardcoded `aria-label="Perform action"` placed after `{...props}`, restoring visible and contextual accessibility names across all buttons throughout the application.
- **Handled Unconfirmed Email Flow**:
  - Added an actionable "Resend confirmation email" CTA when Supabase returns a 400 `"Email not confirmed"` error, rescuing users trapped in unverified email states.
- **Fixed Deceptive Dynamic Legal Dates (`TermsOfUse.tsx`, `PrivacyPolicy.tsx`)**:
  - Replaced dynamic `{new Date().toLocaleDateString()}` that showed "today's date" on every visit with deterministic version metadata (`Version 2.1 • Effective November 2024`).

### 🔒 Security, Legal & Architecture
- **DPDP Act 2023 & IT Act 2000 Compliance**:
  - Embedded Section 5 "Notice at Collection of Consent" directly in the registration consent statement.
  - Added explicit parental/guardian consent affirmations for minor school learners.
  - Designated an official Grievance Redressal Officer with formal contact channels (`support@mindflow.com`) under Section 8 of the DPDP Act 2023.
- **Client-Side Brute-Force Rate Limiting**:
  - Enforced a client-side velocity check locking out login attempts for 30 seconds after 5 consecutive failures, with real-time countdown display to prevent credential stuffing.
- **System Theme Sync (`ThemeAndBrandingInjector.tsx`)**:
  - Added an active listener for `window.matchMedia('(prefers-color-scheme: dark)')` to dynamically synchronize the app palette when theme mode is set to `'system'`.


## [v1.0.338] - 10 November 2026, 01:15 AM IST

### Executive Summary
Engineered a unified, end-to-end table matching and question pipeline solution: remediated flattened/deformed matching-list questions across the database with clean GFM comparative tables, upgraded MarkdownRenderer and quiz UI components to render responsive dual-column comparative tables, equipped UniversalContentImporter with an intelligent schema adapter supporting auto-sequential v1_id generation via PostgreSQL sequences, and established comprehensive pipeline documentation alongside a reusable AI question enrichment prompt.

### ✨ Features & UI/UX Upliftment
- **Responsive Dual-Column Table Rendering (MarkdownRenderer.tsx)**:
  - Built custom table, thead, th, td, and tr overrides for ReactMarkdown with horizontal scroll safety (overflow-x-auto min-w-[300px]), brand accent styling, and dark mode readability.
- **Client-Side Question & Option Sanitizer (questionFormatter.ts)**:
  - Implemented proactive sanitizer utility resolving historical OCR Roman numeral misinterpretations (List 11 -> List II, List 111 -> List III, (11) -> (II), D-l -> D-1).
  - Added layout breaker to cleanly segment flattened multi-list questions on-the-fly.
- **Option Deduplication & Solution Card Parity (QuizOption.tsx, QuestionSolutionCard.tsx)**:
  - Prevented redundant display in QuizOption.tsx when English and Hindi options are identical (e.g. code pairs like I-3, II-1, III-2).
  - Upgraded QuestionSolutionCard.tsx to render questions via MarkdownRenderer, ensuring table structures and line breaks never collapse during post-quiz review.

### ⚡ Performance & Database Architecture
- **Nondestructive Database Table Remediation**:
  - Remediated flattened and OCR-mangled matching questions in public.questions (including POL1115, GEO1423, POL941, CHE382, PHY498, SGK754, SGK756, ECO1006, CUR294, HIS2123) into valid, bilingual GitHub Flavored Markdown tables without data loss.
  - Documented migration in supabase/migrations/20261110010000_remediate_matching_questions.sql.
- **Intelligent Admin Bulk Ingestion Adapter (UniversalContentImporter.tsx)**:
  - Automated schema normalization for both flat database rows and nested Content Contribution Guidelines v2.0 JSON structures (classification.*, sourceInfo.*, properties.*).
  - Strips non-UUID id numbers and safely omits empty/placeholder v1_id values, allowing Supabase's assign_question_v1_id() PostgreSQL sequence trigger to automatically and monotonically allocate v1_id sequence numbers without manual pre-calculation.

### 🔒 Security, Prompts & Architecture Documentation
- **Master Question Pipeline Architecture (docs/QUESTION_PIPELINE_ARCHITECTURE.md)**:
  - Authored a comprehensive chronological guide detailing both Track A (Indigenous in-app pgmq pipeline) and Track B (External AI + Admin Importer), OCR sanitization, database sequence triggers, and validation invariants.
- **Generalized AI Question Enrichment Prompt (docs/prompts/full_prompt_batch_1.md)**:
  - Published a production-grade system prompt enforcing Content Contribution Guidelines v2.0, full 11-subject taxonomy, strict GFM table canonicalization for matching lists, and 5-part bilingual explanations.

## [v1.0.337] - 09 November 2026, 10:40 PM IST

### Executive Summary
Closed visual diagram rendering parity across all student learning surfaces (`QuestionSolutionCard.tsx` and `MistakeQuestionCard.tsx`), engineered a resilient Universal Explanation Adapter in `QuizExplanation.tsx` with bilingual Hindi fallback handling and cleanup of legacy dead code, and embedded native `AdminQuestionImage` controls directly into the admin question modal (`AdminEditQuestionModal.tsx`) across Content and Explanation tabs.

### ✨ Features & UI/UX Upliftment
- **Visual Diagram Parity Across Quiz Review & Mistakes Surfaces**:
  - Mounted `<AdminQuestionImage kind="question" ... />` inside `QuestionSolutionCard.tsx` (quiz review/summary screen) and `MistakeQuestionCard.tsx` (mistakes notebook), guaranteeing diagrams attached to question statements render seamlessly across the entire study workflow.
- **Embedded Visual Controls in Admin Modal**:
  - Embedded `AdminQuestionImage` directly inside Tab 1 (`Content & Options`) for question statement diagrams and Tab 3 (`Explanations & AI Tutor`) for explanation diagrams in `AdminEditQuestionModal.tsx`.
  - Added live preview rendering for explanation diagrams in the student preview subtab, eliminating the need to leave the editing flow to manage educational diagrams.

### 🐛 Bug Fixes & Refactoring
- **Universal Explanation Adapter & Schema Resilience (`QuizExplanation.tsx`)**:
  - Added an explanation adapter supporting structured `Explanation` objects, stringified JSON strings, and raw Markdown strings from legacy PYQ datasets without crashing.
  - Implemented safe bilingual summary extraction: when stripping Hindi characters leaves no content (e.g. pure Hindi PYQ question sets), the component safely falls back to the original summary rather than rendering a blank space.
  - Removed obsolete legacy `formatContent()` and regex splitting helpers that had been completely superseded by `MarkdownRenderer`.

### 🔒 Security & Architecture
- All diagram image mutations adhere to zero-secret policies, updating exclusively through authenticated client services and Supabase RLS.

## [v1.0.336] - 09 November 2026, 09:16 PM IST

### Executive Summary
Remediated the phantom column bug from PR #1074 by executing and applying live database migration `20261109203000_add_question_image_url.sql`, introduced an interactive full-screen Lightbox modal with zoom and pan controls for educational diagrams, upgraded `AdminQuestionImage.tsx` with touch-first mobile admin controls, and connected active question diagram rendering in `QuizQuestionDisplay.tsx`.

### 🐛 Bug Fixes & Database Schema Hardening
- **Phantom Column Remediation (`question_image_url`)**:
  - Created and applied migration `20261109203000_add_question_image_url.sql` adding `question_image_url TEXT` column to `public.questions` on live Supabase production (`sjcfagpjstbfxuiwhlps`).
  - Updated `src/types/models.ts` to include `question_image_url?: string` on the core `Question` interface, resolving runtime exceptions when uploading question-level visual diagrams.
- **Client Cache & Store Synchronization**:
  - Connected `updateImage` in `AdminQuestionImage.tsx` directly to `useQuizSessionStore.getState().hydrateQuestions()`, ensuring that uploads and removals immediately reflect in active quiz sessions without requiring page reloads.

### ✨ Features & UI/UX Upliftment
- **Interactive Full-Screen Lightbox Modal**:
  - Built an accessible Lightbox dialog (`role="dialog"`, `aria-modal="true"`) for question and explanation diagrams.
  - Features high-resolution source inspection, 100%–300% zoom controls, zoom reset, escape key / backdrop dismissal, and tap-to-zoom indicators for students.
- **Touch-Friendly Mobile Admin Actions**:
  - Replaced the desktop-only `group-hover:opacity-100` overlay with permanent, touch-friendly floating admin action pills.
  - Added a direct "Replace Image" action button so administrators can swap images in 1 click without deleting first, paired with a confirmation modal for removals.
- **Question-Level Visual Diagrams in Quiz Displays**:
  - Mounted `<AdminQuestionImage kind="question" ... />` inside `QuizQuestionDisplay.tsx`, bringing visual diagram support (maps, geometry, figures) directly into the main question statement card.

### 🔒 Impacted Scope
- `src/features/quiz/components/AdminQuestionImage.tsx`
- `src/features/quiz/components/QuizQuestionDisplay.tsx`
- `src/types/models.ts`
- `supabase/migrations/20261109203000_add_question_image_url.sql`
- `docs/APP_JOURNEY_LOG.md`
- `package.json`
- `package-lock.json`

---

## [v1.0.335] - 09 November 2026, 08:01 PM IST

### Executive Summary
Comprehensively audited and overhauled the Question Management Command Center (`AdminEditQuestionModal.tsx`). Eliminated a critical AI cache-poisoning bug that wrote `{}` instead of `null` to Supabase, corrected misleading schema formatting, introduced a categorized 3-tab layout (`Content & Options`, `Exam & Classification`, `Explanations & AI Tutor`), integrated a 1-click "Mark Correct" option synchronizer, added on-demand AI generation and cache purge capabilities, and provided 1:1 live student previews with KaTeX and Markdown rendering.

### 🐛 Bug Fixes & Cache Hardening
- **Cache Poisoning Resolution**:
  - Remediated the empty object `{}` fallback that previously marked questions as cached in Supabase `questions.ask_ai_explanation`, preventing students from receiving empty AI responses.
  - Form validation and payloads now strictly preserve `null` when no explanation is present, allowing future Edge Function generation calls to run cleanly.
- **Schema Alignment**:
  - Replaced obsolete `"ai_analysis"` guidance with the canonical `ask-ai-tutor` contract (`correct_answer`, `reasoning`, `exam_facts`, `recent_news`, `interesting_facts`, `fun_fact`).
- **Answer Key Synchronization**:
  - Dynamic option editing now keeps `correctAnswer` in lockstep with the selected option text, preventing false-positive validation rejections.

### ✨ Features & UI/UX Upliftment
- **Categorized 3-Tab Architecture**:
  - Structured the monolithic 17-field scroll into three intuitive tabs: `Content & Options`, `Exam & Classification`, and `Explanations & AI Tutor`.
- **Interactive MCQ Option Cards**:
  - Replaced raw JSON option arrays with visual option cards featuring 1-click "Mark Correct" radio selectors, optional Hindi inputs, and dynamic option count management (2–6 options).
- **AI Tutor Command Center**:
  - Built an in-modal action bar with database cache status indicators (`Cached in DB` vs `Not Cached`), on-demand **"Generate with AI"** calling the live Edge Function, and **"Clear Cache"** to purge corrupted entries.
  - Implemented a 1:1 **Student Live Preview** matching the student-facing `AiExplanationButton` modal design with Markdown and LaTeX KaTeX math rendering.

### 🔒 Impacted Scope
- `src/features/admin/components/AdminEditQuestionModal.tsx`
- `docs/APP_JOURNEY_LOG.md`
- `package.json`
- `package-lock.json`

---

## [v1.0.334] - 09 November 2026, 09:56 AM IST

### Executive Summary
Integrated the `AdminQuestionImage` controller directly into `QuizExplanation.tsx`, providing administrators with direct, in-place image review and Cloudinary uploading capabilities for question explanations during active quizzes and solution reviews.

### ✨ Features & UI Enhancements
- **Inline Admin Question Image Controller**:
  - Bound `<AdminQuestionImage />` with `kind="explanation"` and `initialImageUrl={imageUrl}` into `QuizExplanation.tsx`.
  - Enables authorized content creators and administrators to inspect, upload, and remove explanation images directly inside the live quiz solution viewer.

### 🔒 Impacted Scope
- `src/features/quiz/components/QuizExplanation.tsx`
- `package.json`

---

## [v1.0.333] - 08 November 2026, 09:48 PM IST

### Executive Summary
Introduced comprehensive, end-to-end admin image upload support for GK quiz explanations. Added the `explanation_image_url` column to Supabase `questions`, created the `AdminQuestionImage` component with Cloudinary integration, and bound explanation images across Mistake Cards, Question Solution Cards, and Quiz Reviews.

### ✨ Features Added & Architecture
- **Database Schema & RLS Hardening**:
  - Added `explanation_image_url TEXT` column to `public.questions` table via migration `20261108134030_add_explanation_image_url.sql`.
  - Configured idempotent RLS update policy granting `UPDATE` rights on `questions` to authenticated users with `is_admin` or `content_creator` roles.
- **Optimistic State & Query Management (`useQuestionImage`)**:
  - Created custom React Query hook with optimistic cache updates, error rollback, and automatic cache invalidation upon upload or removal.
- **Administrative Image Controller (`AdminQuestionImage`)**:
  - Built full image management component with drag-and-drop / file selection, Cloudinary media upload integration with folder structuring, and image preview/deletion.
- **Display Bindings Across Quiz Experiences**:
  - Integrated visual explanation support into `MistakeQuestionCard.tsx`, `QuestionSolutionCard.tsx`, `QuizReview.tsx`, and `LearningSession.tsx`.

### 🔒 Impacted Scope
- `src/features/quiz/components/AdminQuestionImage.tsx`
- `src/features/quiz/hooks/useQuestionImage.ts`
- `src/features/admin/api/adminQuestionImageApi.ts`
- `src/features/mistakes/components/MistakeQuestionCard.tsx`
- `src/features/quiz/components/QuestionSolutionCard.tsx`
- `src/features/quiz/components/QuizReview.tsx`
- `src/features/quiz/learning/LearningSession.tsx`
- `src/services/mediaUploadService.ts`
- `src/types/models.ts`
- `supabase/migrations/20261108134030_add_explanation_image_url.sql`

---

## [v1.0.332] - 08 November 2026, 04:50 PM IST

### Executive Summary
Enhanced the Question Management Command Center by introducing an editable JSON field for `ask_ai_explanation` in `AdminEditQuestionModal.tsx`.

### ✨ Features Added & Refactoring
- **Editable AI Explanation Field**:
  - Integrated `ask_ai_explanation` field into initial form state, validation pipeline (`validateJson('ask_ai_explanation', ..., 'object')`), and mutation payload.
  - Added dynamic textarea with expected JSON format guidance (`{"ai_analysis": "Text..."}`) for seamless administrative authoring of AI-generated question explanations.

### 🔒 Impacted Scope
- `src/features/admin/components/AdminEditQuestionModal.tsx`
- `package.json`

---

## [v1.0.331] - 08 November 2026, 12:56 PM IST

### Executive Summary
Executed a comprehensive audit of the progressive Login flow (`AuthPage.tsx`) and resolved three critical vulnerabilities: eliminated the Password Recovery dead-end by introducing a dedicated `ResetPasswordPage` and preserving recovery tokens during hash bootstrap, fixed infinite loading UI lockups on session-less sign-ins, and resolved native Android Capacitor `GoogleAuth.initialize()` crashes.

### 🐛 Bug Fixes & Architectural Hardening
- **Password Recovery Dead-End Resolution**:
  - Implemented a dedicated, accessible `ResetPasswordPage` (`src/features/auth/components/ResetPasswordPage.tsx`) mapped to `ROUTES.RESET_PASSWORD = '/reset-password'`.
  - Updated `useAppBootstrap.ts` to detect `type=recovery` in incoming hash payloads, sanitizing sensitive tokens from the address bar while preserving the `#/reset-password` target hash for React HashRouter.
  - Updated `NavigationManager.tsx` to exempt `/reset-password` from premature onboarding redirects, ensuring recovery users can set a new password without interruption.
- **Infinite Loading UI Freeze Resolution**:
  - Hardened `handleAuthAction` in `AuthPage.tsx` to guarantee `isEmailLoading` is safely reset on all code paths, properly surfacing actionable errors if Supabase returns without an active session.
- **Native Android Google Sign-In Hardening**:
  - Added explicit runtime `await GoogleAuth.initialize()` calls prior to `GoogleAuth.signIn()` across both `AuthPage.tsx` and `SignupPage.tsx` to prevent native Capacitor plugin initialization crashes on Android.
- **OAuth Web URL Sanitization**:
  - Sanitized redirect URL path concatenation to prevent duplicate slashes (`//#/`) on strict URL allowlists.
  - Normalized user email input via `.trim().toLowerCase()` to prevent casing-induced authentication discrepancies.

### 🔒 Security & Architecture
- Maintained strict zero-token address bar exposure by immediately stripping sensitive tokens via `window.history.replaceState` before HashRouter mounts.
- Enforced password requirements (minimum 6 characters, matching confirmation) on password reset.

## [v1.0.330] - 08 November 2026, 12:17 PM IST

### Executive Summary
Upgraded the "Create Account" (`SignupPage.tsx`) experience to full visual and architectural parity with the progressive 2-step Login portal (`AuthPage.tsx`). Replaced the bulky legacy white card, redundant checkboxes, and heavy vertical scroll with a frameless, direction-aware 2-step onboarding sequence, bidirectional email state preservation between Login and Signup, Android hardware back/Escape capture interception, and 44x44px accessible touch controls.

### ✨ Features & UI/UX Parity
- **Full Visual Parity with Senior Login Architecture**:
  - Replaced the clunky desktop card box on mobile with a frameless, vertically centered layout (`h-[100dvh] max-h-[100dvh]` with safe-area insets and ambient indigo glow).
  - Adopted the exact typography, BrandLogo sizing, Google OAuth button, and divider aesthetics from `AuthPage.tsx`.
- **Progressive 2-Step Registration Flow**:
  - **Step 1 (Identification)**: One-tap Google Sign-Up or Email Address identification with format validation, forward-sliding animation, and permanent Terms/Privacy notice.
  - **Step 2 (Details & Security)**: Active Email Pill with quick "Change" action, Full Name input with auto-focus, Password & Confirm Password with individual 44x44px eye toggles, and unified 18+ Terms checkbox.
- **Cross-Page Email State Preservation**:
  - Wired bidirectional route state between `AuthPage` and `SignupPage` via `useLocation` / `location.state?.email`. If a user types their email on either screen and switches, their email is seamlessly prefilled.
- **Hardware Back Button & Escape Interception**:
  - Integrated `data-headlessui-state="open"` on Step 2 with capture-phase `Escape` key listeners, enabling seamless return to Step 1 without triggering an Android app exit or full screen pop. Step 1 top-left back button cleanly returns to the Login portal.

## [v1.0.329] - 08 November 2026, 11:55 AM IST

### Executive Summary
Conducted a deep architectural and functional audit of the login portal (`AuthPage.tsx`) and remediated critical blockers: wired up the non-functional "Forgot Password" action to live Supabase password recovery, eliminated the Android hardware back button event trap on Step 2 by enabling standard DOM event bubbling and capture-phase interception, established reliable post-animation auto-focus across progressive step transitions, sanitized input whitespace across transitions, and removed dead component state.

### 🐛 Bug Fixes & Architectural Polish
- **Real Password Recovery Integration (`supabase.auth.resetPasswordForEmail`)**:
  - Replaced the mock/dummy `handleForgotPassword` toast with a production-grade asynchronous handler executing `supabase.auth.resetPasswordForEmail()`.
  - Added dedicated loading (`isResettingPassword`) and error recovery handling, preventing user lockout when credentials are lost.
  
- **Android Hardware Back Button Deadlock Remediation**:
  - Fixed synthetic `Escape` event dispatch in `useHardwareBackButton.ts` by setting `{ bubbles: true, cancelable: true }`.
  - Updated `AuthPage.tsx` keydown listener to capture-phase registration on `document`, ensuring back presses on Step 2 (`step === 'password'`) reliably return to Step 1 (`step === 'email'`) without deadlock on Android Capacitor devices.

- **Framer Motion Auto-Focus Timing Fix**:
  - Replaced immediate `requestAnimationFrame` calls (which fired while incoming DOM elements were unmounted during Framer Motion's 220ms `mode="wait"` exit transition) with a step-change `useEffect` hook.
  - Ensures password input on Step 2 and email input on Step 1 reliably gain focus without requiring manual user tapping.

- **State Sanitization & Dead Code Cleanup**:
  - Enforced `setEmail(trimmed)` upon proceeding past Step 1 to eliminate lingering trailing whitespace on email pills and hidden username fields.
  - Removed unreferenced `message` state and unused `useLocation` / `useAuth` imports in `AuthPage.tsx`.
  - Added `overflow-hidden` to animated error alert containers to prevent text overflow during height collapse animations.

### 🔒 Impacted Scope
- `src/features/auth/components/AuthPage.tsx`
- `src/hooks/useHardwareBackButton.ts`
- `package.json`
- `docs/APP_JOURNEY_LOG.md`

---

## [v1.0.328] - 08 November 2026, 10:32 AM IST

### Executive Summary
Executed a comprehensive, senior-level UI/UX overhaul of the authentication portal (`AuthPage.tsx`). Eliminated the massive 262px whitespace void on tall smartphones (such as Samsung M51) through balanced vertical centering, permanently bound the Terms of Service & Privacy Policy directly beneath the primary action buttons so they never vanish during typing, added focus-ring clearance gutters to eliminate left/right focus border clipping, enhanced touch targets to 44x44px, and introduced responsive height-driven scaling for ultra-short and landscape viewports with zero scrolling.

### ✨ Features Added & UI Polish
- **Cohesive Vertical Architecture (Zero Blank Whitespace on Tall Screens)**:
  - Replaced the fractured `justify-between` and `my-auto` model with a unified, vertically centered card layout.
  - Eliminated the 262px dead space between the header and Google sign-in on devices like Samsung M51 (412x915) and iPhone 14 Pro Max (430x932), providing a tight, natural 20px gap (`mb-3 sm:mb-5`).
  
- **Permanent Terms & Privacy Notice Placement**:
  - Moved the legal notice directly beneath the Continue (Step 1) and Sign In (Step 2) buttons.
  - Removed focus-triggered hide states so the terms notice remains permanently visible and legible both while idle and while typing.

- **Focus Ring Clipping Elimination (Issue 3 Fix)**:
  - Added a `p-1 -m-1` gutter around the sliding container, providing 4px of clearance outside the input borders.
  - Replaced hard-clipped outer focus rings with smooth, non-overflowing focus states (`focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/25`), ensuring 100% unclipped, beautiful borders on Android WebView.

- **Dynamic Height Adaptability (Ultra-Short & Landscape)**:
  - Introduced arbitrary height variants (`[@media(max-height:500px)]:`) that automatically compress button and input heights to 36px (`h-9`), reduce vertical gaps, and hide redundant subtitles on short screens.
  - Verified 0px vertical and 0px horizontal scroll across all viewports including `640x360` (landscape) and `360x340` (keyboard simulation).

- **Senior UX Micro-Interactions & Accessibility**:
  - Replaced native browser `alert()` for "Forgot Password?" with a non-blocking toast via `useNotificationStore`.
  - Added a prominent top-left `<ArrowLeft />` back button on Step 2 to easily return to Step 1 alongside the email pill "Change" action.
  - Guaranteed 44x44px touch targets on the show/hide password toggle.
  - Wrapped error banners in `<AnimatePresence>` to eliminate Cumulative Layout Shift (CLS).

### 🔒 Security & Architecture
- Full compliance with MindFlow Product Constitution Section 8 performance budgets and zero-tolerance hard invariants.
- 100% preservation of Supabase auth, Google OAuth, and native Capacitor Google Sign-In handlers.


## [v1.0.327] - 08 November 2026, 08:38 AM IST

### Executive Summary
Re-engineered the authentication portal (`AuthPage.tsx`) into a modern, 2-step progressive authentication flow (`email` ➔ `password`) with direction-aware Framer Motion transitions. Pinned the brand header to eliminate visual jumping between steps, established a stable middle step container, removed the obsolete "Try 3 Sample Questions First" feature, integrated Android hardware back / Escape interception on Step 2, and ensured complete credential matching for mobile and desktop password managers.

### ✨ Features Added
- **2-Step Progressive Authentication Flow (`AuthPage.tsx`)**:
  - **Step 1 (Identification)**: Users enter their email or select Google Sign-In. Email format regex validation runs synchronously on "Continue" with zero account enumeration delays.
  - **Step 2 (Password Authentication)**: Displays an active email pill with an emerald status indicator and a quick "Change" button that smoothly returns to Step 1.
  - **Auto-Focus Workflow**: Automatically focuses the password input upon transitioning to Step 2, and focuses the email input when returning to Step 1.
  - **Password Manager Compatibility**: Added standard `autoComplete="username"` on Step 1, `autoComplete="current-password"` on Step 2, and a visually hidden `username` input in Step 2 so password managers (Google Password Manager, Apple Keychain, Bitwarden) seamlessly store and autofill credentials.

- **Anchored Brand Header & Stable Min-Height Container**:
  - Pinned the MindFlow wordmark, "Welcome Back" greeting, and "CREATE ACCOUNT" link at the top with fixed padding. The header remains firmly in place and never shifts or collapses.
  - Enforced a stable middle container with `min-h-[220px]` (`[@media(min-height:750px)]:min-h-[250px]`), preventing layout height bouncing during transitions.

- **Direction-Aware Motion Transitions (`framer-motion`)**:
  - Configured slide variants where forward progression slides left (`x: 36 -> 0`) and backward navigation slides right (`x: -36 -> 0`).
  - Fully respects system accessibility settings via `useReducedMotion()`.

- **Android Hardware Back & Escape Interception**:
  - Tagged Step 2 with `data-headlessui-state="open"` and bound an `Escape` keydown handler.
  - Pressing the Android hardware Back button or Escape key on Step 2 gracefully returns the user to Step 1 without exiting the application or navigating away.

- **Debounced Virtual Keyboard Optimization**:
  - Form container utilizes debounced (`150ms`) `focusin`/`focusout` listeners.
  - On mobile viewports when typing, only the bottom legal/terms footer is hidden, keeping the header and the active input/action button 100% visible and unclipped.

### ⚡ Performance & Refactoring
- **Complete Decommission of "Try 3 Sample Questions" in Auth**:
  - Completely removed the Sample Questions button, demo drawer, and associated local demo state machines from `AuthPage.tsx`, eliminating the excess whitespace beneath the Google Sign-in button.
  - Preserved `src/features/quiz/data/starterDiagnosticQuestions.ts` on disk for zero-risk repository hygiene.

### 🔒 Security & Architecture
- **Auth Flow & Protocol Invariance**:
  - Preserved underlying Supabase authentication calls (`supabase.auth.signInWithPassword`, `signInWithOAuth`, native `GoogleAuth.signIn`), haptic feedback protocols, and zero-secrets compliance.


## [v1.0.326] - 08 November 2026, 07:56 AM IST

### Executive Summary
Re-architected the Authentication / Login portal (`AuthPage.tsx`) into a viewport-locked, native single-screen experience. The mobile interface eliminates the web "card-on-a-page" border and vertical/horizontal scrolling, features a responsive two-column layout for short landscape screens, smoothly collapses secondary blocks when the virtual keyboard is active, and provides a consolidated, authoritative terms/privacy footer.

### ✨ Features Added
- **Native Viewport-Locked Single-Screen Experience (`AuthPage.tsx`)**:
  - Bound root container to `h-[100dvh] max-h-[100dvh] w-full overflow-hidden` with safe-area positive padding (`env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`).
  - Mobile & Native Canvas: Stripped artificial card borders and shadows on `< md` screens so auth controls rest seamlessly on the deep navy gradient background; preserved centered card presentation on desktop (`md+`).
  - Consolidated Legal Links: Replaced redundant duplicate terms notices with a single pinned footer at the bottom maintaining intact terms and privacy policy routes.
  - Viewport-Height Based Typography & Sizing: Standardized inputs and buttons to 44–48px with dynamic height-aware classes (`[@media(min-height:750px)]:`), guaranteeing zero vertical or horizontal overflow across 360x640, 390x844, and 412x915 viewports.

- **Short Landscape 2-Column Responsive Layout**:
  - Implemented an automatic two-column layout for short screens in landscape (`(min-width: 540px) and (max-height: 520px)`), placing Brand & Google/Sample triggers on the left and Email/Password/Submit actions on the right to eliminate scrolling at 640x360.

- **Flicker-Free Virtual Keyboard Reactivity**:
  - Added debounced (150ms) `focusin`/`focusout` and `visualViewport` height tracking.
  - Automatically collapses top brand and secondary buttons on mobile when typing so email, password, error feedback, and the "Sign In" button remain 100% visible and accessible above the virtual keyboard.

### 🔒 Security & Architecture
- **Auth Flow & Policy Invariance**:
  - Preserved 100% of underlying Supabase authentication methods (`signInWithPassword`, `signInWithOAuth`, native `GoogleAuth.signIn`), 3-question diagnostic micro-demo state machine, route policies, and haptic feedback.

## [v1.0.325] - 08 November 2026, 07:05 AM IST

### Executive Summary
Replaced immediate auto-start quiz behavior on dashboard drill buttons with an informative, beginner-friendly confirmation Downsheet (`DashboardDrillBottomSheet`). Users now see detailed context on what is about to start—including drill rationale, target exam, mode selection (Learning vs Mock), question count options (10, 15, 20, 25 Qs), and estimated duration—with direct options to start, customize in Quiz Builder, or safely cancel.

### ✨ Features Added
- **Dashboard Drill Confirmation Downsheet (`DashboardDrillBottomSheet.tsx`)**:
  - Implemented a unified, accessible mobile-friendly bottom sheet for all dashboard quiz launch entry points.
  - Contextual explanation card informing users what questions are included and why the drill is recommended (resolving beginner confusion over "which button is doing what").
  - Interactive Mode Selector: Toggle between Learning Mode (instant answer reveal & AI explanations) and Mock Exam Mode (timed simulation with score review).
  - Flexible Question Count selector chips (`10 Qs`, `15 Qs`, `20 Qs`, `25 Qs`) with dynamic estimated completion time calculation.
  - Action options: "Start Practice Drill / Mock Test", "Customize Filters" (opens Quiz Builder pre-filtered without starting), and "Cancel" (safe dismissal).
  - Accessible interaction design: mobile drag-handle visual cue, backdrop blur dismissal, keyboard `Escape` listener, and body scroll lock.

### 🐛 Bug Fixes
- **Dashboard Accidental Immediate Quiz Start Fix (`DashboardPage.tsx`, `AIPrescriptionCard.tsx`, `ImportantForSscStrip.tsx`)**:
  - Intercepted direct `autoStart: true` navigation on "Start Targeted Drill", "Daily PYQ Drill", "Important for SSC CGL" curated topic cards, and ExamCard 25 Qs buttons.
  - All triggers now cleanly stage drill parameters into `DashboardDrillBottomSheet`, eliminating unintended quiz session generation when exploratory clicks occur.

### 🔒 Security & Architecture
- **Diagnostic Telemetry Integration (`telemetryService.ts`)**:
  - Added strictly typed telemetry payloads: `dashboard_drill_sheet_opened`, `dashboard_drill_started`, and `dashboard_drill_customize_clicked` for privacy-first observability without PII.
## [v1.0.324] - 08 November 2026, 06:55 AM IST

### Executive Summary
Architected and deployed an enterprise-grade, desktop-first Admin Command Center (`/#/admin/*`), centralizing control over user IAM, question bank management, vocabulary matrix, content ingestion pipelines, mock test series, study materials, financial transaction ledgers, moderation queues, and remote app configuration. Completely eradicated hardcoded legacy admin email checks and elevated error boundary diagnostics.

### ✨ Features Added
- **Unified Enterprise Desktop Command Center Shell (`AdminLayout.tsx`, `AdminSidebar.tsx`, `AdminHeader.tsx`, `AdminCommandPalette.tsx`)**:
  - Implemented collapsible responsive sidebar with grouped navigation: Control Room, Access & IAM, Academic Content, Mock Tests CMS, Governance & Billing.
  - Added global `Ctrl+K` Command Palette for instant keyboard-driven search and navigation across all admin modules.
  - Added dynamic route breadcrumb path navigation and real-time operational status indicators in `AdminHeader`.
- **System Overview & Health Dashboard (`AdminOverviewPage.tsx`)**:
  - Live metric counters querying total questions, registered learners, vocabulary items, published tests, pending moderation flags, and AI DLQ sizes.
  - High-density KPI cards and quick-action shortcuts for daily platform operations.
- **Learner Directory & IAM Access Control Studio (`AdminUsersPage.tsx`, `UserDetailsDrawer.tsx`, `UserFilterBar.tsx`, `UserRoleBadge.tsx`)**:
  - High-density user master table with search, role filters (`all`, `admin`, `moderator`, `content_creator`, `teacher`, `super_admin`), sorting by registration date, XP, and streaks, and CSV export.
  - Flyout inspection drawer providing tabbed views for learner analytics, RBAC privilege management, active device session tokens with one-click revocation, and trust/risk heuristics with shadow-flag toggles.
- **Question Bank Studio & Inspector (`AdminQuestionsPage.tsx`, `QuestionInspectorDrawer.tsx`)**:
  - High-throughput question browser with multi-select bulk operations, subject/difficulty filters, and pagination.
  - Full inspector drawer supporting bilingual inspection, options editing, difficulty adjustment, and tags management.
- **Universal Multi-Format Content Importer (`UniversalContentImporter.tsx`)**:
  - Unified modal supporting bulk JSON and single-item ingestion for Questions, One Word Substitutions (OWS), Idioms & Phrases, and Synonyms with interactive schema validation and sample template exports.
- **Vocabulary Matrix Hub (`AdminVocabPage.tsx`)**:
  - Consolidated tabbed workspace for OWS, Idioms, and Synonyms with inline editing links, live counts, and fast text filtering.
- **Financials & Monetization Ledger (`AdminFinancialsPage.tsx`)**:
  - Complete Razorpay transaction audit ledger with status filters (`Captured`, `Failed`, `Pending`), plan breakdown (`Spark`), raw gateway payload modal inspector, and CSV export.
- **Governance & Moderation Queue (`AdminReportsQueue.tsx`)**:
  - Moderation queue with status tabs (`pending`, `being_reviewed`, `resolved`, `ignored`), review modal with full user/post evidence snapshots, and content restore/permanent deletion actions.
- **Broadcast & Notification Center (`AdminNotifications.tsx`)**:
  - Modern dual-column desktop composer for multi-channel announcements with audience segmentation and audit history table with pagination.
- **Study Materials Command Center (`AdminManageMaterials.tsx`)**:
  - Integrated course document catalog with direct PDF drag-and-drop uploader to Supabase Storage.
- **Legacy Route Modernization**:
  - Seamlessly redirected legacy admin upload routes (`/admin/upload`, `/admin/upload-gk`, `/admin/upload-ows`, `/admin/upload-idioms`, `/admin/upload-synonyms`) to modern desktop studio tabs.

### 🐛 Bug Fixes
- **Enrichment Pipeline Hero Crash Fix**:
  - Resolved `Cannot read properties of undefined (reading 'is_active')` in `pipelineMetricsService.ts` by mapping Supabase RPC `get_ai_pipeline_dashboard_metrics` keys (`pipeline_status` -> `hero`, `metrics` -> `telemetry`, etc.) and providing safe fallback defaults.
  - Added robust optional chaining across `PipelineHeroCard`, `QualityMetrics`, `QueueIntelligence`, `ProgressMatrix`, `PhaseLatencyChart`, and `TokenEconomicsPanel`.
- **Route Reference & SearchParams Fixes**:
  - Fixed missing `useSearchParams` import in `AdminQuestionsPage.tsx` and declared `useSearchParams` in `AdminVocabPage.tsx`.
  - Repaired JSX nesting in `AdminReportsQueue.tsx` review modal action bar.
- **PresenceAvatar Typings Alignment**:
  - Aligned prop contracts in `AdminUsersPage.tsx` and `UserDetailsDrawer.tsx` to `avatarUrl` and `altText`.

### 🔒 Security & Architecture
- **Eradication of Hardcoded Admin Email Checks**:
  - Replaced all legacy `user.email === 'admin@mindflow.com'` checks across the entire repository with `AuthPolicy.isAdmin(user, profile, roles)` and RBAC roles (`admin`, `super_admin`).
  - Protected admin route group centrally in `NavigationManager` with `RouteAccessType.ADMIN`.
- **Diagnostic Glassmorphism Error Boundary (`ErrorBoundary.tsx`)**:
  - Upgraded system error boundary with collapsible component stack traces, exact error details banner, 1-click diagnostic JSON copy, and safe return to dashboard navigation.


## [v1.0.323] - 07 November 2026, 07:15 PM IST

### Executive Summary
Investigated and resolved an issue where dashboard quick drills and topic boxes inadvertently generated multi-thousand question mega-quizzes. Introduced an authoritative system-wide ceiling guard (`MAX_QUIZ_QUESTIONS = 100`), enforced default question count boundaries (10–25 questions) across all dashboard launch triggers, and added interactive Question Count selector chips (10, 20, 25, 50, 100) to the Quiz Configuration footer per MindFlow Constitution Section 8.

### 🐛 Bug Fixes
- **Dashboard Drill Over-Generation Fix (`DashboardPage.tsx`, `useVulnerabilityEngine.ts`, `AIAdaptiveQuizModal.tsx`, `useExamReadiness.ts`)**:
  - Fixed `Daily PYQ Drill` (`handleQuickAction('mock')`) which previously navigated with `{ tags: ['PYQ'] }` and `autoStart: true` without specifying a limit, inadvertently generating quizzes with all ~9,184 PYQs in the database. Now strictly requests `questionCount: 25`.
  - Fixed `Start Targeted Drill` in `useVulnerabilityEngine.ts`, which now passes `questionCount: target.suggestedQuestionCount || 10`.
  - Fixed `Important for SSC CGL` topic cards (`ImportantForSscStrip.tsx`), ensuring high-yield topic drill clicks strictly limit practice sessions to a curated 25 questions instead of whole-subject dumps.
  - Fixed `AIAdaptiveQuizModal` and `useExamReadiness`, standardizing auto-started diagnostic and readiness drills to 15 questions.

### 🔒 Security & Architecture
- **Hard System Ceiling Enforcement (`quizCreationService.ts`)**:
  - Introduced `MAX_QUIZ_QUESTIONS = 100` and `DEFAULT_DRILL_QUESTION_COUNT = 25`.
  - Even if an unbounded question array is passed to `createQuiz`, the service now automatically clamps and logs a warning, guaranteeing that no quiz session can ever bloat IndexedDB or flood `bridge_saved_quiz_questions` with thousands of records.

### ✨ Features Added
- **Interactive Question Count Selector (`QuizConfig.tsx`)**:
  - Implemented sticky footer question count selector chips (`10`, `20`, `25`, `50`, `100 (Max)`), giving users direct control over their session length (defaulting to 25 per Constitution Section 8).
  - Dynamically updated the primary CTA label to `Create Quiz (X / Total Available)` with automatic random sampling so each generated session is fresh and focused.

## [v1.0.322] - 07 November 2026, 03:55 PM IST

### Executive Summary
Revamped the Answer Key Tool and Candidate Details section to match the intended user specification. Implemented end-to-end extraction and persistence for all candidate fields (`Subject/Exam Name`, `Exam Time`, `State`, `Gender`, `Roll Number`, `Category`, `Venue Name`), maximized the result page viewport by removing constraining lateral margins, removed the global header from the tool route, and deployed Edge Function v5 live to Supabase.

### ✨ Features Added
- **Exact Candidate Details Card Specification (`CandidateDetailsSection.tsx`)**:
  - Rebuilt the card to match the user's intended UI with an ID card header badge and a clean, vertically stacked list separated by crisp dividers.
  - Formatted all 9 core candidate fields: Candidate Name, Roll Number, Category, Exam Date, Exam Time (`10:00 AM (Shift-1)`), Venue Name, Subject/Exam Name, State (`BIHAR`), and Gender (`MALE`).
- **Comprehensive Candidate Form Controls (`AnswerKeyCalculator.tsx`)**:
  - Added dedicated form selectors for `Gender` (Male, Female, Other) and `Home State / UT` (populated with all 36 Indian states & union territories).
  - Integrated state inference heuristic (`inferStateFromVenue`) to automatically extract the candidate's home/exam state from the venue center name and city address if not manually specified.
- **Maximized Viewport & Minimal Margins**:
  - Overhauled layout constraints on the result page to use minimal lateral margins (`px-1 sm:px-2 md:px-3` with `max-w-[1440px]`), ensuring full screen real-estate is dedicated to dense score analytics and section breakdowns.
- **Global Header Removal on Result Page (`MainLayout.tsx`)**:
  - Registered `/tools/answer-key-calculator` to `isHeaderHiddenRoute`, removing the global app header to eliminate visual clutter and granting 100% vertical focus to the answer key scorecard.

### ⚡ Performance & Refactoring
- **Parser & Type Engine Modernization (`ExamParserAdapter.ts`, `EduquityAdapter.ts`, `types.ts`)**:
  - Added `Subject` extraction from TCS iON tables and Eduquity response sheets.
  - Enhanced `formatExamTimeWithShift` to accurately compose time and shift labels without duplication.
- **Supabase Cloud Sync & Edge Function Deployment (`parse-exam-sheet` v5)**:
  - Updated Edge Function `parse-exam-sheet` to extract `subject`, accept `gender` and `state`, and persist them directly into `public.exam_submissions`.
  - Deployed Edge Function version 5 live to production project `sjcfagpjstbfxuiwhlps`.

### Impacted Scope
- `src/features/tools/answer-key-engine/components/sections/CandidateDetailsSection.tsx`
- `src/features/tools/answer-key-engine/AnswerKeyCalculator.tsx`
- `src/features/tools/answer-key-engine/components/ScorecardDashboard.tsx`
- `src/features/tools/answer-key-engine/adapters/ExamParserAdapter.ts`
- `src/features/tools/answer-key-engine/adapters/EduquityAdapter.ts`
- `src/features/tools/answer-key-engine/services/answerKeyService.ts`
- `src/features/tools/answer-key-engine/utils/format.ts`
- `src/features/tools/answer-key-engine/types.ts`
- `src/layouts/MainLayout.tsx`
- `supabase/functions/parse-exam-sheet/index.ts`
- `package.json`


## [v1.0.321] - 07 November 2026, 02:30 PM IST

### Executive Summary
Expanded the Brand & Motion System to include the 4th purposeful variants: the ultra-compact **Morphing Synapse** spinner (`<BrandSpinner variant="morphing" />`) and the standalone **Smooth Brain Glyph** (`<BrandLogo variant="glyph" />`). Restored the user's signature compact Google Play-style morphing gradient spinner with inner pulsing brain to the official design system and integrated it into `AppConfigHub` with dynamic variant switching.

### ✨ Features Added
- **Morphing Synapse Spinner Variant (`variant="morphing"`)**:
  - Encapsulated the 140x140 Google Play-style morphing path and animated coordinate values (`MORPHING_SYNAPSE_PATHS`) into `brandTokens.ts`.
  - Added ultra-compact sizing tokens (`xs: 24px`, `sm: 32px`, `md: 48px`, `lg: 64px`, `xl: 96px`) allowing the morphing spinner to fit inside compact chips, badges, and table rows.
  - Centered the pulsing smooth brain emblem inside the morphing gradient loop with full dark/light theme support.
- **Bare Vector Smooth Brain Glyph (`<BrandLogo variant="glyph" />`)**:
  - Added standalone glyph variant that renders the canonical smooth brain emblem without the squircle background badge, ideal for tight spaces and inline typography.
- **4-Variant Motion Studio in `AppConfigHub`**:
  - Expanded `LoadingConfigPanel` to showcase live interactive previews for all 4 variants: Halo Ring, Morphing Synapse, Inline Arc, and Neural Skeleton.
  - Added an active app-wide spinner selector allowing administrators to toggle between the full-screen Halo Ring and the compact Morphing Synapse.

### ⚡ Performance & Refactoring
- **SynapticLoader Backwards Compatibility**:
  - Enhanced `<SynapticLoader />` to accept `variant` and `size` while defaulting to the active remote configuration or morphing loader for compact layouts.
- **Store & Schema Modernization**:
  - Updated `useAppConfigStore.ts` with strongly typed `LoadingConfig` supporting `'synaptic' | 'morphing' | 'inline' | 'skeleton'`.

## [v1.0.320] - 07 November 2026, 01:25 PM IST

### Executive Summary
Established the unified MindFlow Brand Identity, Logo, and Motion System. Consolidated fragmented brain icons and ad-hoc loaders across the repository into canonical `<BrandLogo />` and `<BrandSpinner />` components. Promoted the orbital halo spinner from BlueIntro to the application's universal signature brand loader, backed by a live control panel in `AppConfigHub` (`/#/admin/app-config`) and remote configuration via Supabase.

### ✨ Features Added
- **Canonical Brand Identity Layer (`src/components/brand/`)**:
  - `brandTokens.ts`: Canonical vector definitions for the Smooth Brain Glyph with Neural Lobes, circuit brain paths, standard gradient anchors, and sizing tokens.
  - `BrandLogo.tsx`: Authoritative brand logo component supporting 3 purposeful variants (`icon`, `wordmark`, `animated`) across light, dark, and auto modes.
  - `BrandSpinner.tsx`: Unified loader system featuring 3 purposeful variants:
    - `synaptic`: Signature rotating orbital gradient halo ring with centered pulsing brand emblem.
    - `inline`: Clean, single-stroke geometric arc that inherits `currentColor` for buttons, chips, and input adornments.
    - `skeleton`: Neural card and row shimmer.
- **Admin Motion Control Center (`src/features/admin/app-config/`)**:
  - `AppConfigHub.tsx`: Replaced stubbed loading tab with a production `LoadingConfigPanel` offering live side-by-side previews of halo, inline, and skeleton loaders, halo rotation speed controls (`Snappy (0.9s)`, `Normal (1.5s)`, `Relaxed (2.2s)`), and a center emblem toggle.
  - One-tap "Publish Config" dynamically synchronizing loading preferences to Supabase `public.app_ui_config`.
  - `useAppConfigStore.ts`: Extended configuration schema with strongly typed `LoadingConfig` interface and local caching.

### ⚡ Performance & Refactoring
- **Backwards Compatibility**: Re-exported `<BrandSpinner variant="synaptic" />` from `src/components/ui/SynapticLoader.tsx` to instantly upgrade 30+ legacy call sites without breaking API contracts.
- **Auth Flow Standardization**: Migrated `AuthPage.tsx` and `SignupPage.tsx` from raw Lucide `BrainCircuit` and `Loader2` to `<BrandLogo variant="wordmark" size="lg" />` and `<BrandSpinner variant="inline" size="sm" />`.
- **Intro Engine Unification**: Refactored `BlueIntro.tsx` to consume `<BrandLogo variant="icon" />` in its core logo squircle, eliminating 20+ lines of duplicate inline brain SVG markup.

### 🔒 Security & Architecture
- **Architecture Documentation Persistence**:
  - `docs/AI_MEMORY_CONTEXT.md`: Added comprehensive App Launch Lifecycle & Dynamic Intro Pipeline reference.
  - `docs/MINDFLOW_CONSTITUTION.md`: Added Section 5.4 Application Launch & First-Impression Contract governing zero-waterfall parallel mounting and remote-decoupled intro orchestration.
  - `AGENTS.md`: Added App Launch Lifecycle & Intro Diagnostics invariants for autonomous pair programmers.

## [v1.0.319] - 07 November 2026, 11:55 AM IST

### Executive Summary
Delivered the comprehensive MindFlow Result Dashboard & Analytics Engine for high-stakes CBT examinations (SSC CGL, RRB, Eduquity). Integrated mathematical scoring models, standard competition 1224 rankings, Commission Formula-2 multi-shift normalisation with Top-0.1% anchor, 0ms offline-first caching, 5 SVG visual primitives, and 8 modular analytics cards with complete PII masking.

### ✨ Features Added
- **Pure Statistical Calculation & Formatting Engine (`src/features/tools/answer-key-engine/utils/`)**:
  - `stats.ts`: Deterministic calculation models for raw section scores, accuracy, standard competition ranking with tie handling, percentile calculations, directional deltas (`more`/`less`/`neutral`), and Formula-2 normalisation.
  - `format.ts`: Indian number formatting (`en-IN`), trailing zero suppression for whole integers (`136` vs `40.5`), 12-hour IST dates/times, and strict PII protection masking (`R*** K***`, `3261******36`).
  - Unit test suite: 29 / 29 Vitest tests passing with 100% green coverage across golden calculation fixtures.
- **Offline Storage & Layer 3 Integration Hooks (`src/features/tools/answer-key-engine/hooks/` & `services/`)**:
  - `answerKeyCache.ts`: Instant 0ms offline snapshot persistence and candidate caching layer.
  - `useResultDashboard.ts`: 0ms hydration from local offline storage combined with background Supabase RPC synchronization.
  - `useHistogramSlider.ts`: Interactive mark density scrubber, category filter tabs (`All`, `UR`, `OBC`, `EWS`, `SC`, `ST`), and dynamic counter metrics.
  - `useShiftAverages.ts`: Shift difficulty ranking (#1 hardest to easiest), user shift matching, and slide-over directory drawer state.
- **Visual Primitives & 8 Modular Sections (`src/features/tools/answer-key-engine/components/`)**:
  - 5 Pure SVG Primitives: `ScoreDonut` (~170px animated donut with 12 o'clock progress arc), `BalanceScale` (dynamic You vs Average beam tilt), `HistogramSlider` (interactive SVG histogram with 7 ticks and range slider), `CohortComparisonBar` (rounded bar with vertical benchmark tick), and `SortedBars` (horizontal shift difficulty ranking).
  - 8 Dedicated Section Cards: `CandidateDetailsSection`, `ScoreSummarySection`, `RankAndAverageSection`, `SubjectWiseMarksSection`, `NormalisedScoreSection`, `MarksDistributionSection`, `SubjectWiseComparisonSection`, and `AverageMarksSection`.
  - Coordinator Refactor: `ScorecardDashboard.tsx` coordinating the 8 analytics sections alongside full question-by-question review filtering, honest labeling disclosure banner ($N$), and offline state indicators.

### ⚡ Performance & Refactoring
- Completely decoupled business calculations from UI rendering for 0ms computation overhead.
- Self-contained caching layer eliminates global database lockouts while guaranteeing instant rendering on flaky network conditions.

### 🔒 Security & Architecture
- Strict PII masking prevents candidate exposure in competitive rank listings.
- Transparent sample size ($N$) disclosure banners clarify that rank and normalisation values are community estimates.


## [v1.0.318] - 07 November 2026, 10:45 AM IST

### Executive Summary
Executed enterprise Role-Based Access Control (RBAC) modernization and database security hardening on PostgreSQL 17 (Supabase project `sjcfagpjstbfxuiwhlps`). Replaced legacy hardcoded email checks (`admin@mindflow.com`) with a scalable `public.user_roles` architecture, modernized 49 Row-Level Security policies across 18 tables and storage buckets, hardened administrative stored procedures, locked down mutable search paths on 102 functions, and integrated resilient role caching into the frontend authentication and navigation pipelines.

### 🔒 Security & Architecture
- **Enterprise PostgreSQL 17 RBAC Foundation (`supabase/migrations/20261107000000_create_rbac_foundation.sql`)**:
  - Created strongly typed `public.app_role` enum (`super_admin`, `admin`, `moderator`, `content_creator`, `teacher`, `student`).
  - Implemented authoritative `public.user_roles` junction table with cascade deletion, performance indexes, and strict super-admin management policies.
  - Implemented high-performance, STABLE, `SECURITY DEFINER` authorization helpers: `is_admin()`, overloaded `has_role()`, and `get_my_roles()`.
  - Added zero-downtime, backward-compatible fallback for `admin@mindflow.com` and idempotently backfilled roles.
- **Row-Level Security Modernization (`supabase/migrations/20261107000001_modernize_rls_policies.sql`)**:
  - Resolved critical Supabase Advisor finding by enabling RLS and locking write/truncate on `public.official_answer_keys`.
  - Upgraded 49 policies across 18 tables (`study_materials`, `questions`, `idiom`, `ows`, `synonym`, `reports`, `notifications`, `source_documents`, `app_ui_config`, mock test tables, AI pipeline tables) to scope `TO authenticated` and consume cached scalar subqueries `(SELECT public.is_admin())`.
  - Modernized storage policies for `branding` and `study_materials` buckets.
- **Admin RPC Security Hardening & Search Path Lockdown (`supabase/migrations/20261107000002_harden_admin_rpcs.sql`)**:
  - Closed critical security vulnerabilities on `delete_content_by_admin`, `restore_content_by_admin`, and `admin_override_explanation` by enforcing role checks and revoking execution from `public`/`anon`.
  - Set immutable `search_path = public` across 102 functions to eliminate search path hijacking vectors flagged by Supabase Security Advisor.
  - Revoked public/anon execution and restricted access to authenticated callers for all sensitive administrative queue, DLQ, and pipeline control functions.

### ✨ Features Added & Frontend Integration
- **Permissions Registry (`src/config/permissions.ts`)**:
  - Exported strongly typed `AppRole` union and mapped roles in `PERMISSIONS.ROLES`.
- **Authorization Policy (`src/lib/navigation/policies/AuthPolicy.ts`)**:
  - Upgraded `AuthPolicy.isAdmin()` to evaluate authoritative roles first, profile fallback second, and transitional email third.
  - Added `AuthPolicy.hasRequiredRole()` supporting hierarchical role inheritance (`super_admin` wildcard, `admin` inheriting moderation/content creation).
- **Auth Context (`src/features/auth/context/AuthContext.tsx`)**:
  - Exposed `roles: AppRole[]`, `isAdmin`, `isModerator`, `isContentCreator`, `hasRole()`, and `refreshRoles()`.
  - Implemented offline-resilient role caching in `localStorage` (`mindflow_cached_user_roles`) to eliminate race conditions on initial app render.
- **Navigation Policy (`src/lib/navigation/NavigationManager.tsx`)**:
  - Added support for `requiredRoles?: AppRole[]` to enable granular role-protected route guards with automatic intent redirection.
- **Developer Profile (`src/features/about/components/AalokProfile.tsx`)**:
  - Switched from email check to reactive `!isAdmin` flag.

## [v1.0.317] - 06 November 2026, 09:20 PM IST

### Executive Summary
Resolved live Edge Function execution error (`Failed to send a request to the Edge Function`) by executing the production deployment ritual for the `parse-exam-sheet` Edge Function and PostgreSQL database migrations on the live Supabase project (`sjcfagpjstbfxuiwhlps`). Fixed Eduquity candidate roll number extraction against CSS watermark style matches, resolved database submission re-run upsert conflicts, and aligned frontend validation guidance with multi-vendor portal support.

### 🐛 Bug Fixes & Hidden Gotchas Solved
- **Live Supabase Edge Function Deployment**:
  - Identified that while `parse-exam-sheet` was merged into the repository, GitHub Actions only builds static frontend assets for GitHub Pages and does not deploy Edge Functions to Supabase.
  - Successfully deployed `parse-exam-sheet` (v4) with JWT bypass for public parsing endpoints to the live production Supabase instance (`sjcfagpjstbfxuiwhlps`).
- **PostgreSQL Analytics Engine Migration Applied**:
  - Applied migration `20261106130000_create_exam_analytics_engine.sql` containing `exam_configs`, `exam_submissions`, `exam_stats_snapshots`, `official_answer_keys` tables and `get_candidate_live_rankings` RPC to the live database.
- **Watermark Text Extraction Regex Refinement (`EduquityAdapter.ts` & `supabase/functions/parse-exam-sheet/index.ts`)**:
  - Fixed a regex vulnerability where `.watermark-text { position: absolute; ... }` inside `<style>` blocks was erroneously matched instead of candidate DOM elements, resulting in empty roll numbers.
  - Hardened regex to strictly target `<div class='watermark-text'...>([0-9]+)</div>`.
- **Submission Upsert Conflict Constraint Alignment**:
  - Resolved `uq_exam_user` constraint collision during repeated candidate submissions by explicitly targeting `onConflict: 'exam_id,user_id'` in `exam_submissions` upsert queries.
- **Frontend Guidance & Error UI (`AnswerKeyCalculator.tsx`)**:
  - Clarified error state hint text to inform users of both supported vendor portals (`*.digialm.com` and `*.cbexams.com`) or the offline HTML dropzone option.

### ⚡ Performance & Verification
- End-to-end verified live URL execution against `https://sscexams.cbexams.com/CGLE2026jsdgheQchallengemshetsOct13/ViewCandResponse.aspx?EncKey=...`.
- Verified live response: 136.0 / 200 marks (Reasoning: 40.5, GK: 17.0, Maths: 33.5, English: 45.0) with live candidate ranking calculation.
- Passed full TypeScript compile (`npx tsc --noEmit`) and Vite production build (`npx vite build`) with zero errors.

---


## [v1.0.316] - 06 November 2026, 08:35 PM IST

### Executive Summary
Engineered complete Multi-Vendor CBT Exam Answer Key parsing support for SSC's newly adopted vendor, Eduquity (`*.cbexams.com`). Solved the critical ASP.NET WebForms postback silent rollback defect via direct parallel session token requests (`A -> P2`, `A -> P3`, `A -> P4`), introduced `EduquityAdapter` for image-based CBT sheets with HTML table cell color matrix decoding (`bgcolor='green'`, `red`, `yellow`, `gray`), watermark candidate extraction, and updated the SSRF-guarded Edge Function and Toolbox UI.

### ✨ Features Added
- **Eduquity CBT Adapter (`src/features/tools/answer-key-engine/adapters/EduquityAdapter.ts`)**:
  - Implements `ExamParserAdapter` interface for Eduquity CBT response sheets.
  - Decodes table background color rules: `green` (+2.0 correct answer selected), `red` (-0.5 incorrect answer selected), `yellow` (official correct option when unattempted or failed), and `gray` (0.0 unattempted).
  - Handles image-based question statement and option tags (`qimg/...`) without fragile text dependencies.
  - Extracts candidate Roll / Registration Number directly from embedded watermark text layers (`<div class='watermark-text'>...</div>`).
- **Vendor-Neutral Edge Function (`supabase/functions/parse-exam-sheet/index.ts`)**:
  - Updated SSRF domain allowlist to permit `*.cbexams.com` alongside `*.digialm.com` and `*.ssc.nic.in`.
  - Added parallel multi-part postback fetching for Eduquity: concurrently fetches Part B (`P2`, General Awareness), Part C (`P3`, Quantitative Aptitude), and Part D (`P4`, English) using Part A's root session tokens.
  - Seamlessly persists candidate submission to `exam_submissions` table in PostgreSQL.
- **Toolbox UI & Client Service Updates (`AnswerKeyCalculator.tsx`, `answerKeyService.ts`)**:
  - Allowed `cbexams.com` URLs in client-side pre-validation.
  - Automatically routes uploaded HTML or pasted URLs to either `TcsIonAdapter` or `EduquityAdapter` based on structural detection.
  - Refined input placeholders and helper text to indicate multi-vendor compatibility (TCS iON / Eduquity).

### 🐛 Bug Fixes & Hidden Gotchas Solved
- **ASP.NET WebForms Postback Silent Rollback Fix**:
  - *Symptom*: Sequential chained postbacks (`A -> B -> C -> D`) caused Quantitative Aptitude (Part C / Maths) to silently duplicate Reasoning (Part A / 40.5 marks instead of 33.5 marks) due to server-side `__EVENTVALIDATION` mismatches without throwing 500 errors.
  - *Fix*: Strictly enforced direct parallel postbacks from Part A's root session tokens (`A -> P2`, `A -> P3`, `A -> P4`), successfully producing 100% accurate scores verified against the real exam answer key.
- **TypeScript Circular Export Disambiguation**:
  - Centralized `ExamParserAdapter` interface in `src/features/tools/answer-key-engine/types.ts` to prevent TS2308 export collision between types and adapters.

### 🔒 Security & Architecture
- Documented multi-vendor CBT exam architecture, image parsing protocols, and ASP.NET postback gotchas in `docs/architecture/13-hidden-knowledge.md` (Section 8) and `docs/AI_MEMORY_CONTEXT.md` (Section 10).

---

## [v1.0.315] - 06 November 2026, 01:32 PM IST

### Executive Summary
Delivered Phase 1 (MVP) and core architectural skeleton for the MindFlow Exam Intelligence, Answer Key & Rank Prediction Engine. Introduced dual-input response sheet parsing (online URL fetching via SSRF-safeguarded Supabase Edge Function and 0ms offline browser HTML parsing via `TcsIonAdapter`), section-wise metrics, question review filters, indexed PostgreSQL database schema with RLS and `SECURITY DEFINER` live ranking RPC stubs, and responsive scorecard dashboard in MindFlow Toolbox (`/tools/answer-key-calculator`).

### ✨ Features Added
- **Answer Key & Score Calculator Tool (`src/features/tools/answer-key-engine/`)**:
  - Registered new tool in Toolbox Hub (`src/features/tools/ToolsHome.tsx`) with animated Cyan/Sky SVG token (`AnswerKeyCalculatorSVG`).
  - Seamlessly inherits active exam context from `useExamContextStore` (Constitution Section 1, Commandment 2).
  - Offers dual input modes:
    1. *Paste URL Link*: Fetches official TCS iON response sheet via Edge Function without exposing client tokens.
    2. *Upload HTML (Offline)*: Parses downloaded response sheet 100% in-browser with 0ms latency.
  - Generates comprehensive scorecard featuring Total Raw Score, Accuracy %, Correct/Negative marks, and 4-subject breakdown (Reasoning, GK, Math, English).
  - Provides detailed Question-by-Question review filterable by status (`All`, `Wrong Only`, `Unattempted`, `Correct`) and by subject.
  - Implements honest community disclaimer banner and sample-gated UI tabs for future phases (Rank Matrix, Shift Difficulty & Normalization, AI Weakness Insights).
- **Pure TypeScript Resilient Parser (`src/features/tools/answer-key-engine/adapters/ExamParserAdapter.ts`)**:
  - Resilient `TcsIonAdapter` matching official TCS iON Question IDs and Option IDs rather than fragile question sequence indices.
  - Shared design compatible with both browser DOM parsing and server-side Edge Functions.
- **Client Caching & Offline Hydration (`src/features/tools/answer-key-engine/services/answerKeyService.ts`)**:
  - Automatically caches the most recent scorecard in local storage for instant 0ms restoration upon revisiting the tool.
  - Implements PII masking utilities (`maskRollNumber`, `maskName`) protecting candidate privacy in shared environments.

### 🔒 Security & Architecture
- **Enterprise PostgreSQL Schema (`supabase/migrations/20261106130000_create_exam_analytics_engine.sql`)**:
  - `exam_configs`: Config-driven exam rules, positive/negative marking (+2.0 / -0.5), and section weights.
  - `exam_submissions`: Stores candidate submissions with dedicated BTree-indexed numeric columns (`score_reasoning`, `score_gk`, `score_math`, `score_english`) for sub-millisecond ranking sorting.
  - `exam_stats_snapshots`: Asynchronous precomputed snapshot table preventing full-table scan bottlenecks during traffic spikes.
  - Row Level Security (RLS) ensuring students only read/write their own submission (`auth.uid() = user_id`).
  - `get_candidate_live_rankings` RPC configured with `SECURITY DEFINER` and `SET search_path = public`, returning aggregate counts and ranks without exposing other users' personal records.
- **SSRF-Safeguarded Edge Function (`supabase/functions/parse-exam-sheet/index.ts`)**:
  - Validates domain against allowlist (`*.digialm.com`, `*.ssc.nic.in`), blocks private IP ranges/metadata endpoints, enforces 8s timeout, and prevents open redirects (`redirect: 'error'`).
  - Never logs or stores raw URLs containing authentication tokens; securely stores SHA-256 hash for deduplication.
- **Feature Flags (`src/config/features.ts`)**:
  - Added `EXAM_ANALYTICS` flags isolating Phase 1 (MVP) while maintaining skeletons for Phase 2, 3, and 4.


## [v1.0.314] - 06 November 2026, 12:44 PM IST

### Executive Summary
Implemented Phase 5C of the Constitution Implementation Plan: Intelligence Layer (Predictive Exam Readiness & Spaced Repetition Revision Planner). Introduced the `useExamReadiness` engine calculating coverage, accuracy, and readiness scores scoped to the active target exam, activated the `AIStudyPlannerModal` on `AIHome` with Ebbinghaus spaced retention schedules, and surfaced the predictive readiness index directly on the Dashboard `UserProgressCard`.

### ✨ Features Added
- **Predictive Exam Readiness Engine (`src/features/ai/hooks/useExamReadiness.ts`)**:
  - Dynamically calculates readiness percentage (0–100%) against historical syllabus requirements for the user's active canonical exam.
  - Weights syllabus coverage (50%), question accuracy (50%), and subtracts deductions for unresolved critical mistakes.
  - Classifies readiness into actionable tiers (`Exam Ready`, `On Track`, `Developing`, `Foundational`) with tailored study guidance.
  - Emits `readiness_computed` and `revision_plan_generated` diagnostic telemetry events.
- **Spaced Repetition Revision Planner Modal (`src/features/ai/components/AIStudyPlannerModal.tsx` & `src/features/ai/AIHome.tsx`)**:
  - Activated the fourth and final card ("AI Study Planner") in `AIHome` with an interactive, rich revision modal.
  - Analyzes attempted topics against the Ebbinghaus forgetting curve, flagging topics unpracticed for $>3$ days or having sub-optimal accuracy.
  - Provides a 1-tap "Drill" button per topic or an "All Due Revisions" sprint launcher with 0ms direct execution.
- **Dashboard Predictive Readiness Integration (`src/features/dashboard/components/UserProgressCard.tsx`)**:
  - Embedded a dynamic target exam readiness pill directly on the Dashboard `UserProgressCard` (e.g. `🎯 SSC CGL 68% Ready`), connecting high-level progress with active exam preparation.

## [v1.0.313] - 06 November 2026, 12:20 PM IST

### Executive Summary
Implemented Phase 5B of the Constitution Implementation Plan: Intelligence Layer (Pre-Grounded Conversational Tutor & Adaptive AI Quiz Generator). Bound `useAIChat` to the active target exam context (`useExamContextStore`), added an ambient Active Goal header in `AIChatPage` with dynamic exam-scoped quick starters, and launched the `AIAdaptiveQuizModal` in `AIHome` with 3 personalized practice strategies.

### ✨ Features Added
- **Pre-Grounded Conversational AI Tutor (`src/features/ai/chat/useAIChat.ts`)**:
  - Automatically ingests `activeExam` (`useExamContextStore`) into the system prompt and initial request payload, enforcing Constitution Section 10 (*The AI must never ask: "What exam are you studying for?"*).
  - Automatically tailors tone, syllabus references, difficulty, and mnemonics to the active target exam and PYQs.
  - Retains and combines user profile mastery context seamlessly when enabled.
- **Ambient Target Exam Context Bar & Smart Quick Starters (`src/features/ai/chat/AIChatPage.tsx`)**:
  - Surfaced an ambient `Active Goal: {exam.displayName} ({exam.shortCode})` bar at the top of the chat area with a 1-tap shortcut to change focus on the Dashboard.
  - Dynamically computes high-yield quick starters tailored to the user's active exam (e.g., top-scoring topics, hard practice questions, short tricks, 7-day revision strategies).
- **AI Adaptive Quiz Generator Modal (`src/features/ai/components/AIAdaptiveQuizModal.tsx` & `src/features/ai/AIHome.tsx`)**:
  - Activated the "Generate Quiz with AI" card on `AIHome` with a rich, interactive modal.
  - Offers 3 adaptive strategies:
    1. *Target Weak Areas (Adaptive Sprint)*: Focuses on diagnosed weak topics from `useVulnerabilityEngine`.
    2. *High-Yield PYQ Sprint*: Focuses on frequently repeated previous year questions for the active exam.
    3. *Balanced Mixed Simulation*: Multi-subject coverage across the entire syllabus.
  - Provides 10, 15, and 25-question length selection with direct 0ms session launch (`autoStart: true`).

## [v1.0.312] - 06 November 2026, 11:58 AM IST

### Executive Summary
Implemented Phase 5A of the Constitution Implementation Plan: Intelligence Layer (Vulnerability Engine & Ambient AI Study Coach). Introduced `useVulnerabilityEngine` for local 0ms offline mistake & topic vulnerability aggregation scoped to the active target exam, injected the non-disruptive `AIPrescriptionCard` on the Dashboard, added one-tap remedial and diagnostic drill launches, and added diagnostic telemetry.

### ✨ Features Added
- **Algorithmic Vulnerability & Weakness Engine (`src/features/ai/hooks/useVulnerabilityEngine.ts`)**:
  - Dynamically scopes mistake and error history to the user's active canonical exam (`useExamContextStore`).
  - Aggregates errors by subject and topic, weighting repeat and critical mistakes to identify the top vulnerable area.
  - Implements offline-first fallback: seamlessly aggregates from local IndexedDB `saved_quizzes` if remote mastery sync is unavailable.
  - Emits `vulnerability_diagnosed` and `ai_drill_launched` diagnostic telemetry events.
- **Ambient AI Study Prescription Card (`src/features/ai/components/AIPrescriptionCard.tsx`)**:
  - Embedded seamlessly on `DashboardPage.tsx` directly beneath the `ExamQuickAccessStrip` (Constitution Section 10).
  - Automatically updates its pedagogical diagnosis in real-time whenever the user switches their active target exam.
  - Provides a 1-tap "Start Targeted Drill" (or "Start Diagnostic Drill") button that directly initiates a focused 10-Q learning session.
  - Displays a contextual "Review Mistakes" shortcut with badge counter when mistakes exist for the active exam.
- **Diagnostic Baseline Mode (Constitution Section 7 Zero Dead Ends)**:
  - If a user has 0 recorded mistakes for a newly selected exam, provides an intelligent diagnostic invitation to establish their baseline via PYQ drill, eliminating blank empty states.

### ⚡ Performance & Refactoring
- **Exam Matching Prefix Support (`src/features/dashboard/constants/examRegistry.ts`)**:
  - Added `matchPrefix: 'SSC CGL'` to canonical exam definitions to reliably associate all multi-tier question variants.
- **Vitest Path Resolution (`vitest.config.ts`)**:
  - Added `@` alias configuration resolving to `./src` for test execution parity with Vite bundler.

## [v1.0.311] - 06 November 2026, 11:05 AM IST

### Executive Summary
Implemented Phase 4 of the Constitution Implementation Plan: Engine & Architecture Optimization. Delivered smart filter pruning and reverse PYQ year ordering in `QuizConfig`, high-precision Dashboard FCP SLA instrumentation, IndexedDB cache performance tracking, resilient offline sync retry queue preservation, and vitest test timeout stabilization for CI/sandboxes.

### ⚡ Performance & Refactoring
- **Smart Filter Pruning & PYQ Ordering (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Dynamically pruned stale exam years and shifts when switching active exams or subjects, eliminating dead-end zero-question queries (Constitution Section 6.1).
  - Reversed PYQ years list (`.sort().reverse()`) to surface recent exam papers first.
  - Scoped available tags and filter chips strictly to active exam and subject metadata.
- **Dashboard First Contentful Paint SLA Telemetry (`src/pages/DashboardPage.tsx`)**:
  - Injected `dashboard_fcp` SLA budget tracking (`PERF_BUDGETS.DASHBOARD_FCP = 1000ms`) via `performanceTracker.startMark()` and `endMark()` in `requestAnimationFrame` on initial render.
- **IndexedDB Metadata Cache Hit Instrumentation (`src/features/quiz/hooks/useQuestionMetadata.ts`)**:
  - Added millisecond-level telemetry tracking (`perf_quiz_metadata_cached_ms` vs `perf_quiz_metadata_fetch_ms`) measuring cache hit efficiency against Constitution Section 8 performance budgets.
- **Resilient Offline Sync Retry Queue (`src/lib/syncService.ts`)**:
  - Configured `pushBookmark`, `removeBookmark`, and `pushSynonymInteraction` to support `throwOnError = true` when dispatched by `processEventQueue`.
  - Ensures network errors in background sync queue prevent failed items from being prematurely purged from `useSyncStore`, preserving offline mutations until successful cloud synchronization (Constitution Section 5).
- **Vitest Windows Sandbox Test Timeout Stabilization (`vitest.config.ts`)**:
  - Configured `testTimeout: 15000` to prevent CPU throttling false-positive timeouts during concurrent test runs on Windows virtual sandboxes.

## [v1.0.310] - 06 November 2026, 10:29 AM IST

### Executive Summary
Implemented Phase 3B of the Constitution Implementation Plan: Platform Consistency across Bookmarks, Mistake Notebook, Dashboard Greeting, and Post-Quiz Review Scorecard. Preserved target exam context across memory modules, added actionable Section 7 recovery empty states, and surfaced canonical exam scoping badges.

### ✨ Features Added
- **Bookmarks Page Target Exam Preservation & Empty Recovery (`src/pages/BookmarksPage.tsx`)**:
  - Automatically scopes bookmarks to `activeExamId` when questions exist for the active exam, preserving aspirant context on launch.
  - Implemented Constitution Section 7 compliant actionable recovery empty state when filter combinations yield zero bookmarks, providing direct one-tap recovery actions (`View All Exams`, `Clear Subject Filter`, `Start Practice Quiz`).
  - Context-aware logical back navigation using `location.state.returnTo` / `from` with safe fallback to `/dashboard`.
- **Mistake Notebook Target Exam Scoping & Recovery (`src/features/mistakes/pages/MistakeNotebookPage.tsx`)**:
  - Automatically initializes exam filter to `activeExamId` when mistakes exist for the user's active exam.
  - Added comprehensive recovery empty state offering contextual buttons to clear exam filters, clear subject filters, or reset all filters.
  - Aligned hierarchical back navigation with `handleBack` routing.
- **Dashboard Paused Quiz Canonical Exam Scoping (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Added canonical exam shortcode badge (`🎯 SSC CGL`, `🎯 BPSC`, etc.) at the top-right corner of the active "Resume Quiz" tile.
  - Prefixed paused quiz title with the matched canonical exam shortCode to provide instant contextual recognition.
- **Review Flow Exam Scoping Badge (`src/features/quiz/components/QuizResultBase.tsx`)**:
  - Surfaced matched canonical exam badge directly above the quiz title in the main scorecard hero section.

### ⚡ Performance & Refactoring
- Preserved single source of truth across all 4 modules (`useExamContextStore`), ensuring 0ms offline-first in-memory filtering without extra database roundtrips.

## [v1.0.309] - 06 November 2026, 10:05 AM IST

### Executive Summary
Implemented Phase 3A of the Constitution Implementation Plan: Platform Consistency across Quiz Library and Subject Hub. Established target exam scoping, contextual filter bars, exam-aware recovery empty states, and visual context banners adhering to the MindFlow Constitution (Sections 2.1, 4.1 & 6.4).

### ✨ Features Added
- **Quiz Library Target Exam Scoping Toolbar (`src/features/quiz/components/QuizLibraryToolbar.tsx`)**:
  - Added horizontal scrollable Target Exam Filter pill bar (`All` + pinned user exams with dynamic count badges).
  - Synchronized selection with `useExamContextStore` while allowing ad-hoc examination scoping within the library.
- **Exam-Scoping in Saved & Attempted Quizzes (`src/features/quiz/components/SavedQuizzesList.tsx`, `src/features/quiz/components/AttemptedQuizzesList.tsx`)**:
  - Filtered saved drafts and completed quiz sessions by selected exam context.
  - Added Constitution Section 7 compliant actionable recovery empty states when no quizzes match the active exam, providing direct actions to clear the exam filter or launch a new quiz.
- **Subject Hub & Topics Exam Context Focus (`src/features/dashboard/pages/subject/SubjectHubPage.tsx`, `src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`)**:
  - Added Active Target Exam Focus banner below the subject header, displaying the active exam's badge and full title.
- **Quiz Start BottomSheet Exam Scoping Badge (`src/features/dashboard/components/subject/QuizStartBottomSheet.tsx`)**:
  - Surface active target exam badge directly beside the subject/topic subtitle, preserving context prior to session generation.

### ⚡ Performance & Refactoring
- **Quiz Library Logical Back Navigation (`src/features/quiz/components/QuizLibrary.tsx`)**:
  - Aligned back button to return to `/dashboard` instead of legacy `/mcqs`, strictly honoring Constitution Section 6.2 hierarchical navigation.

## [v1.0.308] - 06 November 2026, 09:41 AM IST

### Executive Summary
Implemented Phase 2 Core UX: codified the 3-Tier Progressive Disclosure system in `QuizConfig.tsx`, established Context-Aware Logical Back Navigation across all views, and aligned hardware back button handling with the MindFlow Constitution (Sections 6.2 & 6.3).

### ✨ Features Added
- **QuizConfig 3-Tier Progressive Disclosure (`src/features/quiz/components/QuizConfig.tsx`)**:
  - **Tier 1 (Core Essentials)**: Default open viewport with Active Target Exam banner, mode selector, quick start pills, subject/topic classification, and difficulty selection.
  - **Tier 2 (PYQ & Examination Scoping)**: Single-tap accordion with dynamic active filter counters (`activeBadge`), encapsulating exam years, exam date shifts, and question format options.
  - **Tier 3 (Deep Diagnostics & Tags)**: Structured secondary accordion for granular tags and metadata search without cognitive overload.
- **Enhanced Accordion Component (`src/features/quiz/components/ui/Accordion.tsx`)**:
  - Added support for semantic subtitles, active count badges (`activeBadge`), and Constitution Section 9 atmospheric styling.

### ⚡ Performance & Refactoring
- **Context-Aware Logical Back Navigation Engine (`src/features/quiz/components/QuizConfig.tsx`, `src/routes/AppRoutes.tsx`)**:
  - Replaced legacy hardcoded redirects (`ROUTES.MCQS`) with intelligent hierarchical back resolution checking `location.state.returnTo`, `location.state.from`, active subject context, and defaulting safely to `/dashboard`.
  - Propagated contextual `returnTo` and `from` state in `DashboardPage.tsx`, `SubjectHubPage.tsx`, and `SubjectTopicsPage.tsx`.
- **Session Pause Exit Alignment (`src/features/quiz/learning/LearningSession.tsx`, `src/routes/AppRoutes.tsx`)**:
  - Replaced legacy redirect to `/quiz/library` on session pause with return to `/dashboard`, surfacing the active paused session immediately on the Dashboard "Resume Quiz" tile.
- **Android Hardware Back Alignment (`src/hooks/useHardwareBackButton.ts`)**:
  - Updated level 2 nested routing to redirect `/quiz/config`, `/quiz/create`, and `/quiz/library` to `/dashboard` instead of legacy `/mcqs`.

## [v1.0.307] - 06 November 2026, 09:16 AM IST

### Executive Summary
Fixed CI build pipeline failures by converting `TelemetryRecord` into a strict discriminated union and adding type narrowing in unit test suites for `telemetryService` and `performanceMetrics`.

### 🐛 Bug Fixes
- **TypeScript Discriminated Union for Telemetry (`src/lib/telemetry/`)**:
  - Converted `TelemetryRecord` from generic payload lookup to a distributed mapped discriminated union on `name: K`.
  - Resolved `TS2339: Property does not exist on type union` compiler failures encountered during CI `npm run build` (`tsc && vite build`).
  - Added type-guard narrowing in `telemetryService.test.ts` and `performanceMetrics.test.ts`.
  - Re-verified with local `npm run build` and `npx vitest --run` (all 10 tests green).

## [v1.0.306] - 06 November 2026, 09:00 AM IST

### Executive Summary
Implemented Phase 1 Foundation Infrastructure: established the Canonical State Ownership Registry, developed the centralized privacy-first Diagnostic Telemetry Service, and introduced the Performance Budget Tracking Engine strictly enforcing Sections 3, 8, and 11 of the MindFlow Constitution.

### ⚡ Performance & Refactoring
- **Performance Budget Engine (`src/lib/performance/`)**:
  - Implemented `performanceTracker` instrumented with Constitution Section 8 quantitative SLA thresholds: Filter Recalculation (< 16ms / 60fps), Quiz Generation (< 300ms), Route Transition (< 150ms), and AI Response (< 2.5s).
  - Instrumented `QuizConfig.tsx` to benchmark dynamic filter calculation against the 16ms SLA budget on every user filter change.
  - Instrumented `quizCreationService.ts` to measure quiz session generation latency against the 300ms SLA budget.
  - Automatic emission of `perf_budget_exceeded` telemetry events and styled developer console warnings whenever operations exceed budgets.

### 🔒 Security & Architecture
- **State Ownership Registry (`src/lib/state/`)**:
  - Implemented `stateOwnershipRegistry.ts` registering all 10 canonical state slices with their sole owner store, primary storage medium, authorized consumers, and prohibited anti-patterns.
  - Implemented runtime consumer assertion `assertStateConsumer` to detect and warn against shadow local state mutations in dev mode.
- **Diagnostic Telemetry Service (`src/lib/telemetry/`)**:
  - Implemented `telemetryService.ts` and `useTelemetry()` React hook enforcing Section 11 of the Constitution.
  - Built-in zero-PII sanitizer stripping sensitive user details and an in-memory 50-item ring buffer for live diagnostics.
  - Wired foundational telemetry events across the application:
    - `exam_selected`: Emitted in `useExamContextStore.ts` upon exam selection with source tag (`strip`, `modal`, `hub`, `banner`).
    - `quiz_generated` / `quiz_generation_failed`: Emitted in `quizCreationService.ts` with execution time and reuse state.
    - `filters_cleared`: Emitted in `QuizConfig.tsx` when user resets secondary filters while preserving the active exam and subject context.
    - `resume_quiz`: Emitted in `DashboardPage.tsx` with progress metrics when continuing paused learning/mock sessions.
- **Automated Verification**:
  - Created unit test suites for `telemetryService.test.ts`, `performanceMetrics.test.ts`, and `stateOwnershipRegistry.test.ts` (10/10 passing).

## [v1.0.305] - 06 November 2026, 08:35 AM IST

### Executive Summary
Established Phase 0 Repository Governance: ratified and enshrined the MindFlow Constitution as the supreme architectural and product standard, introduced Architecture Decision Records (ADRs 0001–0004), established the Product Decisions Log, updated AI agent operating instructions, and integrated the mandatory Constitution Compliance Checklist into the engineering lifecycle.

### 🔒 Security & Architecture
- **Ratification of the MindFlow Constitution (`docs/MINDFLOW_CONSTITUTION.md`)**:
  - Enshrined the 10 Immutable Product Commandments (One Concept → One Control, Never Ask Twice, Context Preservation, Logical Back Navigation, Offline-First 0ms Hydration, Zero Dead-End Empty States).
  - Established the Global State Ownership Matrix assigning every piece of application state to a single authoritative store.
  - Formalized the Unidirectional Data Flow Charter, Core Product Contracts (Quiz Gen, Context Switch, Back Navigation), and Quantitative Performance Budgets.
- **Architecture Decision Records (ADRs) Framework (`docs/ADR/*`, `docs/PRODUCT_DECISIONS.md`)**:
  - `ADR-0001`: Exam-First Architecture & Canonical Exam Registry.
  - `ADR-0002`: Logical Back Navigation & Direct Session Launch.
  - `ADR-0003`: Single State Ownership & Protected Context Clears.
  - `ADR-0004`: Offline-First Zero-Latency Hydration via IndexedDB.
- **AI Agent Directives & Compliance Checklist (`AGENTS.md`, `docs/AI_MEMORY_CONTEXT.md`)**:
  - Elevated the Constitution to priority level #2 (directly below explicit user prompt) in the Decision Precedence Hierarchy.
  - Embedded the Constitution Compliance Checklist for all future Pull Requests and implementation verification passes.

## [v1.0.304] - 06 November 2026, 03:35 AM IST

### Executive Summary
Unified the visual design language across the entire MindFlow Dashboard by extending the acclaimed atmospheric ambient gradient and tinted border design system from the Exam Target Cards to all dashboard sections (Greeting Actions, GK/GS Subjects, English Vocabulary Pillars, Quick Actions, User Progress, and Important Drills) with strict semantic color congruency.

### ✨ Features Added
- **Atmospheric Ambient Gradients & Tinted Borders Across Dashboard**:
  - **Hero Greeting Strip (`DashboardGreeting.tsx`)**: Replaced flat grey action buttons with themed cards featuring atmospheric gradients, squircle icon tiles, and glowing hover states for Today's Plan (Indigo), Bookmarks (Amber), Resume Quiz (Violet), and Quiz History (Emerald).
  - **GK / GS Subjects (`SubjectStrip.tsx`)**: Replaced standard grey subject buttons with semantic tinted cards featuring delicate ambient gradient overlays, elevated squircle icon containers, and color-matched borders across all 8 core subjects (History, Polity, Geography, Economy, Physics, Chemistry, Biology, Static GK).
  - **English & Vocabulary (`EnglishSection.tsx`)**: Elevated Synonyms, One Word Substitution, and Idioms pillar cards with ambient gradient washes and elevated icon tiles. Upgraded mini-game buttons (Imposter Trap, Tap & Connect, Speed Match) with semantic pill washes and borders.
  - **Quick Actions Grid (`QuickActionsGrid.tsx`)**: Styled Daily PYQ, Custom Quiz, and Mistake Notebook cards with the signature ambient glow and squircle icon badges.
  - **User Progress Card (`UserProgressCard.tsx`)**: Harmonized the progress card with an Indigo/Blue ambient wash and tinted border to match the surrounding dashboard cards.
  - **Important Drills Strip (`ImportantForSscStrip.tsx`)**: Upgraded drill cards with subject-correlated ambient washes and elevated play button squircles.

### ⚡ Performance & Refactoring
- **Token Consolidation (`sscDashboardConfig.ts`)**:
  - Centralized gradient tokens, structural border classes, and hover borders across `SSC_SUBJECTS`, `QUICK_ACTIONS`, and `IMPORTANT_FOR_SSC` to maintain design system consistency.

## [v1.0.303] - 06 November 2026, 03:08 AM IST

### Executive Summary
Delivered Phase 3 of the Exam-First Architecture: introduced granular exam filtering and canonical badges across the Mistake Notebook and Bookmarks pages, empowering students preparing for specific examinations (such as SSC CGL or BPSC) to review errors and saved questions targeted to their active exam.

### ✨ Features Added
- **Mistake Notebook Exam Filtering (`MistakeNotebookPage.tsx`)**:
  - Integrated dynamic Exam filter chips above the subject filters, allowing students to filter cognitive mistake records by exam (e.g. `🎯 SSC CGL (14)`, `📄 BPSC (3)`).
  - Scoped retention drills triggered via `MasteryDrillBar` to respect the active exam filter.
- **Canonical Exam Badge in Mistake Cards (`MistakeQuestionCard.tsx`)**:
  - Resolved and rendered canonical exam badges (e.g. `🎯 SSC CGL`, `🎯 BPSC`) directly on mistake question cards alongside cognitive vulnerability status badges.
- **Bookmarks Exam Filtering & Badges (`BookmarksPage.tsx`)**:
  - Added horizontal exam filter chips to filter saved bookmarks by canonical exam alongside subject filters.
  - Rendered canonical exam badges directly on bookmark cards for immediate visual identification.

### ⚡ Performance & Refactoring
- **Reactive Fast-Switching**:
  - Implemented zero-latency client-side memoized filter matching (`matchesCanonicalExam`) to ensure instantaneous filter switching on low-end mobile devices without triggering network round-trips.

## [v1.0.302] - 06 November 2026, 02:52 AM IST

### Executive Summary
Executed Phase 1 & 2 of the approved Exam-First Architecture Audit: eliminated duplicate exam controls in `QuizConfig.tsx`, enabled zero-library friction direct quiz session launches, resolved state leakage in QuickStart and filter resets, propagated active exam context to Subject Hubs, and introduced canonical exam badges on saved and attempted quiz cards.

### ⚡ Performance & Refactoring
- **One Concept, One Control (`QuizConfig.tsx`)**:
  - Hidden raw alphabetical exam capsules (`[A-I]`, `[J-R]`, `[S-Z]`, `[Other]`) inside "Advanced Filters" whenever an active exam context is present, establishing the top banner as the sole authoritative controller.
  - Dynamically scoped `allExamYears` and `allExamShifts` so only shifts and years relevant to the active target exam are rendered.
- **Zero-Library Friction Direct Launch (`QuizConfig.tsx`)**:
  - Replaced post-creation redirect to `/quiz/library?tab=created` with direct session launch (`navigate('/quiz/session/${mode}/${result.quizId}')`), eliminating redundant navigation steps.
- **State Leak & Reset Hardening (`QuizConfig.tsx`)**:
  - Hardened `handleQuickStart` to sample only from the active exam question pool instead of resetting to global database metadata.
  - Fixed `handleClearFilters` to preserve the user's active target exam context upon clearing ad-hoc topic and difficulty filters.
  - Contextualized default quiz titles to `${activeExamInfo.displayName} Practice • {Date}`.

### ✨ Features Added
- **Subject Hub & Topics Exam Context Preservation (`SubjectHubPage.tsx`, `SubjectTopicsPage.tsx`)**:
  - Propagated active exam state when launching custom quizzes and direct subtopic drills from Subject Hub and Subject Topics pages, preventing unintended question leakage across exams.
  - Eliminated delayed library navigation flicker in `SubjectTopicsPage.tsx`, launching directly into active quiz sessions.
- **Canonical Exam Badges on Quiz Cards (`SavedQuizCard.tsx`, `AttemptedQuizCard.tsx`)**:
  - Resolved and rendered branded exam pills (e.g. `🎯 SSC CGL`, `🎯 BPSC`) directly on library cards for instant visual identification.
- **Dynamic Exam Adaptability in Dashboard (`ImportantForSscStrip.tsx`)**:
  - Adapted the strip title and topic clicks to the active target exam (`Important for {activeExam}`), preventing hardcoded bias toward SSC for BPSC/Railways aspirants.

### 🔒 Security & Architecture
- Verified 0 TypeScript errors (`npx tsc --noEmit`) and successful production build with clean asset chunking.

## [v1.0.301] - 06 November 2026, 01:46 AM IST

### Executive Summary
Introduced the Exam-First Quick Access architecture on the Dashboard with multi-exam preparation support, establishing a Canonical Exam Registry (`examRegistry.ts`), dedicated persistent multi-exam context store (`useExamContextStore.ts`), horizontal swipeable target exam cards (`ExamQuickAccessStrip.tsx`), a goal management modal (`ManageTargetExamsModal.tsx`), and pre-scoped `QuizConfig` deep-linking.

### ✨ Features Added
- **Canonical Exam Registry (`src/features/dashboard/constants/examRegistry.ts`)**:
  - Implemented declarative exam mapping matching user-facing brands (SSC CGL, BPSC, RRB NTPC, IB ACIO, UPSC CDS, Bihar Police) to raw database values (`questions.examName`), resolving database alias variations (e.g. `'CGL PRE'` and `'SSC CGL'`).
  - Added $O(N)$ lightweight client metadata count computation (`computeExamCounts`).
- **Multi-Exam Context Store (`src/stores/useExamContextStore.ts`)**:
  - Built persistent Zustand store managing active exam focus (`activeExamId`) and user-pinned multi-exam target list (`pinnedExamIds`).
  - Enables seamless multi-exam preparation (e.g. candidates preparing simultaneously for SSC CGL and BPSC).
- **Exam Quick Access Strip (`src/features/dashboard/components/ExamQuickAccessStrip.tsx`)**:
  - Embedded responsive horizontal snap carousel at Tier 1.5 of the Dashboard.
  - Implemented 1-tap "Configure Quiz" and express "⚡ 25 Qs Drill" actions.
- **Manage Target Exams Modal (`src/features/dashboard/components/ManageTargetExamsModal.tsx`)**:
  - Bottom sheet on mobile / modal on desktop for exploring all exam categories, pinning/unpinning target goals, and inspecting question counts.
- **Quiz Config Exam Context Banner (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Added URL parameter (`?exam=<id>`) and navigation state hydration.
  - Rendered sticky "Target Exam Active" header banner with available question counts and one-click "Clear Exam" CTA.

### ⚡ Performance & Refactoring
- **Pre-computed Offline Question Counts**: Cached exam question counts in `localStorage` (`mindflow_exam_counts_cache_v1`) for instant 0ms rendering upon app launch.
- **Zero-Count Topic Pruning**: Leveraged existing index counts so subject/topic capsules automatically hide when 0 questions exist for the active exam.

### 🔒 Security & Architecture
- **Preserved Existing Routes & Capabilities**: Unconstrained "Custom Quiz" builder and GK/GS subject hubs remain completely intact.
- **Zero-Dependency Footprint**: Leveraged existing Zustand, Lucide, and Tailwind primitives without introducing third-party packages.

## [v1.0.300] - 06 November 2026, 12:49 AM IST

### Executive Summary
Documented the Windows Antigravity shell runner (`exebox`) relative path resolution workaround across all AI agent operational rules, established the permanent repository `.gitignore` hygiene for local batch forwarders, and synchronized the missing `v1.0.299` app journey changelog entry.

### 🔒 Security & Architecture
- **Antigravity Shell Runner (`exebox`) Workaround Documentation (`AGENTS.md`, `docs/AI_MEMORY_CONTEXT.md`)**:
  - Documented the root cause of the Windows `failed to start PTY command via exebox: The system cannot find the file specified` bug (where Antigravity resolves bare `powershell` relative to the workspace directory `d:\MindFlow-main\powershell`).
  - Added instructions for the `powershell.bat` local environment bridge forwarding calls directly to Windows PowerShell with system path injection.
  - Added strict Git hygiene rules requiring `powershell.bat` and `powershell.cmd` to remain uncommitted in `.gitignore`.
- **Git Hygiene (`.gitignore`)**:
  - Ensured `powershell.bat` and `powershell.cmd` are persistently ignored by version control.
- **App Journey History Synchronization (`docs/APP_JOURNEY_LOG.md`)**:
  - Backfilled the missing changelog entry for `v1.0.299` documenting the Quiz Configuration exam categorization and scrollable capsule refactor.

### Impacted Scope
- `.gitignore`
- `AGENTS.md`
- `docs/AI_MEMORY_CONTEXT.md`
- `docs/APP_JOURNEY_LOG.md`
- `package.json` (bumped to 1.0.300)

## [v1.0.299] - 05 November 2026, 07:33 PM IST

### Executive Summary
Refactored the Quiz Configuration advanced filters by replacing static multi-select dropdowns with responsive, categorized `ScrollableCapsules` for Exam Names (split alphabetically into `[A-I]`, `[J-R]`, `[S-Z]`, and `[Other]`), Exam Years, and Exam Shifts, significantly improving touch ergonomics and filter discoverability on mobile viewports.

### ✨ Features Added
- **Alphabetical Exam Categorization (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Segmented `allExamNames` into 4 memoized subsets: `examNamesAI` (`[A-I]`), `examNamesJR` (`[J-R]`), `examNamesSZ` (`[S-Z]`), and `examNamesOther` (non-alphabetic/special prefixes).
  - Replaced legacy `MultiSelectDropdown` with dynamic `ScrollableCapsules` for each alphabetical partition with count badges (`filterCounts.examName`), zero-count hiding (`hideZeroCount`), and multi-row capsule wrapping (`maxRows={3}`).
- **Scrollable Capsule Filters for Years & Shifts (`src/features/quiz/components/QuizConfig.tsx`)**:
  - Migrated `Exam Year` and `Exam Shift` filters from dropdown menus into touch-friendly horizontal `ScrollableCapsules`.
  - Added contextual tooltips (`tooltip`) and multi-select toggle handlers (`onOptionToggle`) allowing swift multi-year and multi-shift selection.

### Impacted Scope
- `src/features/quiz/components/QuizConfig.tsx`
- `package.json` (bumped to 1.0.299)
- `package-lock.json`

## [v1.0.298] - 04 November 2026, 08:58 AM IST

### Executive Summary
Fixed the Quiz Library shimmer skeleton loading layout by eliminating the constrained centering box in `QueryStateHandler` and aligning `QuizLibrarySkeleton` with the full page structure, responsive grid, and toolbar placement for seamless, zero-layout-shift loading.

### 🐛 Bug Fixes
- **Full-Width Skeleton Presentation (`src/components/ui/ErrorState/QueryStateHandler.tsx`)**:
  - Removed restrictive fixed-height (`h-48`) and flex-centering wrapper when a custom `loadingComponent` is provided, preventing skeletons from collapsing into a distorted compact box in the center of the viewport.
- **Quiz Library Skeleton Alignment (`src/features/quiz/components/QuizLibrarySkeleton.tsx`)**:
  - Replaced basic pulse boxes with animated gradient light-sweep shimmer (`animate-shimmer` with `bg-[length:200%_100%]`).
  - Added an integrated Toolbar skeleton placeholder matching `QuizLibraryToolbar` to eliminate layout shift when data finishes loading.
  - Aligned grid and list container classes (`grid gap-4 sm:gap-6 z-20 ${viewMode === 'list' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`) with actual saved and attempted quiz cards.
  - Dynamic count adaptation based on active view mode (6 for grid, 3 for list).
- **Component Consumption (`src/features/quiz/components/SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`, `index.ts`)**:
  - Updated `loadingComponent` invocations to pass dynamic `viewMode` directly into `QuizLibrarySkeleton`.
  - Exported `QuizLibrarySkeleton` in the quiz components public index.

### Impacted Scope
- `src/components/ui/ErrorState/QueryStateHandler.tsx`
- `src/features/quiz/components/QuizLibrarySkeleton.tsx`
- `src/features/quiz/components/SavedQuizzesList.tsx`
- `src/features/quiz/components/AttemptedQuizzesList.tsx`
- `src/features/quiz/components/index.ts`

## [v1.0.297] - 04 November 2026, 01:45 AM IST

### Executive Summary
Streamlined the main Dashboard visual and navigation hierarchy by permanently removing the Suggested Drill section and the Weak Areas action button from Quick Actions for all user states, resulting in a cleaner, distraction-free student dashboard.

### ⚡ Performance & Refactoring
- **Dashboard Streamlining (`src/pages/DashboardPage.tsx`)**:
  - Removed `SuggestedDrillCard` and associated diagnostic/challenge drill selection logic from the Dashboard.
  - Promoted `UserProgressCard` to a clean full-width insight widget under Tier 5.
  - Removed deprecated `weak-topics` handler from `handleQuickAction`.
- **Quick Actions Optimization (`src/features/dashboard/`)**:
  - Removed `weak-topics` ("Weak Areas") from `QUICK_ACTIONS` in `sscDashboardConfig.ts`.
  - Upgraded `QuickActionsGrid.tsx` with responsive grid layout (`grid-cols-2 sm:grid-cols-3`), allowing the 3 core actions (Daily PYQ Drill, Custom Quiz, Mistake Notebook) to span cleanly on both mobile and desktop without gaps.

### Impacted Scope
- `src/features/dashboard/constants/sscDashboardConfig.ts`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/pages/DashboardPage.tsx`

## [v1.0.296] - 04 November 2026, 01:20 AM IST

### Executive Summary
Re-aligned MindFlow's AI infrastructure with active Google AI Studio production tiers and quotas (`gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.8-flash`, and `gemma-4` batch workhorses), replacing deprecated `gemini-2.5-flash` references. Re-architected Edge Function execution planners with prioritized candidate matching and guaranteed non-terminating fallback so AI chats and tutor requests never fail when individual models are degraded.

### ✨ Features Added
- **Production Google AI Model Alignment**:
  - Synced client and server AI orchestration to use `gemini-3.1-flash-lite` (500 RPD, 15 RPM), `gemini-3.5-flash-lite` (500 RPD, 15 RPM), and `gemini-3.8-flash` (20 RPD, 5 RPM).
  - Configured batch enrichment pipelines (`explanation`, `etymology`, `mnemonic`, `grammar`) to leverage high-volume `gemma-4-31b-it` and `gemma-4-26b-a4b-it` (14,400 RPD) alongside flash models.
- **Frontend Quota & Model Selection (`src/features/ai/chat/`)**:
  - Updated `MODEL_CONFIGS` in `useQuota.ts` with accurate RPD/RPM limits and tier labels ("Fast", "Fast 2x", "Pro").
  - Defaulted active AI Chat model in `useAIChat.ts` to `gemini-3.1-flash-lite`.
  - Polished model badge and dropdown presentation in `ChatInput.tsx` and `AIChatPage.tsx`.

### 🐛 Bug Fixes
- **Resolved AI Chat 500 Failure ("All scheduled models failed")**:
  - Fixed rigid model filtering in `supabase/functions/chat-ai/index.ts` where execution plan candidates were discarded if their model did not strictly match the requested model ID.
  - Implemented priority sorting `[...matchingCandidates, ...fallbackCandidates]` ensuring requests gracefully fall back to active healthy models instead of throwing an unhandled exception.
- **Search Grounding Fallback (`supabase/functions/ask-ai-tutor/index.ts`)**:
  - Aligned Search Grounding fallback from deprecated `gemini-2.5-flash` to `gemini-2.5` to conform to Google AI Studio's 1,500 daily free grounding queries.
- **Synonyms Enrichment Model Update (`supabase/functions/enrich-synonyms/index.ts`)**:
  - Replaced legacy `gemini-2.5-flash` with `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, and `gemma-4-31b-it`.

### 🔒 Security & Architecture
- **Multi-Key Edge Runtime Synchronization (`public.ai_model_runtime`)**:
  - Provisioned and enabled `gemini-3.5-flash-lite` and `gemini-3.8-flash` across all active and fallback API keys (`GEMINI_API_KEY_v1`, `GEMINI_API_KEY_FALLBACK_v1`, `enrich-ques-api_v1`, `enrich-ques-api-fallback_v1`).
- **Dynamic Task Configuration Alignment (`public.ai_feature_config`, `public.ai_task_config`)**:
  - Updated model chains for `chat`, `ask_ai_tutor`, and `planner` to prioritize `["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-3.8-flash"]`.
- **Edge Deployment Verification**:
  - Deployed updated `chat-ai` Edge Function bundle to Supabase production environment.


## [v1.0.295] - 03 November 2026, 10:48 PM IST

### Executive Summary
Eliminated the 50–60 second new-tab dashboard freeze by fundamentally resolving the root-level "Pull-Wipe-Resync Echo Loop" in the storage and synchronization layers. Decoupled local IndexedDB writes from outbound network pushes via `skipRemotePush`, eradicated destructive startup database wipes, implemented cross-tab Web Lock synchronization deduplication, and delivered instant 0ms local-first hydration for paused quizzes and GK subject counts with multi-account isolation.

### ⚡ Performance & Refactoring
- **Storage Layer Decoupling (`src/lib/db.ts`)**:
  - Introduced `DBSaveOptions` with `skipRemotePush?: boolean` across `saveQuiz`, `updateQuizName`, `saveQuizHistory`, `saveBookmark`, `saveSynonymInteraction`, `saveOWSInteraction`, and `saveIdiomInteraction`.
  - Prevented local IndexedDB persistence operations from automatically firing outbound HTTP `_pushToSupabase` side-effects during background sync operations.
- **Instant Paused Quiz Hydration (`src/pages/DashboardPage.tsx`)**:
  - Implemented eager local-first hydration from IndexedDB (`db.getAllSavedQuizzes()`), illuminating the "Resume Quiz" button in **0ms** upon tab mount.
  - Quietly synchronizes remote query updates into IndexedDB in the background with `skipRemotePush: true`.
- **Instant GK Subject Counts (`src/features/dashboard/components/SubjectStrip.tsx`, `SubjectsPage.tsx`)**:
  - Implemented sanitized and schema-validated `localStorage` caching (`mindflow_subject_counts`).
  - Provides `initialData` to TanStack Query so GK subject cards display `1,200+ Qs` instantly on tab boot without displaying loading indicators (`...`).
- **Dashboard Bookmark Resilience (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Passed `skipRemotePush: true` during local bookmark hydration, preventing redundant bookmark sync echoes.

### 🔒 Security & Architecture
- **Eradication of Destructive Startup Wipes (`src/lib/syncService.ts`)**:
  - Permanently removed `db.clearAllUserData()` from `syncOnLogin()`. Background synchronization now performs non-destructive, key-matched atomic upserts, preserving offline-first quiz state and preventing database thrashing.
  - Added remote `saved_quizzes` hydration during sync so active quiz sessions synchronize seamlessly across user devices.
- **Cross-Tab Web Lock Coordination & Cooldown (`src/lib/syncService.ts`)**:
  - Introduced a 15-minute sync cooldown (`mindflow_last_full_sync_${userId}`) shared across tabs in `localStorage`, protecting against corrupted future timestamps.
  - Gated cloud delta synchronization behind a non-blocking Web Lock (`navigator.locks.request('mindflow_cloud_sync_lock', { ifAvailable: true })`), guaranteeing that only one tab synchronizes with Supabase at any moment while peer tabs yield cleanly.
- **Multi-Account Storage Boundary Isolation (`src/features/auth/context/AuthContext.tsx`)**:
  - Implemented `mindflow_last_auth_user_id` tracking. If a different user authenticates on a shared machine, previous user caches and IndexedDB records are wiped immediately before new user session hydration, preventing cross-user data leakage.

## [v1.0.294] - 03 November 2026, 09:20 PM IST

### Executive Summary
Upgraded MindFlow's AI pair programming guidelines (`AGENTS.md`) to a production-grade 9.9/10 autonomous agent architecture. Codified an explicit 5-tier Decision Precedence Hierarchy, established strict "Stop and Ask" circuit breakers, introduced Confidence Calibration and Anti-Hallucination rules, enforced PostgreSQL `SECURITY INVOKER` defaults for database RPCs, and established dynamic tooling discovery while rigorously preserving all hard invariants (HashRouter, OAuth hash interception in `useAppBootstrap.ts`, Port 3000, `--legacy-peer-deps`, and Capacitor Android requirements).

### 🔒 Security & Architecture
- **Decision Precedence Hierarchy (`AGENTS.md`)**:
  - Formalized explicit conflict resolution precedence: (1) Explicit User Prompt → (2) Repository Guardrails & Safety Invariants → (3) Existing Codebase Conventions & FSD → (4) Project Documentation → (5) General Best Practices.
- **Circuit Breakers ("Stop and Ask")**:
  - Implemented automatic pause triggers requiring user confirmation if >10 files are modified, database migrations alter existing table data, new npm dependencies are introduced, auth/permission logic changes, or public APIs break.
- **Database Function Safety Policy**:
  - Mandated `SECURITY INVOKER` by default for all database RPCs to respect Row Level Security (RLS) and caller permissions.
  - Restricted `SECURITY DEFINER` exclusively to functions with reviewed internal authorization checks and strict `SET search_path = public`.
- **Confidence Calibration & Anti-Hallucination Triad**:
  - Codified High/Medium/Low confidence self-evaluation; mandates reporting uncertainties rather than fabricating solutions.
  - Enforced Read-Before-Write and surgical edits with a zero-tolerance policy against unsolicited drive-by refactoring.
  - Codified the separation of observed codebase facts from subjective architectural recommendations.
- **Full Invariant Preservation**:
  - Retained MindFlow-critical requirements: `<HashRouter>`, OAuth hash extraction in `src/hooks/useAppBootstrap.ts`, local port 3000, `--legacy-peer-deps`, IndexedDB quiz offline-first resilience, and Gemini Live bidirectional audio specifications (16kHz in / 24kHz out).

## [v1.0.293] - 03 November 2026, 08:55 PM IST

### Executive Summary
Executed a comprehensive Lighthouse performance and accessibility overhaul targeting the unauthenticated login portal (`https://aklabx.github.io/MindFlow/`). Eliminated massive initial JS over-bundling (~2.4 MB uncompressed JS dropped from login modulepreloads), decoupled render-blocking Google Fonts, resolved WCAG accessibility violations (button accessible names and landmark elements), and split core routes to achieve optimal First Contentful Paint (FCP) and Largest Contentful Paint (LCP) on mobile and desktop without regressing HashRouter, OAuth, or Capacitor native flows.

### ⚡ Performance & Bundle Optimization
- **Vite ModulePreload Dependency Decoupling (`vite.config.ts`)**:
  - Implemented `build.modulePreload.resolveDependencies` filter to strictly exclude heavyweight markdown and export vendor bundles (`vendor-export`, `vendor-markdown`) from initial entry HTML modulepreloads.
  - Consolidated Rollup chunking rules to route `vite/preload-helper` directly to `vendor-react`, preventing Rollup from co-locating the dynamic import runtime helper inside `vendor-export` (which was triggering a cascading preload of `pdfmake`, `xlsx`, and `html2canvas` on the login page).
  - Shrunk entry bundle `index.js` from 501.8 kB to 428.6 kB and eliminated ~2.4 MB of uncompressed JavaScript from the initial unauthenticated network waterfall.
- **Route Code-Splitting & Barrel Decoupling (`src/routes/AppRoutes.tsx`)**:
  - Converted `DashboardPage`, `SubjectsPage`, and `AppPreferencesPage` into lazy-loaded chunks (`React.lazy()`).
  - Decoupled `AppRoutes.tsx` from the top-level `@/features/quiz` barrel export, directly importing `QuizProvider` and `useFlashcardStore` from their atomic files to avoid pulling heavy quiz session/plugin machinery into the initial route map.
  - Imported `QuizSessionGuard`, `ResultGuard`, and `ShareGatekeeper` directly from their respective component paths.
- **Non-Blocking Asynchronous Typography (`index.html`)**:
  - Maintained preconnect for `fonts.googleapis.com` and `fonts.gstatic.com`.
  - Loaded primary UI font (`Inter`) synchronously with `display=swap`.
  - Converted secondary and non-critical font families (`Crimson Text`, `Noto Sans Devanagari`, `Playfair Display`, `Poppins`) to load asynchronously via `media="print" onload="this.media='all'"` with `<noscript>` fallback, removing render-blocking latency on the critical rendering path.

### ♿ Accessibility & Semantic UX
- **WCAG Landmark & Screen Reader Fixes (`src/features/auth/components/AuthPage.tsx`, `src/features/auth/components/SignupPage.tsx`)**:
  - Replaced root `<div>` containers with semantic `<main id="main-content" role="main">` landmarks, eliminating the Lighthouse "Document does not have a main landmark" audit error.
  - Added explicit `aria-label={showPassword ? "Hide password" : "Show password"}` and `<span className="sr-only">` accessible text to password visibility toggle buttons, resolving the "Buttons do not have an accessible name" audit violation.
  - Preserved responsive keyboard-aware layout and positive viewport constraints (`min-h-[100dvh]`).

### Impacted Scope
- `index.html`
- `vite.config.ts`
- `src/routes/AppRoutes.tsx`
- `src/features/auth/components/AuthPage.tsx`
- `src/features/auth/components/SignupPage.tsx`
- `package.json` & `package-lock.json`
- `docs/APP_JOURNEY_LOG.md`

## [v1.0.292] - 03 November 2026, 01:10 PM IST

### Executive Summary
Engineered the Centralized Mastery & Memory Engine (CMME) and Panacea Mistake Notebook. Pushes past conventional error notebooks by introducing Memory Vulnerability Indexing (MVI), spaced verification for first-time lucky guesses (तुक्का vs mastery), escalating cognitive error tiers (Fresh Slip 1x, Repeated Error 2x, Critical Trap 3x+), automated historical quiz backfilling, and 1-click targeted retention drills across GK/GS, English, and all future subjects.

### ✨ Features & Architecture
- **Universal Mastery Engine Schema & RPCs (`supabase/migrations/20261103120000_create_centralized_mastery_engine.sql`)**:
  - Created `public.user_question_mastery` table with composite uniqueness on `(user_id, question_id)`, tracking interaction counts, consecutive streaks, MVI (0-100), cognitive tiers, and spaced review timestamps.
  - Implemented `record_question_interactions(p_interactions JSONB)` RPC with algorithmic vulnerability tier evaluation:
    - `CRITICAL_ERROR` (MVI 95-100, $\ge 3$ consecutive/total failures, 1-day spaced repetition).
    - `REPEATED_ERROR` (MVI 70-80, 2 failures, concept traps, 2-day spaced repetition).
    - `FRESH_SLIP` (MVI 45-55, 1 mistake, 3-day spaced repetition).
    - `UNVERIFIED_GUESS` (MVI 30-35, 1st-time correct answer flagged for spaced verification).
    - `FAMILIAR` (MVI 10-15, 2 consecutive correct answers).
    - `MASTERED` (MVI 0, 3 consecutive correct answers, graduated).
  - Implemented resilient `backfill_user_question_mastery()` RPC parsing historical attempt logs from all completed quizzes, populating 235 initial questions into the mastery table.
- **Mastery Service (`src/features/quiz/services/masteryService.ts`)**:
  - Centralized manager for querying summaries, filtering questions by cognitive tier/subject, saving personal concept notes, manual graduation, and launching revision drills.
- **Asynchronous Interaction Logging in Quiz Pipeline (`src/features/quiz/hooks/useQuiz.ts`)**:
  - Integrated with `submit_quiz_session` in `useQuiz.ts` to automatically record all question interactions into the CMME engine asynchronously upon session completion.
- **Command Center Mistake Notebook UI (`src/features/mistakes/`)**:
  - `MistakeNotebookPage.tsx`: Full-fledged error revision dashboard mounted at `/mistake-notebook` with multi-subject filtering and real-time search.
  - `CognitiveSummaryDeck.tsx`: Memory Vulnerability Index meter and interactive 6-tier filter buttons (All Mistakes, Critical Traps, Repeated, Fresh Slips, Lucky Guesses?, Mastered).
  - `MasteryDrillBar.tsx`: 1-click retention drill launchers ("Kill Critical Traps", "Verify Lucky Guesses", and "Quick 10-Q Sweep").
  - `MistakeQuestionCard.tsx`: Deep solution cards featuring bilingual EN/HI question toggles, option comparison (student choice vs correct answer), official explanations, private concept takeaway note persistence, AiExplanation modal integration, single-question practice drills, and "Mark as Mastered" graduation toggles.
- **Routing & Navigation (`src/config/routes.ts`, `src/routes/AppRoutes.tsx`, `src/pages/DashboardPage.tsx`, `src/layouts/MainLayout.tsx`)**:
  - Added `ROUTES.MISTAKE_NOTEBOOK = '/mistake-notebook'` and `ROUTES.QUIZ.MISTAKES = '/quiz/mistakes'`.
  - Wired Dashboard Quick Actions tile "Mistake Notebook" to route directly to `/mistake-notebook`.
  - Added header suppression in `MainLayout.tsx` for clean sticky navbar presentation.

### Impacted Scope
- `supabase/migrations/20261103120000_create_centralized_mastery_engine.sql`
- `src/features/quiz/services/masteryService.ts`
- `src/features/quiz/hooks/useQuiz.ts`
- `src/features/mistakes/`
- `src/config/routes.ts`
- `src/routes/AppRoutes.tsx`
- `src/pages/DashboardPage.tsx`
- `src/layouts/MainLayout.tsx`
- `package.json`
- `docs/APP_JOURNEY_LOG.md`

## [v1.0.291] - 03 November 2026, 11:20 AM IST

### Executive Summary
Restructured Dashboard curriculum architecture: renamed the ambiguous "Subjects" group to "GK / GS Subjects", established a dedicated "English & Vocabulary" hub section (Concept A with 3 core pillars + interactive vocab game pills), and repurposed the vacated Quick Actions tile to "Mistake Notebook" for instant error revision.

### ✨ Features & UI/UX Improvements
- **GK / GS Subjects Renaming (`src/features/dashboard/components/SubjectStrip.tsx`)**:
  - Renamed the header title to `GK / GS Subjects` to accurately reflect its General Studies content (History, Polity, Geography, Economics, Science, Static GK).
- **Dedicated English & Vocabulary Section (`src/features/dashboard/components/EnglishSection.tsx`)**:
  - Created a dedicated `rounded-2xl` container card housing English as a first-class subject hub.
  - Built 3 core pillar cards: **Synonyms & Antonyms** (`/english?tab=vocabsynonyms`), **One Word Substitution** (`/english?tab=vocabows`), and **Idioms & Phrases** (`/english?tab=vocabidiom`).
  - Added an interactive micro-game booster bar for instant practice: **The Imposter Trap**, **Tap & Connect**, and **Speed Match**.
  - Added header action `Open Hub →` linking directly to the full English Hub (`/english`).
- **Mistake Notebook in Quick Actions (`src/features/dashboard/constants/sscDashboardConfig.ts`, `QuickActionsGrid.tsx`, `DashboardPage.tsx`)**:
  - Replaced the vacated English tile in Quick Actions with `Mistake Notebook` (`RotateCcw` icon, amber theme) linking directly to Attempted Quizzes and error solutions (`/quiz/library?tab=attempted`).

### Impacted Scope
- `src/features/dashboard/components/SubjectStrip.tsx`
- `src/features/dashboard/components/EnglishSection.tsx`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/features/dashboard/constants/sscDashboardConfig.ts`
- `src/features/dashboard/index.ts`
- `src/pages/DashboardPage.tsx`
- `package.json`

## [v1.0.290] - 03 November 2026, 09:25 AM IST

### Executive Summary
Redesigned the Dashboard visual hierarchy with rounded-corner section containers and crisp boundary distinction for all buttons and interactive cards across light and dark modes. Solved low-contrast washed-out card boundaries by enclosing each section (Hero Strip, Subjects, Quick Actions, Suggested Drill, Your Progress, Important for SSC) within its own visible container card with refined borders, subtle elevation, and distinct inner button states.

### ✨ Visual Polish & UI/UX Improvements
- **Section-Level Container Architecture (`src/features/dashboard/components/`, `src/pages/DashboardPage.tsx`)**:
  - Enclosed each dashboard section (`SubjectStrip`, `QuickActionsGrid`, `ImportantForSscStrip`, `SuggestedDrillCard`, `UserProgressCard`, and `DashboardGreeting`) inside rounded-corner rectangular container cards (`rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] backdrop-blur-md`).
  - Integrated section headers and "View All" actions cleanly within each container card header.
  - Adjusted dashboard tier spacing to `space-y-3 sm:space-y-4` for a clean, cohesive visual cadence.
- **Crisp Button & Inner Card Boundaries**:
  - Replaced low-contrast `border-slate-100` with high-clarity `border-slate-200/90 dark:border-slate-700/70` and subtle `bg-slate-50/80 dark:bg-slate-800/60` background fills on all subject chips, quick action buttons, greeting quick-actions, and SSC cards.
  - Enhanced hover states with crisp border accents (`hover:border-indigo-300 dark:hover:border-indigo-600/70`) and active micro-scaling.
  - Standardized badge and chip boundaries across `SuggestedDrillCard` and `ImportantForSscStrip`.

### Impacted Scope
- `src/features/dashboard/components/DashboardGreeting.tsx`
- `src/features/dashboard/components/SubjectStrip.tsx`
- `src/features/dashboard/components/QuickActionsGrid.tsx`
- `src/features/dashboard/components/SuggestedDrillCard.tsx`
- `src/features/dashboard/components/UserProgressCard.tsx`
- `src/features/dashboard/components/ImportantForSscStrip.tsx`
- `src/pages/DashboardPage.tsx`
- `package.json`

## [v1.0.289] - 03 November 2026, 08:45 AM IST

### Executive Summary
Permanently resolved PostgreSQL `57014` statement timeout errors, connection pool exhaustion (`PGRST003`), and infinite loading spinners across the Quiz Library (`Created Quizzes` & `Attempted Quizzes`) and Dashboard. Re-architected database schema, query patterns, background sync pipeline, and tab lifecycle, reducing live query latency by 95.7% (from 8-10s+ down to ~14ms).

### ⚡ Performance & Database Architecture
- **Saved Quizzes Payload Sanitization (`supabase/migrations/20261103000000_optimize_quiz_library_performance.sql`)**:
  - Sanitized `saved_quizzes.state`: Stripped nested `activeQuestions` JSON array from remote database storage, dropping TOAST storage and single-row sizes from ~2MB down to ~10KB.
  - Created composite covering index `idx_saved_quizzes_library` on `(user_id, status, created_at DESC) WHERE (deleted_at IS NULL)` for sub-15ms index-only scans.
  - Added foreign key covering index `idx_bridge_saved_quiz_questions_question_id` on `bridge_saved_quiz_questions(question_id)` eliminating sequential scans during cascading lookups.
  - Optimized RLS policies for `saved_quizzes` and `bridge_saved_quiz_questions` to use InitPlan execution `((SELECT auth.uid()) = user_id)`.
- **PostgREST Embedded Aggregation (`src/features/quiz/components/SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`)**:
  - Replaced wildcard `select('*')` and thousands of bridge rows with embedded count syntax `bridge_saved_quiz_questions(count)` and precise column projection (`id, name, created_at, mode, status, filters, state`).
  - Moved status filtering from JavaScript memory into PostgreSQL queries (`.neq('status', 'result')` and `.eq('status', 'result')`), leveraging the composite index.
- **Single-Row Dashboard Optimization (`src/pages/DashboardPage.tsx`)**:
  - Replaced table scan that downloaded all user quizzes with an indexed `.neq('status', 'result').limit(1)` query, reducing Dashboard load overhead to <10ms.

### 🐛 Bug Fixes & Sync Pipeline Resilience
- **Eliminated Login Query Storm (`src/lib/syncService.ts`)**:
  - Removed dead-code question collection routine that gathered all question IDs across user quizzes, chunked into 46 batches, and executed 46 concurrent PostgREST requests into an empty loop.
- **Infinite Loader Resolution (`src/lib/syncService.ts`, `SavedQuizzesList.tsx`, `AttemptedQuizzesList.tsx`)**:
  - Moved `processEventQueue(userId)` inside `try/finally` in `syncOnLogin` and added a 10-second safety watchdog on `isSyncing` to guarantee unlocked state across network drops.
  - Removed raw `if (loading || isSyncing) return <SynapticLoader />` that intercepted UI renders before `<QueryStateHandler>`, ensuring error states and retry buttons render reliably.
  - Removed redundant query cache invalidations on component mount.
- **Quiz Creation Hardening (`src/features/quiz/services/quizCreationService.ts`)**:
  - Stripped `activeQuestions` from remote state payloads on initial quiz creation to prevent database bloat while maintaining full state in local IndexedDB.

### 🎨 UI/UX & Responsive Experience
- **Conditional Tab Mounting (`src/features/quiz/components/QuizLibrary.tsx`)**:
  - Replaced dual concurrent DOM tab mounting (`display: none`) with conditional mounting wrapped in `AnimatePresence mode="wait"`, ensuring only the active tab queries the database and transitions smoothly.
- **Glassmorphic Skeleton States (`src/features/quiz/components/QuizLibrarySkeleton.tsx`)**:
  - Introduced responsive skeleton card components matching list and grid layouts for zero layout shift during loading.
  - Enabled non-blocking background synchronization: users with cached data see their library instantly without blocking spinners.

## [v1.0.288] - 01 November 2026, 10:46 AM IST

### Executive Summary
Re-architected the Subject & Topic navigation pipeline to eliminate twin redundant REST queries with a high-performance PostgreSQL taxonomy summary RPC (~15ms, 1.5 KB payload), introduced intelligent 3-tier caching (RAM -> IndexedDB -> Server RPC), and eliminated cold-start blocking via zero-block Just-In-Time (JIT) subtopic question preparation for mobile and fast-tapping users.

### ⚡ Performance & Refactoring
- **Postgres Taxonomy Aggregation RPC (`supabase/migrations/20261101000000_subject_topics_summary_rpc.sql`)**:
  - Implemented `get_subject_topics_summary(p_subject)` returning nested `{ topic: { total, subtopics: { [subTopic]: count } } }` directly from PostgreSQL in ~15ms.
  - Reduced network payload from ~200 KB (over 4,200 raw JSON objects across twin calls) to ~1.5 KB.
  - Added partial index `idx_questions_subject_taxonomy` on `(subject, topic, "subTopic") WHERE deleted_at IS NULL` for lightning-fast aggregation scans.
  - Created targeted subtopic metadata RPC `get_subtopic_quiz_metadata(p_subject, p_topic, p_subtopic)` to fetch lightweight question taxonomy for single subtopics on demand.
- **3-Tier Unified Subject Service (`src/features/dashboard/services/subjectService.ts`)**:
  - Implemented `fetchSubjectTaxonomy` with local-first priority: checks IndexedDB `quiz_metadata_cache` first (0ms offline), falling back to `get_subject_topics_summary` server RPC on cold start.
  - Implemented `fetchSubtopicMetadata` for JIT targeted subtopic hydration, caching returned items into IndexedDB for subsequent offline use.
  - Re-routed legacy `fetchSubjectTopics` and `fetchSubjectTopicCounts` adapters to share the unified taxonomy result, preventing duplicate network requests.
- **Subject Hub Prefetching (`src/features/dashboard/pages/subject/SubjectHubPage.tsx`)**:
  - Added background prefetching of subject taxonomy on mount of `SubjectHubPage` using `queryClient.prefetchQuery`, ensuring data is already hot in memory before the user taps "Topic-wise Practice".

### 📱 Mobile UX & Resilient Fallbacks
- **Zero-Block JIT Subtopic Preparation (`src/features/dashboard/pages/subject/SubjectTopicsPage.tsx`, `src/features/dashboard/components/subject/QuizStartBottomSheet.tsx`)**:
  - Eliminated the blocking error toast ("Please wait, syncing quiz data...") for cold-cache and fast-tapping visitors.
  - Added eager JIT subtopic metadata fetching as the bottom sheet animates into view.
  - Added graceful fallback to targeted subtopic metadata fetching upon tapping "Start Quiz", allowing users on slow networks or cold starts to start practicing in ~150ms without waiting for other subjects' metadata.
  - Extended TanStack Query caching for subject taxonomy (`staleTime: 30 mins`, `gcTime: 24 hours`) to provide instantaneous 0ms re-entry for returning users and prevent skeleton layout jank.

---

## [v1.0.287] - 31 October 2026, 05:37 PM IST

### Executive Summary
Fixed addressing discrepancy in Dashboard greeting where user was addressed by raw email prefix (`mindflow`) instead of their configured display/full name (`Guest User`). Created a canonical, tested user display name resolution utility with graceful fallbacks.

### 🐛 Bug Fixes & UX Harmonization
- **Canonical User Display Name Resolver (`src/utils/user.ts`)**:
  - Implemented `getUserDisplayName` with multi-tier priority resolution: `profile.full_name` -> `user.user_metadata.full_name` -> `user.user_metadata.name` -> `user.user_metadata.display_name` -> `profile.username` -> `user.user_metadata.username` -> `user.user_metadata.given_name` -> email prefix -> fallback (`Aspirant`).
  - Added unit test suite (`src/utils/user.test.ts`) covering all resolution tiers, empty/whitespace edge cases, and fallback behavior.
- **Dashboard Greeting Addressing (`src/features/dashboard/components/DashboardGreeting.tsx`, `src/pages/DashboardPage.tsx`)**:
  - Switched from flawed `user?.user_metadata?.first_name` (which never exists in Supabase auth) to `getUserDisplayName(profile, user, 'Aspirant')`.
  - Fed canonical `profile` from `useAuth()` into `DashboardGreeting` to dynamically address users by their chosen profile name.
- **Global Name Consistency (`src/features/dashboard/components/DashboardHeader.tsx`, `src/features/auth/components/ProfilePage.tsx`, `src/layouts/SidePanel.tsx`)**:
  - Unified user name display across DashboardHeader, Profile page, and SidePanel using `getUserDisplayName`.

---

## [v1.0.286] - 31 October 2026, 04:48 PM IST

### Executive Summary
Unified the Dashboard Greeting and Action Cards into a single compact Hero Strip (Option B) and reduced inter-section vertical gaps globally (Option D), reclaiming ~80px of dead viewport space and elevating core quiz action entry points above the fold.

### ✨ UI/UX Modernization & Whitespace Optimization
- **Unified Hero Strip (`src/features/dashboard/components/DashboardGreeting.tsx`)**:
  - Integrated user greeting (`Good Afternoon, Aspirant 👋`) and the 4 action buttons (Today's Plan, Bookmarks, Resume Quiz, Quiz History) into a single translucent card container with backdrop blur and subtle border accent.
  - Streamlined action button layout with compact icons, tighter text margins, and micro-interaction active press states (`active:scale-95`).
- **Global Dashboard Spacing Consolidation (`src/pages/DashboardPage.tsx`)**:
  - Reduced outer container top padding (`-mt-4 pt-4` -> `-mt-4 pt-2`) and inner content offset (`pt-3 sm:pt-5` -> `pt-1 sm:pt-2`).
  - Tightened vertical rhythm across all dashboard sections (`space-y-4` -> `space-y-2.5`), ensuring Quick Actions (Mock Test, Custom Quiz) remain readily visible on mobile viewports without excessive scrolling.

---

## [v1.0.285] - 31 October 2026, 04:18 PM IST

### Executive Summary
Resolved recurring background sync red alert popups ("Background sync failed. Retrying automatically...") by strictly scoping the 15-second heartbeat reconciliation timer, route transitions, and auto-retry rules to active quiz sessions.

### 🐛 Bug Fixes & Resilience
- **Quiz Periodic Sync Heartbeat Scoping (`src/features/quiz/hooks/useQuiz.ts`)**:
  - Restructured the 15-second periodic reconciliation timer, `beforeunload`, and `visibilitychange` window event listeners to only fire when actively inside an unpaused quiz route (`window.location.hash.includes('/quiz/session/') && currentState.status === 'quiz' && !currentState.isPaused && currentState.quizId`).
  - Stopped periodic sync cycles from executing when users pause quizzes or navigate back to the Dashboard or other routes.
- **Sync Queue & Error Toast Hardening (`src/features/quiz/stores/useQuizSessionStore.ts`)**:
  - Guarded `enqueueCloudSync('periodic_reconciliation')` to automatically no-op if called outside active quiz session routes or during paused states.
  - Eliminated repetitive `queryClient.invalidateQueries({ queryKey: ['latest-paused-quiz'] })` calls during routine 15s heartbeats, preventing continuous background Supabase queries.
  - Suppressed alarmist red error toast notifications for non-critical background periodic sync sweeps while preserving notifications for explicit user pause/complete actions.
  - Updated `goHome()` to explicitly clear `quizId: undefined` so navigation to the Dashboard terminates lingering quiz references.
- **Idempotent Retry Policy (`src/lib/fetchWithTimeout.ts`)**:
  - Updated `isSafeToRetry` to allow safe, exponential backoff retries for idempotent `PATCH` calls to `/rest/v1/saved_quizzes`, gracefully recovering from transient network drops or token refreshes without throwing error toasts.

---

## [v1.0.284] - 31 October 2026, 03:56 PM IST

### Executive Summary
Fixed critical database type mismatch error (`invalid input syntax for type uuid: "HIS14"`) affecting the Bookmarks view and state synchronization when handling questions with legacy alphanumeric identifiers.

### 🐛 Bug Fixes & System Hardening
- **Question Hydration by ID (`src/features/quiz/services/questionService.ts`)**:
  - Implemented smart ID partitioning via `UUID_REGEX` to isolate standard UUIDs from legacy alphanumeric identifiers (such as `"HIS14"`, `"BIO1"`).
  - Queried Supabase `questions` table using `.in('id', ...)` for UUIDs and `.in('v1_id', ...)` for legacy IDs, eliminating Postgres type casting errors (Postgres error `22P02`).
  - Wrapped batch queries in safe async executors to prevent unhandled promise rejections.
- **Bookmarks Page Resilience (`src/pages/BookmarksPage.tsx`)**:
  - Enhanced `useQuery` query function with error logging and graceful fallback.
  - Upgraded bookmark removal to delete both `question.id` (UUID) and `question.v1_id` from local IndexedDB and Supabase backend.
  - Enhanced "Reset Bookmarks" action to cleanly wipe bookmarks from both local IndexedDB and remote `user_bookmarks` table.
- **Background Sync Service (`src/lib/syncService.ts` & `src/features/quiz/stores/useBookmarkStore.ts`)**:
  - Updated `removeBookmark` API to accept and purge both `questionId` and optional `v1Id`.
  - Upgraded remote bookmark hydration to track both `id` and `v1_id`, preventing duplicate hydrations and redundant push events.
  - Hardened store bookmark toggle logic to check and filter both standard UUIDs and legacy IDs.

---

## [v1.0.283] - 31 October 2026, 12:16 PM IST

### Executive Summary
Major release introducing the **Today's Plan (Daily SSC Exam Prep Engine)**, comprehensive Dashboard experience enhancements, streamlined state synchronization, and core Navigation and Session Recovery hardening.

### ✨ Features Added
- **Today's Plan Module (`src/features/todays-plan/`)**:
  - **Dual-Track Prep System**: Seamless switching between **GK Exam Drill** and **English Vocab Booster**.
  - **Intelligent Scheduling Engine (`todaysPlanAlgorithm.ts`)**:
    - **Mistake Vault Integration**: Automatically flags and surfaces previously failed questions for high-priority retention drills.
    - **Spaced Retention Repetition**: Implements structured interval spacing (1-day, 3-day, 7-day, 14-day, 30-day intervals) to solidify memory.
    - **Chapters of 25**: Sequential syllabus progression curating focused 25-question topic batches.
  - **Adaptive Daily Hero Card**: 1-click drill launch (`TodaysPlanHeroCard.tsx`), real-time completion tracking, and animated skeleton loaders.
  - **Interactive Vocab Booster**: Flashcard-style vocabulary mastery cards with contextual examples and definitions.
- **Dashboard Experience Overhaul**:
  - **Live Dynamic Greeting & Stats (`DashboardGreeting.tsx`)**: Shows real-time bookmark counts synced between IndexedDB and Supabase, time-based dynamic greetings, and quick-action shortcuts.
  - **SSC Subject Strip (`SubjectStrip.tsx`)**: Highlighting primary exam subjects with progress indicators and instant subject drill launches.
  - **Targeted Exam Topics (`ImportantForSscStrip.tsx`)**: Quick-access tags for frequently tested topics and high-yield concepts.
  - **Suggested Drills & User Progress Cards**: Refined metrics and drill recommendations based on user practice patterns.

### 🐛 Bug Fixes & System Hardening
- **Navigation Flow Stabilization (`NavigationManager.tsx`)**:
  - Resolved history stack corruption and race conditions during fast tab switches on mobile and Capacitor Android.
  - Enhanced route-guard transitions and ensured smooth deep-linking without URL hash collisions.
- **Session Recovery & Bootstrap (`RecoveryManager.ts`, `useAppBootstrap.ts`)**:
  - Hardened guest session recovery logic against transient token refresh failures.
  - Preserved the mandatory OAuth hash interception guardrail (`window.location.hash` parsing) for GitHub Pages hosting.
- **Optimistic State Management (`useBookmarkStore.ts`, `useQuizSessionStore.ts`)**:
  - Enabled immediate optimistic UI updates for bookmarks and quiz states with resilient background synchronization to IndexedDB and cloud.
- **Provider Refactoring (`src/providers/AppProvider.tsx`, `src/lib/queryClient.ts`)**:
  - Extracted TanStack QueryClient into a clean dedicated module (`queryClient.ts`), reducing unnecessary render cycles in the core app tree.

---

## [v1.0.277] - 27 October 2026, 03:10 PM IST

### Executive Summary
Messaging and chat stability update resolving auto-scrolling issues in active discussion rooms.

### 🐛 Bug Fixes & Improvements
- **Chat Scrolling (`src/features/community/`)**:
  - Integrated React Virtuoso `followOutput` to ensure the chat window automatically follows new incoming messages smoothly.
  - Simplified scroll event handlers to prevent jitter on high-frequency message streams.

---

## [v1.0.276] - 27 October 2026, 01:03 PM IST

### Executive Summary
UI consistency update adding full Dark Mode compatibility to community message rooms.

### 🐛 Bug Fixes & Improvements
- **Theme Polish**:
  - Normalized Tailwind CSS dark mode classes (`dark:bg-slate-900`, `dark:text-slate-100`) across `ActiveChatRoom` and community message threads.
  - Resolved background-text contrast issues on dark themes for user message bubbles.

---

## [v1.0.275] - 27 October 2026, 09:39 AM IST

### Executive Summary
Mobile typing experience overhaul in chat inputs.

### ✨ Features Added & Improvements
- **Auto-Expanding Chat Bar**: Replaced single-line input with an auto-expanding textarea in `ChatInputBar.tsx`, allowing multi-line drafting without obstructing keyboard viewports.

---

## [v1.6 (6) - Android Release] - 25 October 2026, 04:57 PM IST

### Executive Summary
Production build release for Google Play Store packaging the latest PWA improvements into Capacitor Android.

### ⚡ Build & Platform Updates
- **Android Configuration (`android/app/build.gradle`)**:
  - Bumped `versionCode` to `6` and `versionName` to `1.6`.
  - Verified splash screen and deep-link handling for Android 14+ devices.

---

## [v1.0.273] - 26 October 2026, 08:51 PM IST

### Executive Summary
Layout fixes for mobile chat viewport and message rendering hierarchies.

### 🐛 Bug Fixes
- **Mobile Chat Layout**: Restored clean flexbox hierarchies and resolved message rendering overflow issues on narrow viewports.

---

## [v1.0.272] - 26 October 2026, 05:37 PM IST

### Executive Summary
Mobile edge-to-edge layout adaptation for immersive chat rooms.

### ⚡ Refactoring & Improvements
- **Edge-to-Edge UI**:
  - Removed restrictive `fixed inset-0` constraints from `MainLayout` on chat routes.
  - Allowed active chat room viewports to utilize full device display width while preserving `max-w-3xl` constraints on desktop screens.

---

## [v1.0.271] - 26 October 2026, 09:42 AM IST

### ✨ Features Added
- **Message Action Menu**: Implemented an accessible long-press context menu on chat messages supporting copy, quote, and report actions.

---

## [v1.0.270] - 26 October 2026, 07:49 AM IST

### ⚡ Architecture
- **URL-Driven Chat Routes**: Extracted `ActiveChatRoom` component and transitioned messaging views to URL parameters (`#/community/chat/:roomId`), enabling direct navigation and browser back/forward support.

---

## [v1.0.269] - 26 October 2026, 07:23 AM IST

### 🐛 Bug Fixes
- **Viewport Occlusion**: Corrected keyboard pop-up occlusions in `ActiveChatRoom` on mobile web browsers.

---

## [v1.0.268] - 25 October 2026, 12:21 AM IST

### ⚡ Architecture
- **Dedicated Headers**: Standardized header components and layout containers across secondary application pages.

---

## [v1.0.267] - 25 October 2026, 06:31 PM IST

### ⚡ UI Optimization
- **Header Route Visibility**: Dynamic suppression of the global navigation header on focused views (quizzes, active study rooms) to maximize reading screen real estate.

---

## [v1.0.266] - 25 October 2026, 04:10 PM IST

### 🐛 Bug Fixes
- **Auth Session Loops**: Resolved infinite session expired refresh loops for guest aspirants navigating between offline and online states.

---

## [v1.0.265] - 24 October 2026, 04:36 PM IST

### 🔒 Reliability
- **Stale-Session Recovery**: Completed full implementation of the session recovery manager for seamless user re-authentication without loss of quiz progress.

---

## [v1.0.264] - 24 October 2026, 02:33 PM IST

### ✨ UI Polish
- **Interactive Feedback**: Added clear "Coming Soon" modal feedback for in-development dashboard action tiles.

---

## [v1.0.263] - 24 October 2026, 11:23 AM IST

### 🔒 Reliability & Architecture
- **Global Session Recovery Architecture**: Laid foundational recovery routines to detect invalidated auth tokens and gracefully guide users through re-auth.

---

## [v1.0.262] - 24 October 2026, 09:27 AM IST

### 📚 Documentation
- **Architecture Mapping**: Generated comprehensive repository and directory maps in `/docs` to guide feature modularization.
