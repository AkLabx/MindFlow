# MindFlow Comprehensive Full-Stack Production Audit Report

> **Audited Target:** MindFlow Application (`MindFlow-main`)  
> **Target Production Milestone:** Production Launch Supporting 10,000 Daily Active Users (DAU)  
> **Evaluation Domains:** UI/UX & Constitution Compliance, Backend Architecture & Supabase Scalability, Security & Secret Governance, Legal & Privacy Compliance, and Google Play Store / Capacitor Publishing Standards  
> **Date:** November 10, 2026  
> **Lead Orchestrator:** Dispatch-Only Teamwork Orchestrator  
> **Specialist Domain Reports:**  
> - UI/UX & Constitution: `.agents/teamwork/explorer_uiux/report.md`  
> - Backend & 10k DAU Scalability: `.agents/teamwork/explorer_backend/report.md`  
> - Security Posture & Secrets: `.agents/teamwork/explorer_security/report.md`  
> - Legal & Privacy Regulations: `.agents/teamwork/explorer_legal/report.md`  
> - Google Play Store & Capacitor: `.agents/teamwork/explorer_playstore/report.md`  

---

## 1. Executive Summary & Production Readiness Verdict

MindFlow is a full-stack, AI-powered competitive examination preparation platform architected as an offline-first Progressive Web App (PWA) on GitHub Pages (`https://aklabx.github.io/MindFlow/`) and wrapped for Android native distribution via **Capacitor 8** (`@capacitor/android: ^8.3.1`). The platform utilizes **Supabase (PostgreSQL 17.6 in `ap-south-1`)** for cloud persistence, realtime synchronizations, and pgmq-backed asynchronous AI pipelines.

### Overall Audit Verdict: **NOT READY FOR PRODUCTION LAUNCH (Requires Remediation Across All 5 Domains)**

While MindFlow exhibits exceptional frontend speed, modern Capacitor 8 integration, strict zero-latency local caching via IndexedDB, and clean PII minimization in telemetry, the exhaustive audit identified **critical architectural bottlenecks, security vulnerabilities, statutory privacy infractions, and Google Play submission blockers** that must be resolved to reliably support 10,000 Daily Active Users (DAU):

1. **Backend & Scalability (FATAL BOTTLENECK AT 10k DAU):**  
   The current Supabase Micro compute tier provides only `max_connections = 60`, of which 22 connections are permanently allocated to system daemons (`realtime_rls`, `authenticator`, PostgREST, `pg_net`, `pg_cron`), leaving **only 38 usable connections**. Under 10,000 DAU traffic (peak CCU ~450, peak QPS ~180), unpooled Edge Functions (`enrich-questions` holding 5 direct connections) and unindexed queries (64 unindexed foreign keys, 1.52s execution latency on `get_filtered_quiz_metadata`) will cause immediate connection pool exhaustion (`FATAL: remaining connection slots are reserved`) and cascade into 504 Gateway Timeouts.
2. **Security & Data Integrity (CRITICAL VULNERABILITIES):**  
   - **Stored XSS in Core Quiz Displays:** `src/components/ui/MarkdownRenderer.tsx` uses `rehypeRaw` without `DOMPurify.sanitize()` across all student quiz questions, MCQ options, and explanation cards, allowing malicious HTML/JS execution.  
   - **Cross-Tenant Quiz Session Injection:** `create_quiz_session` RPC is `SECURITY DEFINER` and accepts `p_user_id` without verifying `auth.uid() = p_user_id`, allowing any authenticated user to inject arbitrary quiz records into other students' accounts.  
   - **Excessive Privileges:** 66 `SECURITY DEFINER` functions in `public` schema are directly executable by anonymous users (`anon`), and 99 by `authenticated`.  
   - **Unsafe Iframe Sandboxing:** `TextExporter.tsx` combines `allow-scripts` and `allow-same-origin`, destroying iframe isolation and exposing parent `localStorage` auth tokens.
