# 13. Hidden Knowledge & Tribal Assumptions

## Overview
This section captures critical assumptions, unspoken rules, and "gotchas" that are not immediately obvious from reading the code but are vital for maintaining system stability.

## 1. Auth Mutex Poisoning
- **The Issue:** The `gotrue-js` client relies on an internal promise queue. If a background refresh hangs (e.g., during network transition), it poisons the singleton and blocks all future auth calls.
- **The Fix:** `src/lib/supabase.ts` monkey-patches `getSession`, `signOut`, etc., with an 8-second `Promise.race`.
- **Do Not Touch:** Do not remove these wrappers until an upstream fix in Supabase JS is confirmed. Resetting auth loading states in a `finally` block is also prohibited; it must only happen in a `catch` block to prevent UI flickering during OAuth redirects.

## 2. Quiz IndexedDB Seeding
- **The Rule:** Quizzes MUST be seeded into IndexedDB (`db.saveQuiz`) immediately upon creation.
- **Why:** If a quiz is not fully seeded (with `activeQuestions`, `quizId`, `filters`), the `QuizSessionGuard` will silently fail when attempting to resume or hydrate the quiz, resulting in a blank screen or a crash.

## 3. Data Mapping & Schema Quirks
- **Array vs JSON:** The `options` and `options_hi` columns in `public.questions` are `text[]` (Postgres arrays), not JSONB. Use `array_length(column_name, 1)` to query size.
- **Column Mismatches:** Supabase RPC results occasionally mismatch frontend models (e.g., `source_pdf` vs `examName`, `phrase` vs `word`). The frontend explicitly aliases these.
- **ID Casting:** When matching Supabase IDs (which are numbers/bigints) against local JS Maps or Sets, explicitly cast them to strings (`String(id)`) to prevent silent lookup failures.
- **Taxonomy Fallbacks:** IndexedDB cache may store taxonomy fields nested (`q.classification.subject`). Always use fallback coalescing (`q.subject ?? q.classification?.subject`) to support legacy data.

## 4. Cache Invalidation Triggers
- **The Rule:** Modifying the DB schema for vocab features requires incrementing `vocab_cache_cleared_vX` in `localStorage`.
- **Why:** IndexedDB will attempt to render corrupted or outdated schema shapes on mount if not explicitly cleared.

## 5. Testing & Verification Ports
- **The Rule:** The local Vite server runs on **Port 3000**, not 5173.
- **Why:** Playwright visual verification tools and automation scripts are hardcoded to target `localhost:3000`.

## 6. AI Rate Limits & Capacity
- **The Rule:** `batch_size` in `ai_task_config` must strictly be `1`.
- **Why:** A single question enrichment triggers multiple distinct AI tasks (taxonomy, research, translation). Batching multiple questions causes workers to pull too many jobs simultaneously, bypassing global RPM limits and triggering 429 errors.

## 7. Versioning
- **The Rule:** App versions are updated via `npm version patch --no-git-tag-version`.
- **Why:** `vite.config.ts` dynamically reads `process.env.npm_package_version`. This avoids manual string replacements.
