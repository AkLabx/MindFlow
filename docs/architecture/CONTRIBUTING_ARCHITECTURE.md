# Contributing Architecture Standards

These architectural standards ensure MindFlow remains scalable, deterministic, and highly performant. All new contributions must adhere to these guidelines.

## 1. Feature-Sliced strictness
- **Rule:** Never import deeply into another feature's internal structure.
- **Bad:** `import { QuizPlayer } from '@/features/quiz/components/QuizPlayer'`
- **Good:** `import { QuizPlayer } from '@/features/quiz'` (exported from the barrel file)
- **Exception:** Lazy loaded boundaries in `AppRoutes.tsx` may bypass barrel files to enable proper Webpack/Vite code splitting chunks.

## 2. Asynchronous Mutations & Loading States
- **Rule:** All database mutations (`insert`, `update`, `delete`, Storage uploads) MUST be wrapped in a custom React Query hook.
- **Why:** Centralizes cache invalidation (e.g., updating virtual paginated lists), ensures loading/success states are deterministic, and normalizes error reporting. Ad-hoc mutations inside components lead to desynced UI state.

## 3. Offline Caching (IndexedDB)
- **Rule:** Do not store broken schemas in IDB. If a Supabase RPC shape changes, you MUST explicitly invalidate/clear the local IDB cache by bumping the `DB_VERSION` or `localStorage` invalidation flag.
- **Why:** The UI reads from IDB first. Corrupt IDB data results in silent crashes on boot.

## 4. Supabase Mutex Safety
- **Rule:** `gotrue-js` Auth methods (`getSession`, `signOut`) must be wrapped in `Promise.race` timeouts.
- **Why:** Mobile OS reawakening (foreground/background) can cause race conditions that deadlock the Supabase internal mutex. `useAppVisibilityReawakening.ts` enforces a strict concurrency lock.

## 5. UI Safe Areas
- **Rule:** Never use hardcoded pixel heights for bottom navigation padding. Mobile capacitor builds require edge-to-edge support.
- **Standard:** Use `pb-[calc(Xrem_+_env(safe-area-inset-bottom))]`.

## 6. Edge Queue Backoff
- **Rule:** Background worker functions processing `pgmq` must strictly be idempotent.
- **Rule:** Infrastructure errors (rate limits, timeouts) must *never* permanently fail a job. They must update the visibility timeout (`vt`) for exponential backoff. The `FAILED` status is strictly for unrecoverable data problems.