3. **Legal Compliance & Privacy (CRITICAL STATUTORY LIABILITIES):**  
   - **Unlawful Erasure Block:** `DeleteAccountPage.tsx` strictly prevents account deletion if the user has not first downloaded their data (`if (!hasDownloadedData) return`), violating **GDPR Article 17** ("Right to Erasure") and **India's DPDP Act 2023 Section 12**.  
   - **Play Store Rejection Blocker:** The app lacks a publicly accessible, unauthenticated web URL for account deletion, violating Google Play's mandatory Data Safety deletion requirement.  
   - **Consent Bypass:** Google OAuth bypasses legal terms and age attestation, and zero consent timestamps or terms versions are recorded in the database, breaching **GDPR Article 7(1)** and **DPDP Act Section 6(1)** burden-of-proof requirements.  
   - **Storage Bleed:** `db.clearAllUserData()` is unawaited on manual logout and skipped on passive session expiry, leaving personal test records on shared mobile devices.
4. **Google Play Store Publishing (SUBMISSION BLOCKERS):**  
   - **Fatal Runtime Microphone Crash:** `AndroidManifest.xml` lacks `RECORD_AUDIO`. Native users opening the Gemini Voice Coach (`AITalkPage.tsx`) will crash or receive an Android WebView permission denial.  
   - **Static Version Codes:** `android/app/build.gradle` hardcodes `versionCode 6` and `versionName "1.6"` (detached from `package.json: 1.0.339`), causing Google Play Console to reject subsequent application updates.  
   - **Dangerous Merged Permissions:** Unused dependencies (`@capacitor/camera`, `@capacitor/filesystem`) merge deprecated `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` without `maxSdkVersion="32"`, triggering automated Play Console rejections.  
   - **Missing Deep Link Filters:** Manifest lacks `VIEW` intent-filters, breaking OAuth redirects, password resets, and `mindflow://` deep links on Android.
5. **UI/UX State & Constitution Compliance (UX BREAKS):**  
   - **Intro Curtain Mounting Inversion:** `<IntroEngine>` in `App.tsx:61` is gated behind `!bootstrapState.isReady`, forcing a `<SynapticLoader>` cold-start flash instead of parallel mounting.  
   - **Gesture-Bar Clipping:** Fixed-bottom action bars across 4 main config screens rely on an uncompiled, inert `pb-safe` CSS utility, clipping the "Start Quiz" CTA behind Android gesture navigation pills.  
   - **Hardware Back Disorientation:** `useHardwareBackButton.ts` checks obsolete routes (`/idioms`, `/synonyms`) instead of `/vocab/*` and omits subject topics hierarchy, mistakenly exiting to `/dashboard`.  
   - **Direct Cloud Mutations:** `SavedQuizzesList.tsx` updates Supabase directly and uses native `window.confirm()` / `alert()`, bypassing IndexedDB cache consistency.

---

## 2. Domain 1: UI/UX State & Constitution Compliance Audit

### 2.1 Compliance Against the 10 Constitution Invariants

| # | Constitution Principle | Status | Codebase Reality & Findings |
|---|---|:---:|---|
| 1 | **One Concept → One Control → One Location** | ⚠️ Partial | State ownership is well centralized for quiz engines, but quiz deletion is triggered in `SavedQuizzesList.tsx` using native `window.confirm()` alongside drawer dialogs. |
| 2 | **Context Preserved** | ⚠️ Partial | Downstream screens inherit active exam blueprints, but Android hardware back press drops topic context and jumps directly to dashboard. |
| 3 | **Logical Back Respected** | ❌ FAIL | `useHardwareBackButton.ts:118-124` matches obsolete path prefixes (`/idioms`, `/synonyms`, `/ows`) instead of registered `/vocab/*` routes. Pressing Android HW back from topic drills drops directly to `/dashboard`. |
| 4 | **Offline-First (0ms Local Render)** | ⚠️ Partial | Core quiz taking renders from IndexedDB (`db.saveQuiz`), but quiz deletion/renaming in `SavedQuizzesList.tsx:166` mutates Supabase directly (`supabase.from('saved_quizzes').update(...)`) without updating local IndexedDB. |
| 5 | **State Owner Defined** | ✅ PASS | Zustand stores (`quizStore`, `useAppConfigStore`, `useExamStore`) own explicit slices. |
| 6 | **Unidirectional Data Flow** | ✅ PASS | Zero two-way state synchronization loops observed between components. |
| 7 | **Performance Budget Respected** | ❌ FAIL | Section 8 SLA mandates Dashboard FCP $<1.0\text{s}$. Static 2000ms splash delay in `capacitor.config.ts` combined with cold-start `<SynapticLoader>` flash causes 3.5s+ time-to-interactive on mobile. |
| 8 | **Accessibility Reviewed (44x44px & WCAG 2.1 AA)** | ❌ FAIL | `ClaymorphismSwitch.css:20` sets switch height to `0.45em` (22.5px); `SubjectHeader.tsx:60-65` back button hit box is 36x36px. Both violate mandatory 44x44px touch targets. |
| 9 | **Telemetry Diagnostic Events Without PII** | ⚠️ Partial | Telemetry engine sanitizes payloads cleanly; however, core Constitution events (`empty_state_seen`, `recovery_action_clicked`, `offline_sync_completed`) are declared in `telemetryService.ts` but have 0 call sites across `src/`. |
| 10 | **Empty & Error States Implemented** | ✅ PASS | Clear recovery buttons and diagnostic error boundaries implemented across major drill interfaces. |

