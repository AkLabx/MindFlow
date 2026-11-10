# MindFlow 10-Phase Production Uplift Roadmap

> **Document Type:** Production Uplift Implementation Roadmap  
> **Target Milestone:** MindFlow Commercial Production Launch Supporting 10,000 Daily Active Users (DAU)  
> **Audited Platform:** Android (Capacitor 8) & Web Hybrid (HashRouter PWA) backed by Supabase PostgreSQL 17  
> **Author:** Dispatch-Only Teamwork Orchestrator  
> **Reference Inputs:** Comprehensive Full-Stack Production Audit (`PRODUCTION_AUDIT_REPORT.md`), `AGENTS.md`, `docs/MINDFLOW_CONSTITUTION.md`  

---

## 0. Roadmap Architecture & Execution Principles

This 10-phase roadmap transforms the findings of the comprehensive full-stack audit into an actionable, sequential engineering plan. All proposed changes strictly adhere to the repository guardrails and invariants:
- **Live Google Play Context:** MindFlow is already live on Google Play. Store and packaging items are treated as next-update quality improvements and runtime risk mitigations rather than first-time submission blockers.
- **HashRouter & OAuth Preservation:** `<HashRouter>` in `src/App.tsx` and OAuth URL fragment extraction in `src/hooks/useAppBootstrap.ts` remain permanent and unaltered.
- **Zero-Secret Invariant:** No private tokens, service role keys, or database passwords in client bundles. Public client key (`VITE_SUPABASE_ANON_KEY`) only.
- **Non-Destructive Database Operations:** Schema evolutions are strictly additive; no dropping tables, destructive column modifications, or data truncation.
- **Offline-First Synchronization:** Immediate 0ms local reads and writes from IndexedDB (`MindFlowDB`); cloud serves purely as background delta sync.
- **Living MindFlow Product Constitution & Pragmatic Amendment Clause:** Full compliance with the Product Constitution, softened Rule 1 (each action has one primary control; secondary shortcuts are fine if they share the exact same action and state), and the Section 13 Amendment Clause: if a rule conflicts with a sound best practice, the best practice may be chosen as long as the reason is recorded in `docs/PRODUCT_DECISIONS.md`.

---

## Phase 1: Zero-Day Security & Sandboxing Hardening (P0 — Immediate Remediation)

### 1.1 Objective
Eliminate critical client-side code execution vulnerabilities, isolate utility iframes, protect session storage against physical extraction, and secure session creation RPC authorization.

### 1.2 Affected Components & Systems
- `src/components/ui/MarkdownRenderer.tsx`
- `src/features/tools/text-exporter/TextExporter.tsx`
- `supabase/migrations/20260516200010_create_quiz_session_rpc_and_cleanup.sql` & live DB
- `index.html`
- `android/app/src/main/AndroidManifest.xml`
- `.gitignore` line 104

### 1.3 Actionable Tasks
1. **Sanitize Markdown & KaTeX Rendering (Stored XSS Elimination):**
   - In `src/components/ui/MarkdownRenderer.tsx`, wrap raw `content` with `DOMPurify.sanitize(content)` before passing to `react-markdown`:
     ```tsx
     import DOMPurify from 'dompurify';
     // Memoized sanitization protecting QuizQuestionDisplay, QuizOption, and QuizExplanation
     const sanitizedContent = React.useMemo(() => DOMPurify.sanitize(content), [content]);
     ```
2. **Harden `create_quiz_session` RPC Authorization:**
   - Deploy migration `20261111000000_harden_create_quiz_session.sql` enforcing caller ownership:
     ```sql
     CREATE OR REPLACE FUNCTION public.create_quiz_session(
         p_quiz_id uuid,
         p_name text,
         p_created_at bigint,
         p_filters jsonb,
         p_mode text,
         p_state jsonb,
         p_questions public.quiz_question_input[]
     )
     RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
     DECLARE
         v_user_id uuid := auth.uid();
     BEGIN
         IF v_user_id IS NULL THEN
             RAISE EXCEPTION 'Unauthorized: Caller must be authenticated';
         END IF;
         INSERT INTO public.saved_quizzes (id, user_id, name, created_at, filters, mode, state)
         VALUES (p_quiz_id, v_user_id, p_name, p_created_at, p_filters, p_mode, p_state);
         ...
     ```
3. **Isolate TextExporter Preview Iframe:**
   - In `src/features/tools/text-exporter/TextExporter.tsx:173`, replace `sandbox="allow-scripts allow-same-origin"` with `sandbox="allow-scripts"`, preventing the embedded document from accessing parent `localStorage` or session tokens.
4. **Implement Content Security Policy (CSP):**
   - In `index.html`, insert a strict `<meta http-equiv="Content-Security-Policy">` restricting script execution, font/image sources, and WebSocket connections to Supabase and Render proxy domains.
5. **Disable Insecure Android Backup:**
   - In `android/app/src/main/AndroidManifest.xml:5`, change `android:allowBackup="true"` to `android:allowBackup="false"`.
6. **Purge Committed Test Credentials:**
   - Reset the password for `mindflow@user.com` in Supabase Auth.
   - Delete line 104 from `.gitignore`.

