# Error Handling Audit

## 1. Silent Catches & Swallowed Exceptions
A codebase search reveals numerous instances of `catch (error) {}` blocks that neither re-throw the error nor present a user-facing notification.

**Examples:**
- `useAppVisibilityReawakening.ts`: Catches session timeouts silently.
- `useLocalStorageState.ts`: Silently ignores quota exceeded errors.
- `AuthContext.tsx`: The `signOut` routine swallows errors to force local cache clearing, which is defensively sound, but masks underlying network deadlocks.

## 2. Unhandled Promise Rejections (Floating Promises)
Many components execute async functions without `await` or `.catch()`, leading to "Uncaught (in promise)" errors in the browser console.
- `useSound.ts`: `soundClone.play()` occasionally catches, but `AudioContext` resumes often float.
- `syncService.ts`: Several background UPSERT promises are fired and forgotten. If they fail, the user is never notified that their data didn't reach the cloud.

## 3. Missing Retry Strategies
- `lib/supabase.ts` implements a custom `fetchWithTimeout` to abort hanging requests after 15,000ms. However, if this aborts a critical mutation (like `submit_quiz_session`), there is **no automatic exponential backoff or retry mechanism**. The mutation simply fails, and the user sees an error state.
- `IndexedDB` sync queues lack a robust backoff strategy. If Supabase is down, the sync service continuously hammers the endpoint on every visibility change.

## 4. Error Boundaries
- **Status:** The app possesses a global `ErrorBoundary.tsx` in `src/providers/`.
- **Flaw:** Granular feature-level Error Boundaries are missing. If a single React component within `ReelsFeed` crashes, the entire application shell unmounts and displays the global fallback, destroying the user's navigational state. We need Error Boundaries around individual routes (`pages/`).