### 2.2 Navigation & Routing Architecture
- **HashRouter & OAuth Preservation:**  
  `src/App.tsx:69` wraps application routes in `<HashRouter>`, preserving subpath compatibility on GitHub Pages (`https://aklabx.github.io/MindFlow/#/`).  
  `src/hooks/useAppBootstrap.ts:55-87` securely intercepts OAuth hash tokens (`access_token`, `refresh_token`), executes `window.history.replaceState(...)` to scrub the URL bar, and calls `supabase.auth.setSession()`. Both invariants are fully intact.
- **Parallel Mounting Law Inversion (`App.tsx:61-68`):**  
  ```tsx
  if (!bootstrapState.isReady && bootstrapState.stage !== 'OFFLINE_INITIALIZATION') {
    return <div className="h-screen w-screen flex items-center justify-center bg-transparent"><SynapticLoader size="xl" /></div>;
  }
  return <ErrorBoundary><IntroEngine><HashRouter>...
  ```
  The intro engine cannot mount until `bootstrapState.isReady` resolves. Any network latency during `supabase.auth.getSession()` causes a jarring loader flash instead of mounting the intro curtain immediately.

### 2.3 Mobile Safe-Area & Gesture Invariants
- **Inert `pb-safe` Utility:**  
  `src/features/quiz/components/QuizConfig.tsx:851`, `IdiomsConfig.tsx:462`, `OWSConfig.tsx:490`, and `SynonymsConfig.tsx:446` apply `pb-safe`. However, `pb-safe` is completely absent from `src/index.css` and `tailwind.config.js`. On Android gesture navigation devices, fixed-bottom "Start Quiz" buttons overlap the system gesture navigation pill.
- **`<KeyboardAwareBottomBar>` Adoption:**  
  Only 3 files in `src/features/community/` currently implement `<KeyboardAwareBottomBar>`. The remaining 7 drill configuration views lack keyboard-aware offset handling.

---

## 3. Domain 2: Backend Architecture, Supabase Usage & 10,000 DAU Scalability

### 3.1 10,000 DAU Traffic & Capacity Modeling
- **Assumed Workload:** 10,000 active students per day; average session duration: 18 minutes; 40% of daily traffic concentrated during peak evening study hours (7:00 PM – 10:00 PM IST).
- **Concurrency Math:**
  $$\text{Daily Session Seconds} = 10,000 \times (18 \times 60) = 10,800,000\text{ seconds}$$
  $$\text{Peak Window Sessions} = 4,000\text{ sessions over } 3\text{ hours } (10,800\text{ seconds})$$
  $$\text{Average Peak Concurrent Users (CCU)} = \frac{4,000 \times 1,080\text{ s}}{10,800\text{ s}} \approx \mathbf{400\text{ CCU}}$$
  Allowing for peak burst factor ($1.25\times$), **Peak CCU = 500 concurrent sessions**.