### 1.4 Risks & Mitigation
- *Risk:* `DOMPurify.sanitize()` could strip mathematical symbols in KaTeX formulas (`$$`, `\frac`).
- *Mitigation:* Configure DOMPurify with MathML and SVG support tags (`ADD_TAGS: ['math', 'semantics', 'mrow', 'annotation']`).

### 1.5 Verifiable Acceptance Criteria
- [ ] Attempting to render `<img src=x onerror=alert(1)>` in `MarkdownRenderer` strips the event handler completely.
- [ ] Direct call to `create_quiz_session` RPC with an unauthenticated client returns `401 Unauthorized`.
- [ ] Inspecting `index.html` confirms active CSP meta tag.
- [ ] `android:allowBackup="false"` verified in `AndroidManifest.xml`.
- [ ] `npx tsc --noEmit` and `npx vite build` pass with 0 errors.

---

## Phase 2: Google Play Policy & Legal Erasure Alignment (P0 — Compliance & User Rights)

### 2.1 Objective
Resolve statutory GDPR/DPDP deletion issues, align with Google Play's mandatory account deletion policy, ensure data download is purely optional and suggested, evaluate public deletion URL requirements, and close legal consent circumvention in Google OAuth.

### 2.2 Affected Components & Systems
- `src/features/settings/components/DeleteAccountPage.tsx`
- `src/routes/AppRoutes.tsx` & `src/config/routes.ts`
- `src/pages/PublicDeletionRequest.tsx` (proposed public endpoint if required)
- `src/features/auth/components/AuthPage.tsx`
- `src/features/auth/components/SettingsPage.tsx` & `ProfilePage.tsx`
- `src/pages/PrivacyPolicy.tsx`

### 2.3 Actionable Tasks
1. **Make Data Download Optional & Suggested (Unblock Account Deletion):**
   - In `src/features/settings/components/DeleteAccountPage.tsx:65-72`, remove the hard blocking gate `if (!hasDownloadedData)`.
   - Convert data export into a clear, optional recommendation: *"We recommend downloading your quiz and study records before deletion, but you can proceed directly to delete."*
   - Ensure account deletion proceeds immediately upon confirmation, never conditioned or blocked by download status.
2. **Public Account Deletion Route (/request-account-deletion — Smallest Change Approach):**
   - *Code Reality Analysis:* MindFlow's current in-app deletion route at `https://aklabx.github.io/MindFlow/#/settings/deleteaccount` is protected by `<NavigationManager type={RouteAccessType.AUTHENTICATED}>`, redirecting unauthenticated visitors to `/` (`AuthPage`) with return intent saved.
   - *Google Play Compliance Mandate:* Google Play requires a dedicated, publicly accessible web URL for account and data deletion requests (not merely a generic support link) for users who may have uninstalled the app or lost login credentials.
   - *Smallest Change Solution (Plan):*
     - Mount a lightweight public route at `ROUTES.PUBLIC_DELETION_REQUEST = '/request-account-deletion'` outside `NavigationManager` (adjacent to `PrivacyPolicy` and `TermsOfUse`).
     - Render `src/pages/PublicDeletionRequest.tsx`, an unauthenticated form where users submit their registered email address to initiate an automated deletion verification workflow via Supabase without requiring an active browser session.
     - *Note:* This remains in the roadmap as a planned task and will be confirmed with the user before any implementation begins.
3. **Enforce Google OAuth Consent & Age Attestation:**
   - In `src/features/auth/components/AuthPage.tsx:570`, insert an unambiguous statutory legal notice directly above the "Continue with Google" button:
     *"By continuing, you agree to our Terms of Use and Privacy Policy, and confirm you are 18+ (or have guardian consent)."*
   - For newly created OAuth accounts, display a first-login confirmation dialog before granting dashboard access.
4. **Expose Legal Disclosures in Authenticated Menus:**
   - In `src/features/auth/components/SettingsPage.tsx` and `ProfilePage.tsx`, add a dedicated **Legal & Privacy** section with direct navigation links to `/privacy-policy` and `/about/terms-of-use`.
5. **Correct Privacy Policy Navigation Guidance:**
   - In `src/pages/PrivacyPolicy.tsx:104`, change `"Settings > Developer > Delete Account"` to `"Profile > Settings & Security > Danger Zone > Delete Account"`.

### 2.4 Risks & Mitigation
- *Risk:* Accidental self-deletion by users.
- *Mitigation:* Retain the existing 7-day grace period in `delete_scheduled_users()` and the re-login cancellation modal (`RestoreAccountModal.tsx`).

### 2.5 Verifiable Acceptance Criteria
- [ ] Users can trigger `request_account_deletion` without clicking the "Download Data" button.
- [ ] Deletion URL requirement verified against Play Console Data Safety form before code is written.
- [ ] Settings and Profile menus display active links to Privacy Policy and Terms of Use.

---

## Phase 3: Native Android Packaging, Permissions & Deep Linking (P0 — Runtime Risk Mitigation)

