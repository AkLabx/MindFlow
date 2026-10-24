# Security & Reliability Audit

## 1. Security Analysis

### Authentication & Authorization
- **Design:** Supabase GoTrue handles authentication. Role-based access (RBAC) is implemented via a `role` column in the `profiles` table. **[Confirmed]**
- **Client Trust Assumption:** The `NavigationManager` relies heavily on local state (`user`, `profile`) to grant access to routes. While the UI hides features, actual data security must be enforced by Row Level Security (RLS) on the backend. **[Confirmed]**
- **No Guest Access:** The system is hardcoded against anonymous usage, mitigating unauthenticated API spam. **[Confirmed]**

### Common Vulnerabilities
- **SQL Injection:** Mitigated by Supabase Client (PostgREST), which uses parameterized queries. **[Highly Likely]**
- **XSS (Cross-Site Scripting):** React handles escaping by default. However, if Markdown or AI responses are rendered using `dangerouslySetInnerHTML` without proper sanitization (e.g., via DOMPurify), an XSS risk exists. **[Possible]**
- **Rate Limiting:** AI endpoints use custom atomic RPCs for rate limiting (`check_and_increment_ai_quota`). Standard Supabase Auth handles auth rate limits. **[Confirmed]**

## 2. Reliability & Resilience

### Offline-First Architecture
MindFlow's core strength is its resilience to network instability.
- **IndexedDB:** Quiz and Vocab sessions are entirely localized after initial fetch.
- **Upsert-Safe Mutations:** Updates to IndexedDB (`updateQuizProgress`) are designed to not fail if the initial seed was delayed. **[Confirmed]**
- **Background Sync:** State synchronization uses the Supabase JS client (`supabase.from().update()`) over raw `fetch` to bypass iOS/Chromium buffer limits and CORS issues. **[Confirmed]**

### Race Conditions & Idempotency
- **AI Quotas:** Resolved by `20260702100000_ai_governance_atomic_quota.sql`, which uses `SELECT FOR UPDATE` to lock user quota rows before incrementing, preventing double-spend under high concurrent requests. **[Confirmed]**
- **Job Queues:** If PGMQ is used for background tasks (e.g., AI enrichments), the queue mechanism must handle visibility timeouts and idempotency inherently. **[Highly Likely]**

### Error Handling & Mutex Locks
- **Auth Mutex Poisoning:** Addressed in `src/lib/supabase.ts` with `withAuthTimeout`. If a background auth refresh hangs (due to a spotty connection), a strict 8-second `Promise.race` forces rejection, unblocking the app runtime. **[Confirmed]**

## 3. Architecture Risks

| Severity | Description | Evidence | Impact | Recommendation | Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Medium** | **Client-Side JSON Parsing** | `quizReducer.ts`, `db.ts` | Invalid schema cached offline could crash the UI on load. | Ensure strict versioning and cache wiping (`clearCache()`) when altering models. | Confirmed |
| **Low** | **Large Payload Execution** | `chat-ai/index.ts` limits payloads to 100k chars. | Prompt injection or oversized payload attacks. | The limit mitigates memory exhaustion, but prompt injection remains a risk handled by model instruction design. | Confirmed |
| **Medium** | **Complex Route Guard Logic** | `NavigationManager.tsx` | UI flickering, infinite redirect loops if intents are corrupted. | Refactor according to `FUTURE_REFACTOR_BLUEPRINT.md`. | Confirmed |