- **Query Throughput (QPS):** Each active student taking quizzes, fetching questions, syncing bookmarks, and recording telemetry generates ~0.35–0.45 queries/sec.  
  $$\text{Peak QPS} = 450 \times 0.40 = \mathbf{180\text{ QPS}}$$

### 3.2 Connection Starvation & Little's Law Analysis
- **Postgres Engine Configuration (Supabase Micro Tier):**
  - `max_connections = 60`
  - `shared_buffers = 28672` (224 MB)
  - `statement_timeout = 120000` (2 minutes)
  - `pg_stat_activity` reveals **22 connections permanently reserved** by Supabase system daemons (`realtime_rls`, `realtime_connect`, `authenticator`, PostgREST pool, `postgres_exporter`, `pg_net`, `pg_cron`).
  - **Net Usable Database Connections = 38 slots.**
- **Application of Little's Law ($L = \lambda \times W$):**
  - Arrival Rate $\lambda = 180\text{ queries/sec}$.
  - System capacity: $L_{\max} = 38\text{ connections}$.
  - **Maximum tolerable mean query latency $W_{\max}$:**
    $$W_{\max} = \frac{L_{\max}}{\lambda} = \frac{38}{180} \approx \mathbf{0.211\text{ seconds (211 ms)}}$$
  - **Actual Latency Bottlenecks Identified:**
    1. `EXPLAIN ANALYZE SELECT * FROM public.get_filtered_quiz_metadata(NULL);` takes **1,527 ms (1.52s)**. In `questionService.ts:117-135`, client cold-start loops 11 times ($11 \times 1.52\text{s} = 16.7\text{ seconds}$).
    2. Vocabulary join queries in `get_filtered_synonym_metadata` take **419.95 ms** due to string casting (`ON u.word_id::TEXT = s.id::TEXT`).
    3. If query latency averages 400ms–1500ms, the required connections jump to $180 \times 0.400 = \mathbf{72}$ to $180 \times 1.5 = \mathbf{270\text{ connections}}$.
    4. **Conclusion:** $L \gg 38$. Without connection pooling and query optimization, the database will exhaust connection slots within 60 seconds of peak traffic.

### 3.3 Database Indexing Gaps & Advisor Linter Findings
- **Unindexed Foreign Keys (Lint 0001):** The Supabase Performance Advisor flagged **64 unindexed foreign keys**, including:
  - `questions.source_document_id`
  - `user_question_mastery.last_quiz_id`
  - `bridge_saved_idioms.user_id` and `word_id`
  - `bridge_saved_ows.user_id` and `word_id`
  - `bridge_saved_synonyms.user_id` and `word_id`
  - `chat_room_messages.room_id`
  - `post_comments.post_id`
  - `ai_request_logs.question_id`
  When child tables grow under 10k DAU, cascade checks and deletions on parent tables force sequential table scans.
- **Auth RLS InitPlan Warnings (Lint 0003):** **107 RLS policies** re-evaluate `auth.uid()` or `current_setting()` per row instead of wrapping them in scalar subqueries `(SELECT auth.uid())`, multiplying function call overhead by row counts.
- **Missing Telemetry Index:** `analytics_events` has millions of writes from telemetry without an index on `(event_name, created_at DESC)`.
- **Redundant Duplicate Indexes:** Duplicate indexes on `questions` and `bridge_saved_quiz_questions` consume space in `shared_buffers` (which is constrained to 224 MB).

### 3.4 RPC Execution & PL/pgSQL Cursor Loops
- **Cursor Loop in `record_question_interactions` (`20261103120000_create_centralized_mastery_engine.sql:124-208`):**
  Uses `FOR v_item IN SELECT * FROM jsonb_array_elements(p_interactions) LOOP` to execute sequential SELECT and UPDATE queries per question. Submitting a 50-question mock test generates 50+ sequential queries inside a single transaction, holding row locks and inflating lock contention under concurrency.
- **Split REST Inserts in `quizCreationService.ts:132-158`:**  
  Client performs two uncoordinated REST calls to `saved_quizzes` and `bridge_saved_quiz_questions`, bypassing the atomic `create_quiz_session` RPC and risking orphaned header records on network drops.