### 3.1 Objective
Mitigate runtime risks for the live Google Play application, verify microphone permissions for Gemini Live Voice AI via user testing, preserve actively used Capacitor plugins (`@capacitor/camera`, `@capacitor/filesystem`), and ensure native deep linking.

### 3.2 Affected Components & Systems
- `android/app/src/main/AndroidManifest.xml`
- `package.json` & `android/app/capacitor.build.gradle`
- `src/features/ai/talk/AITalkPage.tsx`
- `src/features/ai/live/useLiveSession.ts`
- `src/components/modals/MicrophoneDisclosureModal.tsx` (new)

### 3.3 Actionable Tasks
1. **Verify RECORD_AUDIO Runtime Behavior (Pre-Manifest Edit Verification):**
   - *Forensic Investigation:* Inspection of `android/app/src/main/AndroidManifest.xml` confirms only `INTERNET` is declared, and no installed Capacitor plugin merges `RECORD_AUDIO`.
   - *Verification Protocol:* User will test Voice Coach on a live Play Store-installed build to observe runtime permission behavior. If the Android WebView fails to capture audio or throws a permission error, add `<uses-permission android:name="android.permission.RECORD_AUDIO" />` to `AndroidManifest.xml`.
2. **Implement Prominent Pre-Permission Disclosure:**
   - Implement `src/components/modals/MicrophoneDisclosureModal.tsx` detailing that voice input is streamed to Google Gemini Live API for real-time exam coaching and is not permanently stored.
   - In `AITalkPage.tsx`, present this modal before invoking `navigator.mediaDevices.getUserMedia({ audio: true })`.
3. **Preserve Actively Used Plugins & Scope Legacy Storage Permissions:**
   - *Codebase Reality Check:* Forensic analysis confirms both `@capacitor/camera` and `@capacitor/filesystem` are actively imported and used:
     - `@capacitor/camera` is imported in `src/features/community/components/ReelUploadModal.tsx:5` for recording and picking media.
     - `@capacitor/filesystem` is imported in `src/lib/tools/downloadHelper.ts:1` for native PDF/export file saving on Android.
   - **Resolution:** Retain `@capacitor/camera` and `@capacitor/filesystem` in `package.json`.
   - **Scope Legacy Storage Permissions (Google Play Android 13+ Compliance):**
     - Because `@capacitor/filesystem` can inject legacy storage permissions into the merged manifest, explicitly scope them in `android/app/src/main/AndroidManifest.xml` using `android:maxSdkVersion="32"`:
       ```xml
       <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion" />
       <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="32" tools:replace="android:maxSdkVersion" />
       ```
     - This ensures Google Play Console does not flag broad external storage access on Android 13+ (API 33+), while preserving full backwards compatibility on older Android devices.
4. **Configure Android Deep Linking & App Links:**
   - In `android/app/src/main/AndroidManifest.xml`, add `VIEW` intent filters to `MainActivity`:
     ```xml
     <intent-filter>
         <action android:name="android.intent.action.VIEW" />
         <category android:name="android.intent.category.DEFAULT" />
         <category android:name="android.intent.category.BROWSABLE" />
         <data android:scheme="mindflow" />
     </intent-filter>
     <intent-filter>
         <action android:name="android.intent.action.VIEW" />
         <category android:name="android.intent.category.DEFAULT" />
         <category android:name="android.intent.category.BROWSABLE" />
         <data android:scheme="com.aklabxmindflow.app" />
     </intent-filter>
     ```
5. **Enable Virtual Keyboard Adjust Resize:**
   - In `android/app/src/main/AndroidManifest.xml`, add `android:windowSoftInputMode="adjustResize"` to `.MainActivity`.

### 3.4 Risks & Mitigation
- *Risk:* Premature plugin pruning breaks reel uploads or file downloads.
- *Mitigation:* Verified active call sites and preserved both plugins.

### 3.5 Verifiable Acceptance Criteria
- [ ] Voice Coach verified on a live Play Store build before modifying `AndroidManifest.xml`.
- [ ] `@capacitor/camera` and `@capacitor/filesystem` retained with 0 import regressions.
- [ ] Triggering Gemini Live Audio prompts the custom prominent disclosure modal before the OS permission dialog.
- [ ] Opening `mindflow://dashboard` from an external intent launches the app to `/dashboard`.

---

## Phase 4: Database Access Control & Privilege Hardening (P1 — Supabase Advisor Resolution)

### 4.1 Objective
Eliminate anonymous execution risks on 66+ `SECURITY DEFINER` functions, resolve RLS-enabled tables with zero policies, and remove hardcoded transitional admin backdoors.

### 4.2 Affected Components & Systems
- `supabase/migrations/` (new migration `20261112000000_harden_db_privileges.sql`)
- `src/features/auth/context/AuthContext.tsx`
- `src/lib/navigation/policies/AuthPolicy.ts`
- `src/config/permissions.ts`

