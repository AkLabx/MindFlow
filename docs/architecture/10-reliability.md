# 10. Reliability & Resilience

## Overview
MindFlow is engineered to handle unreliable networks and complex asynchronous workflows through idempotency and robust fallback mechanisms.

## Core Resilience Strategies

### 1. The 8-Second Auth Mutex Breaker
* **Context:** The Supabase `gotrue-js` client uses an internal promise queue (mutex). If an operation hangs (due to a dropping network connection), it permanently poisons the singleton, blocking all future auth calls.
* **Solution:** `src/lib/supabase.ts` wraps all critical auth methods (`getSession`, `signOut`, etc.) in a `Promise.race` with an 8-second timeout (`withAuthTimeout`). This forces the promise to reject, unblocking the mutex and preventing the app from freezing.

### 2. Offline-First Mutability (Upsert Resilience)
* **Context:** When a user takes a quiz offline, the app must record their progress.
* **Solution:** Local database mutations in IndexedDB (e.g., `db.updateQuizProgress`) are designed to be upsert-safe. If the initial quiz creation payload was delayed, the update function will automatically insert a missing record. This prevents fatal "not found" state synchronization errors.

### 3. Idempotent Background Workers
* **Context:** AI enrichment tasks run asynchronously via `pgmq`. A worker might crash midway through processing a question, or a network timeout might cause the message to be redelivered.
* **Solution:**
  - Background workers are strictly idempotent.
  - They use explicit row-level locks (`SELECT ... FOR UPDATE`).
  - They check local progress states in the database before initiating expensive external API calls to Gemini, preventing duplicated work and race conditions.

### 4. Exponential Backoff in AI Pipelines
* **Context:** Google Gemini models often return `429 Too Many Requests` or `503 Service Unavailable` on the Free Tier.
* **Solution:**
  - Infrastructure errors never permanently fail a question.
  - The Edge Function updates the `pgmq` visibility timeout (`vt`), automatically scheduling an exponential backoff retry.
  - The `FAILED` status is strictly reserved for non-recoverable data problems (e.g., invalid schema logic, bad JSON).

### 5. Delta Sync Architecture
* **Context:** Fetching entire vocabulary or quiz databases on every app load is slow and unreliable on mobile networks.
* **Solution:** The frontend queries `updated_at` timestamps locally and requests only changed rows via RPCs. If the schema fundamentally changes, a version flag (`vocab_cache_cleared_vX`) is bumped in the frontend config to explicitly clear the cache and force a clean rebuild, avoiding schema shape corruption.

*Evidence:* `src/lib/supabase.ts`, memory guidelines, `AI_TUTOR_PIPELINE.md`.
*Confidence:* Confirmed.