### 3.5 AI Pipeline & Edge Function Constraints
- **Direct Edge Function Connections:** Edge function `enrich-questions` (v41) connects directly to Postgres port 5432 using `npm:postgres` with `max: 5` connections. Concurrent worker invocations compete directly with user traffic for the 38 connection slots.
- **RPM Quota Reset Cron Misconfiguration:** In `cron.job` row 21, `reset_minute_ai_quotas()` is scheduled for `*/15 * * * *` (every 15 minutes) instead of every 1 minute (`* * * * *`). If the RPM limit is reached, AI generation remains blocked for up to 14 minutes.
- **Model Invariant Inversion:** `public.ai_task_config` row `question_taxonomy_v1` lists `model_chain = ["gemma-4-31b-it", "gemma-4-26b-a4b-it", "gemini-3.1-flash-lite"]`, violating the project invariant that `gemini-3.1-flash-lite` must be placed first.

---

## 4. Domain 3: Security Posture, Secret Handling & Identity Governance

### 4.1 Zero-Secret Compliance
- **Server Secret Isolation:** Live Gemini voice integration routes via `RUNTIME_CONFIG.LIVE_PROXY_URL` (`wss://mindflow-live-proxy.onrender.com`), passing user Supabase JWTs. Server proxy and Edge Functions hold private `GEMINI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` server-side. Zero private keys exist in client bundles.
- **Committed Plaintext Credentials:** Line 104 of tracked `.gitignore` contains plaintext testing credentials:  
  `# Auth credentials: email: mindflow@user.com , password: Test@1234`.
- **Hardcoded Public Client Keys:** `SUPABASE_URL` and `SUPABASE_ANON_KEY` are hardcoded in `src/lib/supabase.ts:5-6` rather than dynamically consumed from environment variables.

### 4.2 Authentication & Privilege Escalation Risks
- **Zero Guest Login:** Verified 100% compliant. No anonymous auth or guest bypass routes exist.
- **Hardcoded Transitional Admin Backdoor:**  
  `AuthContext.tsx:108-112`, `AuthPolicy.ts:37-39`, and `20261107000000_create_rbac_foundation.sql:52, 70, 147` check:
  `user.email === 'admin@mindflow.com'`.  
  If registration is open or email confirmation is bypassed, any registrant claiming `admin@mindflow.com` gains client-side super-admin and database `is_admin() = true`.

### 4.3 Database RPC Security & RLS Posture
- **Cross-Tenant Quiz Injection via `create_quiz_session` (`20260516200010_create_quiz_session_rpc_and_cleanup.sql:17-74`):**  
  Function is declared `SECURITY DEFINER` (bypassing table RLS) and accepts `p_user_id uuid` without checking `auth.uid() = p_user_id`. Any authenticated caller can inject arbitrary quiz sessions into any victim student's account.
- **Unrestricted Quiz Cloning (`clone_shared_quiz`):** Clones any quiz by ID without verifying if the quiz was marked as shared or public.
- **66 `SECURITY DEFINER` RPCs Callable by Anonymous Users (`anon`):**  
  Supabase Security Advisor flagged 66 functions callable via unauthenticated PostgREST `/rest/v1/rpc/...`, including `submit_quiz_session`, `bulk_queue_questions`, `reset_daily_ai_quotas`, `delete_scheduled_users`, and `restore_account`.