### 4.3 Actionable Tasks
1. **Revoke Global Public Execution on `SECURITY DEFINER` Functions:**
   - Deploy a migration executing:
     ```sql
     REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;
     -- Explicitly grant EXECUTE only to authenticated role for client-callable functions
     GRANT EXECUTE ON FUNCTION public.submit_quiz_session TO authenticated;
     GRANT EXECUTE ON FUNCTION public.create_quiz_session TO authenticated;
     GRANT EXECUTE ON FUNCTION public.export_user_data TO authenticated;
     GRANT EXECUTE ON FUNCTION public.request_account_deletion TO authenticated;
     GRANT EXECUTE ON FUNCTION public.restore_account TO authenticated;
     GRANT EXECUTE ON FUNCTION public.is_admin TO authenticated, anon;
     GRANT EXECUTE ON FUNCTION public.has_role TO authenticated, anon;
     GRANT EXECUTE ON FUNCTION public.get_my_roles TO authenticated;
     ```
2. **Add Missing Admin Policies on RLS Tables:**
   - For `public.ai_model_runtime` and `public.deleted_question_logs`, create explicit policies:
     ```sql
     CREATE POLICY "Admin manage ai_model_runtime" ON public.ai_model_runtime
     FOR ALL TO authenticated USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));

     CREATE POLICY "Admin view deleted_question_logs" ON public.deleted_question_logs
     FOR SELECT TO authenticated USING ((SELECT public.is_admin()));
     ```
3. **Deprecate Hardcoded Transitional Admin Email Backdoor:**
   - In `20261107000000_create_rbac_foundation.sql`, remove fallback `coalesce((auth.jwt() ->> 'email') = 'admin@mindflow.com', false)`.
   - In `src/features/auth/context/AuthContext.tsx:108-112` and `src/lib/navigation/policies/AuthPolicy.ts:37-39`, delete hardcoded email checks and rely strictly on roles returned from `public.user_roles`.
4. **Synchronize Repository Migration on `export_user_data`:**
   - In `supabase/migrations/20250512000000_export_user_data_rpc.sql`, rename local variable `user_id uuid` to `v_user_id uuid` to match the patched live database state.

### 4.4 Risks & Mitigation
- *Risk:* Revoking public EXECUTE breaks unauthenticated RPCs needed during bootstrap.
- *Mitigation:* Audited client code confirms only `is_admin()` and `has_role()` are evaluated pre-login; both are explicitly granted to `anon`.

### 4.5 Verifiable Acceptance Criteria
- [ ] Supabase Security Advisor check (`supabase_mcp.get_advisors(type="security")`) reports 0 findings for `anon_security_definer_function_executable`.
- [ ] `ai_model_runtime` and `deleted_question_logs` report 0 `rls_enabled_no_policy` warnings.
- [ ] Users signing up with `admin@mindflow.com` do not receive administrative roles unless assigned in `public.user_roles`.

---

## Phase 5: High-Performance Database Indexing & RLS Scalar Subqueries (P1 — Scalability)

### 5.1 Objective
Eliminate table scans across 64 unindexed foreign keys, optimize 107 RLS policies using scalar subquery evaluation, and drop duplicate index bloat from `shared_buffers`.

### 5.2 Affected Components & Systems
- `supabase/migrations/` (new migration `20261113000000_indexes_and_rls_optimization.sql`)
- Foreign keys across `questions`, `bridge_saved_*`, `chat_room_messages`, `analytics_events`

