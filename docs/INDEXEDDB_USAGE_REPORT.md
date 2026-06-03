# IndexedDB (`lib/db.ts`) Usage Report

## 1. Where is it used?
- **Quiz Guards:** `QuizSessionGuard` queries `db.getInProgressQuiz` on mount.
- **Quiz Controllers:** `useQuiz.ts` calls `db.updateQuizProgress` on every user action.
- **Other Features:** Heavily used by `IdiomSession`, `OWSSession`, `SynonymQuizSession`, and `AIChatPage`.
- **Global Providers:** `AuthContext` wipes the DB on logout.

## 2. Why does it exist?
It was implemented as an "Offline-First" buffering layer. Because the Supabase cloud connection could drop on mobile/PWA, `IndexedDB` stores every quiz answer locally milliseconds after the user taps it.

## 3. Is it still required?
**Yes, but its scope is too wide.**
Right now, `IndexedDB` acts as the *primary* source of truth for hydration on page refresh, fighting with the cloud.
Ideally, React Query should be the primary source of truth (via its `persistQueryClient` plugin if offline support is needed). `IndexedDB` should only be required for the `Service Worker` Sync Queue (saving mutations that failed to send to Supabase).

## 4. User-Facing Feature Dependencies
- **Offline Quiz Resumption:** If a user loses internet, closes the app, and reopens it, `IndexedDB` is the only reason their active session restores correctly.
- **PWA Background Sync:** The `syncService.ts` relies on IndexedDB to hold bookmarks, interactions, and analytics events until the network returns.