- **RLS Enabled with Zero Policies:** `public.ai_model_runtime` and `public.deleted_question_logs` have RLS enabled with 0 policies, blocking non-admin access.
- **Migration Drift on `export_user_data`:** Repository migration file `20250512000000_export_user_data_rpc.sql` uses `WHERE user_id = user_id` (tautological leak of all users' data). While patched in live DB to `v_user_id`, the repository file remains unpatched.

### 4.4 Client-Side & WebView Vulnerabilities
- **Stored XSS in `MarkdownRenderer.tsx:32-35`:**  
  Uses `rehypeRaw` with `react-markdown` without `rehype-sanitize` or `DOMPurify.sanitize(content)`. Because this component renders all question texts, MCQ choices, and explanations across 5 core quiz views, any malicious HTML/JS in questions executes directly in user browsers.
- **Defeated Iframe Sandbox in `TextExporter.tsx:173`:**  
  Uses `sandbox="allow-scripts allow-same-origin"`. W3C standards explicitly state this combination allows embedded iframes to escape the sandbox and access `window.parent.localStorage` where Supabase auth tokens reside.
- **Missing Content Security Policy:** `index.html` lacks CSP headers or `<meta http-equiv="Content-Security-Policy">`.
- **Insecure Android Backup:** `AndroidManifest.xml:5` declares `android:allowBackup="true"`, allowing physical extraction of IndexedDB databases and session tokens via `adb backup`.

---

## 5. Domain 4: Legal Compliance, Privacy Regulations & Data Governance

### 5.1 Regulatory Status (GDPR, India DPDP Act 2023, CCPA)
- **Unlawful Data Download Gate on Deletion (CRITICAL):**  
  `src/features/settings/components/DeleteAccountPage.tsx:65-72`:
  ```typescript
  if (!hasDownloadedData) {
      showToast({ variant: 'error', title: 'Data Not Downloaded', message: 'Please download your data before deleting your account.' });
      return;
  }
  ```
  Conditioning erasure on data export violates **GDPR Article 17** ("Right to Erasure") and **DPDP Act 2023 Section 12**, representing a prohibited deceptive design pattern ("dark pattern").
- **Missing Public Web Deletion URL (Play Store Blocker):**  
  `DeleteAccountPage` is locked behind `RouteAccessType.AUTHENTICATED`. Users who uninstalled the app have no public web mechanism to request account deletion, violating Google Play's mandatory Data Safety deletion requirement.
- **Google OAuth Consent & Age Attestation Bypass:**  
  `AuthPage.tsx:414-457` initiates Google OAuth immediately upon tap, completely bypassing terms agreement and age confirmation checkboxes.
- **Missing Consent Audit Trail:**  
  Neither `auth.users` user metadata nor `public.profiles` logs `terms_accepted_version`, `terms_accepted_at`, or age confirmation. Under **GDPR Article 7(1)** and **DPDP Act Section 6(1)**, the Data Fiduciary bears the burden of proof to demonstrate valid consent.
- **Inaccessible Post-Login Disclosures:** Neither `SettingsPage.tsx` nor `ProfilePage.tsx` contains links to Privacy Policy or Terms of Use.
- **Storage Bleed on Session Expiry:** `db.clearAllUserData()` is unawaited in `AuthContext.tsx:430` on manual logout and completely omitted from `onAuthStateChange` when sessions expire, while `custom_quiz_banks` is omitted from `clearAllUserData()`.
- **PII & AI Safety (COMPLIANT):** Telemetry engine (`telemetryService.ts`) and AI edge prompts (`ask-ai-tutor`, `chat-ai`) strictly strip all user PII, compliant with Constitution Section 11.

---

## 6. Domain 5: Google Play Store & Capacitor Publishing Standards

### 6.1 Android Manifest & Permissions
- **Fatal Missing Microphone Permission:** `AndroidManifest.xml` declares only `INTERNET`. Native users launching the Gemini Voice Coach (`AITalkPage.tsx`, `audio-recorder.ts`) encounter fatal permission denial in Android WebView. Must declare `<uses-permission android:name="android.permission.RECORD_AUDIO" />`.
- **Missing Pre-Permission Prominent Disclosure:** Google Play's Sensitive Permissions policy requires an in-context educational disclosure modal explaining voice data usage prior to invoking `getUserMedia()`.
- **Dead Dependency Permission Leakage:** Unused plugins `@capacitor/camera` and `@capacitor/filesystem` in `package.json` auto-merge `CAMERA`, `READ_EXTERNAL_STORAGE`, and `WRITE_EXTERNAL_STORAGE` into the production APK without `maxSdkVersion="32"`, triggering policy flags on Android 13+ (Target SDK 36).
- **Missing Deep Link Intent Filters:** `AndroidManifest.xml` lacks `android.intent.action.VIEW` intent-filters. Deep links (`mindflow://`), password reset emails, and OAuth redirects fail to route into the native app.

### 6.2 Versioning & Build Pipeline
- **Hardcoded Gradle Version Codes:** `android/app/build.gradle:19-20` hardcodes `versionCode 6` and `versionName "1.6"`, disconnected from `package.json` (`1.0.339`) and `APP_JOURNEY_LOG.md` (`v1.0.339`). Successive uploads with code 6 are automatically rejected by Google Play Console.
- **Unoptimized Release Builds:** `buildTypes.release` sets `minifyEnabled false` with empty Proguard rules, increasing APK size and exposing cleartext bytecode.

### 6.3 Launch Sequence & Android 15 Edge-to-Edge
- **2000ms Double Splash Freeze:** `capacitor.config.ts:14-15` enforces `launchShowDuration: 2000`, while `SplashScreen.hide()` is never called in web code, creating a 2-second frozen screen before `IntroEngine` starts.
- **Android 15 Top Safe Area Clipping:** Target SDK 36 enforces edge-to-edge transparent system bars on Android 15. The sticky header in `src/layouts/MainLayout.tsx:212` lacks `pt-[env(safe-area-inset-top)]`, causing status bar icons and camera notches to overlap header titles.
- **Missing `postSplashScreenTheme`:** `styles.xml:24-26` omits `postSplashScreenTheme`, logging theme assertion warnings during activity transitions.

---

## 7. Comparative Audit Synthesis Matrix

| Domain | Critical Blockers Identified | Affected Files & Subsystems | Remediation Severity |
|---|---|---|:---:|
| **UI/UX State & Constitution** | Intro curtain cold-start loader flash; uncompiled `pb-safe` causing bottom-bar clipping; stale hardware back paths; direct Supabase mutations in quiz cards; 22.5px touch targets; phantom telemetry events. | `src/App.tsx`, `QuizConfig.tsx`, `useHardwareBackButton.ts`, `SavedQuizzesList.tsx`, `ClaymorphismSwitch.css`, `telemetryService.ts` | **HIGH** |
| **Backend & 10k DAU Scalability** | Only 38 usable connections; 1.52s query latency on `get_filtered_quiz_metadata`; 64 unindexed FKs; 107 RLS InitPlan warnings; N+1 cursor loop in mastery engine; 15-min AI quota reset cron; Edge Functions using direct DB connections. | `supabase/migrations/`, `questionService.ts`, `quizCreationService.ts`, `cron.job`, `enrich-questions` Edge Function | **CRITICAL** |
| **Security & Secrets** | Stored XSS in `MarkdownRenderer.tsx` via `rehypeRaw`; cross-tenant quiz injection in `create_quiz_session`; 66 `SECURITY DEFINER` RPCs open to `anon`; unsafe iframe sandbox in `TextExporter.tsx`; missing CSP; `android:allowBackup="true"`. | `src/components/ui/MarkdownRenderer.tsx`, `TextExporter.tsx`, `index.html`, `20260516200010_create_quiz_session_rpc_and_cleanup.sql`, `AndroidManifest.xml` | **CRITICAL** |
| **Legal & Privacy** | Mandatory data export gating account deletion; missing public web deletion URL; Google OAuth consent bypass; missing consent audit trail in DB; unawaited and passive IndexedDB storage bleed. | `src/features/settings/components/DeleteAccountPage.tsx`, `src/routes/AppRoutes.tsx`, `AuthPage.tsx`, `AuthContext.tsx`, `src/lib/db.ts` | **CRITICAL** |
| **Google Play & Capacitor** | Missing `RECORD_AUDIO` manifest permission; missing prominent microphone disclosure; hardcoded `versionCode 6`; dead camera/storage plugins; missing `VIEW` deep link filters; 2000ms static splash delay. | `android/app/src/main/AndroidManifest.xml`, `android/app/build.gradle`, `package.json`, `capacitor.config.ts`, `AITalkPage.tsx`, `MainLayout.tsx` | **CRITICAL** |

---

## 8. Verification & Attestation

Every finding in this report has been verified through direct code inspection, Supabase PostgreSQL catalog queries, Supabase Security and Performance Advisor diagnostics, and Android Gradle manifest analysis. The complete findings provide the empirical foundation for the 10-Phase Production Uplift Roadmap.