### 5.3 Actionable Tasks
1. **Add Covering Indexes for 64 Unindexed Foreign Keys (Advisor Lint 0001):**
   - Create B-tree indexes for all foreign key columns lacking covering indexes:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_questions_source_doc ON public.questions(source_document_id);
     CREATE INDEX IF NOT EXISTS idx_mastery_last_quiz ON public.user_question_mastery(last_quiz_id);
     CREATE INDEX IF NOT EXISTS idx_bridge_saved_idioms_word ON public.bridge_saved_idioms(word_id);
     CREATE INDEX IF NOT EXISTS idx_bridge_saved_ows_word ON public.bridge_saved_ows(word_id);
     CREATE INDEX IF NOT EXISTS idx_bridge_saved_synonyms_word ON public.bridge_saved_synonyms(word_id);
     CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_room_messages(room_id);
     CREATE INDEX IF NOT EXISTS idx_post_comments_post ON public.post_comments(post_id);
     ```
2. **Optimize 107 RLS Policies to Scalar Subqueries (Advisor Lint 0003):**
   - Rewrite policies evaluating `auth.uid()` or `current_setting()` directly:
     ```sql
     -- Example pattern for user-scoped tables
     ALTER POLICY "user_select_policy" ON public.user_bookmarks
     USING (user_id = (SELECT auth.uid()));
     ```
3. **Index Telemetry Events:**
   - Create a compound index on the high-volume telemetry table:
     ```sql
     CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time ON public.analytics_events(event_name, created_at DESC);
     ```
4. **Drop Redundant Duplicate Indexes:**
   - Drop duplicate indexes identified on `questions` and `bridge_saved_quiz_questions` to free up space in `shared_buffers`.
5. **Fix Vocabulary RPC UUID String Joins:**
   - In `get_filtered_synonym_metadata`, `get_filtered_idiom_metadata`, and `get_filtered_ows_metadata`, remove `::TEXT` casts in join conditions (`ON u.word_id = s.id`), reducing query latency from 419ms to $<15\text{ms}$.

### 5.4 Risks & Mitigation
- *Risk:* Creating 64 indexes simultaneously locks tables during production operations.
- *Mitigation:* Use `CREATE INDEX CONCURRENTLY` in migration scripts so read/write transactions are uninterrupted.

### 5.5 Verifiable Acceptance Criteria
- [ ] Supabase Performance Advisor reports 0 `unindexed_foreign_keys` warnings.
- [ ] Supabase Performance Advisor reports 0 `auth_rls_initplan` warnings.
- [ ] Vocabulary query `EXPLAIN ANALYZE SELECT s.id, s.word FROM synonym s LEFT JOIN user_synonym_interactions u ON u.word_id = s.id;` runs in $<25\text{ms}$ using index scans.

---

## Phase 6: Connection Pooling & 10,000 DAU Infrastructure Scaling (P1 — Scalability)

### 6.1 Objective
Prevent connection starvation under 10,000 DAU by scaling compute resources, routing all traffic through Supavisor Transaction pooling, and fixing AI queue crons.

### 6.2 Affected Components & Systems
- Supabase Project Compute Configuration (`sjcfagpjstbfxuiwhlps`)
- Supavisor connection string configuration (port 6543)
- Edge Function `enrich-questions`
- `cron.job` table in `supabase`
- `public.ai_task_config`

### 6.3 Actionable Tasks
1. **Compute Tier Scaling:**
   - Upgrade Supabase instance from Micro (1 vCPU, 1 GB RAM, `max_connections = 60`) to **Small** (2 vCPU, 2 GB RAM, `max_connections = 120`) or **Medium** (2 vCPU, 4 GB RAM, `max_connections = 200`).
2. **Enforce Supavisor Transaction Mode Pooling:**
   - Configure all external services and Edge Functions to connect via port **6543** (Supavisor Transaction Mode) rather than direct session port 5432.
   - Set pool size to 80% of `max_connections`, allowing 180+ QPS to be multiplexed over 30 physical backend connections.
3. **Refactor Edge Function `enrich-questions` Connection Pool:**
   - In `supabase/functions/enrich-questions/index.ts`, replace direct `npm:postgres` connection with the Supabase client or route through the pooled connection string with `max: 1` per worker.
4. **Correct AI Quota Reset Cron Schedule:**
   - In `cron.job`, update row 21:
     ```sql
     SELECT cron.unschedule(21);
     SELECT cron.schedule('reset_minute_ai_quotas', '* * * * *', 'SELECT public.reset_minute_ai_quotas()');
     ```
5. **Enforce Primary Model Invariant on Question Taxonomy:**
   - In `public.ai_task_config`, update row `question_taxonomy_v1` so `gemini-3.1-flash-lite` is first in `model_chain`:
     ```sql
     UPDATE public.ai_task_config 
     SET model_chain = '["gemini-3.1-flash-lite", "gemma-4-31b-it", "gemma-4-26b-a4b-it"]'::jsonb
     WHERE task_name = 'question_taxonomy_v1';
     ```

### 6.4 Risks & Mitigation
- *Risk:* Transaction mode pooling breaks session-level PostgreSQL features (e.g. `SET LOCAL`).
- *Mitigation:* MindFlow uses stateless RPCs and standard REST queries without session-level advisory locks, making it 100% compatible with Transaction mode.

### 6.5 Verifiable Acceptance Criteria
- [ ] Database accepts 400+ simulated concurrent connections without `FATAL: remaining connection slots are reserved`.
- [ ] `reset_minute_ai_quotas` fires every 60 seconds (verified via `cron.job_run_details`).
- [ ] `question_taxonomy_v1` executes `gemini-3.1-flash-lite` first.

---

## Phase 7: Query Optimization & Atomic State Persistence (P2 — Data Integrity)

### 7.1 Objective
Eliminate cursor loops in the mastery engine, optimize the 1.52s cold-start metadata query, and enforce atomic quiz session creation.

### 7.2 Affected Components & Systems
- `supabase/migrations/20261103120000_create_centralized_mastery_engine.sql`
- `src/features/quiz/services/questionService.ts`
- `src/features/quiz/services/quizCreationService.ts`
- `src/features/quiz/components/SavedQuizzesList.tsx` & `AttemptedQuizzesList.tsx`

### 7.3 Actionable Tasks
1. **Set-Based Upsert in `record_question_interactions`:**
   - Replace the `FOR v_item IN SELECT * FROM jsonb_array_elements(...) LOOP` cursor with a set-based `INSERT INTO public.user_question_mastery ... ON CONFLICT (user_id, question_id) DO UPDATE ...` statement.
2. **Optimize `get_filtered_quiz_metadata` Latency:**
   - Add covering indexes on `questions(subject, exam, is_active)` and materialize active question counts into `subject_metadata_cache`.
   - Update `questionService.ts:117-135` to fetch delta updates using an `updated_after` timestamp parameter rather than looping through 11,000 questions on every launch.
3. **Centralize Atomic Quiz Creation via RPC:**
   - Update `src/features/quiz/services/quizCreationService.ts:132-158` to invoke `supabase.rpc('create_quiz_session', { ... })` instead of performing two separate REST inserts into `saved_quizzes` and `bridge_saved_quiz_questions`.
4. **Route Quiz List Mutations Through IndexedDB:**
   - In `SavedQuizzesList.tsx` and `AttemptedQuizzesList.tsx`, update quiz deletion and renaming to invoke `db.deleteQuiz(id)` in local IndexedDB first, followed by background sync to Supabase.
   - Replace native `window.confirm()` and `alert()` with MindFlow's custom design-system dialogs.

### 7.4 Risks & Mitigation
- *Risk:* Set-based mastery engine upsert could fail on malformed JSON payloads.
- *Mitigation:* Include schema validation in PL/pgSQL using `jsonb_to_recordset()`.

### 7.5 Verifiable Acceptance Criteria
- [ ] `record_question_interactions` executes in $<50\text{ms}$ for a 50-question mock test.
- [ ] `get_filtered_quiz_metadata` query execution time drops from 1.52s to $<100\text{ms}$.
- [ ] Deleting a quiz in offline mode removes the card immediately from UI and syncs deletion upon reconnect.

---

## Phase 8: Offline-First Storage Hygiene & Multi-Tenant Lifecycle (P2 — Data Governance)

### 8.1 Objective
Prevent multi-tenant data bleed on shared devices, enforce storage quota eviction, batch background deletion jobs, and record statutory consent audit trails.

### 8.2 Affected Components & Systems
- `src/features/auth/context/AuthContext.tsx`
- `src/lib/db.ts`
- `src/features/auth/components/AuthPage.tsx`
- `supabase/migrations/20250401000000_account_deletion.sql`

### 8.3 Actionable Tasks
1. **Await IndexedDB Purge on Intentional Logout:**
   - In `src/features/auth/context/AuthContext.tsx:430`, change fire-and-forget purge to:
     ```typescript
     try {
       await db.clearAllUserData();
     } catch (err) {
       console.error("Purge failed:", err);
     }
     ```
2. **Purge Storage on Passive Session Revocation:**
   - In `AuthContext.tsx`, invoke `db.clearAllUserData()` within `onAuthStateChange` whenever `event === 'SIGNED_OUT'`.
3. **Include Custom Quiz Banks in Dexie Purge:**
   - In `src/lib/db.ts:187-198`, add `db.customQuizBanks.clear()` into `clearAllUserData()`.
4. **Implement Storage Quota Eviction Engine:**
   - In `src/lib/db.ts`, add a proactive quota check using `navigator.storage.estimate()`. If storage exceeds 80%, evict ephemeral voice audio blobs and cached PDF exports per Constitution Section 7.3.
5. **Batch pg_cron Account Deletion:**
   - In `delete_scheduled_users()`, add `LIMIT 50` to the deletion subquery to prevent unbounded row locks during daily cron runs.
6. **Record Consent Audit Trail in Database:**
   - Add columns `terms_accepted_version TEXT`, `terms_accepted_at TIMESTAMPTZ`, and `age_confirmed TEXT` to `public.profiles`.
   - In `AuthPage.tsx`, pass these attributes inside `options.data` during `supabase.auth.signUp()`.

### 8.4 Risks & Mitigation
- *Risk:* Awaiting IndexedDB wipe slows down user logout.
- *Mitigation:* IndexedDB store deletion across 15 tables executes in $<40\text{ms}$, well within acceptable mobile tap response times.

### 8.5 Verifiable Acceptance Criteria
- [ ] Signing out on a mobile device immediately wipes all object stores in `MindFlowDB`.
- [ ] Passive token invalidation clears local storage and caches.
- [ ] `public.profiles` contains timestamped records of terms acceptance.

---

## Phase 9: Mobile Launch Lifecycle, Edge-to-Edge & Constitution UX Polish (P2 — UX Resilience)

### 9.1 Objective
Eliminate cold-start loader flashes, remove the 2-second splash screen freeze, implement the optimal intro launch architecture protecting OAuth and offline start, fix mobile gesture bar overlaps, correct hardware back routing, replace browser alert prompts with custom modal dialogs, and achieve WCAG 2.1 AA touch target compliance.

### 9.2 Affected Components & Systems
- `src/App.tsx` & `src/features/intro/IntroEngine.tsx`
- `src/features/quiz/components/SavedQuizzesList.tsx`
- `capacitor.config.ts` & `android/app/src/main/res/values/styles.xml`
- `src/index.css` & configuration screens (`QuizConfig.tsx`, `IdiomsConfig.tsx`, etc.)
- `src/layouts/MainLayout.tsx`
- `src/hooks/useHardwareBackButton.ts`
- `src/features/quiz/components/ui/ClaymorphismSwitch.css` & `SubjectHeader.tsx`
- `src/lib/telemetry/telemetryService.ts`

### 9.3 Actionable Tasks
1. **Intro & Launch Lifecycle Optimization (Option B Implementation):**
   - *Option Comparison & Rationale:*
     - **Option A (Mount router & intro together):** High risk of broken authentication. Mounting `<HashRouter>` before `useAppBootstrap` intercepts the URL hash causes `HashRouter` to misinterpret `#access_token=...` or trigger premature redirects in `NavigationManager` before the session is hydrated.
     - **Option B (Recommended & Approved — Instant Intro + Background Bootstrap + Deferred Router):**
       1. On Frame 0, render `<IntroEngine>` immediately without any `<SynapticLoader>` screen curtain.
       2. `useAppBootstrap` runs in the background behind the intro canvas: intercepts OAuth tokens, sanitizes URL via `window.history.replaceState`, initializes Supabase, and hydrates IndexedDB.
       3. **OAuth Preservation Invariant:** The OAuth hash interception and URL sanitization logic in `src/hooks/useAppBootstrap.ts` stays **completely unchanged**.
       4. `<HashRouter>` remains unmounted until `bootstrapState.isReady === true`.
       5. **Maximum Wait Time & Timeout Fallback:** Incorporate an 8-second maximum watchdog timer (reusing the existing auth timeout). If bootstrap stalls or encounters network lag, the watchdog fires after 8 seconds, forces intro completion, mounts `<HashRouter>`, and lets `NavigationManager` gracefully handle the resulting unauthenticated or offline state with actionable recovery.
       6. The intro finishes playback only after meeting its minimum duration *and* receiving the readiness signal from `bootstrapState.isReady` (or upon the 8s timeout).
       7. **Shorten Native Splash:** In `capacitor.config.ts`, set `launchShowDuration: 0` and `launchAutoHide: false`. In `IntroEngine.tsx`, call `SplashScreen.hide()` on component mount, guarded by `if (Capacitor.isNativePlatform())`.
       - *Trade-offs:* **100% OAuth safe**, **100% offline safe**, and **0ms loader flash**. Delivers a seamless 60fps AAA launch transition.
     - **Option C (Static curtain replacement):** Replaces spinner with static backdrop, but retains a noticeable 2-step visual transition.
   - *Action Item:* Implement **Option B** in `src/App.tsx` and `src/features/intro/IntroEngine.tsx`.
2. **Replace Native `window.confirm()` in `SavedQuizzesList.tsx` with Custom Modal Dialog:**
   - In `src/features/quiz/components/SavedQuizzesList.tsx`, replace the native browser `window.confirm("Are you sure you want to delete this quiz?")` with MindFlow's custom branded confirmation dialog, providing smooth animations, dark-mode styling, and improved mobile UX.
3. **Eliminate 2000ms Splash Freeze:**
   - In `capacitor.config.ts`, set `launchShowDuration: 0` and `launchAutoHide: false`.
   - In `IntroEngine.tsx`, call `SplashScreen.hide()` on component mount (guarded by `Capacitor.isNativePlatform()`).
   - In `styles.xml`, add `<item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>` to `AppTheme.NoActionBarLaunch`.
4. **Compile `.pb-safe` & Standardize `<KeyboardAwareBottomBar>`:**
   - In `src/index.css`, define:
     ```css
     .pb-safe {
       padding-bottom: max(1rem, env(safe-area-inset-bottom));
     }
     ```
   - Wrap bottom action bars in `QuizConfig.tsx`, `IdiomsConfig.tsx`, `OWSConfig.tsx`, and `SynonymsConfig.tsx` with `<KeyboardAwareBottomBar>`.
5. **Android 15 Edge-to-Edge Safe Area Insets:**
   - In `src/layouts/MainLayout.tsx:212`, add `pt-[env(safe-area-inset-top)]` to sticky headers to prevent overlap with camera punch holes.
6. **Fix Hierarchical Hardware Back Navigation:**
   - In `src/hooks/useHardwareBackButton.ts:118-124`, update route checks to match `/vocab/*` routes.
   - Add hierarchical back rule: pressing back on `/subject/:name/topics` navigates to `/subject/:name`.
7. **Enforce 44x44px Touch Targets:**
   - In `ClaymorphismSwitch.css:20`, set switch minimum height to `44px`.
   - In `SubjectHeader.tsx:60-65`, expand back button hit area to `min-w-[44px] min-h-[44px]`.
8. **Emit Declared Diagnostic Telemetry Events:**
   - Emit `empty_state_seen`, `recovery_action_clicked`, and `offline_sync_completed` at appropriate call sites.

### 9.4 Risks & Mitigation
- *Risk:* `SplashScreen.hide()` throws an error on desktop web.
- *Mitigation:* Guard native calls with `if (Capacitor.isNativePlatform())`.

### 9.5 Verifiable Acceptance Criteria
- [ ] Cold launch displays the animated intro curtain immediately without an intermediary loader flash.
- [ ] No double-splash screen freeze occurs on Android cold launch.
- [ ] Bottom action buttons do not overlap Android gesture navigation bars.
- [ ] Pressing Android hardware back inside vocab drills returns to `/english`.
- [ ] Touch targets measure $\ge 44\times 44\text{px}$.

---

## Phase 10: CI/CD Pipeline Automation, Version Mapping & Release Verification (P3 — Release Engineering)

### 10.1 Objective
Establish manual Android release version management in Gradle mapped to web semver in documentation, configure R8 code shrinking and ProGuard protection, and execute full-stack end-to-end verification.

### 10.2 Affected Components & Systems
- `android/app/build.gradle` & `android/app/proguard-rules.pro`
- `.github/workflows/android-build.yml`
- `docs/APP_JOURNEY_LOG.md` & `package.json`

### 10.3 Actionable Tasks
1. **Manual Android Versioning Maintained (Decoupled from Web package.json):**
   - Retain explicit, manual versioning in `android/app/build.gradle` (`versionCode` and `versionName`) to keep Android builds clean, predictable, and independent from rapid web patch increments.
   - For every production Android upload, increment `versionCode` manually so it is strictly higher than the previous Play Console release (e.g. `versionCode 7`, `versionName "1.7"`).
   - In `docs/APP_JOURNEY_LOG.md`, add a dedicated mapping entry for each Android release linking it to the active web semver:
     `Android 1.7 (versionCode 7) = Web v1.0.340`.
2. **Guard Local Release Signing:**
   - In `build.gradle`, guard `signingConfigs.release` with `if (ksFile.exists() && System.getenv("KEYSTORE_PASSWORD") != null)` to allow local unsigned APK builds without failing CI.
3. **Configure ProGuard / R8 Rules:**
   - In `android/app/proguard-rules.pro`, add keeps for Capacitor bridge, WebKit `@JavascriptInterface`, and plugins. Set `minifyEnabled true` in release builds.
4. **Complete Google Play Console Declarations:**
   - Submit Data Safety Form using Section 4.2 mapping.
   - Ensure account deletion link entry is consistent with the verified Play Console configuration.
5. **Full Verification Ritual:**
   - Verify TypeScript: `npx tsc --noEmit` (0 errors).
   - Verify Build: `npx vite build` (0 errors).
   - Build Android AAB: `./gradlew bundleRelease` in `android/`.

### 10.4 Risks & Mitigation
- *Risk:* R8 shrinks necessary reflection classes and causes runtime crashes.
- *Mitigation:* Preserve all Capacitor plugins via `-keep public class * extends com.getcapacitor.Plugin`.

### 10.5 Verifiable Acceptance Criteria
- [ ] `android/app/build.gradle` maintains clean manual versioning with monotonic `versionCode`.
- [ ] Every Android release is logged in `docs/APP_JOURNEY_LOG.md` with an explicit mapping to web semver.
- [ ] Android release AAB builds cleanly without ProGuard warnings.
- [ ] `npx tsc --noEmit` passes with 0 errors.
- [ ] `docs/APP_JOURNEY_LOG.md` updated per version bump ritual.

---

## 11. Roadmap Dependency Graph & Milestone Matrix

```
[Phase 1: Security & Sandboxing] ──┐
[Phase 2: Play Policy & Erasure]  ├──► [Phase 4: DB Access & Privileges] ──► [Phase 5: Indexes & RLS] ──► [Phase 6: Connection Pooling]
[Phase 3: Native Android Perms]  ──┘                                                                                │
                                                                                                                    ▼
[Phase 10: CI/CD & Verification] ◄── [Phase 9: Launch & UX Polish] ◄── [Phase 8: Offline Hygiene] ◄── [Phase 7: Query & Persistence]
```

| Phase | Milestone Name | Priority | Core Target Area | Key Acceptance Signal |
| :---: | :--- | :---: | :--- | :--- |
| **1** | Zero-Day Security & Sandboxing | **P0** | XSS, RPC caller checks, iframe isolation | Stored XSS eradicated in `MarkdownRenderer` |
| **2** | Play Store Policy & Legal Erasure | **P0** | Unblocked deletion, Play Console URL check | Deletion unblocked; optional data download |
| **3** | Native Packaging & Permissions | **P0** | Voice Coach live test, retain active plugins | `@capacitor/camera` & `filesystem` preserved |
| **4** | DB Access Control & Privileges | **P1** | Security Definer RPC permissions, RLS policies | 0 anon security definer findings in Advisor |
| **5** | Indexes & RLS Scalar Subqueries | **P1** | 64 unindexed FKs, 107 RLS subqueries | 0 FK & RLS performance warnings in Advisor |
| **6** | Connection Pooling & Scalability | **P1** | Supavisor transaction pool, 10k DAU headroom | 400 CCU sustained without connection exhaustion |
| **7** | Query Optimization & Persistence | **P2** | Mastery set upsert, atomic quiz session RPC | Quiz cold-start latency drops below 100ms |
| **8** | Offline Hygiene & Storage Purge | **P2** | Synchronous logout purge, consent tracking | Dexie stores wiped on logout & session expiry |
| **9** | Launch Lifecycle & UX Polish | **P2** | Option B Intro (0ms flash), safe areas, HW back | Zero double-splash freeze; custom modal dialogs |
| **10** | Release Engineering & CI/CD | **P3** | Manual Gradle versioning, release mapping log | Clean manual versionCode; Journey Log mapped |
